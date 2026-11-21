import "server-only";
import { assistantModel } from "./assistant-stream";
import { crmConfigured } from "./auth";
import { listBackups } from "./backup";
import { DEMO_MODE } from "./demo";
import { listKeys, storageReady } from "./kv";
import { getOps, type OpsEntry, type OpsKey } from "./ops";
import { getSettings } from "./settings";
import { getTraffic } from "./traffic";

import type { Status, StatusItem, StatusReport } from "./status-types";

export type { Status, StatusItem, StatusReport };

const DAY = 86_400_000;
const rank: Record<Status, number> = { ok: 0, unknown: 1, warning: 2, down: 3 };
export const worst = (list: Status[]): Status => list.reduce<Status>((a, b) => (rank[b] > rank[a] ? b : a), "ok");

/** Next run of a cron given as "minute hour * * weekday|*" (UTC), matching vercel.json. */
export function nextCronRun(schedule: string, from = new Date()): Date {
  const [min, hour, , , dow] = schedule.split(" ");
  for (let i = 0; i <= 8; i++) {
    const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate() + i, Number(hour), Number(min)));
    if (d > from && (dow === "*" || Number(dow) === d.getUTCDay())) return d;
  }
  throw new Error(`Unsupported schedule ${schedule}`);
}

export const SCHEDULES = { retention: "0 10 * * 1", backup: "0 11 * * *" } as const;

function fromOps(
  id: OpsKey,
  label: string,
  e: OpsEntry | undefined,
  opts: { staleAfterMs?: number; neverDetail: string; schedule?: string },
  now: Date,
): StatusItem {
  const next = opts.schedule ? ` Next run ${nextCronRun(opts.schedule, now).toISOString()}.` : "";
  if (!e || !e.lastRun) {
    return { id, label, status: "unknown", lastChecked: now.toISOString(), lastSuccess: null, detail: opts.neverDetail + next };
  }
  const failedLast = e.lastErrorAt !== null && e.lastErrorAt === e.lastRun;
  let status: Status = failedLast ? "down" : "ok";
  let detail = failedLast ? `Last run failed: ${e.lastError}` : e.detail;
  if (!failedLast && opts.staleAfterMs && now.getTime() - Date.parse(e.lastRun) > opts.staleAfterMs) {
    status = "warning";
    detail = `Hasn't run since ${e.lastRun}.`;
  }
  return { id, label, status, lastChecked: now.toISOString(), lastSuccess: e.lastOk, detail: detail + next };
}

