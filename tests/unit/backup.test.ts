import { describe, expect, it } from "vitest";
import { listBackups, restoreBackup, runBackup } from "@/lib/backup";
import { createLead, deleteLead, getLead, listLeads } from "@/lib/store";

const base = { name: "Sam", phone: "4805550100", source: "manual" as const };

describe("backup and restore", () => {
  it("backs up, survives a deletion, and restores the lead", async () => {
    const keep = await createLead({ ...base, name: "Keep" });
    const lose = await createLead({ ...base, name: "Lose" });
    const out = await runBackup();
    expect(out.leads).toBe(2);
    expect(await listBackups()).toEqual([out.date]);

    await deleteLead(lose.id);
    expect(await getLead(lose.id)).toBeNull();

    const r = await restoreBackup(out.date);
    expect(r.leads).toBe(1); // only the missing one; existing records are left alone
    expect((await getLead(lose.id))?.name).toBe("Lose");
    expect((await listLeads()).map((l) => l.id).sort()).toEqual([keep.id, lose.id].sort());
  });

  it("does not overwrite newer edits unless asked", async () => {
    const l = await createLead(base);
    const out = await runBackup();
    const { updateLead } = await import("@/lib/store");
    await updateLead(l.id, { value: 500 });
    await restoreBackup(out.date);
    expect((await getLead(l.id))?.value).toBe(500);
    await restoreBackup(out.date, { overwrite: true });
    expect((await getLead(l.id))?.value).toBeNull();
  });

  it("rejects a missing or malformed date", async () => {
    await expect(restoreBackup("2000-01-01")).rejects.toThrow();
    await expect(restoreBackup("../x")).rejects.toThrow();
  });
});

describe("restore and visit slots", () => {
  it("a restored lead with a visit holds its window again", async () => {
    const { createPublicLead } = await import("@/lib/booking");
    const { claimSlot, openWindows } = await import("@/lib/slots");
    const { listKeys, removeJson } = await import("@/lib/kv");
    const { futureWorkingDay } = await import("./helpers");
    const date = futureWorkingDay(5);
    const res = await createPublicLead(
      { ...base, name: "Visit" },
      { date, window: "morning", status: "requested" },
    );
    if (!res.ok) throw new Error("expected booking");
    const out = await runBackup();
    await deleteLead(res.lead.id);
    for (const k of await listKeys("slots/")) await removeJson(k);
    expect((await openWindows(date)) as { open: string[] }).toMatchObject({ open: expect.arrayContaining(["morning"]) });

    await restoreBackup(out.date);
    expect(await claimSlot(date, "morning", "other-lead-id-1")).toBe(false);
  });
});
