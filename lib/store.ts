import "server-only";
import { randomUUID } from "node:crypto";
import { listKeys, readJson, readMany, removeJson, writeJson, writeJsonIfAbsent } from "./kv";
import type { Lead, Note } from "./types";

export { StorageNotConfiguredError, storageReady } from "./kv";

/** Lead storage: one JSON document per lead. */

const PREFIX = "leads/";
const ID_RE = /^[a-z0-9-]{8,64}$/;
const key = (id: string) => `${PREFIX}${id}.json`;

/** Writes a complete lead record, replacing any existing one with the same id. */
export async function saveLead(lead: Lead): Promise<void> {
  return writeJson(key(lead.id), lead);
}

export async function listLeads(): Promise<Lead[]> {
  const leads = await readMany<Lead>(await listKeys(PREFIX));
  return leads.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getLead(id: string): Promise<Lead | null> {
  if (!ID_RE.test(id)) return null;
  return readJson<Lead>(key(id));
}

export type NewLead = Pick<Lead, "name" | "phone" | "source"> &
  Partial<Omit<Lead, "id" | "createdAt" | "updatedAt" | "notes">> & { note?: string; id?: string };

export function makeNote(text: string): Note {
  return { id: randomUUID(), at: new Date().toISOString(), text };
}

export async function createLead(input: NewLead): Promise<Lead> {
  const now = new Date().toISOString();
  const lead: Lead = {
    id: input.id ?? randomUUID(),
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
    ...(input.language ? { language: input.language } : {}),
  };
  await saveLead(lead);
  return lead;
}

/** The lead changed after the caller loaded it. */
export class ConflictError extends Error {
  constructor() {
    super("This lead changed since you opened it.");
    this.name = "ConflictError";
  }
}

export async function updateLead(
  id: string,
  patch: Partial<Omit<Lead, "id" | "createdAt" | "notes">> & {
    addNote?: string;
    removeNoteId?: string;
    /** The `updatedAt` the editor last saw. If the stored lead is newer, the save is refused. */
    expectedUpdatedAt?: string;
  },
): Promise<Lead | null> {
  const current = await getLead(id);
  if (!current) return null;
  if (patch.expectedUpdatedAt && patch.expectedUpdatedAt !== current.updatedAt) throw new ConflictError();
  // Atomic stale-edit check: each (lead, version) can be edited from exactly once. The first writer
  // creates the version marker (write-if-absent); a parallel save from the same version gets a conflict.
  let versionKey: string | null = null;
  if (patch.expectedUpdatedAt) {
    versionKey = `lead-versions/${id}_${patch.expectedUpdatedAt.replace(/[^0-9]/g, "")}.json`;
    if (!(await writeJsonIfAbsent(versionKey, { at: new Date().toISOString() }))) throw new ConflictError();
  }
  const { addNote, removeNoteId, ...rest } = patch;
  const { expectedUpdatedAt, ...fields } = rest;
  void expectedUpdatedAt;
  let notes = current.notes;
  if (removeNoteId) notes = notes.filter((n) => n.id !== removeNoteId);
  if (addNote) notes = [makeNote(addNote), ...notes];
  // Always move updatedAt forward, even within the same millisecond, so a copy taken before this
  // save can never match the new version (the stale-edit check compares these strings).
  const now = new Date(Math.max(Date.now(), Date.parse(current.updatedAt) + 1)).toISOString();
  const next: Lead = { ...current, ...fields, notes, id: current.id, updatedAt: now };
  // Remember when a job was closed out so revenue lands in the right month.
  if (fields.status && fields.status !== current.status) {
    next.closedAt = fields.status === "won" || fields.status === "lost" ? now : null;
  }
  try {
    await saveLead(next);
  } catch (err) {
    // The edit didn't land, so release the version for a retry.
    if (versionKey) await removeJson(versionKey).catch(() => undefined);
    throw err;
  }
  return next;
}

export async function deleteLead(id: string): Promise<boolean> {
  if (!ID_RE.test(id)) return false;
  await removeJson(key(id));
  return true;
}
