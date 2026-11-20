import { NextResponse } from "next/server";
import { assistantModel } from "@/lib/assistant";
import { requireOwner } from "@/lib/crm-guard";
import { DEMO_MODE } from "@/lib/demo";
import { storageReady } from "@/lib/kv";

/** What is connected, for the dashboard's settings and assistant screens. */
export async function GET() {
  const denied = await requireOwner();
  if (denied) return denied;
  return NextResponse.json({
    ai: Boolean(process.env.ANTHROPIC_API_KEY),
    model: assistantModel(),
    storage: storageReady(),
    previewMode: DEMO_MODE,
  });
}
