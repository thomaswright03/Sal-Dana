import "server-only";
import { alertFailure } from "./notify";
import { recordOps, type OpsKey } from "./ops";

/** Authorises a Vercel cron call: `Authorization: Bearer $CRON_SECRET`. */
export function cronAllowed(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && req.headers.get("authorization") === `Bearer ${secret}`;
}

/** Runs a job, records the outcome for /admin, and emails the named person if it fails. */
export async function runJob<T extends object>(
  key: OpsKey,
  label: string,
  job: () => Promise<T>,
): Promise<{ ok: true; result: T } | { ok: false; error: string }> {
  try {
    const result = await job();
    await recordOps(key, true, JSON.stringify(result));
    return { ok: true, result };
  } catch (err) {
    const error = err instanceof Error ? err.message : "failed";
    console.error(`${label} failed`, err);
    await recordOps(key, false, error);
    await alertFailure(label, error);
    return { ok: false, error };
  }
}
