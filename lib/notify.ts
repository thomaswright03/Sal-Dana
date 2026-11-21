import "server-only";
import { alertRecipient, leadRecipient, sendEmail, siteUrl } from "./email";
import { formatDate, windowLabel } from "./schedule";
import { recordOps } from "./ops";
import type { Lead } from "./types";

export function leadEmailText(lead: Lead): string {
  const slot = lead.appointment
    ? `${formatDate(lead.appointment.date)}, ${windowLabel(lead.appointment.window)} (requested)`
    : "No time requested";
  return [
    `New lead from the ${lead.source === "ai-assistant" ? "AI assistant" : "website form"}.`,
    "",
    `Name: ${lead.name}`,
    `Phone: ${lead.phone}`,
    `Service: ${lead.service || "Not said"}`,
    `Requested visit: ${slot}`,
    "",
    `Open it: ${siteUrl()}/crm/leads?lead=${lead.id}`,
  ].join("\n");
}

/**
 * Emails Alan about a new real lead. Called after the lead is saved. Never throws, so a
 * failed send can't lose the lead; the outcome is logged and shown on /admin.
 */
export async function notifyNewLead(lead: Lead): Promise<boolean> {
  if (lead.demo) return true;
  const sent = await sendEmail({
    to: leadRecipient(),
    subject: `New lead: ${lead.name}${lead.service ? ` (${lead.service})` : ""}`,
    text: leadEmailText(lead),
  });
  if (sent.ok) {
    await recordOps("leadNotify", true, "Last new-lead email sent");
    return true;
  }
  console.error("lead notification failed", sent.error);
  await recordOps("leadNotify", false, sent.error);
  return false;
}

/** Emails the named person when a background job fails. */
export async function alertFailure(job: string, error: string): Promise<void> {
  const sent = await sendEmail({
    to: alertRecipient(),
    subject: `Sal Dana site: ${job} failed`,
    text: `${job} failed.\n\n${error}\n\nSee ${siteUrl()}/admin`,
  });
  if (!sent.ok) console.error("failure alert not sent", sent.error);
}
