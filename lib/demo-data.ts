import "server-only";
import { clearDemoLeads, loadDemoLeads } from "./demo-leads";
import { setDemoReviews, type NewReview } from "./reviews";
import { todayInPhoenix } from "./schedule";
import { site } from "./site";
import { emptyDay, setDemoTraffic } from "./traffic";
import type { ReviewSource, TrafficDay, TrafficSource } from "./types";

/** Sample reviews and visit numbers for previewing the site and dashboard. None of it is real. */

function addDays(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Small seeded generator so the same day always gets the same sample numbers. */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SOURCE_SHARE: [TrafficSource, number][] = [
  ["Google", 0.46],
  ["Direct", 0.2],
  ["Facebook", 0.12],
  ["Nextdoor", 0.09],
  ["Instagram", 0.06],
  ["Yelp", 0.04],
  ["Other sites", 0.03],
];

// Relative interest by hour of the day: a morning peak and a smaller one after dinner.
const HOUR_WEIGHT = [1, 0.5, 0.3, 0.3, 0.5, 1.5, 3, 5, 7, 9, 9, 8, 7, 6, 5, 5, 5, 6, 7, 8, 7, 5, 3, 2];
const DAY_WEIGHT = [0.72, 1.14, 1.06, 1.02, 1.0, 0.96, 0.88];

function pick<T>(rand: () => number, shares: [T, number][]): T {
  let r = rand();
  for (const [value, share] of shares) {
    r -= share;
    if (r <= 0) return value;
  }
  return shares[0][0];
}

function sampleTraffic(days: number): TrafficDay[] {
  const today = todayInPhoenix();
  const hourNow = Number(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: site.timezone }).format(
      new Date(),
    ),
  );
  const out: TrafficDay[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = addDays(today, -i);
    const rand = seeded(Number(date.replaceAll("-", "")));
    const day = emptyDay(date);
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
    // Slow growth toward today, a weekly rhythm, and some day-to-day noise.
    const growth = 0.62 + 0.38 * (1 - i / days);
    const target = Math.round(
      46 * growth * DAY_WEIGHT[weekday] * (0.78 + rand() * 0.5) * (i % 23 === 4 ? 1.7 : 1),
    );
    const weightTotal = HOUR_WEIGHT.reduce((a, b) => a + b, 0);
    for (let h = 0; h < 24; h += 1) {
      if (i === 0 && h > hourNow) break;
      const n = Math.round((target * HOUR_WEIGHT[h]) / weightTotal + (rand() - 0.5) * 1.2);
      day.hours[h] = Math.max(0, n);
    }
    day.visitors = day.hours.reduce((a, b) => a + b, 0);
    day.pageviews = Math.round(day.visitors * (1.18 + rand() * 0.2));
    for (let v = 0; v < day.visitors; v += 1) {
      const source = pick(rand, SOURCE_SHARE);
      day.sources[source] = (day.sources[source] ?? 0) + 1;
      const d = rand();
      day.devices[d < 0.64 ? "mobile" : d < 0.95 ? "desktop" : "tablet"] += 1;
      day.langs[rand() < 0.18 ? "es" : "en"] += 1;
      if (rand() < 0.09) day.events.chat_open = (day.events.chat_open ?? 0) + 1;
      if (rand() < 0.07) day.events.form_start = (day.events.form_start ?? 0) + 1;
      if (rand() < 0.022) day.events.form_submit = (day.events.form_submit ?? 0) + 1;
      if (rand() < 0.05) day.events.call = (day.events.call ?? 0) + 1;
      if (rand() < 0.03) day.events.text = (day.events.text ?? 0) + 1;
      if (rand() < 0.008) day.events.email = (day.events.email ?? 0) + 1;
    }
    out.push(day);
  }
  return out;
}

const REVIEW_SEEDS: {
  name: string;
  city: string;
  service: string;
  ago: number;
  source: ReviewSource;
  rating?: number;
  text: string;
}[] = [
  {
    name: "Karen M.",
    city: "Scottsdale",
    service: "Doors & hardware",
    ago: 12,
    source: "google",
    text: "Three doors in our house never closed right. Alan had all of them hung true in an afternoon and they shut with a click now. Tidy, on time, and a pleasure to have around.",
  },
  {
    name: "David R.",
    city: "Gilbert",
    service: "The punch list",
    ago: 20,
    source: "google",
    text: "Handed over a list of fourteen things we’d been putting off for two years. Every one of them done in a single visit, and done better than I would have asked for.",
  },
  {
    name: "Priya S.",
    city: "Tempe",
    service: "Drywall & paint",
    ago: 31,
    source: "google",
    text: "I honestly cannot find where the hole in the hallway was. The texture match is perfect. He covered the floors, cleaned up everything, and left the place spotless.",
  },
  {
    name: "Michael T.",
    city: "Paradise Valley",
    service: "Carpentry & trim",
    ago: 38,
    source: "google",
    text: "The crown molding in our dining room looks like it was always there. Tight corners, clean caulk lines, not a nail hole in sight. Real craftsmanship.",
  },
  {
    name: "Jessica L.",
    city: "Chandler",
    service: "Kitchen & bath refresh",
    ago: 54,
    source: "facebook",
    text: "New faucet, new hardware on every cabinet, and a fresh backsplash. The kitchen feels brand new and it took two days. Clear estimate up front and no surprises.",
  },
  {
    name: "Robert H.",
    city: "Mesa",
    service: "Outdoor & patio",
    ago: 61,
    source: "nextdoor",
    text: "Our side gate had been dragging for years. Alan rebuilt it properly, and it swings with one finger now. He even touched up the paint on the posts without being asked.",
  },
  {
    name: "Angela W.",
    city: "Scottsdale",
    service: "Mounting & installs",
    ago: 66,
    source: "google",
    text: "Mounted an 85 inch TV over the fireplace with every cable hidden. Dead level. He also hung a gallery wall while he was here and laid it all out with me first.",
  },
  {
    name: "Tom B.",
    city: "Queen Creek",
    service: "Tile & flooring",
    ago: 84,
    source: "google",
    rating: 4,
    text: "Replaced six cracked tiles in the entry and you cannot tell which ones are new. Showed up exactly when he said he would. That alone is rare.",
  },
  {
    name: "Sofia G.",
    city: "Phoenix",
    service: "The punch list",
    ago: 92,
    source: "facebook",
    text: "We were getting our house ready to sell and Alan worked through the whole inspection list in two days. Our agent asked for his number before she left.",
  },
  {
    name: "Daniel K.",
    city: "Gilbert",
    service: "Carpentry & trim",
    ago: 118,
    source: "google",
    text: "Built-in shelves in the office, scribed to a wall that is nowhere near straight. They look custom because they are. Fair price, careful work, great communication.",
  },
];

function sampleReviews(): NewReview[] {
  const today = todayInPhoenix();
  return REVIEW_SEEDS.map((r) => ({
    name: r.name,
    city: r.city,
    service: r.service,
    rating: r.rating ?? 5,
    text: r.text,
    date: addDays(today, -r.ago),
    source: r.source,
    permission: "",
    relationship: "",
    published: true,
  }));
}

export async function loadDemo(): Promise<void> {
  await Promise.all([loadDemoLeads(), setDemoTraffic(sampleTraffic(120)), setDemoReviews(sampleReviews())]);
}

export async function clearDemo(): Promise<void> {
  await Promise.all([clearDemoLeads(), setDemoTraffic(null), setDemoReviews(null)]);
}
