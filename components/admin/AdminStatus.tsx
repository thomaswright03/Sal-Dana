"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { Status, StatusReport } from "@/lib/status-types";

const TIER_LABEL = { important: "Important", key: "Key", basic: "Basic" } as const;
const BADGE: Record<Status, string> = {
  ok: "bg-emerald-400/15 text-emerald-200",
  warning: "bg-amber-400/15 text-amber-200",
  down: "bg-red-400/15 text-red-200",
  unknown: "bg-white/10 text-sand",
};
const WORD: Record<Status, string> = { ok: "OK", warning: "Warning", down: "Down", unknown: "Unknown" };

function arizona(iso: string | null): string {
  if (!iso) return "never";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Phoenix",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function AdminStatus() {
  const router = useRouter();
  const [report, setReport] = useState<StatusReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/admin/status.json", { cache: "no-store" });
      if (res.status === 401) return router.replace("/admin/login");
      if (!res.ok) throw new Error(`Status ${res.status}`);
      setReport((await res.json()) as StatusReport);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load the status.");
    }
  }, [router]);

  useEffect(() => {
    const first = setTimeout(() => void load(), 0);
    const t = setInterval(() => void load(), 60_000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [load]);

  async function signOut() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Sal Dana Renovations</p>
          <h1 className="font-serif text-4xl tracking-tight">System status</h1>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => void load()} className="rounded-full border border-line px-4 py-2 text-xs text-sand hover:text-bone">
            Check again
          </button>
          <button type="button" onClick={() => void signOut()} className="rounded-full border border-line px-4 py-2 text-xs text-sand hover:text-bone">
            Sign out
          </button>
        </div>
      </header>

      {error && (
        <p role="alert" className="mt-6 rounded-xl border border-red-400/30 bg-red-400/5 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}
      {!report && !error && <p className="mt-10 text-sm text-dust">Checking…</p>}

      {report && (
        <>
          <section aria-label="Overall status" className="mt-8 flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-coal p-5">
            <span data-testid="overall" className={`rounded-full px-4 py-1.5 text-sm font-medium ${BADGE[report.overall]}`}>
              {WORD[report.overall]}
            </span>
            <p className="text-sm text-sand">Last checked {arizona(report.checkedAt)} (Arizona time)</p>
          </section>

          {report.groups.map((g) => (
            <section key={g.tier} className="mt-8">
              <h2 className="eyebrow mb-3">{TIER_LABEL[g.tier]}</h2>
              <ul className="divide-y divide-line/70 rounded-2xl border border-line bg-coal">
                {g.items.map((it) => (
                  <li key={it.id} className="grid gap-2 p-4 sm:grid-cols-[1fr_auto]">
                    <div>
                      <p className="text-sm font-medium text-bone">{it.label}</p>
                      <p className="mt-1 text-xs leading-relaxed text-dust">{it.detail}</p>
                      <p className="mt-1 text-xs text-dust">
                        Checked {arizona(it.lastChecked)} · Last success {arizona(it.lastSuccess)}
                      </p>
                    </div>
                    <span className={`h-fit w-fit rounded-full px-3 py-1 text-xs font-medium ${BADGE[it.status]}`}>
                      {WORD[it.status]}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </main>
  );
}
