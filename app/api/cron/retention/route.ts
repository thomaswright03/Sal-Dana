import { NextResponse } from "next/server";
import { cronAllowed, runJob } from "@/lib/cron";
import { applyRetention } from "@/lib/retention";

/** Weekly Vercel cron. Vercel sends `Authorization: Bearer $CRON_SECRET`. */
export async function GET(req: Request) {
  if (!cronAllowed(req)) return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  const out = await runJob("retention", "Retention job", () => applyRetention());
  return out.ok
    ? NextResponse.json(out.result)
    : NextResponse.json({ error: "Retention run failed" }, { status: 500 });
}
