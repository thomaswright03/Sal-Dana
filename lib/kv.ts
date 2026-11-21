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

/** Writes only if the key doesn't exist yet. Returns false when someone else got there first. */
export async function writeJsonIfAbsent(key: string, value: unknown): Promise<boolean> {
  check(key);
  if (backend() === "blob") {
    try {
      await put(key, JSON.stringify(value), {
        access: "private",
        contentType: "application/json",
        addRandomSuffix: false,
        allowOverwrite: false,
      });
      return true;
    } catch (err) {
      if (err instanceof Error && /already exists/i.test(err.message)) return false;
      throw err;
    }
  }
  const file = path.join(DATA_DIR, key);
  await fs.mkdir(path.dirname(file), { recursive: true });
  try {
    await fs.writeFile(file, JSON.stringify(value, null, 2), { flag: "wx" });
    return true;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "EEXIST") return false;
    throw err;
  }
}

/** Writes a document to a second Blob store (token from BACKUP_BLOB_READ_WRITE_TOKEN). */
export async function writeJsonTo(token: string, key: string, value: unknown): Promise<void> {
  check(key);
  await put(key, JSON.stringify(value), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    token,
  });
}

export async function readJsonFrom<T>(token: string, key: string): Promise<T | null> {
  check(key);
  const res = await get(key, { access: "private", useCache: false, token });
  if (!res || !res.stream) return null;
  return JSON.parse(await new Response(res.stream).text()) as T;
}

export async function removeJsonFrom(token: string, key: string): Promise<void> {
  check(key);
  await del(key, { token });
}

export async function listKeysFrom(token: string, prefix: string): Promise<string[]> {
  const keys: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix, cursor, limit: 1000, token });
    keys.push(...page.blobs.map((b) => b.pathname));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return keys;
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
  // The prefix may end mid-name ("slots/2026-11-25_"), like a Blob prefix.
  const cut = prefix.lastIndexOf("/") + 1;
  const dir = prefix.slice(0, cut);
  const namePrefix = prefix.slice(cut);
  const files = await fs.readdir(path.join(DATA_DIR, dir)).catch(() => [] as string[]);
  return files.filter((f) => f.endsWith(".json") && f.startsWith(namePrefix)).map((f) => `${dir}${f}`);
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
