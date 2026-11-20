"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type DragEvent } from "react";
import {
  LEAD_STATUSES,
  SOURCE_LABELS,
  STATUS_LABELS,
  type AppointmentStatus,
  type Lead,
  type LeadStatus,
} from "@/lib/types";
import { ago, dayLabel, money, STATUS_TONE, toCsv, today, windowText } from "./format";
import { LeadDrawer } from "./LeadDrawer";

type View = "pipeline" | "leads" | "visits";
type Load = { kind: "loading" } | { kind: "ready" } | { kind: "error"; message: string; storage: boolean };

const EASE = [0.16, 1, 0.3, 1] as const;

export function CrmApp() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [load, setLoad] = useState<Load>({ kind: "loading" });
  const [view, setView] = useState<View>("pipeline");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const notify = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast((t) => (t === message ? null : t)), 3500);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/crm/leads", { cache: "no-store" });
      if (res.status === 401) return router.replace("/crm/login");
      const data = (await res.json()) as { leads?: Lead[]; error?: string; code?: string };
      if (!res.ok) {
        setLoad({
          kind: "error",
          message: data.error ?? "Couldn't load leads.",
          storage: data.code === "storage",
        });
        return;
      }
      setLeads(data.leads ?? []);
      setLoad({ kind: "ready" });
    } catch {
      setLoad({ kind: "error", message: "Couldn't reach the server.", storage: false });
    }
  }, [router]);

  useEffect(() => {
    // Initial load; state is set only after the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    // Pick up new website and assistant leads without a manual reload.
    const timer = setInterval(() => document.visibilityState === "visible" && void refresh(), 60_000);
    return () => clearInterval(timer);
  }, [refresh]);

  const patch = useCallback(
    async (id: string, body: Record<string, unknown>) => {
      const before = leads;
      // Show simple field edits immediately; the server's copy replaces it on reply.
      setLeads((ls) =>
        ls.map((l) => {
          if (l.id !== id) return l;
          const next = { ...l };
          for (const key of ["status", "appointment", "value"] as const) {
            if (key in body) Object.assign(next, { [key]: body[key] });
          }
          return next;
        }),
      );
      try {
        const res = await fetch(`/api/crm/leads/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.status === 401) return router.replace("/crm/login");
        const data = (await res.json()) as { lead?: Lead; error?: string };
        if (!res.ok || !data.lead) throw new Error(data.error ?? "Couldn't save.");
        setLeads((ls) => ls.map((l) => (l.id === id ? data.lead! : l)));
      } catch (err) {
        setLeads(before);
        notify(err instanceof Error ? err.message : "Couldn't save.");
      }
    },
    [leads, notify, router],
  );

  const create = useCallback(
    async (body: Record<string, unknown>) => {
      const res = await fetch("/api/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { lead?: Lead; error?: string };
      if (!res.ok || !data.lead) {
        notify(data.error ?? "Couldn't create the lead.");
        return;
      }
      setLeads((ls) => [data.lead!, ...ls]);
      setCreating(false);
      setSelected(data.lead.id);
    },
    [notify],
  );

  const remove = useCallback(
    async (id: string) => {
      const before = leads;
      setLeads((ls) => ls.filter((l) => l.id !== id));
      setSelected(null);
      const res = await fetch(`/api/crm/leads/${id}`, { method: "DELETE" }).catch(() => null);
      if (!res?.ok) {
        setLeads(before);
        notify("Couldn't delete the lead.");
      }
    },
    [leads, notify],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((l) =>
      [l.name, l.phone, l.email, l.address, l.service, l.details].some((f) => f.toLowerCase().includes(q)),
    );
  }, [leads, query]);

  const stats = useMemo(() => {
    const t = today();
    const open = leads.filter((l) => l.status !== "won" && l.status !== "lost");
    return {
      fresh: leads.filter((l) => l.status === "new").length,
      visits: leads.filter(
        (l) =>
          l.appointment &&
          l.appointment.date >= t &&
          ["requested", "confirmed"].includes(l.appointment.status),
      ).length,
      toConfirm: leads.filter((l) => l.appointment?.status === "requested" && l.appointment.date >= t).length,
      pipeline: open.reduce((sum, l) => sum + (l.value ?? 0), 0),
      won: leads.filter((l) => l.status === "won").reduce((sum, l) => sum + (l.value ?? 0), 0),
    };
  }, [leads]);

  const exportCsv = () => {
    const url = URL.createObjectURL(new Blob([toCsv(leads)], { type: "text/csv" }));
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: `sal-dana-leads-${today()}.csv`,
    });
    a.click();
    URL.revokeObjectURL(url);
  };

  const logout = async () => {
    await fetch("/api/crm/logout", { method: "POST" }).catch(() => null);
    router.replace("/crm/login");
  };

  const current = leads.find((l) => l.id === selected) ?? null;

  return (
    <div className="mx-auto max-w-[1600px] px-4 pb-24 sm:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4 py-6">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-serif text-3xl leading-none tracking-tight">Sal Dana</span>
          <span className="eyebrow">CRM</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportCsv}
            className="rounded-full border border-line px-4 py-2 text-xs text-sand transition-colors hover:border-bone/30 hover:text-bone"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={logout}
            className="rounded-full border border-line px-4 py-2 text-xs text-sand transition-colors hover:border-bone/30 hover:text-bone"
          >
            Sign out
          </button>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "New leads", value: String(stats.fresh), hint: "Waiting on a first reply" },
          {
            label: "Upcoming visits",
            value: String(stats.visits),
            hint: stats.toConfirm ? `${stats.toConfirm} to confirm` : "All confirmed",
          },
          { label: "Open pipeline", value: money(stats.pipeline), hint: "Estimated value in play" },
          { label: "Won", value: money(stats.won), hint: "Value of jobs won" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            className="rounded-2xl border border-line bg-coal p-5"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: i * 0.06 }}
          >
            <p className="eyebrow">{s.label}</p>
            <p className="mt-3 font-serif text-4xl leading-none tracking-tight sm:text-5xl">{s.value}</p>
            <p className="mt-2 text-xs text-dust">{s.hint}</p>
          </motion.div>
        ))}
      </section>

      <div className="sticky top-0 z-20 -mx-4 mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-ink/85 px-4 py-3 backdrop-blur-xl sm:-mx-8 sm:px-8">
        <div className="flex rounded-full border border-line p-1" role="tablist">
          {(["pipeline", "leads", "visits"] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className="relative rounded-full px-4 py-1.5 text-[0.8125rem] capitalize"
            >
              {view === v && (
                <motion.span
                  layoutId="tab"
                  className="absolute inset-0 rounded-full bg-brass"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className={`relative transition-colors ${view === v ? "text-ink" : "text-sand"}`}>
                {v}
              </span>
            </button>
          ))}
        </div>
        <div className="flex flex-1 items-center justify-end gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search leads"
            aria-label="Search leads"
            className="w-full max-w-xs rounded-full border border-line bg-coal px-4 py-2 text-sm outline-none transition-colors placeholder:text-dust focus:border-brass"
          />
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="shrink-0 rounded-full bg-bone px-4 py-2 text-[0.8125rem] font-medium text-ink transition-colors hover:bg-brass"
          >
            + New lead
          </button>
        </div>
      </div>

      <div className="pt-6">
        {load.kind === "loading" && <p className="py-24 text-center text-sm text-dust">Loading your leads</p>}

        {load.kind === "error" && (
          <div className="mx-auto max-w-lg rounded-2xl border border-line bg-coal p-8 text-center">
            <h2 className="font-serif text-3xl">
              {load.storage ? "Storage isn't connected yet" : "Something went wrong"}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-sand">
              {load.storage
                ? "Leads are kept in a Vercel Blob store. Connect one to this project in the Vercel dashboard (Storage, Create, Blob), then redeploy."
                : load.message}
            </p>
            <button
              type="button"
              onClick={() => void refresh()}
              className="mt-6 rounded-full border border-line px-5 py-2 text-sm text-sand hover:text-bone"
            >
              Try again
            </button>
          </div>
        )}

        {load.kind === "ready" && leads.length === 0 && (
          <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-line p-12 text-center">
            <h2 className="font-serif text-4xl">No leads yet</h2>
            <p className="mt-3 text-sm leading-relaxed text-sand">
              Requests from the website form and the AI assistant land here on their own. You can also add one
              by hand.
            </p>
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="mt-6 rounded-full bg-brass px-5 py-2.5 text-sm font-medium text-ink"
            >
              Add your first lead
            </button>
          </div>
        )}

        {load.kind === "ready" && leads.length > 0 && (
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              {view === "pipeline" && (
                <Pipeline
                  leads={filtered}
                  onOpen={setSelected}
                  onMove={(id, status) => void patch(id, { status })}
                />
              )}
              {view === "leads" && <Table leads={filtered} onOpen={setSelected} />}
              {view === "visits" && (
                <Visits
                  leads={filtered}
                  onOpen={setSelected}
                  onStatus={(lead, status) => {
                    const body: Record<string, unknown> = { appointment: { ...lead.appointment!, status } };
                    // Confirming a visit also moves a fresh lead along the pipeline.
                    if (status === "confirmed" && ["new", "contacted", "quoted"].includes(lead.status))
                      body.status = "scheduled";
                    void patch(lead.id, body);
                  }}
                />
              )}
              {filtered.length === 0 && (
                <p className="py-16 text-center text-sm text-dust">Nothing matches that search.</p>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <LeadDrawer
        lead={current}
        creating={creating}
        onClose={() => {
          setSelected(null);
          setCreating(false);
        }}
        onPatch={patch}
        onCreate={create}
        onDelete={remove}
      />

      <AnimatePresence>
        {toast && (
          <motion.div
            role="status"
            className="fixed bottom-6 left-1/2 z-50 rounded-full border border-line bg-coal px-5 py-3 text-sm shadow-2xl"
            initial={{ opacity: 0, y: 20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function VisitBadge({ lead }: { lead: Lead }) {
  if (!lead.appointment || lead.appointment.status === "cancelled") return null;
  const a = lead.appointment;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6875rem] ${a.status === "requested" ? "bg-brass/15 text-brass" : "bg-bone/10 text-sand"}`}
    >
      <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.1">
        <rect x="1.5" y="2.5" width="9" height="8" rx="1" />
        <path d="M1.5 5h9M4 1v2.5M8 1v2.5" />
      </svg>
      {dayLabel(a.date)}
      {a.status === "requested" && " · confirm"}
    </span>
  );
}

function Pipeline({
  leads,
  onOpen,
  onMove,
}: {
  leads: Lead[];
  onOpen: (id: string) => void;
  onMove: (id: string, s: LeadStatus) => void;
}) {
  const [over, setOver] = useState<LeadStatus | null>(null);

  const onDrop = (e: DragEvent, status: LeadStatus) => {
    e.preventDefault();
    setOver(null);
    const id = e.dataTransfer.getData("text/lead");
    const lead = leads.find((l) => l.id === id);
    if (lead && lead.status !== status) onMove(id, status);
  };

  return (
    <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-4 sm:-mx-8 sm:px-8">
      {LEAD_STATUSES.map((status) => {
        const column = leads.filter((l) => l.status === status);
        const total = column.reduce((sum, l) => sum + (l.value ?? 0), 0);
        return (
          <div
            key={status}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(status);
            }}
            onDragLeave={() => setOver((o) => (o === status ? null : o))}
            onDrop={(e) => onDrop(e, status)}
            className={`flex min-h-[50vh] w-[280px] shrink-0 snap-start flex-col rounded-2xl border p-2.5 transition-colors duration-300 ${
              over === status ? "border-brass/60 bg-brass/5" : "border-line bg-coal/60"
            }`}
          >
            <div className="flex items-center justify-between px-2 pb-3 pt-1.5">
              <p className="flex items-center gap-2 text-sm">
                {STATUS_LABELS[status]}
                <span className="rounded-full bg-bone/10 px-2 py-0.5 text-[0.6875rem] text-sand">
                  {column.length}
                </span>
              </p>
              {total > 0 && <span className="font-mono text-[0.6875rem] text-dust">{money(total)}</span>}
            </div>
            <div className="flex flex-1 flex-col gap-2">
              {column.map((lead) => (
                <motion.button
                  layout
                  layoutId={`card-${lead.id}`}
                  key={lead.id}
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    const dt = (e as unknown as DragEvent).dataTransfer;
                    dt.setData("text/lead", lead.id);
                    dt.effectAllowed = "move";
                  }}
                  onClick={() => onOpen(lead.id)}
                  className="cursor-grab rounded-xl border border-line bg-ink p-3.5 text-left transition-colors hover:border-brass/50 active:cursor-grabbing"
                  transition={{ type: "spring", stiffness: 400, damping: 34 }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium leading-tight">{lead.name}</p>
                    {lead.value != null && (
                      <span className="font-mono text-[0.6875rem] text-brass">{money(lead.value)}</span>
                    )}
                  </div>
                  {lead.service && <p className="mt-1 text-xs text-sand">{lead.service}</p>}
                  {lead.details && (
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-dust">{lead.details}</p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <VisitBadge lead={lead} />
                    <span className="ml-auto text-[0.625rem] text-dust">
                      {lead.source === "ai-assistant" ? "AI · " : ""}
                      {ago(lead.createdAt)}
                    </span>
                  </div>
                </motion.button>
              ))}
              {column.length === 0 && (
                <p className="px-2 py-6 text-center text-xs text-dust/70">Drop a lead here</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Table({ leads, onOpen }: { leads: Lead[]; onOpen: (id: string) => void }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className="bg-coal">
          <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:font-mono [&>th]:text-[0.625rem] [&>th]:font-normal [&>th]:uppercase [&>th]:tracking-[0.18em] [&>th]:text-dust">
            <th>Name</th>
            <th>Contact</th>
            <th>Job</th>
            <th>Status</th>
            <th>Visit</th>
            <th>Value</th>
            <th>Source</th>
            <th>Added</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr
              key={l.id}
              onClick={() => onOpen(l.id)}
              className="cursor-pointer border-t border-line transition-colors hover:bg-coal [&>td]:px-4 [&>td]:py-3.5"
            >
              <td className="font-medium">{l.name}</td>
              <td className="text-sand">
                <span className="block">{l.phone}</span>
                {l.email && <span className="block text-xs text-dust">{l.email}</span>}
              </td>
              <td className="max-w-[240px] text-sand">
                <span className="line-clamp-1">{l.service || l.details || "Not specified"}</span>
              </td>
              <td>
                <span className={`rounded-full px-2.5 py-1 text-[0.6875rem] ${STATUS_TONE[l.status]}`}>
                  {STATUS_LABELS[l.status]}
                </span>
              </td>
              <td>{l.appointment ? <VisitBadge lead={l} /> : <span className="text-dust">None</span>}</td>
              <td className="font-mono text-xs">{l.value != null ? money(l.value) : ""}</td>
              <td className="text-xs text-dust">{SOURCE_LABELS[l.source]}</td>
              <td className="whitespace-nowrap text-xs text-dust">{ago(l.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Visits({
  leads,
  onOpen,
  onStatus,
}: {
  leads: Lead[];
  onOpen: (id: string) => void;
  onStatus: (lead: Lead, s: AppointmentStatus) => void;
}) {
  const t = today();
  const withVisit = leads.filter((l) => l.appointment);
  const order = { morning: 0, midday: 1, afternoon: 2 } as const;
  const upcoming = withVisit
    .filter((l) => l.appointment!.date >= t && ["requested", "confirmed"].includes(l.appointment!.status))
    .sort(
      (a, b) =>
        a.appointment!.date.localeCompare(b.appointment!.date) ||
        order[a.appointment!.window] - order[b.appointment!.window],
    );
  const past = withVisit
    .filter((l) => !upcoming.includes(l))
    .sort((a, b) => b.appointment!.date.localeCompare(a.appointment!.date))
    .slice(0, 30);
  const days = [...new Set(upcoming.map((l) => l.appointment!.date))];

  const Row = ({ lead, actions }: { lead: Lead; actions: boolean }) => {
    const a = lead.appointment!;
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-coal p-4">
        <button type="button" onClick={() => onOpen(lead.id)} className="min-w-0 flex-1 text-left">
          <p className="eyebrow !text-brass">{windowText(a.window)}</p>
          <p className="mt-1.5 font-medium">{lead.name}</p>
          <p className="truncate text-xs text-sand">
            {[lead.service, lead.address].filter(Boolean).join(" · ") || lead.phone}
          </p>
        </button>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[0.6875rem] capitalize ${a.status === "requested" ? "bg-brass/15 text-brass" : a.status === "confirmed" ? "bg-emerald-400/15 text-emerald-200" : "bg-bone/10 text-dust"}`}
          >
            {a.status}
          </span>
          {actions && a.status === "requested" && (
            <button
              type="button"
              onClick={() => onStatus(lead, "confirmed")}
              className="rounded-full bg-brass px-3.5 py-1.5 text-xs font-medium text-ink hover:bg-brass-bright"
            >
              Confirm
            </button>
          )}
          {actions && a.status === "confirmed" && (
            <button
              type="button"
              onClick={() => onStatus(lead, "completed")}
              className="rounded-full border border-line px-3.5 py-1.5 text-xs text-sand hover:border-bone/30 hover:text-bone"
            >
              Mark done
            </button>
          )}
          {actions && (
            <button
              type="button"
              onClick={() => onStatus(lead, "cancelled")}
              className="rounded-full border border-line px-3.5 py-1.5 text-xs text-dust hover:border-red-400/40 hover:text-red-200"
            >
              Cancel
            </button>
          )}
          {lead.phone && (
            <a
              href={`tel:${lead.phone.replace(/[^\d+]/g, "")}`}
              className="rounded-full border border-line px-3.5 py-1.5 text-xs text-sand hover:border-bone/30 hover:text-bone"
            >
              Call
            </a>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      {days.length === 0 && <p className="py-12 text-center text-sm text-dust">No upcoming visits.</p>}
      {days.map((day) => (
        <section key={day}>
          <h3 className="mb-3 flex items-baseline gap-3 font-serif text-3xl tracking-tight">
            {dayLabel(day, true)}
            <span className="font-mono text-xs text-dust">{day}</span>
          </h3>
          <div className="space-y-2">
            {upcoming
              .filter((l) => l.appointment!.date === day)
              .map((l) => (
                <Row key={l.id} lead={l} actions />
              ))}
          </div>
        </section>
      ))}
      {past.length > 0 && (
        <section>
          <h3 className="eyebrow mb-3">Past and cancelled</h3>
          <div className="space-y-2 opacity-70">
            {past.map((l) => (
              <div key={l.id}>
                <p className="mb-1 font-mono text-[0.625rem] text-dust">{dayLabel(l.appointment!.date)}</p>
                <Row lead={l} actions={false} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
