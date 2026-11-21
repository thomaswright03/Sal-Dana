import "server-only";
import { readJson, writeJson } from "./kv";

/** Owner switches kept in storage so they take effect on the next request, no redeploy. */
interface Settings {
  aiEnabled: boolean;
  changedAt?: string;
}

const KEY = "settings/site.json";

export async function getSettings(): Promise<Settings> {
  try {
    return (await readJson<Settings>(KEY)) ?? { aiEnabled: true };
  } catch {
    // If storage can't be read the assistant stays on; its own tools fail safely.
    return { aiEnabled: true };
  }
}

export async function setAiEnabled(aiEnabled: boolean): Promise<Settings> {
  const next = { aiEnabled, changedAt: new Date().toISOString() };
  await writeJson(KEY, next);
  return next;
}

/** True when a key is set and the owner hasn't switched the assistant off. */
export async function aiAvailable(): Promise<boolean> {
  return Boolean(process.env.ANTHROPIC_API_KEY) && (await getSettings()).aiEnabled;
}
