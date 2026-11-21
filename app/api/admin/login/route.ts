import { NextResponse } from "next/server";
import { ADMIN_COOKIE, ADMIN_TTL_SECONDS, adminConfigured, checkAdminPassword, createAdminToken } from "@/lib/admin-auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  if (!adminConfigured()) {
    return NextResponse.json({ error: "ADMIN_PASSWORD hasn't been set." }, { status: 503 });
  }
  if (!rateLimit(`admin-login:${clientIp(req)}`, 6, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
  }
  const body = (await req.json().catch(() => null)) as { password?: unknown } | null;
  if (!checkAdminPassword(typeof body?.password === "string" ? body.password : "")) {
    await new Promise((r) => setTimeout(r, 500));
    return NextResponse.json({ error: "That password isn't right." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, createAdminToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: ADMIN_TTL_SECONDS,
  });
  return res;
}
