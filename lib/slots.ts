import "server-only";
import { readJson, removeJson, writeJsonIfAbsent } from "./kv";
import type { WindowId } from "./site";
import { getLead } from "./store";

/**
 * One marker document per date+window. Creating it fails if it already exists, so two
 * concurrent bookings for the same slot can't both succeed.
 */
const key = (date: string, window: WindowId) => `slots/${date}_${window}.json`;

interface Marker {
  leadId: string;
  at: string;
}

/** True if the marker still points at a live, non-cancelled appointment for that slot. */
async function markerLive(date: string, window: WindowId, marker: Marker | null): Promise<boolean> {
  if (!marker) return false;
  // A fresh marker may belong to a booking still being saved.
  if (Date.now() - Date.parse(marker.at) < 60_000) return true;
  const lead = await getLead(marker.leadId);
  const a = lead?.appointment;
  return Boolean(a && a.date === date && a.window === window && a.status !== "cancelled");
}

export async function claimSlot(date: string, window: WindowId, leadId: string): Promise<boolean> {
  const value: Marker = { leadId, at: new Date().toISOString() };
  if (await writeJsonIfAbsent(key(date, window), value)) return true;
  // Someone holds it. If that booking was cancelled or deleted, the slot is free again.
  const held = await readJson<Marker>(key(date, window)).catch(() => null);
  if (await markerLive(date, window, held)) return false;
  await removeJson(key(date, window));
  if (await writeJsonIfAbsent(key(date, window), value)) return true;
  return false;
}
