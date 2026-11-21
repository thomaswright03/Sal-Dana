import { NextResponse } from "next/server";
import { requireOwner, storageError } from "@/lib/crm-guard";
import { claimForOwner, SlotTakenError } from "@/lib/slots";
import { ConflictError, deleteLead, getLead, updateLead } from "@/lib/store";
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
    const { confirmDoubleBook, ...patch } = parsed.data;
    const appt = patch.appointment;
    if (appt) {
      const before = (await getLead(id))?.appointment;
      const moved = !before || before.date !== appt.date || before.window !== appt.window || before.status === "cancelled";
      if (moved) await claimForOwner(appt, id, confirmDoubleBook);
    }
    const lead = await updateLead(id, patch);
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    return NextResponse.json({ lead });
  } catch (err) {
    if (err instanceof ConflictError) {
      return NextResponse.json({ error: err.message, code: "conflict" }, { status: 409 });
    }
    if (err instanceof SlotTakenError) {
      return NextResponse.json({ error: err.message, code: "slot-taken" }, { status: 409 });
    }
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
