import { NextResponse } from "next/server";
import { requireOwner, storageError } from "@/lib/crm-guard";
import { deleteLead, updateLead } from "@/lib/store";
import { crmPatchSchema } from "@/lib/validation";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireOwner();
  if (denied) return denied;
  const { id } = await ctx.params;
  const parsed = crmPatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid update" }, { status: 400 });
  }
  try {
    const lead = await updateLead(id, parsed.data);
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    return NextResponse.json({ lead });
  } catch (err) {
    return storageError(err);
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireOwner();
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    await deleteLead(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return storageError(err);
  }
}
