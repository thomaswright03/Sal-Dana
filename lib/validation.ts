import { z } from "zod";
import { APPOINTMENT_STATUSES, LEAD_STATUSES } from "./types";

const text = (max: number) => z.string().trim().max(max);

export const windowSchema = z.enum(["morning", "midday", "afternoon"]);
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const phoneSchema = z
  .string()
  .trim()
  .max(30)
  .refine((v) => v.replace(/\D/g, "").length >= 10, "Enter a phone number with area code");

export const appointmentSchema = z.object({
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
  })
  .partial();
