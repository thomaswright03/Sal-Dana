"use client";

import { useMemo, useState } from "react";
import { site, windows } from "@/lib/site";
import type { AppointmentStatus, Lead } from "@/lib/types";
import { useCrm } from "./context";
import { addDays, cityOf, num, shortDay, todayAz } from "./data";
import { dayLabel, windowText } from "./format";
import { btn, Card, Icon, PageHead, Tile } from "./ui";
import { VisitPill, VisitStatus } from "./VisitStatus";

const CARD_TONE = {
  requested: "border-brass/50 bg-brass/10",
  confirmed: "border-sky-400/30 bg-sky-400/[0.07]",
  completed: "border-emerald-400/25 bg-emerald-400/[0.06]",
  cancelled: "border-line bg-transparent opacity-50",
} as const;

function mondayOf(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  return addDays(date, -((d.getUTCDay() + 6) % 7));
}

export function ScheduleView() {
  const { leads, openLead, patchLead, newLead } = useCrm();
  const today = todayAz();
  const [offset, setOffset] = useState(0);
  const [picked, setPicked] = useState<string>(today);

  const week = useMemo(() => {
    const monday = addDays(mondayOf(today), offset * 7);
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i)).filter((d) =>
      (site.workingDays as readonly number[]).includes(new Date(`${d}T12:00:00Z`).getUTCDay()),
    );
  }, [today, offset]);

  const byDay = useMemo(() => {
    const map = new Map<string, Lead[]>();
    for (const l of leads) {
      if (!l.appointment) continue;
      map.set(l.appointment.date, [...(map.get(l.appointment.date) ?? []), l]);
    }
    return map;
  }, [leads]);

  const order = { morning: 0, midday: 1, afternoon: 2 } as const;
  const inWeek = week.flatMap((d) => byDay.get(d) ?? []).filter((l) => l.appointment!.status !== "cancelled");
  const day = (byDay.get(picked) ?? [])
    .filter((l) => l.appointment!.status !== "cancelled")
    .sort((a, b) => order[a.appointment!.window] - order[b.appointment!.window]);
  const waiting = leads
    .filter((l) => l.appointment?.status === "requested" && l.appointment.date >= today)
    .sort((a, b) => a.appointment!.date.localeCompare(b.appointment!.date));
  const upcoming = leads.filter(
    (l) =>
      l.appointment &&
      l.appointment.date >= today &&
      ["requested", "confirmed"].includes(l.appointment.status),
  );

  const setStatus = (lead: Lead, status: AppointmentStatus) => {
    const body: Record<string, unknown> = { appointment: { ...lead.appointment!, status } };
    // Confirming a visit also moves a fresh lead along the pipeline.
    if (status === "confirmed" && ["new", "contacted", "quoted"].includes(lead.status))
      body.status = "scheduled";
    void patchLead(lead.id, body);
  };

  const weekday = (d: string) =>
    new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" }).format(
      new Date(`${d}T12:00:00Z`),
    );

  return (
    <>
      <PageHead
        title="This week,"
        accent="on time."
        sub={`Every visit on the calendar. ${site.owner} works ${site.hoursDisplay}, in three windows a day.`}
        action={
          <button type="button" onClick={newLead} className={btn.primary}>
            <Icon name="plus" className="h-3.5 w-3.5" /> Add a visit
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Tile
          index={0}
          label="Visits this week"
          icon="schedule"
          value={num(inWeek.length)}
          note={`${shortDay(week[0])} to ${shortDay(week[week.length - 1])}`}
        />
        <Tile
          index={1}
          label="To confirm"
          icon="clock"
          value={num(waiting.length)}
          note="Requested, waiting on your call or text"
        />
        <Tile
          index={2}
          label="Coming up"
          icon="arrow"
          value={num(upcoming.length)}
          note="From today onward"
        />
        <Tile
          index={3}
          label="Open windows this week"
          icon="check"
          value={num(
            week.filter((d) => d >= today).length * windows.length -
              inWeek.filter((l) => l.appointment!.date >= today).length,
          )}
          note="Still bookable from today"
        />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="p-5 sm:p-6" index={4}>
          <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-body font-medium">
                Week of {shortDay(week[0])} to {shortDay(week[week.length - 1])}
              </h2>
              <p className="mt-1 text-xs text-dust">
                {inWeek.length} {inWeek.length === 1 ? "visit" : "visits"} ·{" "}
                {inWeek.filter((l) => l.appointment!.status === "completed").length} done
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setOffset((o) => o - 1)}
                className={`${btn.ghost} !px-3`}
                aria-label="Previous week"
              >
                <Icon name="arrow" className="h-3.5 w-3.5 rotate-180" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setOffset(0);
                  setPicked(today);
                }}
                className={btn.ghost}
              >
                This week
              </button>
              <button
                type="button"
                onClick={() => setOffset((o) => o + 1)}
                className={`${btn.ghost} !px-3`}
                aria-label="Next week"
              >
                <Icon name="arrow" className="h-3.5 w-3.5" />
              </button>
            </div>
          </header>

          <div className="overflow-x-auto">
            <div
              className="grid min-w-[760px] gap-2"
              style={{ gridTemplateColumns: `5.5rem repeat(${week.length}, minmax(0, 1fr))` }}
            >
              <span />
              {week.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setPicked(d)}
                  aria-pressed={picked === d}
                  className={`rounded-xl border px-2 py-2 text-center transition-colors ${
                    d === today
                      ? "border-brass bg-brass text-ink"
                      : picked === d
                        ? "border-brass/60 text-bone"
                        : "border-line text-sand hover:border-bone/25"
                  }`}
                >
                  <span className="block font-mono text-micro uppercase tracking-[0.18em] opacity-80">
                    {weekday(d)}
                  </span>
                  <span className="block text-lg font-semibold leading-tight">{Number(d.slice(8))}</span>
                </button>
              ))}

              {windows.map((w) => (
                <div key={w.id} className="contents">
                  <div className="flex flex-col justify-center pr-2 text-right">
                    <span className="text-xs text-sand">{w.label}</span>
                    <span className="text-micro text-dust">{w.range}</span>
                  </div>
                  {week.map((d) => {
                    const visits = (byDay.get(d) ?? []).filter((l) => l.appointment!.window === w.id);
                    const live = visits.filter((l) => l.appointment!.status !== "cancelled");
                    const shown = live.length ? live : visits.slice(0, 1);
                    return (
                      <div
                        key={d + w.id}
                        className={`min-h-[104px] rounded-xl border p-1.5 ${picked === d ? "border-line bg-bone/[0.03]" : "border-line/60"}`}
                      >
                        {shown.length === 0 && (
                          <span className="flex h-full items-center justify-center text-micro text-dust/60">
                            {d < today ? "" : "Open"}
                          </span>
                        )}
                        {shown.map((l) => (
                          <button
                            key={l.id}
                            type="button"
                            onClick={() => {
                              setPicked(d);
                              openLead(l.id);
                            }}
                            className={`mb-1 block w-full rounded-lg border p-2 text-left transition-colors last:mb-0 hover:border-brass ${CARD_TONE[l.appointment!.status]}`}
                          >
                            <span className="block truncate text-xs font-medium text-bone">{l.name}</span>
                            <span className="block truncate text-micro text-sand">
                              {l.service || "Visit"}
                            </span>
                            <span className="mt-1 flex items-center gap-1 truncate text-micro text-dust">
                              <Icon name="pin" className="h-2.5 w-2.5 shrink-0" />
                              {cityOf(l.address) ?? "No address"}
                            </span>
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <ul className="mt-5 flex flex-wrap gap-2">
            {(["requested", "confirmed", "completed"] as const).map((s) => (
              <li key={s}>
                <VisitPill status={s} />
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-3">
          <Card className="p-5 sm:p-6" index={5}>
            <h2 className="text-body font-medium">{dayLabel(picked, true)}</h2>
            <p className="mt-1 text-xs text-dust">
              {day.length
                ? `${day.filter((l) => l.appointment!.status === "completed").length} of ${day.length} visits done`
                : "Nothing booked."}
            </p>
            <ul className="mt-4 space-y-2">
              {day.map((l) => (
                <li key={l.id} className="rounded-xl border border-line bg-ink/50 p-3.5">
                  <button type="button" onClick={() => openLead(l.id)} className="block w-full text-left">
                    <span className="eyebrow">{windowText(l.appointment!.window)}</span>
                    <span className="mt-1.5 block text-sm font-medium text-bone hover:text-brass">
                      {l.name}
                    </span>
                    <span className="block truncate text-xs text-dust">
                      {[cityOf(l.address), l.service].filter(Boolean).join(" · ") || "No details"}
                    </span>
                  </button>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <VisitStatus lead={l} onChange={(s) => setStatus(l, s)} />
                    {l.phone && (
                      <a
                        href={`tel:${l.phone.replace(/[^\d+]/g, "")}`}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-sand hover:border-brass/60 hover:text-brass"
                        aria-label={`Call ${l.name}`}
                      >
                        <Icon name="phone" className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5 sm:p-6" index={6}>
            <h2 className="text-body font-medium">Waiting on you</h2>
            <p className="mt-1 text-xs text-dust">Requested visits that haven’t been confirmed yet.</p>
            {waiting.length === 0 && <p className="mt-4 text-sm text-dust">All caught up.</p>}
            <ul className="mt-4 space-y-2">
              {waiting.slice(0, 8).map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3">
                  <button type="button" onClick={() => openLead(l.id)} className="min-w-0 text-left">
                    <span className="block truncate text-sm text-bone hover:text-brass">{l.name}</span>
                    <span className="block text-xs text-dust">
                      {dayLabel(l.appointment!.date)} ·{" "}
                      {windows.find((w) => w.id === l.appointment!.window)?.label}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus(l, "confirmed")}
                    className="shrink-0 rounded-full border border-brass/50 px-3 py-1 text-micro text-brass transition-colors hover:bg-brass hover:text-ink"
                  >
                    Confirm
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
