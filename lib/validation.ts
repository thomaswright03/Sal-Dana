import { z } from "zod";
import { APPOINTMENT_STATUSES, LEAD_STATUSES, REVIEW_SOURCES, TRAFFIC_EVENTS } from "./types";

const text = (max: number) => z.string().trim().max(max);

export const windowSchema = z.enum(["morning", "midday", "afternoon"]);
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const phoneSchema = z
  .string()
  .trim()
  .max(30)
  .refine((v) => v.replace(/\D/g, "").length >= 10, "Enter a phone number with area code");

const appointmentSchema = z.object({
  date: dateSchema,
  window: windowSchema,
  status: z.enum(APPOINTMENT_STATUSES),
});

/** Public quote/booking form. */
export const publicLeadSchema = z.object({
  name: text(120).min(2, "Please tell us your name"),
  phone: phoneSchema,
  email: z.union([z.literal(""), z.email().max(200)]).default(""),
  address: text(200).default(""),
  service: text(120).default(""),
  details: text(3000).default(""),
  date: z.union([z.literal(""), dateSchema]).default(""),
  window: z.union([z.literal(""), windowSchema]).default(""),
  language: z.enum(["en", "es"]).default("en"),
  // Honeypot: real visitors never fill this in.
  company: z.string().max(200).default(""),
});

/** CRM: create a lead by hand. */
export const crmCreateSchema = z.object({
  name: text(120).min(1),
  phone: text(30).default(""),
  email: text(200).default(""),
  address: text(200).default(""),
  service: text(120).default(""),
  details: text(3000).default(""),
  status: z.enum(LEAD_STATUSES).default("new"),
  value: z.number().int().min(0).max(10_000_000).nullable().default(null),
  appointment: appointmentSchema.nullable().default(null),
  /** The owner saw the "window already booked" warning and wants it anyway. */
  confirmDoubleBook: z.boolean().optional(),
});

/** CRM: edit a lead. */
export const crmPatchSchema = z
  .object({
    name: text(120).min(1),
    phone: text(30),
    email: text(200),
    address: text(200),
    service: text(120),
    details: text(3000),
    status: z.enum(LEAD_STATUSES),
    value: z.number().int().min(0).max(10_000_000).nullable(),
    appointment: appointmentSchema.nullable(),
    addNote: text(2000).min(1),
    removeNoteId: z.string().max(64),
    expectedUpdatedAt: z.string().max(40),
    confirmDoubleBook: z.boolean(),
  })
  .partial();

/** CRM: add or edit a customer review. */
export const reviewSchema = z.object({
  name: text(80).min(1, "Add the customer's name"),
  city: text(80).default(""),
  service: text(120).default(""),
  rating: z.number().int().min(1).max(5),
  text: text(1500).min(1, "Add what they wrote"),
  date: dateSchema,
  source: z.enum(REVIEW_SOURCES),
  permission: text(300).default(""),
  relationship: text(300).default(""),
  published: z.boolean(),
});

/** Public site: anonymous visit counter. */
export const trackSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("view"),
    first: z.boolean(),
    lang: z.enum(["en", "es"]),
    ref: z.string().max(500).default(""),
    utm: z.string().max(80).default(""),
  }),
  z.object({ kind: z.literal("event"), event: z.enum(TRAFFIC_EVENTS) }),
]);
