"use client";

import { motion } from "motion/react";
import { useEffect, useMemo, useState, type DragEvent } from "react";
import {
  LEAD_STATUSES,
  SOURCE_LABELS,
  STATUS_LABELS,
  type Lead,
  type LeadSource,
  type LeadStatus,
} from "@/lib/types";
import { useCrm } from "./context";
import { arrivedIn, cityOf, isOpen, num, periodFor, todayAz, valueOf, dayOf } from "./data";
import { ago, money, STATUS_TONE } from "./format";
import { btn, Card, Icon, PageHead, Segmented, Tile } from "./ui";
import { VisitBadge } from "./VisitStatus";

type SortKey = "name" | "city" | "service" | "source" | "status" | "value" | "created";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

export function LeadsView() {
  const { leads, query, setQuery, openLead, newLead, patchLead, exportCsv, range } = useCrm();
  // This view only mounts after the leads load in the browser, so the address bar is safe to read here.
  const [status, setStatus] = useState<LeadStatus | "all">(() => {
    const st = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("status");
    return st && (LEAD_STATUSES as readonly string[]).includes(st) ? (st as LeadStatus) : "all";
  });
  const [source, setSource] = useState<LeadSource | "all">("all");
  const [view, setView] = useState<"table" | "board">("table");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "created", dir: -1 });

  // Keep the filter and search in the address bar so a refresh or Back restores the same view.
  const [urlRead, setUrlRead] = useState(false);
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setQuery(q);
    setUrlRead(true);
    // Read once on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!urlRead) return;
    const p = new URLSearchParams(window.location.search);
    if (status === "all") p.delete("status");
    else p.set("status", status);
    if (query.trim()) p.set("q", query);
    else p.delete("q");
    const qs = p.toString();
    const next = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
    if (next !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(null, "", next);
  }, [status, query, urlRead]);

  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter(
      (l) =>
        (source === "all" || l.source === source) &&
        (!q ||
          [l.name, l.phone, l.email, l.address, l.service, l.details].some((v) =>
            v.toLowerCase().includes(q),
          )),
    );
  }, [leads, query, source]);

  const rows = useMemo(() => {
    const list = status === "all" ? searched : searched.filter((l) => l.status === status);
    const value = (l: Lead): string | number => {
      switch (sort.key) {
        case "name":
          return l.name.toLowerCase();
        case "city":
          return (cityOf(l.address) ?? "~").toLowerCase();
        case "service":
          return (l.service || "~").toLowerCase();
        case "source":
          return l.source;
        case "status":
          return LEAD_STATUSES.indexOf(l.status);
        case "value":
          return l.value ?? -1;
        default:
          return l.createdAt;
      }
    };
    return [...list].sort((a, b) => {
      const x = value(a);
      const y = value(b);
      return (x < y ? -1 : x > y ? 1 : 0) * sort.dir;
    });
  }, [searched, status, sort]);

  const stats = useMemo(() => {
    const { days, prior } = periodFor(range);
    const today = todayAz();
    const won = leads.filter((l) => l.status === "won").length;
    const lost = leads.filter((l) => l.status === "lost").length;
    return {
      waiting: leads.filter((l) => l.status === "new"),
      today: leads.filter((l) => dayOf(l.createdAt) === today).length,
      arrived: arrivedIn(leads, days).length,
      arrivedBefore: arrivedIn(leads, prior).length,
      quoted: leads.filter((l) => l.status === "quoted"),
      open: leads.filter(isOpen),
      winRate: won + lost ? Math.round((won / (won + lost)) * 100) : null,
      decided: won + lost,
    };
  }, [leads, range]);

  const head = (key: SortKey, label: string, align = "") => (
    <th
      className={align}
      aria-sort={sort.key === key ? (sort.dir === 1 ? "ascending" : "descending") : undefined}
    >
      <button
        type="button"
        onClick={() =>
          setSort((s) => ({
            key,
            dir: s.key === key ? (s.dir === 1 ? -1 : 1) : key === "created" || key === "value" ? -1 : 1,
          }))
        }
        className={`inline-flex items-center gap-1 uppercase tracking-[0.18em] transition-colors hover:text-bone ${sort.key === key ? "text-brass" : ""}`}
      >
        {sort.key === key && <span aria-hidden>{sort.dir === 1 ? "↑" : "↓"}</span>}
        {label}
      </button>
    </th>
  );

  return (
    <>
      <PageHead
        title="Every request,"
        accent="in one place."
        sub="Everything that came in through the website, the assistant, or that you added by hand. Click a row to work it."
        action={
          <>
            <button type="button" onClick={exportCsv} className={btn.ghost}>
              <Icon name="download" className="h-3.5 w-3.5" /> Export CSV
            </button>
            <button type="button" onClick={newLead} className={btn.primary}>
              <Icon name="plus" className="h-3.5 w-3.5" /> New lead
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Tile
          index={0}
          label="Waiting on a reply"
          icon="inbox"
          value={num(stats.waiting.length)}
          note={`${stats.today} came in today`}
        />
        <Tile
          index={1}
          label={`Requests, ${range} days`}
          icon="leads"
          value={num(stats.arrived)}
          current={stats.arrived}
          previous={stats.arrivedBefore}
          compareLabel={`vs prior ${range} days`}
        />
        <Tile
          index={2}
          label="Quotes out"
          icon="message"
          value={num(stats.quoted.length)}
          note={`${money(valueOf(stats.quoted))} waiting on an answer`}
        />
        <Tile
          index={3}
          label="Win rate"
          icon="trophy"
          value={stats.winRate === null ? "–" : `${stats.winRate}%`}
          note={stats.decided ? `of ${stats.decided} decided leads` : "No decided leads yet"}
        />
      </div>

      <Card className="mt-3 flex flex-wrap items-center justify-between gap-3 p-3" index={4}>
        <Segmented
          id="lead-status"
          label="Filter by status"
          value={status}
          onChange={setStatus}
          options={[
            { value: "all" as const, label: "All", count: searched.length },
            ...LEAD_STATUSES.map((s) => ({
              value: s,
              label: STATUS_LABELS[s],
              count: searched.filter((l) => l.status === s).length,
            })),
          ]}
        />
        <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
          <label className="sr-only" htmlFor="lead-source">
            Source
          </label>
          <select
            id="lead-source"
            value={source}
            onChange={(e) => setSource(e.target.value as LeadSource | "all")}
            className="h-10 rounded-full border border-line bg-ink px-4 text-small text-sand outline-none focus:border-brass"
          >
            <option value="all">All sources</option>
            {(Object.keys(SOURCE_LABELS) as LeadSource[]).map((s) => (
              <option key={s} value={s}>
                {SOURCE_LABELS[s]}
              </option>
            ))}
          </select>
          <label className="relative">
            <span className="sr-only">Search leads</span>
            <Icon
              name="search"
              className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-dust"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or city"
              className="h-10 w-52 rounded-full border border-line bg-ink pl-9 pr-4 text-small outline-none placeholder:text-dust focus:border-brass"
            />
          </label>
          <Segmented
            id="lead-view"
            label="Layout"
            value={view}
            onChange={setView}
            options={[
              { value: "table" as const, label: "Table" },
              { value: "board" as const, label: "Board" },
            ]}
          />
        </div>
      </Card>

      {leads.length === 0 ? (
        <div className="mx-auto mt-10 max-w-lg rounded-2xl border border-dashed border-line p-12 text-center">
          <h2 className="font-serif text-4xl">No leads yet</h2>
          <p className="mt-3 text-sm leading-relaxed text-sand">
            Requests from the website form and the assistant land here on their own. You can also add one by
            hand.
          </p>
          <button type="button" onClick={newLead} className={`${btn.primary} mt-6`}>
            Add your first lead
          </button>
        </div>
      ) : view === "board" ? (
        <div className="mt-3">
          <Board
            leads={status === "all" ? searched : searched.filter((l) => l.status === status)}
            onOpen={openLead}
            onMove={(id, s) => void patchLead(id, { status: s })}
          />
        </div>
      ) : (
        <Card className="mt-3 overflow-hidden" index={5}>
          <p className="flex items-center justify-between px-5 py-3 text-xs text-dust">
            <span>
              <span className="font-semibold text-bone">{rows.length}</span> of {leads.length} leads
            </span>
            <span>
              Sorted by {sort.key === "created" ? "arrival" : sort.key},{" "}
              {sort.dir === 1 ? "ascending" : "descending"}
            </span>
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] text-left text-sm">
              <thead className="bg-ink/60">
                <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:font-mono [&>th]:text-micro [&>th]:font-normal [&>th]:text-dust">
                  {head("name", "Name")}
                  <th className="uppercase tracking-[0.18em]">Phone</th>
                  {head("city", "City")}
                  {head("service", "Job")}
                  {head("source", "Source")}
                  {head("status", "Status")}
                  <th className="uppercase tracking-[0.18em]">Visit</th>
                  {head("value", "Est. value", "text-right")}
                  {head("created", "Arrived", "text-right")}
                </tr>
              </thead>
              <tbody>
                {rows.map((l) => (
                  <tr
                    key={l.id}
                    onClick={() => openLead(l.id)}
                    className="cursor-pointer border-t border-line/70 transition-colors hover:bg-bone/[0.03] [&>td]:px-4 [&>td]:py-3"
                  >
                    <td>
                      <span className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brass/40 text-micro font-medium text-brass">
                          {initials(l.name)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-bone">{l.name}</span>
                          {l.language === "es" && (
                            <span className="block text-micro text-dust">Prefers Spanish</span>
                          )}
                        </span>
                      </span>
                    </td>
                    <td className="whitespace-nowrap text-sand">
                      {l.phone || <span className="text-dust">None</span>}
                    </td>
                    <td className="text-sand">{cityOf(l.address) ?? <span className="text-dust">–</span>}</td>
                    <td className="max-w-[220px]">
                      {l.service ? (
                        <span className="inline-block max-w-full truncate rounded-full border border-line px-2.5 py-1 text-micro text-sand">
                          {l.service}
                        </span>
                      ) : (
                        <span className="line-clamp-1 text-xs text-dust">{l.details || "Not specified"}</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap text-xs text-sand">
                      <span className="flex items-center gap-2">
                        <Icon
                          name={
                            l.source === "ai-assistant" ? "ask" : l.source === "manual" ? "edit" : "globe"
                          }
                          className="h-3.5 w-3.5 text-dust"
                        />
                        {SOURCE_LABELS[l.source]}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <select
                        value={l.status}
                        aria-label={`Status for ${l.name}`}
                        onChange={(e) => void patchLead(l.id, { status: e.target.value })}
                        className={`cursor-pointer appearance-none rounded-full px-3 py-1 text-micro font-medium outline-none ring-brass/50 focus-visible:ring-2 ${STATUS_TONE[l.status]}`}
                      >
                        {LEAD_STATUSES.map((s) => (
                          <option key={s} value={s} className="bg-coal text-bone">
                            {STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{l.appointment ? <VisitBadge lead={l} /> : <span className="text-dust">–</span>}</td>
                    <td className="text-right font-semibold tabular-nums">
                      {l.value != null ? money(l.value) : ""}
                    </td>
                    <td className="whitespace-nowrap text-right text-xs text-dust">{ago(l.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length === 0 && (
            <p className="py-14 text-center text-sm text-dust">Nothing matches those filters.</p>
          )}
        </Card>
      )}
    </>
  );
}

function Board({
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
        const total = valueOf(column);
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
                <span className="rounded-full bg-bone/10 px-2 py-0.5 text-micro text-sand">
                  {column.length}
                </span>
              </p>
              {total > 0 && <span className="text-micro tabular-nums text-dust">{money(total)}</span>}
            </div>
            <div className="flex flex-1 flex-col gap-2">
              {column.slice(0, 40).map((lead) => (
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
                      <span className="text-micro font-semibold tabular-nums text-bone">
                        {money(lead.value)}
                      </span>
                    )}
                  </div>
                  {lead.service && <p className="mt-1 text-xs text-sand">{lead.service}</p>}
                  {lead.details && (
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-dust">{lead.details}</p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <VisitBadge lead={lead} />
                    <span className="ml-auto text-micro text-dust">
                      {lead.source === "ai-assistant" ? "AI · " : ""}
                      {ago(lead.createdAt)}
                    </span>
                  </div>
                </motion.button>
              ))}
              {column.length > 40 && (
                <p className="px-2 py-1 text-center text-micro text-dust">
                  And {column.length - 40} more. Switch to the table to see them all.
                </p>
              )}
              {column.length === 0 && (
                <p className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-line/70 p-4 text-center text-xs text-dust">
                  Drop a lead here
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
