import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/availability/route";
import { POST } from "@/app/api/lead/route";
import { createPublicLead } from "@/lib/booking";
import { futureClosedDay, futureWorkingDay } from "./helpers";

const get = (date: string) => GET(new Request(`http://x/api/availability?date=${date}`));
const person = { name: "Dana", phone: "4805550101", source: "website-form" as const };

describe("public availability", () => {
  it("lists a taken window as unavailable", async () => {
    const date = futureWorkingDay(7);
    await createPublicLead(person, { date, window: "midday", status: "requested" });
    const body = await (await get(date)).json();
    expect(body.ok).toBe(true);
    expect(body.open).not.toContain("midday");
    expect(body.open).toContain("morning");
  });

  it("explains past and closed days", async () => {
    expect((await (await get("2020-01-06")).json()).code).toBe("past");
    const closed = futureClosedDay();
    if (closed) expect((await (await get(closed)).json()).code).toBe("closed");
  });

  it("the lead form says plainly when the chosen time was taken", async () => {
    const date = futureWorkingDay(8);
    await createPublicLead(person, { date, window: "afternoon", status: "requested" });
    const res = await POST(
      new Request("http://x/api/lead", {
        method: "POST",
        body: JSON.stringify({ name: "Sam", phone: "4805550199", date, window: "afternoon" }),
      }),
    );
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, booked: false, slotTaken: true, takenWindow: "afternoon" });
  });

  it("returns the field name for an invalid phone", async () => {
    const res = await POST(
      new Request("http://x/api/lead", { method: "POST", body: JSON.stringify({ name: "Sam", phone: "12" }) }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).field).toBe("phone");
  });
});
