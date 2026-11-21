import { describe, expect, it } from "vitest";
import { clearDemoLeads, loadDemoLeads } from "@/lib/demo-leads";
import { applyRetention } from "@/lib/retention";
import { createLead, getLead, listLeads, saveLead } from "@/lib/store";

const base = { name: "Sam", phone: "4805550100", source: "manual" as const };
const monthsAgo = (n: number) => {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() - n);
  return d.toISOString();
};

describe("retention", () => {
  it("deletes old non-won leads, keeps won and recent ones", async () => {
    const old = await createLead(base);
    await saveLead({ ...old, createdAt: monthsAgo(30) });
    const oldWon = await createLead({ ...base, status: "won" });
    await saveLead({ ...oldWon, createdAt: monthsAgo(30) });
    const fresh = await createLead(base);
    const r = await applyRetention();
    expect(r.deleted).toBe(1);
    expect(await getLead(old.id)).toBeNull();
    expect(await getLead(oldWon.id)).not.toBeNull();
    expect(await getLead(fresh.id)).not.toBeNull();
  });

  it("clears chat transcripts after 12 months but keeps the lead", async () => {
    const l = await createLead({ ...base, transcript: "Visitor: hi" });
    await saveLead({ ...l, createdAt: monthsAgo(14) });
    const r = await applyRetention();
    expect(r.cleared).toBe(1);
    expect((await getLead(l.id))?.transcript).toBeNull();
  });
});

describe("sample data", () => {
  it("removing samples never touches real leads", async () => {
    const real = await createLead({ ...base, name: "Real Customer" });
    await loadDemoLeads();
    expect((await listLeads()).length).toBeGreaterThan(1);
    await clearDemoLeads();
    const left = await listLeads();
    expect(left.map((l) => l.id)).toEqual([real.id]);
    expect(left.some((l) => l.demo)).toBe(false);
  });
});
