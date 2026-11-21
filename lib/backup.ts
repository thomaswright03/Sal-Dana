import "server-only";
import { listKeys, readJson, readJsonFrom, readMany, writeJson, writeJsonTo } from "./kv";
import { recordOps } from "./ops";
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
const secondToken = () => process.env.BACKUP_BLOB_READ_WRITE_TOKEN || null;

export async function runBackup(): Promise<{ date: string; leads: number; reviews: number; secondStore: boolean }> {
  const date = todayInPhoenix();
  const leads = await readMany<Lead>(await listKeys("leads/"));
  const reviews = (await readJson<Review[]>("reviews.json")) ?? [];
  const snapshot: Snapshot = { version: 1, takenAt: new Date().toISOString(), leads, reviews };
  await writeJson(backupKey(date), snapshot);
  const token = secondToken();
  if (token) await writeJsonTo(token, backupKey(date), snapshot);
  return { date, leads: leads.length, reviews: reviews.length, secondStore: Boolean(token) };
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
  const existing = new Set(await listKeys("leads/"));
  let leads = 0;
  for (const l of snap.leads.filter((x) => want(x.id))) {
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
