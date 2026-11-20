import type { WindowId } from "./site";

export const LEAD_STATUSES = ["new", "contacted", "quoted", "scheduled", "won", "lost"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  quoted: "Quoted",
  scheduled: "Scheduled",
  won: "Won",
  lost: "Lost",
};

export const APPOINTMENT_STATUSES = ["requested", "confirmed", "completed", "cancelled"] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export type LeadSource = "website-form" | "ai-assistant" | "manual";

export const SOURCE_LABELS: Record<LeadSource, string> = {
  "website-form": "Website form",
  "ai-assistant": "AI assistant",
  manual: "Added by hand",
};

export interface Appointment {
  /** YYYY-MM-DD in Arizona time */
  date: string;
  window: WindowId;
  status: AppointmentStatus;
}

export interface Note {
  id: string;
  at: string;
  text: string;
}

export interface Lead {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  service: string;
  details: string;
  source: LeadSource;
  status: LeadStatus;
  /** Estimated job value in whole dollars */
  value: number | null;
  appointment: Appointment | null;
  notes: Note[];
  /** Conversation with the AI assistant, when the lead came from chat */
  transcript: string | null;
  /** When the lead was marked won or lost */
  closedAt?: string | null;
  /** Language the customer used on the site, when known */
  language?: "en" | "es";
  /** True for sample leads loaded to preview the CRM */
  demo?: boolean;
}

/* ---------- Reviews ---------- */

export const REVIEW_SOURCES = ["google", "facebook", "nextdoor", "direct"] as const;
export type ReviewSource = (typeof REVIEW_SOURCES)[number];

export const REVIEW_SOURCE_LABELS: Record<ReviewSource, string> = {
  google: "Google",
  facebook: "Facebook",
  nextdoor: "Nextdoor",
  direct: "Sent directly",
};

export interface Review {
  id: string;
  createdAt: string;
  name: string;
  city: string;
  service: string;
  /** 1 to 5 */
  rating: number;
  text: string;
  /** When the review was left, YYYY-MM-DD */
  date: string;
  source: ReviewSource;
  /** Shown on the public website */
  published: boolean;
  /** True for sample reviews loaded to preview the site */
  demo?: boolean;
}

/** What the public site needs to show a review. */
export type PublicReview = Pick<
  Review,
  "id" | "name" | "city" | "service" | "rating" | "text" | "date" | "source"
> & {
  demo?: boolean;
};

/* ---------- Traffic ---------- */

export const TRAFFIC_EVENTS = ["call", "text", "email", "chat_open", "form_start", "form_submit"] as const;
export type TrafficEvent = (typeof TRAFFIC_EVENTS)[number];

export const TRAFFIC_EVENT_LABELS: Record<TrafficEvent, string> = {
  call: "Tapped call",
  text: "Tapped text",
  email: "Tapped email",
  chat_open: "Opened the chat",
  form_start: "Started the form",
  form_submit: "Sent the form",
};

export const TRAFFIC_SOURCES = [
  "Google",
  "Direct",
  "Facebook",
  "Instagram",
  "Nextdoor",
  "Yelp",
  "Other search",
  "Other sites",
] as const;
export type TrafficSource = (typeof TRAFFIC_SOURCES)[number];

/** One day of anonymous, aggregate site activity. No visitor is identifiable from it. */
export interface TrafficDay {
  /** YYYY-MM-DD in Arizona time */
  date: string;
  visitors: number;
  pageviews: number;
  sources: Partial<Record<TrafficSource, number>>;
  devices: { mobile: number; tablet: number; desktop: number };
  /** Visits by hour of the day, Arizona time (24 entries) */
  hours: number[];
  langs: { en: number; es: number };
  events: Partial<Record<TrafficEvent, number>>;
  /** True for sample days loaded to preview the dashboard */
  demo?: boolean;
}
