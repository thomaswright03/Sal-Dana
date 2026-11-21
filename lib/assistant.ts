import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import type { ToolOutcome } from "./assistant-stream";
import { z } from "zod";
import type { Locale } from "./i18n";
import { formatDate, todayInPhoenix, windowLabel } from "./schedule";
import { services, site, windows } from "./site";
import { createPublicLead } from "./booking";
import { openWindows } from "./slots";
import { dateSchema, phoneSchema, windowSchema } from "./validation";

export { assistantModel } from "./assistant-stream";

export function systemPrompt(locale: Locale = "en"): string {
  const today = todayInPhoenix();
  return `You are the booking assistant on the website of ${site.legalName}, the handyman and renovation business run by ${site.owner} in ${site.state}. Visitors chat with you in a small window in the corner of the site. Your job is to answer their questions and help them request a visit.

Today is ${formatDate(today)} (${today}), Arizona time.

About the business
- ${site.legalName} is an Arizona business. ${site.owner} runs the business. Do not say who does the work, whether subcontractors are used, or that anyone will arrive at a set time; ${site.owner} confirms those directly.
- Service area: ${site.region} (${site.cities.join(", ")}). For somewhere else, take their details and say ${site.owner} will let them know.
- Working hours (typical, not confirmed): ${site.hoursDisplay}. Say ${site.owner} confirms the actual time.
- Phone and text: ${site.phoneDisplay}. Email: ${site.email}.
- Services:
${services.map((s) => `  - ${s.title}: ${s.items.join(", ")}`).join("\n")}
- Visit windows: ${windows.map((w) => `${w.label} (${w.range})`).join(", ")}.

Language
- Reply in the language the visitor writes in, English or Spanish. This visitor is on the ${locale === "es" ? "Spanish" : "English"} version of the site, so use ${locale === "es" ? "Spanish" : "English"} until their own messages show they prefer the other.
- In Spanish, write natural, friendly Spanish as spoken in Arizona, addressing the visitor as "tú".
- When you save a request, pass the visitor's language in the tool's language field, use one of the service names listed above for the service when one fits, and keep the details in the visitor's own words.

How to help
- Write the way a thoughtful front-of-house person would speak: warm, brief, plain. Two or three short sentences per reply is usually right. Plain text only, because the chat window doesn't render markdown. Ask for one or two things at a time.
- To request a visit you need the visitor's name, a phone number, what they need done, and a day and window. The city or address and an email are helpful but optional. Call check_availability for the day they want before you book, then call book_appointment. Work out calendar dates yourself from today's date.
- A booking is a request. ${site.owner} confirms every visit personally by call or text, so say that rather than promising the slot.
- If someone would rather be contacted than pick a time, use request_callback once you have their name and phone number.
- After a tool succeeds, confirm what was saved in a sentence or two.

Boundaries
- You don't know prices. ${site.owner} gives an estimate after seeing the job, so offer to book a walkthrough instead of guessing a number.
- Only state facts about the business that appear above. If asked about licensing, insurance, warranties, or anything else you weren't told, say you'd rather ${site.owner} answer that directly and offer to pass the question along.
- If a job sounds outside the listed services, don't turn it down. Take the details and let ${site.owner} decide.
- For anything dangerous or urgent, such as a gas smell, active flooding, sparking wiring, or a fire, tell them to call 911 or their utility's emergency line first.
- Don't give do-it-yourself instructions for electrical, gas, plumbing-pressure, roofing-height or structural work, and don't give legal, financial or other professional advice. Say that is a question for a licensed professional, and offer to book a visit with ${site.owner} instead.
- Keep the conversation on ${site.name} and the visitor's home project. Politely steer back if it drifts elsewhere.`;
}

export const tools: Anthropic.Beta.BetaTool[] = [
  {
    name: "check_availability",
    description:
      "Look up which visit windows are still open on a given day. Call this before booking, and whenever a visitor asks what times are free.",
    input_schema: {
      type: "object",
      properties: {
        date: { type: "string", description: "The day to check, as YYYY-MM-DD." },
      },
      required: ["date"],
      additionalProperties: false,
    },
  },
  {
    name: "book_appointment",
    description:
      "Save a visit request to Alan's CRM. Call this once you have the visitor's name, phone, what they need, and an open day and window. Alan confirms the visit personally afterward.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "The visitor's name." },
        phone: { type: "string", description: "Phone number including area code." },
        email: { type: "string", description: "Email address, if they gave one." },
        address: { type: "string", description: "Street address or city of the job, if given." },
        service: { type: "string", description: "Short label for the kind of work, e.g. 'Door hanging'." },
        details: { type: "string", description: "What the visitor needs done, in their words." },
        date: { type: "string", description: "Requested day, as YYYY-MM-DD." },
        window: { type: "string", enum: ["morning", "midday", "afternoon"] },
        language: {
          type: "string",
          enum: ["en", "es"],
          description: "The language the visitor is writing in.",
        },
      },
      required: ["name", "phone", "service", "details", "date", "window"],
      additionalProperties: false,
    },
  },
  {
    name: "request_callback",
    description:
      "Save the visitor's details so Alan can call or text them back, for when they have a question for Alan or don't want to pick a time yet.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        phone: { type: "string", description: "Phone number including area code." },
        email: { type: "string" },
        service: { type: "string", description: "Short label for the kind of work, if known." },
        details: { type: "string", description: "What they need or what they'd like Alan to answer." },
        language: {
          type: "string",
          enum: ["en", "es"],
          description: "The language the visitor is writing in.",
        },
      },
      required: ["name", "phone", "details"],
      additionalProperties: false,
    },
  },
];

