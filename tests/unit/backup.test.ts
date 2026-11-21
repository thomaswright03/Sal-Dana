import { describe, expect, it } from "vitest";
import { listBackups, restoreBackup, runBackup } from "@/lib/backup";
import { createLead, deleteLead, getLead, listLeads } from "@/lib/store";

const base = { name: "Sam", phone: "4805550100", source: "manual" as const };

describe("backup and restore", () => {
  it("backs up, survives a deletion, and restores the lead", async () => {
    const keep = await createLead({ ...base, name: "Keep" });
    const lose = await createLead({ ...base, name: "Lose" });
    const out = await runBackup();
    expect(out.leads).toBe(2);
    expect(await listBackups()).toEqual([out.date]);

    await deleteLead(lose.id);
    expect(await getLead(lose.id)).toBeNull();

    const r = await restoreBackup(out.date);
    expect(r.leads).toBe(1); // only the missing one; existing records are left alone
    expect((await getLead(lose.id))?.name).toBe("Lose");
    expect((await listLeads()).map((l) => l.id).sort()).toEqual([keep.id, lose.id].sort());
  });

  it("does not overwrite newer edits unless asked", async () => {
    const l = await createLead(base);
    const out = await runBackup();
    const { updateLead } = await import("@/lib/store");
    await updateLead(l.id, { value: 500 });
    await restoreBackup(out.date);
    expect((await getLead(l.id))?.value).toBe(500);
    await restoreBackup(out.date, { overwrite: true });
    expect((await getLead(l.id))?.value).toBeNull();
  });

  it("rejects a missing or malformed date", async () => {
    await expect(restoreBackup("2000-01-01")).rejects.toThrow();
    await expect(restoreBackup("../x")).rejects.toThrow();
  });
});
