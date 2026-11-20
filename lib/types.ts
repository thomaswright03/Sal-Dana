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
}
