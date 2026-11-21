import { afterEach, describe, expect, it } from "vitest";
import { cronAllowed } from "@/lib/cron";

afterEach(() => delete process.env.CRON_SECRET);
const req = (auth?: string) => new Request("https://x.test/api/cron/backup", { headers: auth ? { authorization: auth } : {} });

describe("cronAllowed", () => {
  it("refuses everything when no secret is set", () => expect(cronAllowed(req("Bearer undefined"))).toBe(false));
  it("accepts only the right bearer secret", () => {
    process.env.CRON_SECRET = "s3cret";
    expect(cronAllowed(req("Bearer s3cret"))).toBe(true);
    expect(cronAllowed(req("Bearer nope"))).toBe(false);
    expect(cronAllowed(req())).toBe(false);
  });
});
