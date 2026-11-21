import { connection, NextResponse } from "next/server";
import { getStatus } from "@/lib/status";

/** Machine-readable status. Signed-in admin cookie or `Authorization: Bearer $ADMIN_STATUS_TOKEN`. */
export async function GET() {
  await connection(); // always computed per request, never prerendered
  return NextResponse.json(await getStatus(), { headers: { "Cache-Control": "no-store" } });
}
