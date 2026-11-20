import { NextResponse } from "next/server";
import {
  checkPassword,
  createSessionToken,
  crmConfigured,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
} from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  if (!crmConfigured()) {
    return NextResponse.json(
      { error: "The CRM password hasn't been set yet. Add CRM_PASSWORD in the Vercel project settings." },
      { status: 503 },
    );
  }
  if (!rateLimit(`login:${clientIp(req)}`, 8, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
  }

  const body = (await req.json().catch(() => null)) as { password?: unknown } | null;
  const password = typeof body?.password === "string" ? body.password : "";
  if (!checkPassword(password)) {
    await new Promise((r) => setTimeout(r, 500));
    return NextResponse.json({ error: "That password isn't right." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return res;
}
