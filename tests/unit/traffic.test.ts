import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/track/route";
import { todayInPhoenix } from "@/lib/schedule";
import { classifyDevice, classifySource, getTraffic, recordHit } from "@/lib/traffic";

describe("traffic counting", () => {
  it("counts first views as visitors, repeat views as pageviews only, and events apart", async () => {
    await recordHit({ kind: "view", first: true, lang: "en", device: "desktop", source: "Direct" });
    await recordHit({ kind: "view", first: false, lang: "en", device: "desktop", source: "Direct" });
    await recordHit({ kind: "event", event: "call" });
    const days = await getTraffic(7);
    const today = days.at(-1)!;
    expect(today.date).toBe(todayInPhoenix());
    expect(today.visitors).toBe(1);
    expect(today.pageviews).toBe(2);
    expect(today.events.call).toBe(1);
    expect(today.devices.desktop).toBe(1);
    expect(today.hours.reduce((a, b) => a + b, 0)).toBe(1);
  });

  it("returns a 7-day window, oldest first, with quiet days as zeros", async () => {
    const days = await getTraffic(7);
    expect(days).toHaveLength(7);
    expect(days[0].date < days[6].date).toBe(true);
    expect(days.every((d) => d.visitors === 0)).toBe(true);
  });

  it("classifies devices and referrers", () => {
    expect(classifyDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Mobile")).toBe("mobile");
    expect(classifyDevice("Mozilla/5.0 (Windows NT 10.0; Win64)")).toBe("desktop");
    expect(classifySource("", "")).toBe("Direct");
  });
});

describe("POST /api/track", () => {
  const post = (body: unknown, ua = "Mozilla/5.0 (Windows NT 10.0)") =>
    POST(new Request("http://x/api/track", { method: "POST", headers: { "user-agent": ua, "content-type": "application/json" }, body: JSON.stringify(body) }));
  const view = { kind: "view", first: true, lang: "en", ref: "", utm: "" };

  it("always answers 204 and counts a real browser", async () => {
    expect((await post(view)).status).toBe(204);
    expect((await getTraffic(1))[0].visitors).toBe(1);
  });
  it("ignores bots and garbage", async () => {
    expect((await post(view, "Googlebot/2.1")).status).toBe(204);
    expect((await post({ kind: "nope" })).status).toBe(204);
    expect((await getTraffic(1))[0].visitors).toBe(0);
  });
});
