import { describe, expect, it } from "vitest";
import { runAnalystTool } from "@/lib/analyst";
import { createReview } from "@/lib/reviews";
import { createLead, saveLead } from "@/lib/store";

async function seed() {
  const mk = async (name: string, createdAt: string, extra: Record<string, unknown>) => {
    const l = await createLead({ name, phone: "4805550101", source: "website-form", ...extra });
    await saveLead({ ...l, createdAt, updatedAt: createdAt });
    return l;
  };
  await mk("Ann Tile", "2026-10-02T15:00:00Z", { service: "Tile", address: "Mesa", status: "won", value: 4000 });
  await mk("Bob Paint", "2026-10-20T15:00:00Z", { service: "Painting", address: "Tempe", status: "new", value: 1000 });
  await mk("Cy Tile", "2026-11-05T15:00:00Z", { service: "Tile", address: "Mesa", status: "new", value: 2500 });
}
const data = async (name: string, input: unknown) => JSON.parse((await runAnalystTool(name, input)).content);

describe("find_leads", () => {
  it("filters by service, status and created date", async () => {
    await seed();
    expect((await data("find_leads", { service: "tile" })).total_matches).toBe(2);
    expect((await data("find_leads", { status: ["new"] })).total_matches).toBe(2);
    expect((await data("find_leads", { created_from: "2026-10-15", created_to: "2026-10-31" })).total_matches).toBe(1);
    expect((await data("find_leads", { min_value: 2000 })).total_matches).toBe(2);
    expect((await data("find_leads", { limit: 1 })).showing).toBe(1);
  });
  it("rejects bad input", async () => {
    expect((await runAnalystTool("find_leads", { status: ["nope"] })).isError).toBe(true);
  });
});

describe("get_lead", () => {
  it("finds one lead by partial name and says when none match", async () => {
    await seed();
    expect((await data("get_lead", { name: "bob" })).name).toBe("Bob Paint");
    expect((await runAnalystTool("get_lead", { name: "zzz" })).content).toMatch(/No lead/);
    expect((await runAnalystTool("get_lead", {})).isError).toBe(true);
  });
  it("asks which one when several match", async () => {
    await seed();
    expect((await data("get_lead", { name: "tile" })).note).toMatch(/Several/);
  });
});

describe("summarize_leads", () => {
  it("counts exactly with no grouping and with a date filter", async () => {
    await seed();
    const all = JSON.stringify(await data("summarize_leads", { group_by: "none" }));
    expect(all).toContain("3");
    const oct = await data("summarize_leads", { group_by: "service", created_to: "2026-10-31" });
    const groups = oct.groups as { group: string; leads: number }[];
    expect(groups.reduce((n, g) => n + g.leads, 0)).toBe(2);
    expect(groups.find((g) => g.group.toLowerCase() === "tile")?.leads).toBe(1);
  });
});

describe("list_reviews", () => {
  it("is empty, then averages ratings and counts platforms", async () => {
    expect((await runAnalystTool("list_reviews", {})).content).toMatch(/No reviews/);
    const r = { name: "P", city: "", service: "", text: "ok", date: "2026-11-01", permission: "", relationship: "", published: false };
    await createReview({ ...r, rating: 5, source: "google" });
    await createReview({ ...r, rating: 4, source: "google" });
    await createReview({ ...r, rating: 3, source: "facebook" });
    const out = await data("list_reviews", {});
    expect(out.count).toBe(3);
    expect(out.average_rating).toBe(4);
    expect(out.by_platform).toEqual({ google: 2, facebook: 1 });
  });
});

describe("traffic_summary", () => {
  it("rejects a backwards range and reports visitors for today", async () => {
    expect((await runAnalystTool("traffic_summary", { from: "2026-11-10", to: "2026-11-01" })).isError).toBe(true);
    const { recordHit } = await import("@/lib/traffic");
    const { todayInPhoenix } = await import("@/lib/schedule");
    await recordHit({ kind: "view", first: true, lang: "es", device: "mobile", source: "Google" });
    const t = todayInPhoenix();
    const out = await data("traffic_summary", { from: t, to: t });
    expect(out.visitors).toBe(1);
    expect(out.language.Spanish).toBe(1);
  });
});
