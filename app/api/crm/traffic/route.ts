import { NextResponse } from "next/server";
import { requireOwner, storageError } from "@/lib/crm-guard";
import { getTraffic } from "@/lib/traffic";

export async function GET() {
  const denied = await requireOwner();
  if (denied) return denied;
  try {
    // Enough history for a 90-day view plus the 90 days before it to compare against.
    return NextResponse.json({ days: await getTraffic(180) });
  } catch (err) {
    return storageError(err);
  }
}
