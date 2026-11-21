"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { site } from "@/lib/site";
import type { Lead, Review, TrafficDay } from "@/lib/types";
import { AskView } from "./AskView";
import { CrmContext, type Crm, type Status } from "./context";
import { RANGES, todayAz, type Range } from "./data";
import { dayLabel, toCsv, today } from "./format";
import { LeadDrawer } from "./LeadDrawer";
import { LeadsView } from "./LeadsView";
import { Overview } from "./Overview";
import { ReviewsView } from "./ReviewsView";
import { ScheduleView } from "./ScheduleView";
import { SettingsView } from "./SettingsView";
import { TrafficView } from "./TrafficView";
import { btn, EASE, Icon, Segmented, type IconName } from "./ui";

type Load = { kind: "loading" } | { kind: "ready" } | { kind: "error"; message: string; storage: boolean };

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/crm", label: "Overview", icon: "overview" },
  { href: "/crm/leads", label: "Leads", icon: "leads" },
  { href: "/crm/schedule", label: "Schedule", icon: "schedule" },
  { href: "/crm/reviews", label: "Reviews", icon: "reviews" },
  { href: "/crm/traffic", label: "Traffic", icon: "traffic" },
  { href: "/crm/ask", label: "Ask AI", icon: "ask" },
  { href: "/crm/settings", label: "Settings", icon: "settings" },
];

const longDate = () =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "America/Phoenix",
  }).format(new Date());

