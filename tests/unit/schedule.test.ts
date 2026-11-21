import { describe, expect, it } from "vitest";
import { checkDay, isValidDate, todayInPhoenix } from "@/lib/schedule";
import type { Lead } from "@/lib/types";
import { futureClosedDay, futureWorkingDay } from "./helpers";

const lead = (date: string, window: "morning" | "midday" | "afternoon", status: "requested" | "cancelled" = "requested") =>
  ({ id: "x", appointment: { date, window, status } }) as unknown as Lead;

describe("checkDay", () => {
  it("rejects malformed and impossible dates", () => {
    expect(isValidDate("2026-02-30")).toBe(false);
    expect(checkDay("tomorrow", []).ok).toBe(false);
  });

  it("rejects today and the past", () => {
    expect(checkDay(todayInPhoenix(), []).ok).toBe(false);
    expect(checkDay("2020-01-01", []).ok).toBe(false);
  });

  it("rejects dates more than 90 days ahead", () => {
    const far = new Date();
    far.setUTCDate(far.getUTCDate() + 120);
    expect(checkDay(far.toISOString().slice(0, 10), []).ok).toBe(false);
  });

  it("rejects non-working days", () => {
    const closed = futureClosedDay();
    if (closed) expect(checkDay(closed, []).ok).toBe(false);
  });

  it("offers every window on an empty day", () => {
    const r = checkDay(futureWorkingDay(), []);
    expect(r.ok && r.open).toEqual(["morning", "midday", "afternoon"]);
  });

  it("removes a taken window but not a cancelled one", () => {
    const day = futureWorkingDay();
    const r = checkDay(day, [lead(day, "morning"), lead(day, "midday", "cancelled")]);
    expect(r.ok && r.open).toEqual(["midday", "afternoon"]);
  });

  it("reports a fully booked day as ok with nothing open", () => {
    const day = futureWorkingDay();
    const r = checkDay(day, [lead(day, "morning"), lead(day, "midday"), lead(day, "afternoon")]);
    expect(r).toEqual({ ok: true, open: [] });
  });
});
