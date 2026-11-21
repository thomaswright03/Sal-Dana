import { afterEach, describe, expect, it } from "vitest";
import { createPublicLead } from "@/lib/booking";
import { recordOps } from "@/lib/ops";
import { getStatus, nextCronRun } from "@/lib/status";

afterEach(() => {
  delete process.env.VERCEL;
  delete process.env.CRM_PASSWORD;
});

const by = (s: Awaited<ReturnType<typeof getStatus>>, name: string) => s.functions.find((f) => f.name === name)!;

describe("status", () => {
  it("is down, with storage and the booking form down, when the Blob token is missing", async () => {
    process.env.VERCEL = "1"; // on Vercel with no BLOB_READ_WRITE_TOKEN
    const s = await getStatus();
    expect(by(s, "Blob storage").status).toBe("down");
    expect(by(s, "Booking form saves a lead").status).toBe("down");
    expect(s.overall).toBe("down");
  });

  it("is down overall when the new-lead email cannot be sent (no RESEND_API_KEY)", async () => {
    delete process.env.RESEND_API_KEY;
    const s = await getStatus();
    const mail = by(s, "New-lead email");
    expect(mail.tier).toBe("important");
    expect(mail.status).toBe("down");
    expect(by(s, "Leads waiting for their email").tier).toBe("important");
    expect(s.overall).toBe("down");
  });

  it("returns exactly the status contract shape", async () => {
    const s = await getStatus();
    expect(Object.keys(s).sort()).toEqual(["checked_at", "functions", "overall", "product"]);
    expect(new Set(s.functions.map((f) => f.tier))).toEqual(new Set(["important", "key", "basic"]));
    for (const f of s.functions) {
      expect(Object.keys(f).sort()).toEqual(["detail", "last_checked", "last_success", "name", "next_expected_run", "status", "tier"]);
      expect(["ok", "warning", "down", "unknown"]).toContain(f.status);
      if (f.status === "ok") expect(f.detail).toBe("");
      else expect(f.detail.length).toBeGreaterThan(0);
    }
  });

  it("a never-run backup is not ok and says when it is next due", async () => {
    const s = await getStatus(new Date("2026-11-21T12:00:00Z"));
    const b = by(s, "Latest backup");
    expect(b.status).not.toBe("ok");
    expect(b.next_expected_run).toBe("2026-11-22T11:00:00.000Z");
    expect(by(s, "Retention cron").next_expected_run).toBe("2026-11-23T10:00:00.000Z");
  });

  it("overall is the worst Important status and keeps unknown as unknown", async () => {
    const s = await getStatus();
    const worstImportant = s.functions.filter((f) => f.tier === "important").map((f) => f.status);
    expect(worstImportant.includes(s.overall)).toBe(true);
  });

  it("says plainly that emails only reach the Resend owner until a domain is set", async () => {
    process.env.RESEND_API_KEY = "re_test";
    const s = await getStatus();
    delete process.env.RESEND_API_KEY;
    expect(by(s, "New-lead email").detail).toContain("Resend account owner");
    expect(by(s, "New-lead email").status).not.toBe("ok");
  });

  it("shows a failed last cron run as down and a good one as ok", async () => {
    await recordOps("retention", false, "boom");
    let s = await getStatus();
    expect(by(s, "Retention cron").status).toBe("down");
    await recordOps("retention", true, "{}");
    s = await getStatus();
    expect(by(s, "Retention cron").status).toBe("ok");
  });

  it("works with the booking form after a lead is saved", async () => {
    await createPublicLead({ name: "Sam", phone: "4805550100", source: "website-form" }, null);
    const s = await getStatus();
    expect(by(s, "Booking form saves a lead").status).toBe("ok");
  });

  it("computes the next cron run", () => {
    const from = new Date("2026-11-21T12:00:00Z"); // a Saturday
    expect(nextCronRun("0 10 * * 1", from).toISOString()).toBe("2026-11-23T10:00:00.000Z");
    expect(nextCronRun("0 11 * * *", from).toISOString()).toBe("2026-11-22T11:00:00.000Z");
  });
});