const clean = (max: number) => z.string().trim().max(max);

const checkInput = z.object({ date: dateSchema });
const bookInput = z.object({
  name: clean(120).min(2),
  phone: phoneSchema,
  email: clean(200).optional(),
  address: clean(200).optional(),
  service: clean(120).min(1),
  details: clean(3000).min(1),
  date: dateSchema,
  window: windowSchema,
  language: z.enum(["en", "es"]).optional(),
});
const callbackInput = z.object({
  name: clean(120).min(2),
  phone: phoneSchema,
  email: clean(200).optional(),
  service: clean(120).optional(),
  details: clean(3000).min(1),
  language: z.enum(["en", "es"]).optional(),
});

export interface ToolContext {
  /** The language of the page the visitor is chatting from. */
  locale: Locale;
  transcript: string;
  /** Returns false once this visitor has saved too many requests. */
  allowWrite: () => boolean;
}

const invalid = (err: z.ZodError): ToolOutcome => ({
  content: `Invalid input: ${err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`,
  isError: true,
});

export async function runTool(name: string, input: unknown, ctx: ToolContext): Promise<ToolOutcome> {
  try {
    if (name === "check_availability") {
      const parsed = checkInput.safeParse(input);
      if (!parsed.success) return invalid(parsed.error);
      const day = await openWindows(parsed.data.date);
      if (!day.ok) return { content: day.reason };
      if (day.open.length === 0)
        return { content: `${formatDate(parsed.data.date)} is fully booked. Suggest another day.` };
      return {
        content: `Open on ${formatDate(parsed.data.date)}: ${day.open.map((w) => windowLabel(w)).join(", ")}.`,
      };
    }

    if (name === "book_appointment") {
      const parsed = bookInput.safeParse(input);
      if (!parsed.success) return invalid(parsed.error);
      const d = parsed.data;
      const day = await openWindows(d.date);
      if (!day.ok) return { content: day.reason, isError: true };
      if (!day.open.includes(d.window)) {
        return {
          content: day.open.length
            ? `That window is taken. Still open on ${formatDate(d.date)}: ${day.open.map((w) => windowLabel(w)).join(", ")}.`
            : `${formatDate(d.date)} is fully booked. Suggest another day.`,
          isError: true,
        };
      }
      if (!ctx.allowWrite())
        return {
          content: `Too many requests from this visitor. Ask them to call or text ${site.phoneDisplay} instead.`,
          isError: true,
        };
      const result = await createPublicLead(
        {
          name: d.name,
          phone: d.phone,
          email: d.email ?? "",
          address: d.address ?? "",
          service: d.service,
          details: d.details,
          source: "ai-assistant",
          transcript: ctx.transcript,
          language: d.language ?? ctx.locale,
        },
        { date: d.date, window: d.window, status: "requested" },
        "reject",
      );
      if (!result.ok) {
        return {
          content: `That window was just taken by someone else. Check availability for ${formatDate(d.date)} again and offer another.`,
          isError: true,
        };
      }
      return {
        content: `Saved. Visit requested for ${formatDate(d.date)}, ${windowLabel(d.window)}. Alan will confirm by call or text.`,
        event: {
          type: "booked",
          date: d.date,
          dateLabel: formatDate(d.date, d.language ?? ctx.locale),
          window: windowLabel(d.window, d.language ?? ctx.locale),
        },
      };
    }

    if (name === "request_callback") {
      const parsed = callbackInput.safeParse(input);
      if (!parsed.success) return invalid(parsed.error);
      const d = parsed.data;
      if (!ctx.allowWrite())
        return {
          content: `Too many requests from this visitor. Ask them to call or text ${site.phoneDisplay} instead.`,
          isError: true,
        };
      await createPublicLead(
        {
          name: d.name,
          phone: d.phone,
          email: d.email ?? "",
          service: d.service ?? "",
          details: d.details,
          source: "ai-assistant",
          note: "Asked for a call back.",
          transcript: ctx.transcript,
          language: d.language ?? ctx.locale,
        },
        null,
      );
      return { content: "Saved. Alan will call or text them back.", event: { type: "callback" } };
    }

    return { content: `Unknown tool: ${name}`, isError: true };
  } catch (err) {
    console.error(`assistant tool ${name} failed`, err);
    return {
      content: `The booking system is unavailable right now. Apologise and ask the visitor to call or text ${site.phoneDisplay}.`,
      isError: true,
    };
  }
}
