import { beforeEach, describe, expect, it, vi } from "vitest";

const notify = vi.hoisted(() => vi.fn(async () => true));
vi.mock("@/lib/notify", () => ({ notifyNewLead: notify, alertFailure: vi.fn() }));

import { createPublicLead } from "@/lib/booking";
import { getOps } from "@/lib/ops";
import { listLeads, updateLead } from "@/lib/store";
import { futureWorkingDay } from "./helpers";

const person = { name: "Dana", phone: "4805550101", source: "website-form" as const };

beforeEach(() => notify.mockClear());

describe("createPublicLead", () => {
  it("two simultaneous bookings for one slot produce one appointment", async () => {
    const date = futureWorkingDay();
    const appt = { date, window: "morning" as const, status: "requested" as const };
    const [a, b] = await Promise.all([
      createPublicLead({ ...person, name: "A" }, appt, "save-without-visit"),
      createPublicLead({ ...person, name: "B" }, appt, "save-without-visit"),
    ]);
    expect([a, b].filter((r) => r.ok && r.booked)).toHaveLength(1);
    const leads = await listLeads();
    expect(leads).toHaveLength(2); // the loser is still saved, without a visit, so Alan can follow up
    expect(leads.filter((l) => l.appointment)).toHaveLength(1);
  });

  it("'reject' saves nothing for the loser", async () => {
    const date = futureWorkingDay();
    const appt = { date, window: "midday" as const, status: "requested" as const };
    const results = await Promise.all([
      createPublicLead(person, appt, "reject"),
      createPublicLead(person, appt, "reject"),
    ]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.filter((r) => !r.ok)).toHaveLength(1);
    expect(await listLeads()).toHaveLength(1);
  });

  it("frees the slot when the visit is cancelled (after the claim settles)", async () => {
    const date = futureWorkingDay();
    const appt = { date, window: "afternoon" as const, status: "requested" as const };
    const first = await createPublicLead(person, appt, "reject");
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    await updateLead(first.lead.id, { appointment: { ...appt, status: "cancelled" } });
    // Age the marker past the 60 second grace period.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(Date.now() + 2 * 60_000);
    const again = await createPublicLead(person, appt, "reject");
    vi.useRealTimers();
    expect(again.ok).toBe(true);
  });

  it("notifies once per new lead and records the save", async () => {
    await createPublicLead(person, null);
    expect(notify).toHaveBeenCalledTimes(1);
    expect((await getOps()).leadSave?.lastOk).toBeTruthy();
  });
});
