import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { listReviews, REVIEWS_TAG, toPublic } from "./reviews";
import type { PublicReview } from "./types";

/**
 * The reviews the owner has chosen to show on the website.
 * Cached with the page and refreshed whenever a review changes in the dashboard.
 */
export async function getPublishedReviews(): Promise<PublicReview[]> {
  "use cache";
  cacheTag(REVIEWS_TAG);
  cacheLife("hours");
  try {
    return (await listReviews()).filter((r) => r.published).map(toPublic);
  } catch {
    // No storage yet (for example a first build): the section simply stays hidden.
    return [];
  }
}
