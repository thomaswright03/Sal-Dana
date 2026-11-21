import { NextResponse } from "next/server";
import { runBackup } from "@/lib/backup";
import { retryPendingNotifications } from "@/lib/notify";
import { cronAllowed, runJob } from "@/lib/cron";

/** Daily Vercel cron: snapshot all leads and reviews, prune old snapshots, resend failed lead emails. */
export async function GET(req: Request) {
  if (!cronAllowed(req)) return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  const out = await runJob("backup", "Daily backup", async () => ({
    ...(await runBackup()),
    // Also send again any new-lead emails that failed earlier.
    emails: await retryPendingNotifications().catch(() => ({ sent: 0, waiting: -1 })),
  }));
  return out.ok ? NextResponse.json(out.result) : NextResponse.json({ error: "Backup failed" }, { status: 500 });
}