/** Real checks; none of them write anything. */
export async function getStatus(now = new Date()): Promise<StatusReport> {
  const iso = now.toISOString();
  const item = (id: string, label: string, status: Status, detail: string, lastSuccess: string | null = null): StatusItem => ({
    id,
    label,
    status,
    detail,
    lastChecked: iso,
    lastSuccess: lastSuccess ?? (status === "ok" ? iso : null),
  });

  // Storage: a real read of the lead index.
  let storage: StatusItem;
  if (!storageReady()) {
    storage = item("storage", "Blob storage", "down", "Storage is not connected (BLOB_READ_WRITE_TOKEN missing).");
  } else {
    try {
      const n = (await listKeys("leads/")).length;
      storage = item("storage", "Blob storage", "ok", `Readable. ${n} lead documents.`);
    } catch (err) {
      storage = item("storage", "Blob storage", "down", `Read failed: ${err instanceof Error ? err.message : "error"}`);
    }
  }
  const storageUp = storage.status === "ok";

  const [ops, settings, backups, traffic] = storageUp
    ? await Promise.all([getOps(), getSettings(), listBackups().catch(() => []), getTraffic(7).catch(() => [])])
    : [{}, { aiEnabled: true } as { aiEnabled: boolean; changedAt?: string }, [] as string[], []];

  const hasKey = Boolean(process.env.ANTHROPIC_API_KEY);

  // Important
  const leadSave = fromOps("leadSave", "Booking form saves a lead", ops.leadSave, { neverDetail: "No lead saved since logging began." }, now);
  const form: StatusItem = !storageUp
    ? item("booking-form", "Booking form saves a lead", "down", "Storage is down, so new requests can't be saved.")
    : leadSave.status === "down"
      ? { ...leadSave, id: "booking-form", label: "Booking form saves a lead" }
      : item("booking-form", "Booking form saves a lead", "ok", `Storage is up. ${leadSave.status === "ok" ? leadSave.detail : "No saved lead recorded yet."}`, leadSave.lastSuccess);
  const assistant: StatusItem = !storageUp
    ? item("assistant-books", "Assistant books a visit", "down", "Storage is down, so bookings can't be saved.")
    : !hasKey
      ? item("assistant-books", "Assistant books a visit", "warning", "Assistant is off: no Anthropic key is set. Visitors see the call-instead message.")
      : !settings.aiEnabled
        ? item("assistant-books", "Assistant books a visit", "warning", "Assistant is switched off by the owner.")
        : item("assistant-books", "Assistant books a visit", "ok", "Key set, switch on, storage up.");

  // Key
  const anth = ops.anthropic;
  const anthropic: StatusItem = !hasKey
    ? item("anthropic", "Anthropic API", "warning", "No API key set; the assistant is not switched on.")
    : anth?.lastErrorAt && anth.lastErrorAt === anth.lastRun
      ? item("anthropic", "Anthropic API", "down", `Last call failed: ${anth.lastError}`, anth.lastOk)
      : anth?.lastOk
        ? item("anthropic", "Anthropic API", "ok", `Model ${assistantModel()}. ${anth.detail}`, anth.lastOk)
        : item("anthropic", "Anthropic API", "unknown", `Key set, model ${assistantModel()}; no call recorded yet.`);
  const retention = fromOps("retention", "Retention cron", ops.retention, { staleAfterMs: 9 * DAY, neverDetail: "Hasn't run yet.", schedule: SCHEDULES.retention }, now);
  const lastDay = [...traffic].reverse().find((d) => d.visitors > 0);
  const tracking = !storageUp
    ? item("tracking", "Visitor tracking", "down", "Storage is down.")
    : lastDay
      ? item("tracking", "Visitor tracking", "ok", `Last visits recorded on ${lastDay.date}.`)
      : item("tracking", "Visitor tracking", "warning", "No visits recorded in the last 7 days.");
  const notifyItem = fromOps("leadNotify", "New-lead email", ops.leadNotify, { neverDetail: "No new-lead email sent yet." }, now);
  if (!process.env.RESEND_API_KEY) {
    notifyItem.status = "down";
    notifyItem.detail = "RESEND_API_KEY is not set: Alan is not told about new leads.";
  }

  // Basic
  const backupBase = fromOps("backup", "Latest backup", ops.backup, { staleAfterMs: 2 * DAY, neverDetail: "No backup has run yet.", schedule: SCHEDULES.backup }, now);
  const backup = { ...backupBase, detail: `${backupBase.detail} ${backups.length} snapshot(s) kept.` };
  const crm = item(
    "crm-signin",
    "CRM sign-in",
    crmConfigured() ? "ok" : "down",
    crmConfigured() ? "Password is set." : "CRM_PASSWORD is missing or too short.",
  );
  const kill = !storageUp
    ? item("ai-switch", "AI kill switch", "unknown", "Can't read the setting while storage is down.")
    : item("ai-switch", "AI kill switch", "ok", settings.aiEnabled ? "Assistant is allowed to run." : `Assistant is switched off (since ${settings.changedAt ?? "unknown"}).`);
  const deployedAt = process.env.BUILD_TIME || null;
  const commit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null;
  const version = item("version", "Deployed version", commit || deployedAt ? "ok" : "unknown", `${commit ?? "unknown commit"}${DEMO_MODE ? " (preview mode)" : ""}, deployed ${deployedAt ?? "unknown"}.`);

  const groups: StatusReport["groups"] = [
    { tier: "important", items: [form, assistant] },
    { tier: "key", items: [anthropic, retention, tracking, notifyItem] },
    { tier: "basic", items: [storage, crm, backup, kill, version] },
  ];
  const all = groups.flatMap((g) => g.items);
  const important = groups[0].items;
  // Down only when something Important or storage is down; other trouble shows as a warning.
  const overall: Status =
    worst(important.map((i) => i.status)) === "down" || storage.status === "down"
      ? "down"
      : worst(all.map((i) => (i.status === "unknown" ? "ok" : i.status === "down" ? "warning" : i.status)));
  return { project: "Sal Dana Renovations", overall, checkedAt: iso, version: { commit, deployedAt }, groups };
}
