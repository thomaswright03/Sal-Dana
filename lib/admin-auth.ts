import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * Separate sign-in for /admin (the status page). Its own password (ADMIN_PASSWORD) and
 * its own signing key, so the shop owner's CRM password does not open it.
 * /admin/status.json also accepts `Authorization: Bearer $ADMIN_STATUS_TOKEN`.
 */

export const ADMIN_COOKIE = "sd_admin";
export const ADMIN_TTL_SECONDS = 60 * 60 * 12;

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 12);
}

function key(): Buffer {
  return createHash("sha256")
    .update(`sal-dana-admin:${process.env.ADMIN_PASSWORD ?? ""}:${process.env.CRM_SESSION_SECRET ?? ""}`)
    .digest();
}

const sign = (payload: string) => createHmac("sha256", key()).update(payload).digest("hex");

function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());
}

export function checkAdminPassword(candidate: string): boolean {
  return adminConfigured() && safeEqual(candidate, process.env.ADMIN_PASSWORD as string);
}

export function createAdminToken(): string {
  const exp = Math.floor(Date.now() / 1000) + ADMIN_TTL_SECONDS;
  return `${exp}.${sign(`admin:${exp}`)}`;
}

export function verifyAdminToken(token: string | undefined | null): boolean {
  if (!token || !adminConfigured()) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || !/^\d+$/.test(exp)) return false;
  if (Number(exp) < Math.floor(Date.now() / 1000)) return false;
  return safeEqual(sig, sign(`admin:${exp}`));
}

export function verifyAdminBearer(header: string | null): boolean {
  const token = process.env.ADMIN_STATUS_TOKEN;
  if (!token || token.length < 16 || !header) return false;
  return safeEqual(header, `Bearer ${token}`);
}
