import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { requireOwner, storageError } from "@/lib/crm-guard";
import { deleteReview, listReviews, PERMISSION_ERROR, REVIEWS_TAG, updateReview } from "@/lib/reviews";
import { reviewSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const denied = await requireOwner();
  if (denied) return denied;
  const { id } = await params;
  const parsed = reviewSchema.partial().safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check the review." },
      { status: 400 },
    );
  }
  try {
    const current = (await listReviews()).find((r) => r.id === id);
    if (current && !current.demo) {
      const next = { ...current, ...parsed.data };
      if (next.published && !next.permission?.trim()) {
        return NextResponse.json({ error: PERMISSION_ERROR }, { status: 400 });
      }
    }
    const review = await updateReview(id, parsed.data);
    if (!review) return NextResponse.json({ error: "That review no longer exists." }, { status: 404 });
    revalidateTag(REVIEWS_TAG, { expire: 0 });
    return NextResponse.json({ review });
  } catch (err) {
    return storageError(err);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const denied = await requireOwner();
  if (denied) return denied;
  const { id } = await params;
  try {
    await deleteReview(id);
    revalidateTag(REVIEWS_TAG, { expire: 0 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return storageError(err);
  }
}
