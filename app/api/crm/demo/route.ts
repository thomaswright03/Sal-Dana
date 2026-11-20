import { NextResponse } from "next/server";
import { requireOwner, storageError } from "@/lib/crm-guard";
import { clearDemoLeads, loadDemoLeads } from "@/lib/demo-leads";
import { listLeads } from "@/lib/store";

/** Load or remove the sample leads used to preview the CRM. */
export async function POST(req: Request) {
  const denied = await requireOwner();
  if (denied) return denied;
  const body = (await req.json().catch(() => null)) as { action?: unknown } | null;
  try {
    if (body?.action === "load") await loadDemoLeads();
    else if (body?.action === "clear") await clearDemoLeads();
    else return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    return NextResponse.json({ leads: await listLeads() });
  } catch (err) {
    return storageError(err);
  }
}
