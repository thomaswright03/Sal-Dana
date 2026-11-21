import { describe, expect, it } from "vitest";
import { ConflictError, createLead, deleteLead, getLead, listLeads, updateLead } from "@/lib/store";

const base = { name: "Sam", phone: "4805550100", source: "manual" as const };

describe("lead store", () => {
  it("creates, lists and fetches a lead", async () => {
    const l = await createLead(base);
    expect(l.status).toBe("new");
    expect((await listLeads()).map((x) => x.id)).toEqual([l.id]);
    expect((await getLead(l.id))?.name).toBe("Sam");
  });

  it("sets closedAt when won or lost and clears it when reopened", async () => {
    const l = await createLead(base);
    const won = await updateLead(l.id, { status: "won" });
    expect(won?.closedAt).toBeTruthy();
    const back = await updateLead(l.id, { status: "contacted" });
    expect(back?.closedAt).toBeNull();
    expect((await updateLead(l.id, { status: "lost" }))?.closedAt).toBeTruthy();
  });

  it("adds and removes notes", async () => {
    const l = await createLead(base);
    const withNote = await updateLead(l.id, { addNote: "Called back" });
    expect(withNote?.notes).toHaveLength(1);
    const cleared = await updateLead(l.id, { removeNoteId: withNote!.notes[0].id });
    expect(cleared?.notes).toHaveLength(0);
  });

  it("refuses a save made from a stale copy", async () => {
    const l = await createLead(base);
    const second = await updateLead(l.id, { value: 100 });
    expect(second).not.toBeNull();
    await expect(updateLead(l.id, { value: 200, expectedUpdatedAt: l.updatedAt })).rejects.toBeInstanceOf(
      ConflictError,
    );
    expect((await getLead(l.id))?.value).toBe(100);
    const ok = await updateLead(l.id, { value: 300, expectedUpdatedAt: second!.updatedAt });
    expect(ok?.value).toBe(300);
  });

  it("returns null for missing leads and bad ids", async () => {
    expect(await updateLead("00000000-0000-0000-0000-000000000000", { value: 1 })).toBeNull();
    expect(await getLead("../etc")).toBeNull();
  });

  it("deletes", async () => {
    const l = await createLead(base);
    await deleteLead(l.id);
    expect(await listLeads()).toHaveLength(0);
  });
});

describe("atomic stale-edit check", () => {
  it("lets exactly one of two parallel saves from the same version through", async () => {
    const l = await createLead(base);
    const results = await Promise.allSettled([
      updateLead(l.id, { name: "A", expectedUpdatedAt: l.updatedAt }),
      updateLead(l.id, { name: "B", expectedUpdatedAt: l.updatedAt }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const failed = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
    expect(failed.reason).toBeInstanceOf(ConflictError);
  });
});
