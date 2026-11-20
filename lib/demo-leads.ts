import "server-only";
import { randomUUID } from "node:crypto";
import { todayInPhoenix, weekday } from "./schedule";
import { site, type WindowId } from "./site";
import { deleteLead, listLeads, saveLead } from "./store";
import type { AppointmentStatus, Lead, LeadSource, LeadStatus } from "./types";

/** Sample leads for previewing the CRM. Flagged `demo` so they can be removed in one go. */

interface Seed {
  name: string;
  phone: string;
  email?: string;
  address: string;
  service: string;
  details: string;
  source: LeadSource;
  status: LeadStatus;
  value?: number;
  /** Days ago the lead arrived */
  age: number;
  /** Working days from today (negative = in the past) and a window */
  visit?: [offset: number, window: WindowId, status: AppointmentStatus];
  notes?: string[];
  transcript?: string;
}

const seeds: Seed[] = [
  {
    name: "Maria Lopez",
    phone: "(480) 555-0188",
    email: "maria.lopez@example.com",
    address: "Tempe",
    service: "Doors & hardware",
    details: "Two interior doors stick and one won't latch. Would like them adjusted or rehung.",
    source: "ai-assistant",
    status: "new",
    age: 0,
    visit: [2, "morning", "requested"],
    transcript:
      "Visitor: Hi, two of my doors stick and one won't latch. Can Alan fix that?\n\nAssistant: He can. Sticking and latching doors are a regular job for Alan. Whereabouts are you, and what day suits you for a visit?\n\nVisitor: Tempe. Sometime this week in the morning?\n\nAssistant: There's a morning window open. Can I take a name and phone number so Alan can confirm?\n\nVisitor: Maria Lopez, 480-555-0188",
  },
  {
    name: "James Whitfield",
    phone: "(602) 555-0142",
    address: "Scottsdale",
    service: "Mounting & installs",
    details: '85" TV over the fireplace, cables hidden in the wall. Also two large mirrors.',
    source: "website-form",
    status: "new",
    age: 0,
    visit: [3, "afternoon", "requested"],
  },
  {
    name: "Hannah Brooks",
    phone: "(480) 555-0117",
    email: "hbrooks@example.com",
    address: "Gilbert",
    service: "The punch list",
    details: "Moving in next month. About a dozen small things from the inspection report.",
    source: "website-form",
    status: "new",
    age: 1,
  },
  {
    name: "Carlos Mendez",
    phone: "(480) 555-0163",
    address: "Chandler",
    service: "Tile & flooring",
    details: "Four cracked tiles in the kitchen, have spares in the garage.",
    source: "ai-assistant",
    status: "contacted",
    age: 2,
    visit: [4, "midday", "confirmed"],
    notes: ["Called back, sending photos of the tile tonight."],
  },
  {
    name: "Linda Park",
    phone: "(480) 555-0129",
    email: "linda.park@example.com",
    address: "Paradise Valley",
    service: "Carpentry & trim",
    details: "Crown molding in the dining room and new baseboards in the hallway.",
    source: "website-form",
    status: "contacted",
    age: 3,
    notes: ["Left a voicemail.", "She prefers texts after 4pm."],
  },
  {
    name: "Greg Sullivan",
    phone: "(623) 555-0175",
    address: "Mesa",
    service: "Outdoor & patio",
    details: "Side gate is dragging and the latch post is loose.",
    source: "website-form",
    status: "contacted",
    age: 4,
    visit: [5, "morning", "confirmed"],
  },
  {
    name: "Natalie Reyes",
    phone: "(480) 555-0136",
    email: "nreyes@example.com",
    address: "Scottsdale",
    service: "Kitchen & bath refresh",
    details: "New faucet, cabinet hardware throughout, subway tile backsplash.",
    source: "website-form",
    status: "quoted",
    value: 2400,
    age: 6,
    notes: ["Walkthrough done. Estimate sent by text.", "She is choosing between two tile options."],
  },
  {
    name: "Owen Bradley",
    phone: "(480) 555-0158",
    address: "Queen Creek",
    service: "Drywall & paint",
    details: "Water stain patch on the ceiling and repaint the guest room.",
    source: "ai-assistant",
    status: "quoted",
    value: 950,
    age: 7,
    notes: ["Estimate sent. Following up Friday."],
  },
  {
    name: "Stephanie Cole",
    phone: "(602) 555-0191",
    email: "scole@example.com",
    address: "Phoenix",
    service: "Carpentry & trim",
    details: "Built-in shelving for a home office, wall is about 11 feet.",
    source: "website-form",
    status: "quoted",
    value: 3800,
    age: 9,
  },
  {
    name: "Raj Patel",
    phone: "(480) 555-0104",
    address: "Chandler",
    service: "Doors & hardware",
    details: "Replace five interior doors and install smart locks front and back.",
    source: "website-form",
    status: "scheduled",
    value: 1850,
    age: 10,
    visit: [1, "morning", "confirmed"],
    notes: ["Doors delivered to his garage.", "Deposit received."],
  },
  {
    name: "Emily Foster",
    phone: "(480) 555-0122",
    email: "emily.foster@example.com",
    address: "Tempe",
    service: "Mounting & installs",
    details: "Gallery wall, two TVs, and curtain rods in three rooms.",
    source: "ai-assistant",
    status: "scheduled",
    value: 640,
    age: 8,
    visit: [1, "afternoon", "confirmed"],
  },
  {
    name: "Victor Nguyen",
    phone: "(480) 555-0147",
    address: "Gilbert",
    service: "The punch list",
    details: "Pre-sale list from the agent, 18 items.",
    source: "website-form",
    status: "scheduled",
    value: 1400,
    age: 12,
    visit: [2, "midday", "confirmed"],
    notes: ["Listing photos are the week after, has to be done before then."],
  },
  {
    name: "Diane Mitchell",
    phone: "(602) 555-0113",
    email: "dmitchell@example.com",
    address: "Scottsdale",
    service: "Kitchen & bath refresh",
    details: "Guest bath: vanity, mirror, fixtures, re-caulk the tub.",
    source: "website-form",
    status: "won",
    value: 3200,
    age: 24,
    visit: [-6, "morning", "completed"],
    notes: ["Finished. Very happy, said she would send her neighbor."],
  },
  {
    name: "Brian O'Connor",
    phone: "(480) 555-0169",
    address: "Mesa",
    service: "Outdoor & patio",
    details: "Rebuild the patio cover fascia and repaint.",
    source: "manual",
    status: "won",
    value: 2750,
    age: 30,
    visit: [-10, "morning", "completed"],
  },
  {
    name: "Alicia Romero",
    phone: "(480) 555-0131",
    email: "aromero@example.com",
    address: "Paradise Valley",
    service: "Carpentry & trim",
    details: "Wainscoting in the entry and stair hall.",
    source: "website-form",
    status: "won",
    value: 4600,
    age: 35,
    visit: [-15, "midday", "completed"],
    notes: ["Paid in full."],
  },
  {
    name: "Kevin Zhao",
    phone: "(623) 555-0186",
    address: "Glendale",
    service: "Tile & flooring",
    details: "Full kitchen floor replacement, about 300 sq ft.",
    source: "website-form",
    status: "lost",
    value: 5200,
    age: 18,
    notes: ["Bigger than a handyman job and outside the usual area. Referred him on."],
  },
];

