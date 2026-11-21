import "server-only";
import { notifyNewLead } from "./notify";
import { recordOps } from "./ops";
import { claimSlot } from "./slots";
import { createLead, type NewLead } from "./store";
import type { Appointment, Lead } from "./types";
import { randomUUID } from "node:crypto";

export type BookResult =
  | { ok: true; lead: Lead; booked: boolean }
  | { ok: false; taken: true };

/**
 * The one way a new lead is created from the public site. Claims the visit slot (so two
 * bookings can't share it), saves the lead, then emails Alan. A failed email never loses the lead.
 *
 * If the slot is already taken: `onTaken: "reject"` saves nothing; `"save-without-visit"`
 * saves the lead with no appointment and a note.
 */
export async function createPublicLead(
  input: Omit<NewLead, "appointment" | "id">,
  appointment: Appointment | null,
  onTaken: "reject" | "save-without-visit" = "save-without-visit",
  takenNote?: string,
): Promise<BookResult> {
  const id = randomUUID();
  let appt = appointment;
  let note = input.note;
  if (appt && !(await claimSlot(appt.date, appt.window, id))) {
    if (onTaken === "reject") return { ok: false, taken: true };
    note = takenNote ?? "The requested time was taken. Offer another time.";
    appt = null;
  }
  let lead: Lead;
  try {
    lead = await createLead({ ...input, id, note, appointment: appt });
  } catch (err) {
    await recordOps("leadSave", false, err instanceof Error ? err.message : "save failed");
    throw err;
  }
  await recordOps("leadSave", true, "Last lead saved");
  await notifyNewLead(lead);
  return { ok: true, lead, booked: Boolean(appt) };
}
