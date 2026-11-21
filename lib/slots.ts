import "server-only";
import { listKeys, readJson, writeJsonIfAbsent } from "./kv";
import { dateProblem } from "./schedule";
import { windows, type WindowId } from "./site";
import { getLead } from "./store";

/**
 * Slot markers: one document per date+window+generation, `slots/<date>_<window>_g<n>.json`.
 * A marker is only ever created with write-if-absent, never deleted or overwritten. The
 * highest generation is the current holder. To take over a slot whose booking was cancelled
 * or deleted, a claimer writes generation n+1; exactly one claimer can create it, so two
 * bookings can't share a slot (this is what makes the takeover atomic).
 */
const prefix = (date: string, window: WindowId) => `slots/${date}_${window}_g`;
const keyFor = (date: string, window: WindowId, gen: number) => `${prefix(date, window)}${gen}.json`;
const MARKER_FRESH_MS = 60_000;

interface Marker {
  leadId: string;
  at: string;
}

interface Current {
  gen: number;
  marker: Marker | null;
}

function genOf(key: string): number {
  const m = /_g(\d+)\.json$/.exec(key);
  return m ? Number(m[1]) : -1;
}

/** Highest generation present for the slot (from a key list), and its marker. */
async function current(date: string, window: WindowId, keys: string[]): Promise<Current> {
  const mine = keys.filter((k) => k.startsWith(prefix(date, window)));
  if (mine.length === 0) return { gen: -1, marker: null };
  const gen = Math.max(...mine.map(genOf));
  const marker = await readJson<Marker>(keyFor(date, window, gen)).catch(() => null);
  return { gen, marker };
}

/** True if the marker points at a live, non-cancelled appointment for that slot. */
async function markerLive(date: string, window: WindowId, marker: Marker | null): Promise<boolean> {
  if (!marker) return false;
  // A fresh marker may belong to a booking still being saved.
  if (Date.now() - Date.parse(marker.at) < MARKER_FRESH_MS) return true;
  const lead = await getLead(marker.leadId);
  const a = lead?.appointment;
  return Boolean(a && a.date === date && a.window === window && a.status !== "cancelled");
}

export async function claimSlot(date: string, window: WindowId, leadId: string): Promise<boolean> {
  const value: Marker = { leadId, at: new Date().toISOString() };
  const cur = await current(date, window, await listKeys(`slots/${date}_`));
  if (cur.gen >= 0 && (await markerLive(date, window, cur.marker))) return false;
  // Free (never held, or the holder cancelled/was deleted): only one writer can create the next generation.
  return writeJsonIfAbsent(keyFor(date, window, cur.gen + 1), value);
}

/** The lead id currently holding a slot, or null if it is free. */
async function slotHolder(date: string, window: WindowId): Promise<string | null> {
  const cur = await current(date, window, await listKeys(`slots/${date}_`));
  return cur.marker && (await markerLive(date, window, cur.marker)) ? cur.marker.leadId : null;
}

/** Windows still open on a date: one list call plus a constant number of reads, however many leads exist. */
export async function openWindows(date: string): Promise<{ ok: true; open: WindowId[] } | { ok: false; reason: string }> {
  const reason = dateProblem(date);
  if (reason) return { ok: false, reason };
  const keys = await listKeys(`slots/${date}_`);
  const live = await Promise.all(
    windows.map(async (w) => {
      const cur = await current(date, w.id, keys);
      return (await markerLive(date, w.id, cur.marker)) ? w.id : null;
    }),
  );
  const taken = new Set(live.filter((x): x is WindowId => x !== null));
  return { ok: true, open: windows.map((w) => w.id).filter((id) => !taken.has(id)) };
}


export class SlotTakenError extends Error {
  constructor(public holderName: string) {
    super(`That window already has ${holderName} booked.`);
    this.name = "SlotTakenError";
  }
}

/**
 * For visits the owner sets in the CRM. Claims the slot for the lead, or throws SlotTakenError naming
 * who holds it. `allowDouble` lets the owner book it anyway after seeing the warning.
 */
export async function claimForOwner(
  appt: { date: string; window: WindowId; status: string } | null | undefined,
  leadId: string,
  allowDouble = false,
): Promise<void> {
  if (!appt || appt.status === "cancelled") return;
  if (await claimSlot(appt.date, appt.window, leadId)) return;
  const holder = await slotHolder(appt.date, appt.window);
  if (holder === leadId || allowDouble) return;
  const lead = holder ? await getLead(holder) : null;
  throw new SlotTakenError(lead?.name ?? "another visit");
}
