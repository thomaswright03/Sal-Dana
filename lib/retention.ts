import "server-only";
import { RETENTION } from "./legal";
import { deleteLead, listLeads, updateLead } from "./store";

const monthsAgo = (n: number, now: Date) => {
  const d = new Date(now);
  d.setUTCMonth(d.getUTCMonth() - n);
  return d.toISOString();
};

/** Deletes leads that never became a job after 24 months, and drops chat transcripts after 12. Keep in step with the privacy policy. */
export async function applyRetention(now = new Date()) {
  const leadCut = monthsAgo(RETENTION.leadMonths, now);
  const chatCut = monthsAgo(RETENTION.transcriptMonths, now);
  let deleted = 0;
  let cleared = 0;
  for (const l of await listLeads()) {
    if (l.status !== "won" && l.createdAt < leadCut) {
      await deleteLead(l.id);
      deleted++;
    } else if (l.transcript && l.createdAt < chatCut) {
      await updateLead(l.id, { transcript: null });
      cleared++;
    }
  }
  return { deleted, cleared };
}
