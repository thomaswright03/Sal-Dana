import type { Lead, TrafficDay, TrafficEvent, TrafficSource } from "@/lib/types";

/** Date maths and roll-ups for the dashboard. Everything is in Arizona time. */

export type Range = 7 | 30 | 90;
export const RANGES: Range[] = [7, 30, 90];

const dayFormat = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Phoenix" });
const dayCache = new Map<string, string>();

/** The Arizona calendar day (YYYY-MM-DD) an ISO timestamp falls on. */
export function dayOf(iso: string): string {
  let d = dayCache.get(iso);
  if (!d) {
    d = dayFormat.format(new Date(iso));
    dayCache.set(iso, d);
  }
  return d;
}

export const todayAz = () => dayFormat.format(new Date());

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** The `n` days ending on `end`, oldest first. */
function daysEnding(end: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addDays(end, i - n + 1));
}

export interface Period {
  /** Days in the selected range, oldest first */
  days: string[];
  /** The same number of days immediately before it */
  prior: string[];
}

export function periodFor(range: Range): Period {
  const today = todayAz();
  return { days: daysEnding(today, range), prior: daysEnding(addDays(today, -range), range) };
}

export const inDays = (days: string[], date: string) => date >= days[0] && date <= days[days.length - 1];

/** Percentage change, or null when there is nothing to compare against. */
export function change(current: number, previous: number): number | null {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

/** Leads that arrived on each of the given days. */
export function leadsPerDay(leads: Lead[], days: string[]): number[] {
  const counts = new Map<string, number>();
  for (const l of leads) {
    const d = dayOf(l.createdAt);
    counts.set(d, (counts.get(d) ?? 0) + 1);
  }
  return days.map((d) => counts.get(d) ?? 0);
}

export const arrivedIn = (leads: Lead[], days: string[]) =>
  leads.filter((l) => inDays(days, dayOf(l.createdAt)));

/** The day a job was won or lost. Older records fall back to their last edit. */
export const closedDay = (l: Lead) => dayOf(l.closedAt ?? l.updatedAt);

export const wonIn = (leads: Lead[], days: string[]) =>
  leads.filter((l) => l.status === "won" && inDays(days, closedDay(l)));

export const valueOf = (leads: Lead[]) => leads.reduce((n, l) => n + (l.value ?? 0), 0);

export const isOpen = (l: Lead) => l.status !== "won" && l.status !== "lost";

/** Counts by a label, biggest first. */
export function tally<T>(items: T[], key: (item: T) => string | null | undefined): [string, number][] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const k = key(item)?.trim();
    if (k) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

/** Pulls a city out of whatever was typed in the address box. */
export function cityOf(address: string): string | null {
  const parts = address
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return null;
  // "123 Main St, Mesa" or "123 Main St, Mesa, AZ 85201" → Mesa; "Mesa" → Mesa.
  const candidate = parts.length === 1 ? parts[0] : parts.find((p, i) => i > 0 && !/\d|^AZ$/i.test(p));
  return candidate && !/^\d/.test(candidate) ? candidate : null;
}

export interface TrafficTotals {
  visitors: number;
  pageviews: number;
  sources: [TrafficSource, number][];
  devices: { mobile: number; tablet: number; desktop: number };
  langs: { en: number; es: number };
  events: Record<TrafficEvent, number>;
  hours: number[];
  sample: boolean;
}

export function trafficIn(traffic: TrafficDay[], days: string[]): TrafficDay[] {
  const byDate = new Map(traffic.map((d) => [d.date, d]));
  return days.map(
    (date) =>
      byDate.get(date) ?? {
        date,
        visitors: 0,
        pageviews: 0,
        sources: {},
        devices: { mobile: 0, tablet: 0, desktop: 0 },
        hours: Array.from({ length: 24 }, () => 0),
        langs: { en: 0, es: 0 },
        events: {},
      },
  );
}

export function totalTraffic(days: TrafficDay[]): TrafficTotals {
  const sources = new Map<TrafficSource, number>();
  const events: Record<TrafficEvent, number> = {
    call: 0,
    text: 0,
    email: 0,
    chat_open: 0,
    form_start: 0,
    form_submit: 0,
  };
  const out: TrafficTotals = {
    visitors: 0,
    pageviews: 0,
    sources: [],
    devices: { mobile: 0, tablet: 0, desktop: 0 },
    langs: { en: 0, es: 0 },
    events,
    hours: Array.from({ length: 24 }, () => 0),
    sample: false,
  };
  for (const d of days) {
    out.visitors += d.visitors;
    out.pageviews += d.pageviews;
    out.devices.mobile += d.devices.mobile;
    out.devices.tablet += d.devices.tablet;
    out.devices.desktop += d.devices.desktop;
    out.langs.en += d.langs.en;
    out.langs.es += d.langs.es;
    d.hours.forEach((n, h) => (out.hours[h] += n));
    for (const [k, v] of Object.entries(d.sources))
      sources.set(k as TrafficSource, (sources.get(k as TrafficSource) ?? 0) + (v ?? 0));
    for (const [k, v] of Object.entries(d.events)) events[k as TrafficEvent] += v ?? 0;
    if (d.demo) out.sample = true;
  }
  out.sources = [...sources.entries()].sort((a, b) => b[1] - a[1]);
  return out;
}

/** Thins a daily series to at most `max` points so a sparkline stays readable. */
export function compact(values: number[], max = 14): number[] {
  if (values.length <= max) return values;
  const size = Math.ceil(values.length / max);
  const out: number[] = [];
  for (let i = values.length; i > 0; i -= size) out.unshift(sum(values.slice(Math.max(0, i - size), i)));
  return out;
}

export const num = (n: number) => new Intl.NumberFormat("en-US").format(Math.round(n));
export const pct = (n: number, digits = 1) => `${n.toFixed(digits)}%`;

export function shortDay(date: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(
    new Date(`${date}T12:00:00Z`),
  );
}

export function longDay(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

export function hourLabel(h: number): string {
  if (h === 0) return "12am";
  if (h === 12) return "12pm";
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}
