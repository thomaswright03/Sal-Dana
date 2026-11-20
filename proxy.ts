import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

/** Gate the CRM and its API behind the owner session cookie. */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const open = pathname === "/crm/login" || pathname === "/api/crm/login" || pathname === "/api/crm/logout";
  if (open) return NextResponse.next();

  if (verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)) {
    const res = NextResponse.next();
    res.headers.set("Cache-Control", "no-store");
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/crm/login", request.url));
}

export const config = {
  matcher: ["/crm/:path*", "/api/crm/:path*"],
};
