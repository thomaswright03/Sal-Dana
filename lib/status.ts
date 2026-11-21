import "server-only";
import { assistantModel } from "./assistant-stream";
import { crmConfigured } from "./auth";
import { listBackups } from "./backup";
import { DEMO_MODE } from "./demo";
import { listKeys, storageReady } from "./kv";
import { getOps, type OpsEntry, type OpsKey } from "./ops";
import { getSettings } from "./settings";
import { getTraffic } from "./traffic";

import { pendingNotificationCount } from "./notify";
import { KEEP_SNAPSHOTS, secondStoreConfigured } from "./backup";
import type { Status, StatusReport, Tier } from "./status-types";

export type { StatusReport };

interface StatusItem {
  id: string;
  label: string;
  status: Status;
  lastChecked: string | null;
  lastSuccess: string | null;
  nextExpectedRun?: string | null;
  detail: string;
}

const DAY = 86_400_000;
const rank: Record<Status, number> = { ok: 0, unknown: 1, warning: 2, down: 3 };
const worst = (list: Status[]): Status => list.reduce<Status>((a, b) => (rank[b] > rank[a] ? b : a), "ok");

/** Next run of a cron given as "minute hour * * weekday|*" (UTC), matching vercel.json. */
export function nextCronRun(schedule: string, from = new Date()): Date {
  const [min, hour, , , dow] = schedule.split(" ");
  for (let i = 0; i <= 8; i++) {
    const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate() + i, Number(hour), Number(min)));
    if (d > from && (dow === "*" || Number(dow) === d.getUTCDay())) return d;
  }
  throw new Error(`Unsupported schedule ${schedule}`);
}

const SCHEDULES = { retention: "0 10 * * 1", backup: "0 11 * * *" } as const;

function fromOps(
  id: OpsKey,
  label: string,
  e: OpsEntry | undefined,
  opts: { staleAfterMs?: number; neverDetail: string; schedule?: string },
  now: Date,
): StatusItem {
  const next = opts.schedule ? nextCronRun(opts.schedule, now).toISOString() : null;
  if (!e || !e.lastRun) {
    return { id, label, status: "unknown", lastChecked: now.toISOString(), lastSuccess: null, nextExpectedRun: next, detail: opts.neverDetail };
  }
  const failedLast = e.lastErrorAt !== null && e.lastErrorAt === e.lastRun;
  let status: Status = failedLast ? "down" : "ok";
  let detail = failedLast ? `Last run failed: ${e.lastError}` : e.detail;
  if (!failedLast && opts.staleAfterMs && now.getTime() - Date.parse(e.lastRun) > opts.staleAfterMs) {
    status = "warning";
    detail = `Hasn't run since ${e.lastRun}.`;
  }
  return { id, label, status, lastChecked: now.toISOString(), lastSuccess: e.lastOk, nextExpectedRun: next, detail };
}

/** Real checks; none of them write anything. */
export async function getStatus(now = new Date()): Promise<StatusReport> {
  const iso = now.toISOString();
  const item = (id: string, label: string, status: Status, detail: string, lastSuccess: string | null = null): StatusItem => ({
    nextExpectedRun: null,
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

  const [ops, settings, backups, traffic, pending] = storageUp
    ? await Promise.all([getOps(), getSettings(), listBackups().catch(() => []), getTraffic(7).catch(() => []), pendingNotificationCount().catch(() => 0)])
    : [{}, { aiEnabled: true } as { aiEnabled: boolean; changedAt?: string }, [] as string[], [], 0];

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
  } else if (!process.env.EMAIL_FROM || !process.env.LEAD_NOTIFY_EMAIL) {
    // Resend's shared sender only delivers to the Resend account owner.
    if (notifyItem.status === "ok") notifyItem.status = "warning";
    notifyItem.detail = `Emails only reach the Resend account owner, not Alan, until a sending domain is verified and EMAIL_FROM and LEAD_NOTIFY_EMAIL are set. ${notifyItem.detail}`.trim();
  }
  const waiting = item(
    "leads-waiting-email",
    "Leads waiting for their email",
    !storageUp ? "unknown" : pending === 0 ? "ok" : "warning",
    !storageUp ? "Can't check while storage is down." : pending === 0 ? "None." : `${pending} lead(s) saved but their email hasn't gone out yet. The daily job and the next successful send try again.`,
  );

  // Basic
  const backupBase = fromOps("backup", "Latest backup", ops.backup, { staleAfterMs: 2 * DAY, neverDetail: "No backup has run yet.", schedule: SCHEDULES.backup }, now);
  const backup = !storageUp ? { ...backupBase, status: "unknown" as Status, detail: "Can't read backups while storage is down." } : { ...backupBase, detail: backupBase.status === "ok" ? "" : `${backupBase.detail} ${backups.length} snapshot(s) kept.`.trim() };
  const secondStore = item(
    "backup-second-store",
    "Backup in a second store",
    secondStoreConfigured() ? "ok" : "warning",
    secondStoreConfigured() ? `Snapshots are also written to the second Blob store (newest ${KEEP_SNAPSHOTS} kept).` : "BACKUP_READ_WRITE_TOKEN is not set: backups are in the same store as the live data.",
  );
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
  const version = item("version", `Deployed version${commit ? ` (${commit}${DEMO_MODE ? ", preview mode" : ""})` : ""}`, commit || deployedAt ? "ok" : "unknown", `${commit ?? "unknown commit"}${DEMO_MODE ? " (preview mode)" : ""}, deployed ${deployedAt ?? "unknown"}.`);

  const tiers: [Tier, StatusItem[]][] = [
    ["important", [form, assistant, notifyItem, waiting]],
    ["key", [anthropic, retention, tracking]],
    ["basic", [storage, crm, backup, secondStore, kill, version]],
  ];
  const functions: StatusReport["functions"] = tiers.flatMap(([tier, items]) =>
    items.map((i) => ({
      tier,
      name: i.label,
      status: i.status,
      last_checked: i.lastChecked,
      last_success: i.lastSuccess,
      next_expected_run: i.nextExpectedRun ?? null,
      detail: i.status === "ok" ? "" : i.detail,
    })),
  );
  // The worst status among the Important functions; unknown stays unknown.
  const overall = worst(functions.filter((f) => f.tier === "important").map((f) => f.status));
  return { product: "Sal Dana Renovations", checked_at: iso, overall, functions };
}
