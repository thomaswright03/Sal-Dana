import "server-only";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { del, get, list, put } from "@vercel/blob";
import type { Lead, Note } from "./types";

/**
 * Lead storage.
 *
 * Production: one private JSON blob per lead in a Vercel Blob store.
 * Local development (no blob credentials, not on Vercel): JSON files in .data/.
 */

const PREFIX = "leads/";

export class StorageNotConfiguredError extends Error {
  constructor() {
    super("Lead storage is not configured. Connect a Vercel Blob store to this project.");
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

const ID_RE = /^[a-z0-9-]{8,64}$/;
const DATA_DIR = path.join(process.cwd(), ".data", "leads");

function blobPath(id: string) {
  return `${PREFIX}${id}.json`;
}

async function readBlob(pathname: string): Promise<Lead | null> {
  const res = await get(pathname, { access: "private", useCache: false });
  if (!res || !res.stream) return null;
  const text = await new Response(res.stream).text();
  return JSON.parse(text) as Lead;
}

/** Writes a complete lead record, replacing any existing one with the same id. */
export async function saveLead(lead: Lead): Promise<void> {
  return write(lead);
}

async function write(lead: Lead): Promise<void> {
  if (backend() === "blob") {
    await put(blobPath(lead.id), JSON.stringify(lead), {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 60,
    });
    return;
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(path.join(DATA_DIR, `${lead.id}.json`), JSON.stringify(lead, null, 2));
}

export async function listLeads(): Promise<Lead[]> {
  let leads: Lead[] = [];
  if (backend() === "blob") {
    const paths: string[] = [];
    let cursor: string | undefined;
    do {
      const page = await list({ prefix: PREFIX, cursor, limit: 1000 });
      paths.push(...page.blobs.map((b) => b.pathname));
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);

    // Read in small batches so a large pipeline doesn't open hundreds of requests at once.
    for (let i = 0; i < paths.length; i += 20) {
      const batch = await Promise.all(paths.slice(i, i + 20).map((p) => readBlob(p).catch(() => null)));
      leads.push(...batch.filter((l): l is Lead => l !== null));
    }
  } else {
    const files = await fs.readdir(DATA_DIR).catch(() => [] as string[]);
    const read = await Promise.all(
      files
        .filter((f) => f.endsWith(".json"))
        .map(async (f) => {
          try {
            return JSON.parse(await fs.readFile(path.join(DATA_DIR, f), "utf8")) as Lead;
          } catch {
            return null;
          }
        }),
    );
    leads = read.filter((l): l is Lead => l !== null);
  }
  return leads.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getLead(id: string): Promise<Lead | null> {
  if (!ID_RE.test(id)) return null;
  if (backend() === "blob") return readBlob(blobPath(id));
  try {
    return JSON.parse(await fs.readFile(path.join(DATA_DIR, `${id}.json`), "utf8")) as Lead;
  } catch {
    return null;
  }
}

export type NewLead = Pick<Lead, "name" | "phone" | "source"> &
  Partial<Omit<Lead, "id" | "createdAt" | "updatedAt" | "notes">> & { note?: string };

export function makeNote(text: string): Note {
  return { id: randomUUID(), at: new Date().toISOString(), text };
}

export async function createLead(input: NewLead): Promise<Lead> {
  const now = new Date().toISOString();
  const lead: Lead = {
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
    name: input.name,
    phone: input.phone,
    email: input.email ?? "",
    address: input.address ?? "",
    service: input.service ?? "",
    details: input.details ?? "",
    source: input.source,
    status: input.status ?? "new",
    value: input.value ?? null,
    appointment: input.appointment ?? null,
    notes: input.note ? [makeNote(input.note)] : [],
    transcript: input.transcript ?? null,
  };
  await write(lead);
  return lead;
}

export async function updateLead(
  id: string,
  patch: Partial<Omit<Lead, "id" | "createdAt" | "notes">> & { addNote?: string; removeNoteId?: string },
): Promise<Lead | null> {
  const current = await getLead(id);
  if (!current) return null;
  const { addNote, removeNoteId, ...fields } = patch;
  let notes = current.notes;
  if (removeNoteId) notes = notes.filter((n) => n.id !== removeNoteId);
  if (addNote) notes = [makeNote(addNote), ...notes];
  const next: Lead = { ...current, ...fields, notes, id: current.id, updatedAt: new Date().toISOString() };
  await write(next);
  return next;
}

export async function deleteLead(id: string): Promise<boolean> {
  if (!ID_RE.test(id)) return false;
  if (backend() === "blob") {
    await del(blobPath(id));
    return true;
  }
  await fs.rm(path.join(DATA_DIR, `${id}.json`), { force: true });
  return true;
}
