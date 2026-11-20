import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * Minimal single-owner auth for the CRM.
 * The password lives in the CRM_PASSWORD env var. A successful login sets an
 * HMAC-signed, httpOnly cookie. Changing the password invalidates every session.
 */

export const SESSION_COOKIE = "sd_crm";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;

export function crmConfigured(): boolean {
  return Boolean(process.env.CRM_PASSWORD && process.env.CRM_PASSWORD.length >= 8);
}

function secret(): Buffer {
  return createHash("sha256")
    .update(`sal-dana-crm:${process.env.CRM_PASSWORD ?? ""}:${process.env.CRM_SESSION_SECRET ?? ""}`)
    .digest();
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = createHash("sha256").update(a).digest();
  const bb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ab, bb);
}

export function checkPassword(candidate: string): boolean {
  if (!crmConfigured()) return false;
  return safeEqual(candidate, process.env.CRM_PASSWORD as string);
}

export function createSessionToken(): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  return `${exp}.${sign(String(exp))}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token || !crmConfigured()) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || !/^\d+$/.test(exp)) return false;
  if (Number(exp) < Math.floor(Date.now() / 1000)) return false;
  return safeEqual(sig, sign(exp));
}
