import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOwner, storageError } from "@/lib/crm-guard";
import { getSettings, setAiEnabled } from "@/lib/settings";

export async function GET() {
  const denied = await requireOwner();
  if (denied) return denied;
  return NextResponse.json(await getSettings());
}

/** The assistant on/off switch. Takes effect on the next chat or Ask AI request. */
export async function PATCH(req: Request) {
  const denied = await requireOwner();
  if (denied) return denied;
  const parsed = z.object({ aiEnabled: z.boolean() }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Send {aiEnabled: true|false}" }, { status: 400 });
  try {
    return NextResponse.json(await setAiEnabled(parsed.data.aiEnabled));
  } catch (err) {
    return storageError(err);
  }
}
