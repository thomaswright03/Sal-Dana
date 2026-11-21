import "server-only";
import { RETENTION } from "./legal";
import type { Lead } from "./types";
import { deleteLead, listLeads, updateLead } from "./store";

const monthsAgo = (n: number, now: Date) => {
  const d = new Date(now);
  d.setUTCMonth(d.getUTCMonth() - n);
  return d.toISOString();
};

/** True if retention would delete this lead now (never became a job, older than the lead cut-off). */
export function leadExpired(l: Lead, now = new Date()): boolean {
  return l.status !== "won" && l.createdAt < monthsAgo(RETENTION.leadMonths, now);
}

/** Deletes leads that never became a job after 24 months, and drops chat transcripts after 12. Keep in step with the privacy policy. */
export async function applyRetention(now = new Date()) {
  const chatCut = monthsAgo(RETENTION.transcriptMonths, now);
  let deleted = 0;
  let cleared = 0;
  for (const l of await listLeads()) {
    if (leadExpired(l, now)) {
      await deleteLead(l.id);
      deleted++;
    } else if (l.transcript && l.createdAt < chatCut) {
      await updateLead(l.id, { transcript: null });
      cleared++;
    }
  }
  return { deleted, cleared };
}
