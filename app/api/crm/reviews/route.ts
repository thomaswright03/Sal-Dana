import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { requireOwner, storageError } from "@/lib/crm-guard";
import { createReview, listReviews, REVIEWS_TAG } from "@/lib/reviews";
import { reviewSchema } from "@/lib/validation";

export async function GET() {
  const denied = await requireOwner();
  if (denied) return denied;
  try {
    return NextResponse.json({ reviews: await listReviews() });
  } catch (err) {
    return storageError(err);
  }
}

export async function POST(req: Request) {
  const denied = await requireOwner();
  if (denied) return denied;
  const parsed = reviewSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check the review." },
      { status: 400 },
    );
  }
  try {
    const review = await createReview(parsed.data);
    revalidateTag(REVIEWS_TAG, { expire: 0 });
    return NextResponse.json({ review });
  } catch (err) {
    return storageError(err);
  }
}
