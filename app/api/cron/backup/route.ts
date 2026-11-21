import { NextResponse } from "next/server";
import { runBackup } from "@/lib/backup";
import { cronAllowed, runJob } from "@/lib/cron";

/** Daily Vercel cron: snapshot all leads and reviews. */
export async function GET(req: Request) {
  if (!cronAllowed(req)) return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  const out = await runJob("backup", "Daily backup", () => runBackup());
  return out.ok ? NextResponse.json(out.result) : NextResponse.json({ error: "Backup failed" }, { status: 500 });
}
