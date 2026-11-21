import "server-only";
import { readJson, writeJson } from "./kv";

/**
 * Small operations log kept in storage: when each background job and integration last
 * ran or succeeded. The /admin status page reads it. Writes never throw.
 */

export type OpsKey =
  | "retention"
  | "backup"
  | "leadSave"
  | "leadNotify"
  | "anthropic"
  | "restore";

export interface OpsEntry {
  lastRun: string | null;
  lastOk: string | null;
  lastError: string | null;
  lastErrorAt: string | null;
  detail: string;
}

export type OpsState = Partial<Record<OpsKey, OpsEntry>>;

const KEYS: OpsKey[] = ["retention", "backup", "leadSave", "leadNotify", "anthropic", "restore"];
/** One document per key, so two jobs recording at once can't overwrite each other. */
const docKey = (k: OpsKey) => `ops/${k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}.json`;

export async function getOps(): Promise<OpsState> {
  const state: OpsState = {};
  await Promise.all(
    KEYS.map(async (k) => {
      try {
        const e = await readJson<OpsEntry>(docKey(k));
        if (e) state[k] = e;
      } catch {
        /* unreadable: treated as never run */
      }
    }),
  );
  return state;
}

/** Records the outcome of one run. Best effort: storage trouble is logged, not thrown. */
export async function recordOps(key: OpsKey, ok: boolean, detail: string): Promise<void> {
  try {
    const prev = await readJson<OpsEntry>(docKey(key));
    const now = new Date().toISOString();
    const entry: OpsEntry = {
      lastRun: now,
      lastOk: ok ? now : (prev?.lastOk ?? null),
      lastError: ok ? (prev?.lastError ?? null) : detail,
      lastErrorAt: ok ? (prev?.lastErrorAt ?? null) : now,
      detail,
    };
    await writeJson(docKey(key), entry);
  } catch (err) {
    console.error(`ops record failed for ${key}`, err);
  }
}
