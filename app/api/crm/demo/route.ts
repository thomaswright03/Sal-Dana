import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { requireOwner, storageError } from "@/lib/crm-guard";
import { clearDemo, loadDemo } from "@/lib/demo-data";
import { listReviews, REVIEWS_TAG } from "@/lib/reviews";
import { listLeads } from "@/lib/store";

export const maxDuration = 60;

/** Load or remove the sample leads, reviews and visit numbers used to preview the dashboard. */
export async function POST(req: Request) {
  const denied = await requireOwner();
  if (denied) return denied;
  const body = (await req.json().catch(() => null)) as { action?: unknown } | null;
  try {
    if (body?.action === "load") await loadDemo();
    else if (body?.action === "clear") await clearDemo();
    else return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    revalidateTag(REVIEWS_TAG, { expire: 0 });
    const [leads, reviews] = await Promise.all([listLeads(), listReviews()]);
    return NextResponse.json({ leads, reviews });
  } catch (err) {
    return storageError(err);
  }
}
