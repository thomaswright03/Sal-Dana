import { beforeEach, describe, expect, it, vi } from "vitest";

const sdk = vi.hoisted(() => ({ stream: vi.fn() }));
vi.mock("@anthropic-ai/sdk", () => {
  class Anthropic {
    static APIError = class extends Error {};
    beta = { messages: { stream: sdk.stream } };
  }
  return { default: Anthropic };
});
vi.mock("@/lib/notify", () => ({ notifyNewLead: vi.fn(async () => true), alertFailure: vi.fn() }));

import { runTool } from "@/lib/assistant";
import { POST as chat } from "@/app/api/chat/route";
import { setAiEnabled } from "@/lib/settings";
import { listLeads } from "@/lib/store";
import { futureWorkingDay } from "./helpers";

const ctx = { locale: "en" as const, transcript: "Visitor: hi", allowWrite: () => true };
const person = { name: "Lee Park", phone: "4805550102", service: "Painting", details: "Two rooms" };

beforeEach(() => sdk.stream.mockReset());

describe("assistant tools", () => {
  it("check_availability lists open windows", async () => {
    const r = await runTool("check_availability", { date: futureWorkingDay() }, ctx);
    expect(r.isError).toBeFalsy();
    expect(r.content).toMatch(/Open on/);
  });

  it("book_appointment saves a lead, then reports the slot taken for the next caller", async () => {
    const date = futureWorkingDay();
    const first = await runTool("book_appointment", { ...person, date, window: "morning" }, ctx);
    expect(first.event).toMatchObject({ type: "booked" });
    const second = await runTool("book_appointment", { ...person, date, window: "morning" }, ctx);
    expect(second.isError).toBe(true);
    expect(second.content).toMatch(/taken/);
    expect(await listLeads()).toHaveLength(1);
  });

  it("two simultaneous book_appointment calls for one slot book once", async () => {
    const date = futureWorkingDay();
    const results = await Promise.all([
      runTool("book_appointment", { ...person, date, window: "midday" }, ctx),
      runTool("book_appointment", { ...person, date, window: "midday" }, ctx),
    ]);
    expect(results.filter((r) => !r.isError)).toHaveLength(1);
    expect(await listLeads()).toHaveLength(1);
  });

  it("refuses to write when the visitor is rate limited", async () => {
    const r = await runTool("book_appointment", { ...person, date: futureWorkingDay(), window: "morning" }, { ...ctx, allowWrite: () => false });
    expect(r.isError).toBe(true);
    expect(await listLeads()).toHaveLength(0);
  });

  it("request_callback saves a lead without a visit", async () => {
    const r = await runTool("request_callback", { name: "Lee Park", phone: "4805550102", details: "Call me" }, ctx);
    expect(r.event).toMatchObject({ type: "callback" });
    expect((await listLeads())[0].appointment).toBeNull();
  });

  it("rejects bad input and unknown tools", async () => {
    expect((await runTool("book_appointment", { name: "x" }, ctx)).isError).toBe(true);
    expect((await runTool("nope", {}, ctx)).isError).toBe(true);
  });
});

describe("chat route and the AI kill switch", () => {
  const req = () =>
    new Request("http://x/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": `9.9.9.${Math.floor(Math.random() * 250)}` },
      body: JSON.stringify({ locale: "en", messages: [{ role: "user", content: "hi" }] }),
    });

  it("answers with the call-instead message when there is no key", async () => {
    const res = await chat(req());
    expect(res.status).toBe(503);
    expect(((await res.json()) as { error: string }).error).toMatch(/call or text/i);
    expect(sdk.stream).not.toHaveBeenCalled();
  });

  it("stops on the next request when the owner switches it off, even with a key", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    await setAiEnabled(false);
    const res = await chat(req());
    expect(res.status).toBe(503);
    expect(sdk.stream).not.toHaveBeenCalled();
    await setAiEnabled(true);
    delete process.env.ANTHROPIC_API_KEY;
  });
});
