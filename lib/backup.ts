import "server-only";
import { listKeys, listKeysFrom, readJson, readJsonFrom, readMany, removeJson, removeJsonFrom, writeJson, writeJsonTo } from "./kv";
import { recordOps } from "./ops";
import { leadExpired } from "./retention";
import { todayInPhoenix } from "./schedule";
import type { Lead, Review } from "./types";

/**
 * Daily export of every lead and review to one JSON snapshot, kept as backups/<date>.json.
 * If BACKUP_BLOB_READ_WRITE_TOKEN is set (a second Blob store), the snapshot is written there too.
 * Restore: see README "Backup and restore".
 */

export interface Snapshot {
  version: 1;
  takenAt: string;
  leads: Lead[];
  reviews: Review[];
}

const backupKey = (date: string) => `backups/${date}.json`;
/** Daily snapshots kept in each store. Older ones are deleted, so storage stays bounded and leads removed by retention drop out of backups within this time. */
export const KEEP_SNAPSHOTS = 30;
export const secondStoreConfigured = () => Boolean(process.env.BACKUP_BLOB_READ_WRITE_TOKEN || process.env.BACKUP_READ_WRITE_TOKEN);
const secondToken = () => process.env.BACKUP_BLOB_READ_WRITE_TOKEN || process.env.BACKUP_READ_WRITE_TOKEN || null;

export async function runBackup(): Promise<{ date: string; leads: number; reviews: number; secondStore: boolean; pruned: number }> {
  const date = todayInPhoenix();
  const leads = await readMany<Lead>(await listKeys("leads/"));
  const reviews = (await readJson<Review[]>("reviews.json")) ?? [];
  const snapshot: Snapshot = { version: 1, takenAt: new Date().toISOString(), leads, reviews };
  await writeJson(backupKey(date), snapshot);
  const token = secondToken();
  if (token) await writeJsonTo(token, backupKey(date), snapshot);
  const pruned = await pruneBackups();
  return { date, leads: leads.length, reviews: reviews.length, secondStore: Boolean(token), pruned };
}

const dateOf = (k: string) => k.replace(/^backups\//, "").replace(/\.json$/, "");

/** Deletes snapshots beyond the newest KEEP_SNAPSHOTS, in both stores. Returns how many were removed. */
export async function pruneBackups(keep = KEEP_SNAPSHOTS): Promise<number> {
  const token = secondToken();
  const stale = (keys: string[]) => keys.sort((a, b) => dateOf(b).localeCompare(dateOf(a))).slice(keep);
  let removed = 0;
  for (const k of stale(await listKeys("backups/"))) {
    await removeJson(k);
    removed++;
  }
  if (token) {
    for (const k of stale(await listKeysFrom(token, "backups/"))) {
      await removeJsonFrom(token, k);
      removed++;
    }
  }
  return removed;
}

/**
 * Puts records from a snapshot back. Existing records are kept unless `overwrite` is set,
 * so a restore can't undo newer edits by accident. `ids` limits it to some records.
 */
export async function restoreBackup(
  date: string,
  opts: { overwrite?: boolean; ids?: string[]; from?: "primary" | "second" } = {},
): Promise<{ leads: number; reviews: number }> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Bad backup date");
  const token = secondToken();
  const snap =
    opts.from === "second" && token
      ? await readJsonFrom<Snapshot>(token, backupKey(date))
      : await readJson<Snapshot>(backupKey(date));
  if (!snap) throw new Error(`No backup for ${date}`);
  const want = (id: string) => !opts.ids || opts.ids.includes(id);
  const now = new Date();
  const existing = new Set(await listKeys("leads/"));
  let leads = 0;
  // Leads older than the retention cut-off were deleted on purpose: they stay deleted.
  for (const l of snap.leads.filter((x) => want(x.id) && !leadExpired(x, now))) {
    const k = `leads/${l.id}.json`;
    if (!opts.overwrite && existing.has(k)) continue;
    await writeJson(k, l);
    leads++;
  }
  // Reviews are one document: add back any that are missing (or replace with `overwrite`).
  let reviews = 0;
  const current = (await readJson<Review[]>("reviews.json")) ?? [];
  const byId = new Map(current.map((r) => [r.id, r]));
  for (const r of snap.reviews.filter((x) => want(x.id))) {
    if (!opts.overwrite && byId.has(r.id)) continue;
    byId.set(r.id, r);
    reviews++;
  }
  if (reviews) await writeJson("reviews.json", [...byId.values()]);
  await recordOps("restore", true, `Restored ${leads} leads and ${reviews} reviews from ${date}`);
  return { leads, reviews };
}

/** Dates that have a snapshot, newest first. */
export async function listBackups(): Promise<string[]> {
  return (await listKeys("backups/"))
    .map((k) => k.replace(/^backups\//, "").replace(/\.json$/, ""))
    .sort()
    .reverse();
}
