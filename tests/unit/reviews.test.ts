import { beforeEach, describe, expect, it, vi } from "vitest";

const guard = vi.hoisted(() => ({ denied: false }));
vi.mock("@/lib/crm-guard", async () => {
  const { NextResponse } = await import("next/server");
  return {
    requireOwner: async () => (guard.denied ? NextResponse.json({ error: "Not signed in" }, { status: 401 }) : null),
    storageError: () => NextResponse.json({ error: "storage" }, { status: 500 }),
  };
});
vi.mock("next/cache", () => ({ revalidateTag: () => {} }));

import { DELETE, PATCH } from "@/app/api/crm/reviews/[id]/route";
import { GET, POST } from "@/app/api/crm/reviews/route";
import { writeJson } from "@/lib/kv";
import { createReview, listReviews, PERMISSION_ERROR, type NewReview } from "@/lib/reviews";

const base: NewReview = {
  name: "Pat",
  city: "Mesa",
  service: "Tile",
  rating: 5,
  text: "Great work",
  date: "2026-11-01",
  source: "google",
  permission: "",
  relationship: "",
  published: false,
};
const json = (body: unknown, method = "POST") =>
  new Request("http://x/api/crm/reviews", { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  guard.denied = false;
});

describe("review storage", () => {
  it("keeps both reviews when two are created at once", async () => {
    await Promise.all([createReview({ ...base, name: "A" }), createReview({ ...base, name: "B" })]);
    expect((await listReviews()).map((r) => r.name).sort()).toEqual(["A", "B"]);
  });

  it("an edit and a create at the same time both survive", async () => {
    const a = await createReview({ ...base, name: "A" });
    const { updateReview } = await import("@/lib/reviews");
    await Promise.all([updateReview(a.id, { text: "Edited" }), createReview({ ...base, name: "B" })]);
    const all = await listReviews();
    expect(all).toHaveLength(2);
    expect(all.find((r) => r.name === "A")?.text).toBe("Edited");
  });

  it("moves an old single-document reviews.json into separate documents", async () => {
    await writeJson("reviews.json", [{ ...base, id: "legacy-review-1", createdAt: "2026-11-01T00:00:00Z" }]);
    expect((await listReviews()).map((r) => r.id)).toEqual(["legacy-review-1"]);
    expect(await listReviews()).toHaveLength(1);
  });
});

describe("review routes", () => {
  it("require the owner to be signed in", async () => {
    guard.denied = true;
    expect((await GET()).status).toBe(401);
    expect((await POST(json(base))).status).toBe(401);
    expect((await PATCH(json({ rating: 4 }, "PATCH"), ctx("x"))).status).toBe(401);
    expect((await DELETE(json({}, "DELETE"), ctx("x"))).status).toBe(401);
  });

  it("refuses to publish a real review without recorded permission", async () => {
    const res = await POST(json({ ...base, published: true }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe(PERMISSION_ERROR);
    expect(await listReviews()).toHaveLength(0);
  });

  it("creates, updates, publishes with permission, then deletes", async () => {
    const created = (await (await POST(json(base))).json()).review;
    expect(created.id).toBeTruthy();

    const blocked = await PATCH(json({ published: true }, "PATCH"), ctx(created.id));
    expect(blocked.status).toBe(400);

    const ok = await PATCH(json({ published: true, permission: "texted yes 2026-11-02" }, "PATCH"), ctx(created.id));
    expect(ok.status).toBe(200);
    expect((await listReviews())[0].published).toBe(true);

    expect((await PATCH(json({ rating: 3 }, "PATCH"), ctx("nonexistent-id-1"))).status).toBe(404);

    expect((await DELETE(json({}, "DELETE"), ctx(created.id))).status).toBe(200);
    expect(await listReviews()).toHaveLength(0);
  });
});
