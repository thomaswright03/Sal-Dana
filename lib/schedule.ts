import { site, windows, type WindowId } from "./site";
import type { Lead } from "./types";

/** Today's date (YYYY-MM-DD) in the business's timezone. */
export function todayInPhoenix(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: site.timezone }).format(new Date());
}

export function isValidDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const d = new Date(`${date}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === date;
}

export function weekday(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

export type DayCheck = { ok: true; open: WindowId[] } | { ok: false; reason: string };

/** Which visit windows are still open on a given day. */
export function checkDay(date: string, leads: Lead[]): DayCheck {
  if (!isValidDate(date)) return { ok: false, reason: "That isn't a valid date. Use YYYY-MM-DD." };
  const today = todayInPhoenix();
  if (date <= today) return { ok: false, reason: "Visits can be requested from tomorrow onward." };
  const max = new Date(`${today}T12:00:00Z`);
  max.setUTCDate(max.getUTCDate() + 90);
  if (date > max.toISOString().slice(0, 10))
    return { ok: false, reason: "Visits can be requested up to 90 days ahead." };
  if (!(site.workingDays as readonly number[]).includes(weekday(date)))
    return { ok: false, reason: `Alan works ${site.hoursDisplay}. Pick another day.` };

  const taken = new Set(
    leads
      .filter((l) => l.appointment && l.appointment.date === date && l.appointment.status !== "cancelled")
      .map((l) => l.appointment!.window),
  );
  return { ok: true, open: windows.map((w) => w.id).filter((id) => !taken.has(id)) };
}

export function windowLabel(id: WindowId): string {
  const w = windows.find((x) => x.id === id);
  return w ? `${w.label} (${w.range})` : id;
}
