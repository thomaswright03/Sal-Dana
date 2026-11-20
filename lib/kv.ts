import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { del, get, list, put } from "@vercel/blob";

/**
 * Small JSON document store.
 *
 * Production: private objects in a Vercel Blob store.
 * Local development (no blob credentials, not on Vercel): files in .data/.
 */

export class StorageNotConfiguredError extends Error {
  constructor() {
    super("Storage is not configured. Connect a Vercel Blob store to this project.");
    this.name = "StorageNotConfiguredError";
  }
}

function backend(): "blob" | "file" {
  if (process.env.BLOB_READ_WRITE_TOKEN) return "blob";
  if (process.env.VERCEL) throw new StorageNotConfiguredError();
  return "file";
}

export function storageReady(): boolean {
  try {
    backend();
    return true;
  } catch {
    return false;
  }
}

const KEY_RE = /^[a-z0-9][a-z0-9/_-]{0,120}\.json$/;
const DATA_DIR = path.join(process.cwd(), ".data");

function check(key: string) {
  if (!KEY_RE.test(key) || key.includes("..")) throw new Error(`Bad storage key: ${key}`);
}

export async function readJson<T>(key: string): Promise<T | null> {
  check(key);
  if (backend() === "blob") {
    const res = await get(key, { access: "private", useCache: false });
    if (!res || !res.stream) return null;
    return JSON.parse(await new Response(res.stream).text()) as T;
  }
  try {
    return JSON.parse(await fs.readFile(path.join(DATA_DIR, key), "utf8")) as T;
  } catch {
    return null;
  }
}

export async function writeJson(key: string, value: unknown): Promise<void> {
  check(key);
  if (backend() === "blob") {
    await put(key, JSON.stringify(value), {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 60,
    });
    return;
  }
  const file = path.join(DATA_DIR, key);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(value, null, 2));
}

export async function removeJson(key: string): Promise<void> {
  check(key);
  if (backend() === "blob") {
    await del(key);
    return;
  }
  await fs.rm(path.join(DATA_DIR, key), { force: true });
}

/** Keys under a prefix such as "leads/". */
export async function listKeys(prefix: string): Promise<string[]> {
  if (backend() === "blob") {
    const keys: string[] = [];
    let cursor: string | undefined;
    do {
      const page = await list({ prefix, cursor, limit: 1000 });
      keys.push(...page.blobs.map((b) => b.pathname));
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    return keys;
  }
  const files = await fs.readdir(path.join(DATA_DIR, prefix)).catch(() => [] as string[]);
  return files.filter((f) => f.endsWith(".json")).map((f) => `${prefix}${f}`);
}

/** Reads many documents, a few at a time, skipping any that fail to load. */
export async function readMany<T>(keys: string[]): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < keys.length; i += 20) {
    const batch = await Promise.all(keys.slice(i, i + 20).map((k) => readJson<T>(k).catch(() => null)));
    out.push(...batch.filter((v): v is Awaited<T> => v !== null));
  }
  return out;
}
