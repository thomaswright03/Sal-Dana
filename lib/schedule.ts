import { WINDOW_TEXT, type Locale } from "./i18n";
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

export function formatDate(date: string, locale: Locale = "en"): string {
  const text = new Intl.DateTimeFormat(locale === "es" ? "es-US" : "en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
  return locale === "es" ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

export type DayCheck = { ok: true; open: WindowId[] } | { ok: false; reason: string };

export type DateProblemCode = "invalid" | "past" | "far" | "closed";

/** Machine-readable reason a date can't take a visit request, or null if it can. */
export function dateProblemCode(date: string): DateProblemCode | null {
  if (!isValidDate(date)) return "invalid";
  const today = todayInPhoenix();
  if (date <= today) return "past";
  const max = new Date(`${today}T12:00:00Z`);
  max.setUTCDate(max.getUTCDate() + 90);
  if (date > max.toISOString().slice(0, 10)) return "far";
  if (!(site.workingDays as readonly number[]).includes(weekday(date))) return "closed";
  return null;
}

/** Why a date can't take a visit request, or null if it can. */
export function dateProblem(date: string): string | null {
  switch (dateProblemCode(date)) {
    case "invalid":
      return "That isn't a valid date. Use YYYY-MM-DD.";
    case "past":
      return "Visits can be requested from tomorrow onward.";
    case "far":
      return "Visits can be requested up to 90 days ahead.";
    case "closed":
      return `Alan works ${site.hoursDisplay}. Pick another day.`;
    default:
      return null;
  }
}

/** Which visit windows are still open on a given day, from a list of leads (pure; used by tests). */
export function checkDay(date: string, leads: Lead[]): DayCheck {
  const reason = dateProblem(date);
  if (reason) return { ok: false, reason };
  const taken = new Set(
    leads
      .filter((l) => l.appointment && l.appointment.date === date && l.appointment.status !== "cancelled")
      .map((l) => l.appointment!.window),
  );
  return { ok: true, open: windows.map((w) => w.id).filter((id) => !taken.has(id)) };
}

export function windowLabel(id: WindowId, locale: Locale = "en"): string {
  const w = WINDOW_TEXT[locale][id];
  return w ? `${w.label} (${w.range})` : id;
}
