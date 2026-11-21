import { NextResponse } from "next/server";
import { assistantModel } from "@/lib/assistant";
import { requireOwner } from "@/lib/crm-guard";
import { DEMO_MODE } from "@/lib/demo";
import { storageReady } from "@/lib/kv";
import { getSettings } from "@/lib/settings";

/** What is connected, for the dashboard's settings and assistant screens. */
export async function GET() {
  const denied = await requireOwner();
  if (denied) return denied;
  return NextResponse.json({
    ai: Boolean(process.env.ANTHROPIC_API_KEY),
    aiEnabled: (await getSettings()).aiEnabled,
    model: assistantModel(),
    storage: storageReady(),
    previewMode: DEMO_MODE,
  });
}
