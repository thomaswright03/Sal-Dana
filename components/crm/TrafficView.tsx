"use client";

import { useMemo } from "react";
import { TRAFFIC_EVENT_LABELS, TRAFFIC_EVENTS } from "@/lib/types";
import { BarList, Plot, SplitBar, thin, VIZ } from "./charts";
import { useCrm } from "./context";
import {
  arrivedIn,
  hourLabel,
  longDay,
  num,
  pct,
  periodFor,
  shortDay,
  totalTraffic,
  trafficIn,
} from "./data";
import { Card, ChartCard, Empty, Icon, PageHead, SampleTag, Tile } from "./ui";

export function TrafficView() {
  const { traffic, leads, range } = useCrm();

  const m = useMemo(() => {
    const { days, prior } = periodFor(range);
    const rows = trafficIn(traffic, days);
    const now = totalTraffic(rows);
    const before = totalTraffic(trafficIn(traffic, prior));
    const actions = (t: typeof now) => t.events.call + t.events.text + t.events.email + t.events.form_submit;
    const online = arrivedIn(leads, days).filter((l) => l.source !== "manual").length;
    const busiest = now.hours.reduce((best, n, h) => (n > now.hours[best] ? h : best), 0);
    const bestDay = rows.reduce((best, d) => (d.visitors > best.visitors ? d : best), rows[0]);
    return {
      days,
      rows,
      now,
      before,
      actions: actions(now),
      actionsBefore: actions(before),
      online,
      busiest,
      bestDay,
      ever: traffic.some((d) => d.visitors > 0),
    };
  }, [traffic, leads, range]);

  const compare = `vs prior ${range} days`;
  const perVisit = m.now.visitors ? m.now.pageviews / m.now.visitors : 0;
  const perVisitBefore = m.before.visitors ? m.before.pageviews / m.before.visitors : 0;
  const has = m.now.visitors > 0;
  const none = (
    <Empty title="No visits in this range">
      {m.ever ? "Try a longer date range." : "Counting starts with the site's next visitor."}
    </Empty>
  );

  return (
    <>
      <PageHead
        title="Who is"
        accent="stopping by."
        sub="Visits to the website, counted by the site itself. The totals are anonymous: no cookies, no tracking across other sites, and nothing that identifies a person."
        action={m.now.sample ? <SampleTag>Sample visits</SampleTag> : undefined}
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
          series={m.rows.map((d) => d.visitors)}
        />
        <Tile
          index={1}
          label="Pages viewed"
          icon="eye"
          value={num(m.now.pageviews)}
          current={m.now.pageviews}
          previous={m.before.pageviews}
          compareLabel={compare}
          series={m.rows.map((d) => d.pageviews)}
        />
        <Tile
          index={2}
          label="Pages per visit"
          icon="chart"
          value={has ? perVisit.toFixed(1) : "–"}
          current={has ? perVisit : undefined}
          previous={has ? perVisitBefore : undefined}
          compareLabel={compare}
          note={has ? undefined : "No visits in this range"}
        />
        <Tile
          index={3}
          label="Reached out"
          icon="phone"
          value={num(m.actions)}
          current={m.actions}
          previous={m.actionsBefore}
          compareLabel={compare}
          note="Calls, texts, emails and sent forms"
        />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-3">
        <ChartCard
          index={4}
          className="xl:col-span-2"
          title="Visitors by day"
          hint={
            has
              ? `Busiest day: ${longDay(m.bestDay.date)}, with ${num(m.bestDay.visitors)} visitors.`
              : "One point per day."
          }
          table={{
            head: ["Day", "Visitors", "Pages viewed"],
            rows: m.rows.map((d) => [longDay(d.date), d.visitors, d.pageviews]).reverse(),
          }}
        >
          {has ? (
            <Plot
              kind="line"
              name="Visitors"
              values={m.rows.map((d) => d.visitors)}
              titles={m.days.map(longDay)}
              ticks={thin(m.days.map(shortDay), range === 7 ? 7 : 6)}
              height={260}
            />
          ) : (
            none
          )}
        </ChartCard>

        <ChartCard
          index={5}
          title="Where visitors come from"
          hint="The site or app that sent each visit."
          table={{
            head: ["Source", "Visitors", "Share"],
            rows: m.now.sources.map(([s, n]) => [s, n, pct((n / Math.max(m.now.visitors, 1)) * 100, 0)]),
          }}
        >
          {m.now.sources.length ? (
            <BarList
              items={m.now.sources.map(([label, value]) => ({
                label,
                value,
                note: pct((value / Math.max(m.now.visitors, 1)) * 100, 0),
              }))}
            />
          ) : (
            none
          )}
        </ChartCard>

        <ChartCard
          index={6}
          className="xl:col-span-2"
          title="Time of day"
          hint={
            has
              ? `Most visits arrive around ${hourLabel(m.busiest)}, Arizona time. A good hour to keep the phone close.`
              : "Visits by hour, Arizona time."
          }
          table={{ head: ["Hour", "Visits"], rows: m.now.hours.map((n, h) => [hourLabel(h), n]) }}
        >
          {has ? (
            <Plot
              kind="columns"
              name="Visits"
              values={m.now.hours}
              titles={m.now.hours.map((_, h) => `${hourLabel(h)} to ${hourLabel((h + 1) % 24)}`)}
              ticks={m.now.hours.map((_, h) => (h % 3 === 0 ? hourLabel(h) : ""))}
              accent={m.busiest}
              height={220}
            />
          ) : (
            none
          )}
        </ChartCard>

        <ChartCard
          index={7}
          title="What visitors did"
          hint={`${num(m.online)} request${m.online === 1 ? "" : "s"} came in through the site in this range.`}
          table={{
            head: ["Action", "Times"],
            rows: TRAFFIC_EVENTS.map((e) => [TRAFFIC_EVENT_LABELS[e], m.now.events[e]]),
          }}
        >
          {TRAFFIC_EVENTS.some((e) => m.now.events[e] > 0) ? (
            <BarList
              items={TRAFFIC_EVENTS.map((e) => ({
                label: TRAFFIC_EVENT_LABELS[e],
                value: m.now.events[e],
              })).sort((a, b) => b.value - a.value)}
            />
          ) : (
            <Empty title="No taps recorded in this range">
              Calls, texts, emails, assistant chats and form starts are counted here as they happen.
            </Empty>
          )}
        </ChartCard>

        <ChartCard
          index={8}
          title="Devices"
          hint="What people were holding when they visited."
          table={{
            head: ["Device", "Visitors"],
            rows: [
              ["Phone", m.now.devices.mobile],
              ["Computer", m.now.devices.desktop],
              ["Tablet", m.now.devices.tablet],
            ],
          }}
        >
          {has ? (
            <SplitBar
              parts={[
                { label: "Phone", value: m.now.devices.mobile, color: VIZ.gold },
                { label: "Computer", value: m.now.devices.desktop, color: VIZ.blue },
                { label: "Tablet", value: m.now.devices.tablet, color: VIZ.aqua },
              ]}
            />
          ) : (
            none
          )}
        </ChartCard>

        <ChartCard
          index={9}
          title="Language"
          hint="Which version of the site visitors read."
          table={{
            head: ["Language", "Visitors"],
            rows: [
              ["English", m.now.langs.en],
              ["Spanish", m.now.langs.es],
            ],
          }}
        >
          {has ? (
            <SplitBar
              parts={[
                { label: "English", value: m.now.langs.en, color: VIZ.gold },
                { label: "Spanish", value: m.now.langs.es, color: VIZ.blue },
              ]}
            />
          ) : (
            none
          )}
        </ChartCard>

        <Card className="p-5 sm:p-6" index={10}>
          <div>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-brass">
              <Icon name="eye" />
            </span>
            <h2 className="mt-4 text-body font-medium text-bone">How this is counted</h2>
            <p className="mt-2 text-xs leading-relaxed text-dust">
              Each browser session counts as one visitor, the first time it opens the site. Search engine
              crawlers and other bots are left out. Only daily totals are kept, so there is nothing to consent
              to and no cookie banner to show.
            </p>
          </div>
        </Card>
      </div>
    </>
  );
}
