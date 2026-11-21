"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { site } from "@/lib/site";
import { SOURCE_LABELS, type Lead } from "@/lib/types";
import { BarList, Funnel, Legend, Plot, thin, VIZ } from "./charts";
import { useCrm } from "./context";
import {
  arrivedIn,
  cityOf,
  closedDay,
  dayOf,
  inDays,
  isOpen,
  leadsPerDay,
  longDay,
  num,
  pct,
  periodFor,
  shortDay,
  tally,
  todayAz,
  totalTraffic,
  trafficIn,
  valueOf,
  wonIn,
} from "./data";
import { ago, money, windowText } from "./format";
import { Card, ChartCard, Empty, Icon, PageHead, SampleTag, Tile, type IconName } from "./ui";
import { VisitStatus } from "./VisitStatus";

function greeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: "America/Phoenix",
    }).format(new Date()),
  );
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

interface FeedItem {
  at: string;
  icon: IconName;
  title: string;
  sub: string;
  lead: Lead;
}

function feed(leads: Lead[]): FeedItem[] {
  const items: FeedItem[] = [];
  for (const l of leads) {
    items.push({
      at: l.createdAt,
      icon: l.source === "ai-assistant" ? "ask" : l.source === "manual" ? "plus" : "inbox",
      title: `New request from ${l.name}`,
      sub: [cityOf(l.address), l.service, `via ${SOURCE_LABELS[l.source].toLowerCase()}`]
        .filter(Boolean)
        .join(" · "),
      lead: l,
    });
    for (const n of l.notes)
      items.push({ at: n.at, icon: "edit", title: `Note on ${l.name}`, sub: n.text, lead: l });
    if (l.closedAt && (l.status === "won" || l.status === "lost")) {
      items.push({
        at: l.closedAt,
        icon: l.status === "won" ? "trophy" : "x",
        title: `${l.name} marked ${l.status}`,
        sub: [l.service, l.value != null ? `est. ${money(l.value)}` : null].filter(Boolean).join(" · "),
        lead: l,
      });
    }
  }
  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 9);
}

