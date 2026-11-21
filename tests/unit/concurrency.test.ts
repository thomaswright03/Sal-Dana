import { afterEach, describe, expect, it, vi } from "vitest";
import { restoreBackup, runBackup, pruneBackups, KEEP_SNAPSHOTS } from "@/lib/backup";
import { createPublicLead } from "@/lib/booking";
import { listKeys, readJson, writeJson } from "@/lib/kv";
import { getOps, recordOps } from "@/lib/ops";
import { pendingNotificationCount, retryPendingNotifications } from "@/lib/notify";
import { claimForOwner, claimSlot, openWindows, SlotTakenError } from "@/lib/slots";
import { createLead, getLead, listLeads, saveLead, updateLead } from "@/lib/store";
import { futureWorkingDay } from "./helpers";

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.RESEND_API_KEY;
});

const person = { name: "Dana", phone: "4805550101", source: "website-form" as const };

describe("ops log", () => {
  it("keeps both entries when two are recorded at once", async () => {
    await Promise.all([recordOps("leadSave", true, "saved"), recordOps("leadNotify", false, "mail down")]);
    const ops = await getOps();
    expect(ops.leadSave?.lastOk).toBeTruthy();
    expect(ops.leadNotify?.lastError).toBe("mail down");
  });
});

describe("slot takeover", () => {
  it("after a cancellation, two simultaneous claims produce exactly one winner", async () => {
    const date = futureWorkingDay();
    const first = await createPublicLead(person, { date, window: "morning", status: "requested" }, "reject");
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    // Age the marker past the "still being saved" grace period, then cancel the visit.
    const markerKey = (await listKeys(`slots/${date}_morning`))[0];
    const marker = (await readJson<{ leadId: string; at: string }>(markerKey))!;
    await writeJson(markerKey, { ...marker, at: new Date(Date.now() - 3_600_000).toISOString() });
    await updateLead(first.lead.id, { appointment: { date, window: "morning", status: "cancelled" } });
    const results = await Promise.all(Array.from({ length: 4 }, (_, i) => claimSlot(date, "morning", `lead-${i}-aaaaaaaa`)));
    expect(results.filter(Boolean)).toHaveLength(1);
  });

  it("availability costs one list call and a constant number of reads, however many leads exist", async () => {
    const date = futureWorkingDay();
    for (let i = 0; i < 30; i++) await createLead({ ...person, name: `L${i}` });
    const open = await openWindows(date);
    expect(open.ok && open.open.length).toBeGreaterThan(0);
    const kv = await import("@/lib/kv");
    const reads = vi.spyOn(kv, "readJson");
    const lists = vi.spyOn(kv, "listKeys");
    await openWindows(date);
    expect(lists).toHaveBeenCalledTimes(1);
    expect(reads.mock.calls.length).toBeLessThanOrEqual(6);
  });
});

describe("owner-created visits", () => {
  it("warns when the window already has a live visit, and allows it when confirmed", async () => {
    const date = futureWorkingDay();
    await createPublicLead({ ...person, name: "Pat" }, { date, window: "midday", status: "requested" }, "reject");
    const other = await createLead({ ...person, name: "Other" });
    await expect(claimForOwner({ date, window: "midday", status: "scheduled" }, other.id)).rejects.toThrow(SlotTakenError);
    await expect(claimForOwner({ date, window: "midday", status: "scheduled" }, other.id)).rejects.toThrow(/Pat/);
    await expect(claimForOwner({ date, window: "midday", status: "scheduled" }, other.id, true)).resolves.toBeUndefined();
    await expect(claimForOwner({ date, window: "morning", status: "scheduled" }, other.id)).resolves.toBeUndefined();
  });
});

describe("new-lead email retry", () => {
  it("flags a lead whose email failed, then sends it later", async () => {
    process.env.RESEND_API_KEY = "re_test";
    vi.stubGlobal("fetch", vi.fn(async () => new Response("boom", { status: 500 })));
    const r = await createPublicLead(person, null);
    expect(r.ok).toBe(true);
    expect(await pendingNotificationCount()).toBe(1);
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 200 })));
    const out = await retryPendingNotifications();
    expect(out).toEqual({ sent: 1, waiting: 0 });
    expect(await pendingNotificationCount()).toBe(0);
  });
});

describe("backups", () => {
  it("keeps only the newest snapshots", async () => {
    for (let d = 1; d <= KEEP_SNAPSHOTS + 5; d++) {
      await writeJson(`backups/2026-01-${String(d).padStart(2, "0")}.json`, { version: 1, takenAt: "", leads: [], reviews: [] });
    }
    const removed = await pruneBackups();
    expect(removed).toBe(5);
    const left = await listKeys("backups/");
    expect(left).toHaveLength(KEEP_SNAPSHOTS);
    expect(left).not.toContain("backups/2026-01-01.json");
  });

  it("restore skips leads past the retention cut-off", async () => {
    const old = await createLead({ ...person, name: "Old" });
    const fresh = await createLead({ ...person, name: "Fresh" });
    await saveLead({ ...old, createdAt: "2020-01-01T00:00:00.000Z" });
    const { date } = await runBackup();
    for (const l of await listLeads()) await (await import("@/lib/store")).deleteLead(l.id);
    const out = await restoreBackup(date);
    expect(out.leads).toBe(1);
    expect(await getLead(fresh.id)).toBeTruthy();
    expect(await getLead(old.id)).toBeNull();
  });
});
