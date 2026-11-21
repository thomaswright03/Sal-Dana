import "server-only";
import { alertRecipient, leadRecipient, sendEmail, siteUrl } from "./email";
import { formatDate, windowLabel } from "./schedule";
import { listKeys, removeJson, writeJson } from "./kv";
import { recordOps } from "./ops";
import { getLead } from "./store";
import type { Lead } from "./types";

function leadEmailText(lead: Lead): string {
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

/** One marker per lead whose email hasn't gone out yet. */
const PENDING = "pending-email/";
const pendingKey = (id: string) => `${PENDING}${id}.json`;

export async function pendingNotificationCount(): Promise<number> {
  return (await listKeys(PENDING)).length;
}

async function sendLeadEmail(lead: Lead): Promise<boolean> {
  const sent = await sendEmail({
    to: leadRecipient(),
    subject: `New lead: ${lead.name}${lead.service ? ` (${lead.service})` : ""}`,
    text: leadEmailText(lead),
  });
  if (sent.ok) {
    await recordOps("leadNotify", true, "Last new-lead email sent");
    await removeJson(pendingKey(lead.id)).catch(() => undefined);
    return true;
  }
  console.error("lead notification failed", sent.error);
  await recordOps("leadNotify", false, sent.error);
  // Remember it, so a later run can send it again.
  await writeJson(pendingKey(lead.id), { leadId: lead.id, failedAt: new Date().toISOString() }).catch(() => undefined);
  return false;
}

/**
 * Emails Alan about a new real lead. Called after the lead is saved. Never throws, so a
 * failed send can't lose the lead; the outcome is logged and shown on /admin, and the lead
 * is queued to be sent again (daily cron, or the next successful send).
 */
export async function notifyNewLead(lead: Lead): Promise<boolean> {
  if (lead.demo) return true;
  const ok = await sendLeadEmail(lead);
  if (ok) await retryPendingNotifications().catch(() => undefined);
  return ok;
}

/** Sends again every lead email that failed before. Returns how many went out and how many are still waiting. */
export async function retryPendingNotifications(): Promise<{ sent: number; waiting: number }> {
  let sent = 0;
  let waiting = 0;
  for (const k of await listKeys(PENDING)) {
    const id = k.slice(PENDING.length, -".json".length);
    const lead = await getLead(id).catch(() => null);
    if (!lead) {
      await removeJson(k).catch(() => undefined); // deleted since
      continue;
    }
    if (await sendLeadEmail(lead)) sent++;
    else waiting++;
  }
  return { sent, waiting };
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