export function Dashboard() {
  const router = useRouter();
  const pathname = usePathname() ?? "/crm";
  const current = NAV.find((n) => n.href !== "/crm" && pathname.startsWith(n.href)) ?? NAV[0];

  const [leads, setLeads] = useState<Lead[]>([]);
  const [traffic, setTraffic] = useState<TrafficDay[]>([]);
  const [reviews, setReviewList] = useState<Review[]>([]);
  const [status, setStatus] = useState<Status | null>(null);
  const [load, setLoad] = useState<Load>({ kind: "loading" });
  const [range, setRange] = useState<Range>(30);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [slotWarning, setSlotWarning] = useState<{ message: string; id: string | null; body: Record<string, unknown> } | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [menu, setMenu] = useState<"alerts" | "account" | null>(null);
  const [sampleBusy, setSampleBusy] = useState(false);
  const [bannerHidden, setBannerHidden] = useState(false);
  const search = useRef<HTMLInputElement>(null);

  const notify = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast((t) => (t === message ? null : t)), 3500);
  }, []);

  // Links from the new-lead email (?lead=ID) open that lead once, on first load.
  const linkedLead = useRef(false);

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
      if (!linkedLead.current) {
        linkedLead.current = true;
        const id = new URLSearchParams(window.location.search).get("lead");
        if (id && data.leads?.some((l) => l.id === id)) setSelected(id);
      }
    } catch {
      setLoad({ kind: "error", message: "Couldn't reach the server.", storage: false });
    }
  }, [router]);

  const loadExtras = useCallback(async () => {
    const get = async <T,>(url: string): Promise<T | null> => {
      try {
        const res = await fetch(url, { cache: "no-store" });
        return res.ok ? ((await res.json()) as T) : null;
      } catch {
        return null;
      }
    };
    const [t, r, s] = await Promise.all([
      get<{ days: TrafficDay[] }>("/api/crm/traffic"),
      get<{ reviews: Review[] }>("/api/crm/reviews"),
      get<Status>("/api/crm/status"),
    ]);
    if (t) setTraffic(t.days);
    if (r) setReviewList(r.reviews);
    if (s) setStatus(s);
  }, []);

  useEffect(() => {
    // Initial load; state is set only after the requests resolve.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    void loadExtras();
    // Pick up new website and assistant leads without a manual reload.
    const timer = setInterval(() => document.visibilityState === "visible" && void refresh(), 120_000);
    return () => clearInterval(timer);
  }, [refresh, loadExtras]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        search.current?.focus();
      }
      if (e.key === "Escape") setMenu(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const patchLead = useCallback(
    async (id: string, body: Record<string, unknown>) => {
      const before = leads;
      const seen = leads.find((l) => l.id === id)?.updatedAt;
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
          body: JSON.stringify({ ...body, expectedUpdatedAt: seen }),
        });
        if (res.status === 401) return router.replace("/crm/login");
        const data = (await res.json().catch(() => ({}))) as { lead?: Lead; error?: string; code?: string };
        // A 409 is either "someone changed this lead" or "that visit window is taken"; they need different prompts.
        if (res.status === 409 && data.code === "slot-taken") {
          setLeads(before);
          setSlotWarning({ message: data.error ?? "That window is already booked.", id, body });
          return;
        }
        if (res.status === 409) {
          setLeads(before);
          setConflict(true);
          return;
        }
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
      const data = (await res.json()) as { lead?: Lead; error?: string; code?: string };
      if (res.status === 409 && data.code === "slot-taken") {
        setSlotWarning({ message: data.error ?? "That window is already booked.", id: null, body });
        return;
      }
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

  const samples = useCallback(
    async (action: "load" | "clear") => {
      setSampleBusy(true);
      try {
        const res = await fetch("/api/crm/demo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        const data = (await res.json()) as { leads?: Lead[]; reviews?: Review[]; error?: string };
        if (!res.ok || !data.leads) throw new Error(data.error ?? "Couldn't update the sample data.");
        setLeads(data.leads);
        setReviewList(data.reviews ?? []);
        setSelected(null);
        await loadExtras();
        notify(action === "load" ? "Sample data loaded." : "Sample data removed.");
      } catch (err) {
        notify(err instanceof Error ? err.message : "Couldn't update the sample data.");
      }
      setSampleBusy(false);
    },
    [loadExtras, notify],
  );

  const exportCsv = useCallback(() => {
    const url = URL.createObjectURL(new Blob([toCsv(leads)], { type: "text/csv" }));
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: `sal-dana-leads-${today()}.csv`,
    });
    a.click();
    URL.revokeObjectURL(url);
  }, [leads]);

  const signOut = useCallback(async () => {
    await fetch("/api/crm/logout", { method: "POST" }).catch(() => null);
    router.replace("/crm/login");
  }, [router]);

  const sampleCount =
    leads.filter((l) => l.demo).length +
    reviews.filter((r) => r.demo).length +
    (traffic.some((d) => d.demo) ? 1 : 0);

  const crm: Crm = useMemo(
    () => ({
      leads,
      traffic,
      reviews,
      status,
      range,
      setRange,
      query,
      setQuery,
      openLead: setSelected,
      newLead: () => setCreating(true),
      patchLead,
      setReviews: setReviewList,
      notify,
      sampleCount,
      sampleBusy,
      samples,
      exportCsv,
      signOut,
    }),
    [
      leads,
      traffic,
      reviews,
      status,
      range,
      query,
      patchLead,
      notify,
      sampleCount,
      sampleBusy,
      samples,
      exportCsv,
      signOut,
    ],
  );

  // What needs the owner's attention, for the bell.
  const alerts = useMemo(() => {
    const t = todayAz();
    const fresh = leads
      .filter((l) => l.status === "new")
      .map((l) => ({ lead: l, text: "New request, waiting on a first reply" }));
    const toConfirm = leads
      .filter((l) => l.appointment?.status === "requested" && l.appointment.date >= t && l.status !== "new")
      .map((l) => ({ lead: l, text: `Visit to confirm, ${dayLabel(l.appointment!.date)}` }));
    return [...fresh, ...toConfirm];
  }, [leads]);

  const newCount = leads.filter((l) => l.status === "new").length;
  const currentLead = leads.find((l) => l.id === selected) ?? null;
  const side = collapsed ? "lg:w-[76px]" : "lg:w-[248px]";

  return (
    <CrmContext.Provider value={crm}>
      <div
        className={`min-h-dvh transition-[padding] duration-500 ${collapsed ? "lg:pl-[76px]" : "lg:pl-[248px]"}`}
      >
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-line bg-coal/60 backdrop-blur-xl transition-[width] duration-500 lg:flex ${side}`}
        >
          <div className="flex h-[72px] items-center justify-between gap-2 px-5">
            <Link href="/crm" className="flex min-w-0 items-baseline gap-2" aria-label="Sal Dana dashboard">
              <span className="font-serif text-[1.75rem] leading-none tracking-tight">
                {collapsed ? "SD" : "Sal Dana"}
              </span>
            </Link>
            {!collapsed && (
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-dust transition-colors hover:text-bone"
                aria-label="Collapse the sidebar"
              >
                <Icon name="collapse" className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {!collapsed && <p className="eyebrow px-5 pb-3">Owner dashboard</p>}
          {collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="mx-auto mb-3 flex h-7 w-7 rotate-180 items-center justify-center rounded-md text-dust transition-colors hover:text-bone"
              aria-label="Expand the sidebar"
            >
              <Icon name="collapse" className="h-3.5 w-3.5" />
            </button>
          )}
          <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Dashboard">
            {NAV.map((n) => {
              const active = n === current;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  title={collapsed ? n.label : undefined}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex h-11 items-center gap-3 rounded-xl px-3.5 text-sm transition-colors ${
                    active ? "text-ink" : "text-sand hover:bg-bone/[0.04] hover:text-bone"
                  } ${collapsed ? "justify-center px-0" : ""}`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-xl bg-brass shadow-[0_8px_30px_-8px_rgb(200_164_106/0.6)]"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <Icon name={n.icon} className="relative h-[18px] w-[18px] shrink-0" />
                  {!collapsed && <span className="relative flex-1 font-medium">{n.label}</span>}
                  {!collapsed && n.href === "/crm/leads" && newCount > 0 && (
                    <span
                      className={`relative rounded-full px-2 py-0.5 text-micro font-semibold tabular-nums ${active ? "bg-ink/15" : "bg-brass text-ink"}`}
                      title={`${newCount} new`}
                    >
                      {newCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="p-3">
            {!collapsed && (
              <div className="mb-2 rounded-xl border border-line bg-ink/60 p-4">
                <p className="font-serif text-lg italic leading-tight text-brass">Finished properly.</p>
                <p className="mt-1.5 text-xs leading-relaxed text-dust">
                  {newCount > 0
                    ? `${newCount} new ${newCount === 1 ? "request is" : "requests are"} waiting on a first reply.`
                    : "Every request has had a reply. Nice work."}
                </p>
              </div>
            )}
            <Link
              href="/"
              className={`flex h-10 items-center gap-3 rounded-xl px-3.5 text-xs text-dust transition-colors hover:text-bone ${collapsed ? "justify-center px-0" : ""}`}
              title="View the website"
            >
              <Icon name="external" className="h-4 w-4" />
              {!collapsed && "View the website"}
            </Link>
          </div>
        </aside>

        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-line bg-ink/85 backdrop-blur-xl">
          <div className="flex h-[72px] items-center gap-3 px-4 sm:px-8">
            <div className="min-w-0 flex-1 lg:flex-none lg:pr-6">
              <p className="truncate text-lg font-semibold leading-tight">{current.label}</p>
              <p className="truncate text-xs text-dust">{longDate()}</p>
            </div>
            <label className="relative hidden flex-1 md:block">
              <span className="sr-only">Search leads</span>
              <Icon
                name="search"
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dust"
              />
              <input
                ref={search}
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (e.target.value && current.href !== "/crm/leads") router.push("/crm/leads");
                }}
                placeholder="Search leads by name, phone, job or city"
                className="h-10 w-full max-w-md rounded-full border border-line bg-coal pl-10 pr-14 text-sm outline-none transition-colors placeholder:text-dust focus:border-brass"
              />
            </label>
            <div className="hidden sm:block">
              <Segmented
                id="range"
                label="Date range"
                value={range}
                onChange={setRange}
                options={RANGES.map((r) => ({ value: r, label: `${r} days` }))}
              />
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenu(menu === "alerts" ? null : "alerts")}
                aria-expanded={menu === "alerts"}
                aria-label={`Needs attention: ${alerts.length}`}
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-line text-sand transition-colors hover:border-bone/30 hover:text-bone"
              >
                <Icon name="bell" />
                {alerts.length > 0 && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brass ring-2 ring-ink" />
                )}
              </button>
              <AnimatePresence>
                {menu === "alerts" && (
                  <motion.div
                    className="absolute right-0 top-12 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-coal p-2 shadow-2xl"
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.25, ease: EASE }}
                  >
                    <p className="eyebrow px-3 pb-2 pt-2">Needs attention</p>
                    {alerts.length === 0 && (
                      <p className="px-3 pb-3 text-sm text-dust">Nothing waiting on you.</p>
                    )}
                    <ul className="max-h-80 overflow-y-auto">
                      {alerts.slice(0, 12).map((a) => (
                        <li key={`${a.lead.id}${a.text}`}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelected(a.lead.id);
                              setMenu(null);
                            }}
                            className="w-full rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-bone/5"
                          >
                            <span className="block text-sm text-bone">{a.lead.name}</span>
                            <span className="block text-xs text-dust">{a.text}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenu(menu === "account" ? null : "account")}
                aria-expanded={menu === "account"}
                aria-label="Account menu"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-brass font-serif text-lg text-ink"
              >
                {site.owner[0]}
              </button>
              <AnimatePresence>
                {menu === "account" && (
                  <motion.div
                    className="absolute right-0 top-12 z-50 w-56 rounded-2xl border border-line bg-coal p-2 shadow-2xl"
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.25, ease: EASE }}
                  >
                    <p className="px-3 pb-1 pt-2 text-sm text-bone">{site.owner}</p>
                    <p className="px-3 pb-2 text-xs text-dust">{site.legalName}</p>
                    <Link
                      href="/crm/settings"
                      onClick={() => setMenu(null)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-sand transition-colors hover:bg-bone/5 hover:text-bone"
                    >
                      <Icon name="settings" /> Settings
                    </Link>
                    <button
                      type="button"
                      onClick={() => void signOut()}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-sand transition-colors hover:bg-bone/5 hover:text-bone"
                    >
                      <Icon name="logout" /> Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          {/* Section tabs for phones and tablets, where the sidebar is hidden */}
          <nav className="flex gap-1 overflow-x-auto px-3 pb-2 lg:hidden" aria-label="Dashboard sections">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                aria-current={n === current ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-small ${
                  n === current ? "bg-brass font-medium text-ink" : "text-sand"
                }`}
              >
                <Icon name={n.icon} className="h-3.5 w-3.5" />
                {n.label}
              </Link>
            ))}
          </nav>
        </header>

        <main className="mx-auto max-w-[1500px] px-4 pb-28 pt-6 sm:px-8">
          <div className="mb-4 sm:hidden">
            <Segmented
              id="range-sm"
              label="Date range"
              value={range}
              onChange={setRange}
              options={RANGES.map((r) => ({ value: r, label: `${r} days` }))}
            />
          </div>

          {sampleCount > 0 && !bannerHidden && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brass/30 bg-brass/[0.07] px-4 py-3 text-sm">
              <p className="flex items-center gap-3 text-bone">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brass text-ink">
                  <Icon name="ask" className="h-3.5 w-3.5" />
                </span>
                <span>
                  <span className="mr-2 rounded-full bg-brass px-2 py-0.5 text-micro font-semibold uppercase tracking-[0.14em] text-ink">
                    Preview
                  </span>
                  Sample leads, reviews and visits are loaded, so the numbers here aren’t real customers.
                </span>
              </p>
              <span className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={sampleBusy}
                  onClick={() => void samples("clear")}
                  className={btn.ghost}
                >
                  {sampleBusy ? "Removing…" : "Remove sample data"}
                </button>
                <button
                  type="button"
                  onClick={() => setBannerHidden(true)}
                  aria-label="Hide this notice"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-dust hover:text-bone"
                >
                  <Icon name="x" className="h-3.5 w-3.5" />
                </button>
              </span>
            </div>
          )}

          {load.kind === "loading" && (
            <p className="py-32 text-center text-sm text-dust">Loading your dashboard</p>
          )}

          {load.kind === "error" && (
            <div className="mx-auto mt-16 max-w-lg rounded-2xl border border-line bg-coal p-8 text-center">
              <h2 className="font-serif text-3xl">
                {load.storage ? "Storage isn’t connected yet" : "Something went wrong"}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-sand">
                {load.storage
                  ? "Leads are kept in a Vercel Blob store. Connect one to this project in the Vercel dashboard (Storage, Create, Blob), then redeploy."
                  : load.message}
              </p>
              <button type="button" onClick={() => void refresh()} className={`${btn.ghost} mt-6`}>
                Try again
              </button>
            </div>
          )}

          {load.kind === "ready" && (
            <AnimatePresence mode="wait">
              <motion.div
                key={current.href}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3, ease: EASE }}
              >
                {current.href === "/crm" && <Overview />}
                {current.href === "/crm/leads" && <LeadsView />}
                {current.href === "/crm/schedule" && <ScheduleView />}
                {current.href === "/crm/reviews" && <ReviewsView />}
                {current.href === "/crm/traffic" && <TrafficView />}
                {current.href === "/crm/ask" && <AskView />}
                {current.href === "/crm/settings" && <SettingsView />}
              </motion.div>
            </AnimatePresence>
          )}
        </main>

        {menu && (
          <button
            type="button"
            className="fixed inset-0 z-20 cursor-default"
            aria-hidden
            tabIndex={-1}
            onClick={() => setMenu(null)}
          />
        )}

        <LeadDrawer
          lead={currentLead}
          creating={creating}
          onClose={() => {
            setSelected(null);
            setCreating(false);
          }}
          onPatch={patchLead}
          onCreate={create}
          onDelete={remove}
        />

        {slotWarning && (
          <div
            role="alert"
            className="fixed bottom-20 left-1/2 z-[70] flex max-w-[92vw] -translate-x-1/2 flex-wrap items-center gap-3 rounded-2xl border border-brass/40 bg-coal px-5 py-3 text-sm shadow-2xl"
          >
            <span>{slotWarning.message}</span>
            <button
              type="button"
              onClick={() => {
                const w = slotWarning;
                setSlotWarning(null);
                if (w.id) void patchLead(w.id, { ...w.body, confirmDoubleBook: true });
                else void create({ ...w.body, confirmDoubleBook: true });
              }}
              className="rounded-full bg-brass px-3.5 py-1.5 text-xs font-medium text-ink"
            >
              Book it anyway
            </button>
            <button type="button" onClick={() => setSlotWarning(null)} className="rounded-full border border-line px-3.5 py-1.5 text-xs text-sand">
              Pick another time
            </button>
          </div>
        )}

        {conflict && (
          <div
            role="alert"
            className="fixed bottom-20 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-3 rounded-full border border-brass/40 bg-coal px-5 py-3 text-sm shadow-2xl"
          >
            <span>This lead changed since you opened it.</span>
            <button
              type="button"
              onClick={() => {
                setConflict(false);
                void refresh();
              }}
              className="rounded-full bg-brass px-3.5 py-1.5 text-xs font-medium text-ink"
            >
              Reload
            </button>
          </div>
        )}

        <AnimatePresence>
          {toast && (
            <motion.div
              role="status"
              className="fixed bottom-6 left-1/2 z-[70] rounded-full border border-line bg-coal px-5 py-3 text-sm shadow-2xl"
              initial={{ opacity: 0, y: 20, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 20, x: "-50%" }}
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </CrmContext.Provider>
  );
}
