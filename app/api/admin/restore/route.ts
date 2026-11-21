import { connection, NextResponse } from "next/server";
import { z } from "zod";
import { listBackups, restoreBackup } from "@/lib/backup";

const body = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  ids: z.array(z.string().max(64)).max(500).optional(),
  overwrite: z.boolean().optional(),
  from: z.enum(["primary", "second"]).optional(),
});

/** Admin only (the proxy checks the admin cookie). GET lists snapshots; POST restores from one. */
export async function GET() {
  await connection();
  return NextResponse.json({ backups: await listBackups() });
}

export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Send {date, ids?, overwrite?}" }, { status: 400 });
  try {
    return NextResponse.json(await restoreBackup(parsed.data.date, parsed.data));
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Restore failed" }, { status: 500 });
  }
}
