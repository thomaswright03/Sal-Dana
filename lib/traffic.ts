import "server-only";
import { readJson, writeJson } from "./kv";
import { todayInPhoenix } from "./schedule";
import { site } from "./site";
import type { TrafficDay, TrafficEvent, TrafficSource } from "./types";

/**
 * First-party visit counts for the owner dashboard.
 *
 * Only daily totals are kept: no cookies, no IP addresses, nothing that
 * identifies a visitor. One document per month keeps storage calls low.
 */

interface MonthDoc {
  days: Record<string, TrafficDay>;
}

const monthKey = (date: string) => `traffic/${date.slice(0, 7)}.json`;

export function emptyDay(date: string): TrafficDay {
  return {
    date,
    visitors: 0,
    pageviews: 0,
    sources: {},
    devices: { mobile: 0, tablet: 0, desktop: 0 },
    hours: Array.from({ length: 24 }, () => 0),
    langs: { en: 0, es: 0 },
    events: {},
  };
}

const SEARCH = /(^|\.)(bing|duckduckgo|yahoo|ecosia|brave|startpage)\./;

/** Buckets a referrer into a handful of named sources. */
export function classifySource(referrer: string, utm: string): TrafficSource {
  const tag = utm.toLowerCase();
  let host = "";
  try {
    host = referrer ? new URL(referrer).hostname.toLowerCase() : "";
  } catch {
    host = "";
  }
  const hit = (re: RegExp) => re.test(host) || re.test(tag);
  if (hit(/google|gmb|gbp/)) return "Google";
  if (hit(/facebook|fb\.|^fb$|messenger/)) return "Facebook";
  if (hit(/instagram|^ig$/)) return "Instagram";
  if (hit(/nextdoor/)) return "Nextdoor";
  if (hit(/yelp/)) return "Yelp";
  if (SEARCH.test(host)) return "Other search";
  if (!host && !tag) return "Direct";
  return "Other sites";
}

export function classifyDevice(userAgent: string): "mobile" | "tablet" | "desktop" {
  if (/ipad|tablet|kindle|silk|playbook/i.test(userAgent)) return "tablet";
  if (/mobi|iphone|android/i.test(userAgent)) return "mobile";
  return "desktop";
}

export const BOT_RE =
  /bot|crawl|spider|slurp|preview|headless|lighthouse|pingdom|monitor|curl|wget|python|axios/i;

function hourInPhoenix(): number {
  const h = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hourCycle: "h23",
    timeZone: site.timezone,
  }).format(new Date());
  return Number(h) % 24;
}

export type Hit =
  | {
      kind: "view";
      source: TrafficSource;
      device: "mobile" | "tablet" | "desktop";
      lang: "en" | "es";
      first: boolean;
    }
  | { kind: "event"; event: TrafficEvent };

/** Adds one hit to today's totals. */
export async function recordHit(hit: Hit): Promise<void> {
  const date = todayInPhoenix();
  const key = monthKey(date);
  const doc = (await readJson<MonthDoc>(key)) ?? { days: {} };
  const day = doc.days[date] ?? emptyDay(date);
  if (hit.kind === "view") {
    day.pageviews += 1;
    if (hit.first) {
      day.visitors += 1;
      day.sources[hit.source] = (day.sources[hit.source] ?? 0) + 1;
      day.devices[hit.device] += 1;
      day.langs[hit.lang] += 1;
      day.hours[hourInPhoenix()] += 1;
    }
  } else {
    day.events[hit.event] = (day.events[hit.event] ?? 0) + 1;
  }
  doc.days[date] = day;
  await writeJson(key, doc);
}

function addDays(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** The last `count` days, oldest first, with quiet days filled in as zeros. */
export async function getTraffic(count: number): Promise<TrafficDay[]> {
  const today = todayInPhoenix();
  const dates = Array.from({ length: count }, (_, i) => addDays(today, i - count + 1));
  const keys = [...new Set(dates.map(monthKey))];
  const docs = await Promise.all(keys.map((k) => readJson<MonthDoc>(k).catch(() => null)));
  const byDate = new Map<string, TrafficDay>();
  for (const doc of docs) for (const day of Object.values(doc?.days ?? {})) byDate.set(day.date, day);
  return dates.map((d) => byDate.get(d) ?? emptyDay(d));
}

/** Replaces or removes sample days. Real days are never touched. */
export async function setDemoTraffic(days: TrafficDay[] | null): Promise<void> {
  const today = todayInPhoenix();
  const months = new Set<string>();
  for (let i = 0; i < 190; i += 1) months.add(monthKey(addDays(today, -i)));
  for (const d of days ?? []) months.add(monthKey(d.date));
  await Promise.all(
    [...months].map(async (key) => {
      const doc = (await readJson<MonthDoc>(key)) ?? { days: {} };
      let changed = false;
      for (const [date, day] of Object.entries(doc.days)) {
        if (day.demo) {
          delete doc.days[date];
          changed = true;
        }
      }
      for (const d of days ?? []) {
        if (monthKey(d.date) === key && !doc.days[d.date]) {
          doc.days[d.date] = { ...d, demo: true };
          changed = true;
        }
      }
      if (changed) await writeJson(key, doc);
    }),
  );
}
