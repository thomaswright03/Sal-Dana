import { afterEach, describe, expect, it } from "vitest";
import { createPublicLead } from "@/lib/booking";
import { recordOps } from "@/lib/ops";
import { getStatus, nextCronRun } from "@/lib/status";

afterEach(() => {
  delete process.env.VERCEL;
  delete process.env.CRM_PASSWORD;
});

describe("status", () => {
  it("is down, with storage and the booking form down, when the Blob token is missing", async () => {
    process.env.VERCEL = "1"; // on Vercel with no BLOB_READ_WRITE_TOKEN
    const s = await getStatus();
    const items = Object.fromEntries(s.groups.flatMap((g) => g.items).map((i) => [i.id, i]));
    expect(items.storage.status).toBe("down");
    expect(items["booking-form"].status).toBe("down");
    expect(s.overall).toBe("down");
  });

  it("groups rows as Important, Key and Basic with times and details", async () => {
    const s = await getStatus();
    expect(s.groups.map((g) => g.tier)).toEqual(["important", "key", "basic"]);
    for (const i of s.groups.flatMap((g) => g.items)) {
      expect(["ok", "warning", "down", "unknown"]).toContain(i.status);
      expect(i.detail.length).toBeGreaterThan(0);
      expect(i.lastChecked).toBeTruthy();
    }
  });

  it("shows a failed last cron run as down and a good one as ok", async () => {
    await recordOps("retention", false, "boom");
    let s = await getStatus();
    expect(s.groups[1].items.find((i) => i.id === "retention")?.status).toBe("down");
    await recordOps("retention", true, "{}");
    s = await getStatus();
    expect(s.groups[1].items.find((i) => i.id === "retention")?.status).toBe("ok");
  });

  it("works with the booking form after a lead is saved", async () => {
    await createPublicLead({ name: "Sam", phone: "4805550100", source: "website-form" }, null);
    const s = await getStatus();
    expect(s.groups[0].items[0].status).toBe("ok");
  });

  it("computes the next cron run", () => {
    const from = new Date("2026-11-21T12:00:00Z"); // a Saturday
    expect(nextCronRun("0 10 * * 1", from).toISOString()).toBe("2026-11-23T10:00:00.000Z");
    expect(nextCronRun("0 11 * * *", from).toISOString()).toBe("2026-11-22T11:00:00.000Z");
  });
});
