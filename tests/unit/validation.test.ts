import { describe, expect, it } from "vitest";
import { crmPatchSchema, publicLeadSchema, reviewSchema } from "@/lib/validation";

describe("publicLeadSchema", () => {
  const ok = { name: "Maria Lopez", phone: "(480) 555-0100" };

  it("accepts a minimal request and fills defaults", () => {
    const r = publicLeadSchema.parse(ok);
    expect(r.email).toBe("");
    expect(r.language).toBe("en");
  });

  it("requires a phone with area code", () => {
    expect(publicLeadSchema.safeParse({ ...ok, phone: "555-0100" }).success).toBe(false);
  });

  it("rejects a one-letter name and a bad email", () => {
    expect(publicLeadSchema.safeParse({ ...ok, name: "A" }).success).toBe(false);
    expect(publicLeadSchema.safeParse({ ...ok, email: "nope" }).success).toBe(false);
  });

  it("rejects an unknown visit window", () => {
    expect(publicLeadSchema.safeParse({ ...ok, window: "night" }).success).toBe(false);
  });
});

describe("crm schemas", () => {
  it("allows partial patches but not bad status values", () => {
    expect(crmPatchSchema.safeParse({ status: "won" }).success).toBe(true);
    expect(crmPatchSchema.safeParse({ status: "maybe" }).success).toBe(false);
    expect(crmPatchSchema.safeParse({ expectedUpdatedAt: "2026-01-01T00:00:00Z" }).success).toBe(true);
  });

  it("limits review ratings to 1-5", () => {
    const base = { name: "A", rating: 6, text: "ok", date: "2026-01-01", source: "direct", published: false };
    expect(reviewSchema.safeParse(base).success).toBe(false);
    expect(reviewSchema.safeParse({ ...base, rating: 5 }).success).toBe(true);
  });
});
