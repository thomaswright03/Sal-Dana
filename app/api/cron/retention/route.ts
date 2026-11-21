import { NextResponse } from "next/server";
import { applyRetention } from "@/lib/retention";

/** Weekly Vercel cron. Vercel sends `Authorization: Bearer $CRON_SECRET`. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }
  try {
    return NextResponse.json(await applyRetention());
  } catch (err) {
    console.error("retention error", err);
    return NextResponse.json({ error: "Retention run failed" }, { status: 500 });
  }
}
