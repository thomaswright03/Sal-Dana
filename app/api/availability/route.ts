import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { dateProblemCode } from "@/lib/schedule";
import { openWindows } from "@/lib/slots";

/** Public: which visit windows are still open on a date. Reuses the same check the booking uses. */
export async function GET(req: Request) {
  if (!rateLimit(`avail:${clientIp(req)}`, 60, 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }
  const date = new URL(req.url).searchParams.get("date") ?? "";
  const code = dateProblemCode(date);
  if (code) return NextResponse.json({ ok: false, code }, { headers: { "Cache-Control": "no-store" } });
  try {
    const day = await openWindows(date);
    if (!day.ok) return NextResponse.json({ ok: false, code: "invalid" });
    return NextResponse.json({ ok: true, open: day.open }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    // Storage trouble: don't block the form; the server re-checks on submit.
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