export function Overview() {
  const { leads, traffic, range, openLead, patchLead } = useCrm();
  const [hover, setHover] = useState<number | null>(null);

  const m = useMemo(() => {
    const { days, prior } = periodFor(range);
    const today = todayAz();
    const tNow = trafficIn(traffic, days);
    const now = totalTraffic(tNow);
    const before = totalTraffic(trafficIn(traffic, prior));
    const arrived = arrivedIn(leads, days);
    const arrivedBefore = arrivedIn(leads, prior);
    // Requests that came in through the site, for comparing against site visitors.
    const online = arrived.filter((l) => l.source !== "manual");
    const onlineBefore = arrivedBefore.filter((l) => l.source !== "manual");
    const won = wonIn(leads, days);
    const wonBefore = wonIn(leads, prior);

    // Estimated value of jobs won in each of the last six months.
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(`${today.slice(0, 7)}-15T12:00:00Z`);
      d.setUTCMonth(d.getUTCMonth() - (5 - i));
      return d.toISOString().slice(0, 7);
    });
    const allWon = leads.filter((l) => l.status === "won");
    const revenue = months.map((mo) => valueOf(allWon.filter((l) => closedDay(l).startsWith(mo))));

    const reached = (statuses: Lead["status"][]) => online.filter((l) => statuses.includes(l.status)).length;

    return {
      days,
      visitors: tNow.map((d) => d.visitors),
      requests: leadsPerDay(leads, days),
      now,
      before,
      arrived,
      arrivedBefore,
      online,
      onlineBefore,
      won,
      wonBefore,
      months,
      revenue,
      funnel: [
        { label: "Visited the site", value: now.visitors },
        { label: "Opened the assistant or the form", value: now.events.chat_open + now.events.form_start },
        { label: "Sent a request", value: online.length },
        { label: "Got a quote", value: reached(["quoted", "scheduled", "won"]) },
        { label: "Became a job", value: reached(["won"]) },
      ],
      services: tally(arrived, (l) => l.service).map(([label, value]) => ({ label, value })),
      cities: tally(arrived, (l) => cityOf(l.address)).map(([label, value]) => ({ label, value })),
      todays: leads
        .filter((l) => l.appointment?.date === today && l.appointment.status !== "cancelled")
        .sort((a, b) => a.appointment!.window.localeCompare(b.appointment!.window)),
      waiting: leads.filter((l) => l.status === "new").length,
      toConfirm: leads.filter((l) => l.appointment?.status === "requested" && l.appointment.date >= today)
        .length,
      pipeline: valueOf(leads.filter(isOpen)),
      openCount: leads.filter(isOpen).length,
      feed: feed(leads),
      wonYear: valueOf(allWon.filter((l) => inDays([months[0] + "-01", today], closedDay(l)))),
      avgJob: allWon.length ? valueOf(allWon) / allWon.length : 0,
    };
  }, [leads, traffic, range]);

  const compare = `vs prior ${range} days`;
  const rate = m.now.visitors ? (m.online.length / m.now.visitors) * 100 : 0;
  const rateBefore = m.before.visitors ? (m.onlineBefore.length / m.before.visitors) * 100 : 0;
  const order = ["morning", "midday", "afternoon"] as const;
  const monthName = (mo: string) =>
    new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(
      new Date(`${mo}-15T12:00:00Z`),
    );

  return (
    <>
      <PageHead
        title={`${greeting()}, ${site.owner}.`}
        sub={`Here is what the last ${range} days looked like across the site, the phone and the calendar.`}
        action={m.now.sample ? <SampleTag /> : undefined}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Tile
          index={0}
          label="Visitors"
          icon="users"
          value={num(m.now.visitors)}
          current={m.now.visitors}
          previous={m.before.visitors}
          compareLabel={compare}
          series={m.visitors}
        />
        <Tile
          index={1}
          label="Requests"
          icon="inbox"
          value={num(m.arrived.length)}
          current={m.arrived.length}
          previous={m.arrivedBefore.length}
          compareLabel={compare}
          series={m.requests}
        />
        <Tile
          index={2}
          label="Visitor to request"
          icon="percent"
          value={m.now.visitors ? pct(rate) : "–"}
          current={m.now.visitors ? rate : undefined}
          previous={m.now.visitors ? rateBefore : undefined}
          compareLabel={compare}
          note={m.now.visitors ? undefined : "Needs site visits to work out"}
        />
        <Tile
          index={3}
          label="Jobs won"
          icon="dollar"
          value={money(valueOf(m.won))}
          current={valueOf(m.won)}
          previous={valueOf(m.wonBefore)}
          compareLabel={compare}
          note={`${m.won.length} ${m.won.length === 1 ? "job" : "jobs"}, estimated value`}
        />
      </div>

      {/* What needs doing next */}
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          {
            href: "/crm/leads",
            value: num(m.waiting),
            label:
              m.waiting === 1
                ? "new request waiting on a first reply"
                : "new requests waiting on a first reply",
            hot: m.waiting > 0,
          },
          {
            href: "/crm/schedule",
            value: num(m.toConfirm),
            label: m.toConfirm === 1 ? "visit to confirm" : "visits to confirm",
            hot: m.toConfirm > 0,
          },
          {
            href: "/crm/leads",
            value: money(m.pipeline),
            label: `in the open pipeline across ${m.openCount} ${m.openCount === 1 ? "lead" : "leads"}`,
            hot: false,
          },
        ].map((a) => (
          <Link
            key={a.label}
            href={a.href}
            className={`group flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 transition-colors ${
              a.hot
                ? "border-brass/40 bg-brass/[0.07] hover:border-brass"
                : "border-line bg-coal hover:border-bone/25"
            }`}
          >
            <span className="flex items-baseline gap-3">
              <span className="text-2xl font-semibold tracking-tight">{a.value}</span>
              <span className="text-sm text-sand">{a.label}</span>
            </span>
            <Icon
              name="arrow"
              className="h-4 w-4 shrink-0 text-dust transition-transform group-hover:translate-x-1 group-hover:text-brass"
            />
          </Link>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-3">
        <ChartCard
          index={4}
          className="xl:col-span-2"
          title="Visitors and requests"
          hint="Daily visitors, with the requests that came in underneath on the same timeline."
          table={{
            head: ["Day", "Visitors", "Requests"],
            rows: m.days.map((d, i) => [longDay(d), m.visitors[i], m.requests[i]]).reverse(),
          }}
        >
          <Legend
            items={[
              { label: "Visitors", color: VIZ.gold, line: true },
              { label: "Requests", color: VIZ.blue },
            ]}
          />
          <div className="mt-3">
            <Plot
              kind="line"
              name="Visitors"
              values={m.visitors}
              titles={m.days.map(longDay)}
              ticks={m.days.map(() => "")}
              color={VIZ.gold}
              height={190}
              hover={hover}
              onHover={setHover}
            />
            <Plot
              kind="columns"
              name="Requests"
              values={m.requests}
              titles={m.days.map(longDay)}
              ticks={thin(m.days.map(shortDay), 7)}
              color={VIZ.blue}
              height={120}
              hover={hover}
              onHover={setHover}
            />
          </div>
        </ChartCard>

        <ChartCard
          index={5}
          title="Where visitors come from"
          hint={`How people found the site, last ${range} days.`}
          table={{
            head: ["Source", "Visitors"],
            rows: m.now.sources.map(([s, v]) => [s, v]),
          }}
        >
          {m.now.sources.length ? (
            <>
              <p className="mb-5 flex items-baseline gap-2">
                <span className="text-3xl font-semibold tracking-tight">{num(m.now.visitors)}</span>
                <span className="text-xs text-dust">visitors</span>
              </p>
              <BarList
                items={m.now.sources.map(([label, value]) => ({
                  label,
                  value,
                  note: `${Math.round((value / Math.max(m.now.visitors, 1)) * 100)}%`,
                }))}
              />
            </>
          ) : (
            <Empty title="No visits recorded yet">
              Visits are counted from the moment this dashboard went live. They will show up here as people
              find the site.
            </Empty>
          )}
        </ChartCard>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <ChartCard
          index={6}
          title="From visitor to job"
          hint={`How far people who found the site got, last ${range} days.`}
          table={{ head: ["Stage", "People"], rows: m.funnel.map((s) => [s.label, s.value]) }}
        >
          <Funnel stages={m.funnel} />
          <p className="mt-5 flex items-center justify-between border-t border-line pt-4 text-small text-sand">
            Visitor to job
            <span className="rounded-full border border-line px-2.5 py-1 text-xs font-semibold tabular-nums text-bone">
              {m.now.visitors ? pct((m.funnel[4].value / m.now.visitors) * 100, 2) : "–"}
            </span>
          </p>
        </ChartCard>

        <ChartCard
          index={7}
          title="Most requested work"
          hint={`What people asked for, last ${range} days.`}
          table={{ head: ["Service", "Requests"], rows: m.services.map((s) => [s.label, s.value]) }}
        >
          {m.services.length ? (
            <BarList items={m.services} />
          ) : (
            <Empty title="Nothing in this range">Requests show up here as they come in.</Empty>
          )}
        </ChartCard>

        <ChartCard
          index={8}
          title="Requests by city"
          hint={`Where the work is, last ${range} days.`}
          table={{ head: ["City", "Requests"], rows: m.cities.map((s) => [s.label, s.value]) }}
        >
          {m.cities.length ? (
            <BarList items={m.cities} color={VIZ.blue} />
          ) : (
            <Empty title="Nothing in this range">Cities come from the address on each request.</Empty>
          )}
        </ChartCard>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-3">
        <ChartCard
          className="xl:col-span-2"
          title="Jobs won by month"
          hint="Estimated value of the jobs marked won in each of the last six months."
          table={{
            head: ["Month", "Estimated value"],
            rows: m.months.map((mo, i) => [monthName(mo), money(m.revenue[i])]),
          }}
        >
          <Plot
            kind="columns"
            name="Jobs won"
            values={m.revenue}
            titles={m.months.map((mo) =>
              new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(
                new Date(`${mo}-15T12:00:00Z`),
              ),
            )}
            ticks={m.months.map(monthName)}
            color={VIZ.gold}
            height={300}
            format={money}
          />
          <dl className="mt-5 grid grid-cols-3 gap-4 border-t border-line pt-5">
            {[
              ["Last six months", money(m.wonYear)],
              ["This month so far", money(m.revenue[5])],
              ["Average job", money(m.avgJob)],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="eyebrow">{k}</dt>
                <dd className="mt-1.5 text-xl font-semibold tracking-tight">{v}</dd>
              </div>
            ))}
          </dl>
        </ChartCard>

        <Card className="flex flex-col p-5 sm:p-6">
          <header className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-body font-medium">Activity</h2>
              <p className="mt-1 text-xs text-dust">The latest across requests, notes and jobs.</p>
            </div>
            <Link
              href="/crm/leads"
              className="flex shrink-0 items-center gap-1.5 text-xs text-brass hover:underline"
            >
              All leads <Icon name="arrow" className="h-3 w-3" />
            </Link>
          </header>
          {m.feed.length === 0 && (
            <Empty title="Quiet so far">New requests and notes will appear here.</Empty>
          )}
          <ol className="relative -mx-2 flex-1">
            {m.feed.map((f, i) => (
              <li key={`${f.lead.id}${f.at}${i}`}>
                <button
                  type="button"
                  onClick={() => openLead(f.lead.id)}
                  className="flex w-full items-start gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-bone/[0.04]"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-brass">
                    <Icon name={f.icon} className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-bone">{f.title}</span>
                    <span className="block truncate text-xs text-dust">{f.sub || "No details"}</span>
                  </span>
                  <span className="shrink-0 pt-0.5 text-micro text-dust">{ago(f.at)}</span>
                </button>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <Card className="mt-3 p-5 sm:p-6">
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-body font-medium">
              Today ·{" "}
              {new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "America/Phoenix" }).format(
                new Date(),
              )}
            </h2>
            <p className="mt-1 text-xs text-dust">
              {m.todays.length
                ? `${m.todays.filter((l) => l.appointment!.status === "completed").length} of ${m.todays.length} visits done`
                : "No visits on the calendar today."}
            </p>
          </div>
          <Link
            href="/crm/schedule"
            className="flex shrink-0 items-center gap-1.5 text-xs text-brass hover:underline"
          >
            Full week <Icon name="arrow" className="h-3 w-3" />
          </Link>
        </header>
        <ul className="grid gap-2 md:grid-cols-3">
          {order.map((w) => {
            const lead = m.todays.find((l) => l.appointment!.window === w);
            return (
              <li key={w} className="rounded-xl border border-line bg-ink/50 p-4">
                <p className="eyebrow">{windowText(w)}</p>
                {lead ? (
                  <div className="mt-3">
                    <button type="button" onClick={() => openLead(lead.id)} className="text-left">
                      <span className="block text-sm font-medium text-bone hover:text-brass">
                        {lead.name}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-xs text-dust">
                        <Icon name="pin" className="h-3 w-3" />
                        {[cityOf(lead.address), lead.service].filter(Boolean).join(" · ") || "No details"}
                      </span>
                    </button>
                    <div className="mt-3">
                      <VisitStatus
                        lead={lead}
                        onChange={(status) =>
                          void patchLead(lead.id, { appointment: { ...lead.appointment!, status } })
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-dust">Open</p>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      <p className="mt-8 text-center text-micro text-dust">
        Visits are anonymous daily totals. Dollar figures are the estimates entered on each lead. Arrived
        dates use Arizona time ({dayOf(new Date().toISOString())}).
      </p>
    </>
  );
}
