import "server-only";
import { randomUUID } from "node:crypto";
import { listKeys, readJson, readMany, removeJson, writeJson, writeJsonIfAbsent } from "./kv";
import type { PublicReview, Review } from "./types";

/** Customer reviews, one document per review (`reviews/<id>.json`) so two saves never overwrite each other. */

const PREFIX = "reviews/";
const LEGACY_KEY = "reviews.json";
const ID_RE = /^[a-z0-9-]{8,64}$/;
const key = (id: string) => `${PREFIX}${id}.json`;
/** Cache tag for the public site's copy of the published reviews. */
export const REVIEWS_TAG = "reviews";

/** Moves reviews from the old single document into one document each, then removes it. Safe to repeat. */
async function migrateLegacy(): Promise<void> {
  const legacy = await readJson<Review[]>(LEGACY_KEY);
  if (!legacy) return;
  for (const r of legacy) await writeJsonIfAbsent(key(r.id), r);
  await removeJson(LEGACY_KEY);
}

export async function listReviews(): Promise<Review[]> {
  await migrateLegacy();
  const all = await readMany<Review>(await listKeys(PREFIX));
  return all.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export async function saveReview(review: Review): Promise<void> {
  await writeJson(key(review.id), review);
}

export const PERMISSION_ERROR =
  "Record how and when the customer agreed to their review being shown (for example: texted yes on 2026-11-20) before showing it on the website.";

export type NewReview = Omit<Review, "id" | "createdAt">;

export async function createReview(input: NewReview): Promise<Review> {
  const review: Review = { ...input, id: randomUUID(), createdAt: new Date().toISOString() };
  await saveReview(review);
  return review;
}

export async function getReview(id: string): Promise<Review | null> {
  if (!ID_RE.test(id)) return null;
  return readJson<Review>(key(id));
}

export async function updateReview(id: string, patch: Partial<NewReview>): Promise<Review | null> {
  const current = await getReview(id);
  if (!current) return null;
  const next = { ...current, ...patch, id: current.id, createdAt: current.createdAt };
  await saveReview(next);
  return next;
}

export async function deleteReview(id: string): Promise<void> {
  if (!ID_RE.test(id)) return;
  await removeJson(key(id));
}

/** Replaces or removes sample reviews. Real reviews are never touched. */
export async function setDemoReviews(samples: NewReview[] | null): Promise<void> {
  const existing = await listReviews();
  await Promise.all(existing.filter((r) => r.demo).map((r) => removeJson(key(r.id))));
  const now = new Date().toISOString();
  await Promise.all(
    (samples ?? []).map((s) => saveReview({ ...s, id: randomUUID(), createdAt: now, demo: true })),
  );
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
    relationship: r.relationship ?? "",
    ...(r.demo ? { demo: true } : {}),
  };
}
