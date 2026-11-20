import { NextResponse } from "next/server";
import { requireOwner, storageError } from "@/lib/crm-guard";
import { createLead, listLeads } from "@/lib/store";
import { crmCreateSchema } from "@/lib/validation";

export async function GET() {
  const denied = await requireOwner();
  if (denied) return denied;
  try {
    return NextResponse.json({ leads: await listLeads() });
  } catch (err) {
    return storageError(err);
  }
}

export async function POST(req: Request) {
  const denied = await requireOwner();
  if (denied) return denied;
  const parsed = crmCreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid lead" }, { status: 400 });
  }
  try {
    const lead = await createLead({ ...parsed.data, source: "manual" });
    return NextResponse.json({ lead }, { status: 201 });
  } catch (err) {
    return storageError(err);
  }
}
