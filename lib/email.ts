import "server-only";
import { site } from "./site";

/** Sends one email through Resend. Never throws: returns ok/error so callers can log it. */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "RESEND_API_KEY is not set" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || `${site.name} <onboarding@resend.dev>`,
        to: [opts.to],
        subject: opts.subject,
        text: opts.text,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { ok: false, error: `Resend ${res.status}: ${(await res.text()).slice(0, 200)}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "send failed" };
  }
}

/** Who hears about new leads. */
export function leadRecipient(): string {
  return process.env.LEAD_NOTIFY_EMAIL || site.email;
}

/** Who hears when a background job fails. */
export function alertRecipient(): string {
  return process.env.ALERT_EMAIL || leadRecipient();
}

export function siteUrl(): string {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return process.env.NEXT_PUBLIC_SITE_URL || (host ? `https://${host}` : "http://localhost:3000");
}
