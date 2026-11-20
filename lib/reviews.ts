import "server-only";
import { randomUUID } from "node:crypto";
import { readJson, writeJson } from "./kv";
import type { PublicReview, Review } from "./types";

/** Customer reviews, kept as one small document. The owner chooses which appear on the site. */

const KEY = "reviews.json";
/** Cache tag for the public site's copy of the published reviews. */
export const REVIEWS_TAG = "reviews";

export async function listReviews(): Promise<Review[]> {
  const all = (await readJson<Review[]>(KEY)) ?? [];
  return all.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export type NewReview = Omit<Review, "id" | "createdAt">;

export async function createReview(input: NewReview): Promise<Review> {
  const review: Review = { ...input, id: randomUUID(), createdAt: new Date().toISOString() };
  await writeJson(KEY, [review, ...(await listReviews())]);
  return review;
}

export async function updateReview(id: string, patch: Partial<NewReview>): Promise<Review | null> {
  const all = await listReviews();
  const current = all.find((r) => r.id === id);
  if (!current) return null;
  const next = { ...current, ...patch, id: current.id, createdAt: current.createdAt };
  await writeJson(
    KEY,
    all.map((r) => (r.id === id ? next : r)),
  );
  return next;
}

export async function deleteReview(id: string): Promise<void> {
  const all = await listReviews();
  await writeJson(
    KEY,
    all.filter((r) => r.id !== id),
  );
}

/** Replaces or removes sample reviews. Real reviews are never touched. */
export async function setDemoReviews(samples: NewReview[] | null): Promise<void> {
  const real = (await listReviews()).filter((r) => !r.demo);
  const now = new Date().toISOString();
  const demo = (samples ?? []).map((s) => ({ ...s, id: randomUUID(), createdAt: now, demo: true }));
  await writeJson(KEY, [...real, ...demo]);
}

export function toPublic(r: Review): PublicReview {
  return {
    id: r.id,
    name: r.name,
    city: r.city,
    service: r.service,
    rating: r.rating,
    text: r.text,
    date: r.date,
    source: r.source,
    ...(r.demo ? { demo: true } : {}),
  };
}
