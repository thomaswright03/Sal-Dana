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

const KEY = "ops/state.json";

export async function getOps(): Promise<OpsState> {
  try {
    return (await readJson<OpsState>(KEY)) ?? {};
  } catch {
    return {};
  }
}

/** Records the outcome of one run. Best effort: storage trouble is logged, not thrown. */
export async function recordOps(key: OpsKey, ok: boolean, detail: string): Promise<void> {
  try {
    const state = await getOps();
    const now = new Date().toISOString();
    const prev = state[key];
    state[key] = {
      lastRun: now,
      lastOk: ok ? now : (prev?.lastOk ?? null),
      lastError: ok ? (prev?.lastError ?? null) : detail,
      lastErrorAt: ok ? (prev?.lastErrorAt ?? null) : now,
      detail,
    };
    await writeJson(KEY, state);
  } catch (err) {
    console.error(`ops record failed for ${key}`, err);
  }
}
