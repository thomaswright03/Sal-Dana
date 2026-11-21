import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifyAdminBearer, verifyAdminToken } from "@/lib/admin-auth";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

function guarded(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

/** Gate the CRM and the admin status page, each behind its own sign-in. */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/api/admin/")) {
    if (pathname === "/admin/login" || pathname === "/api/admin/login" || pathname === "/api/admin/logout") {
      return NextResponse.next();
    }
    if (verifyAdminToken(request.cookies.get(ADMIN_COOKIE)?.value)) return guarded(NextResponse.next());
    if (pathname === "/admin/status.json" && verifyAdminBearer(request.headers.get("authorization"))) {
      return guarded(NextResponse.next());
    }
    if (pathname.startsWith("/api/") || pathname === "/admin/status.json") {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const open = pathname === "/crm/login" || pathname === "/api/crm/login" || pathname === "/api/crm/logout";
  if (open) return NextResponse.next();

  if (verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)) return guarded(NextResponse.next());

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/crm/login", request.url));
}

export const config = {
  matcher: ["/crm/:path*", "/api/crm/:path*", "/admin/:path*", "/admin", "/api/admin/:path*"],
};