/** The date `offset` working days from today, in Arizona time. Negative offsets go back. */
function workingDay(offset: number): string {
  const d = new Date(`${todayInPhoenix()}T12:00:00Z`);
  const step = offset < 0 ? -1 : 1;
  let left = Math.abs(offset);
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + step);
    if ((site.workingDays as readonly number[]).includes(weekday(d.toISOString().slice(0, 10)))) left--;
  }
  return d.toISOString().slice(0, 10);
}

export async function clearDemoLeads(): Promise<number> {
  const demo = (await listLeads()).filter((l) => l.demo);
  await Promise.all(demo.map((l) => deleteLead(l.id)));
  return demo.length;
}

export async function loadDemoLeads(): Promise<number> {
  await clearDemoLeads();
  const now = Date.now();
  const leads = seeds.map((s, i): Lead => {
    // Stagger arrival times so the list reads like real, uneven traffic.
    const created = new Date(now - s.age * 86_400_000 - (i * 37 + 12) * 60_000).toISOString();
    return {
      id: randomUUID(),
      createdAt: created,
      updatedAt: created,
      name: s.name,
      phone: s.phone,
      email: s.email ?? "",
      address: s.address,
      service: s.service,
      details: s.details,
      source: s.source,
      status: s.status,
      value: s.value ?? null,
      appointment: s.visit ? { date: workingDay(s.visit[0]), window: s.visit[1], status: s.visit[2] } : null,
      notes: (s.notes ?? [])
        .map((text, n) => ({
          id: randomUUID(),
          at: new Date(new Date(created).getTime() + (n + 1) * 5 * 3_600_000).toISOString(),
          text,
        }))
        .reverse(),
      transcript: s.transcript ?? null,
      demo: true,
    };
  });
  for (let i = 0; i < leads.length; i += 8) {
    await Promise.all(leads.slice(i, i + 8).map(saveLead));
  }
  return leads.length;
}
