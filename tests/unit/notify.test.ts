import { afterEach, describe, expect, it, vi } from "vitest";
import { createPublicLead } from "@/lib/booking";
import { notifyNewLead } from "@/lib/notify";
import { getOps } from "@/lib/ops";
import { listLeads } from "@/lib/store";
import type { Lead } from "@/lib/types";

const person = { name: "Dana Ortiz", phone: "4805550101", service: "Drywall", source: "website-form" as const };

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.RESEND_API_KEY;
});

describe("new-lead email", () => {
  it("sends one email with name, phone, service and a link", async () => {
    process.env.RESEND_API_KEY = "re_test";
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await createPublicLead(person, null);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, { body: string }];
    expect(url).toBe("https://api.resend.com/emails");
    const body = JSON.parse(init.body) as { text: string; subject: string };
    expect(body.subject).toContain("Dana Ortiz");
    expect(body.text).toContain("4805550101");
    expect(body.text).toContain("Drywall");
    expect(body.text).toContain("/crm/leads?lead=");
    expect((await getOps()).leadNotify?.lastOk).toBeTruthy();
  });

  it("keeps the lead and records the failure when the send fails", async () => {
    process.env.RESEND_API_KEY = "re_test";
    vi.stubGlobal("fetch", vi.fn(async () => new Response("boom", { status: 500 })));
    const r = await createPublicLead(person, null);
    expect(r.ok).toBe(true);
    expect(await listLeads()).toHaveLength(1);
    const ops = await getOps();
    expect(ops.leadNotify?.lastError).toContain("500");
  });

  it("keeps the lead when no email key is configured", async () => {
    const r = await createPublicLead(person, null);
    expect(r.ok).toBe(true);
    expect((await getOps()).leadNotify?.lastError).toContain("RESEND_API_KEY");
  });

  it("never emails for sample leads", async () => {
    process.env.RESEND_API_KEY = "re_test";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await notifyNewLead({ ...(person as object), id: "x", demo: true } as unknown as Lead);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
