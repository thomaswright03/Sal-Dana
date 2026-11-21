"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { site } from "@/lib/site";
import { useCrm } from "./context";
import { num } from "./data";
import { btn, Card, Icon, PageHead, type IconName } from "./ui";

function Pill({ on, children }: { on: boolean | null; children: ReactNode }) {
  const tone =
    on === null
      ? "border-line text-dust"
      : on
        ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
        : "border-brass/40 bg-brass/10 text-brass";
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.6875rem] ${tone}`}
    >
      {on !== null && <Icon name={on ? "check" : "clock"} className="h-3 w-3" />}
      {children}
    </span>
  );
}

function Row({
  icon,
  title,
  children,
  aside,
}: {
  icon: IconName;
  title: string;
  children: ReactNode;
  aside: ReactNode;
}) {
  return (
    <li className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 py-5 first:pt-0 last:pb-0">
      <div className="flex min-w-0 flex-1 basis-64 gap-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line text-brass">
          <Icon name={icon} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-bone">{title}</p>
          <div className="mt-1 text-xs leading-relaxed text-dust">{children}</div>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">{aside}</div>
    </li>
  );
}

const Code = ({ children }: { children: ReactNode }) => (
  <code className="rounded bg-bone/[0.07] px-1.5 py-0.5 font-mono text-[0.6875rem] text-sand">
    {children}
  </code>
);

export function SettingsView() {
  const { notify, status, leads, reviews, traffic, sampleCount, sampleBusy, samples, exportCsv, signOut } = useCrm();
  const [aiOverride, setAiOverride] = useState<boolean | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const aiOn = aiOverride ?? status?.aiEnabled ?? true;
  async function toggleAi() {
    setAiBusy(true);
    const res = await fetch("/api/crm/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aiEnabled: !aiOn }),
    }).catch(() => null);
    if (res?.ok) {
      setAiOverride(!aiOn);
      notify(!aiOn ? "Assistant is on." : "Assistant is off.");
    } else {
      notify("Couldn't change the assistant setting.");
    }
    setAiBusy(false);
  }
  const sampleLeads = leads.filter((l) => l.demo).length;
  const sampleReviews = reviews.filter((r) => r.demo).length;
  const sampleDays = traffic.filter((d) => d.demo).length;
  const counted = traffic.some((d) => d.visitors > 0 && !d.demo);

  const details: [string, string][] = [
    ["Business", site.legalName],
    ["Owner", site.owner],
    ["Phone", site.phoneDisplay],
    ["Email", site.email],
    ["Service area", `${site.region}: ${site.cities.join(", ")}`],
    ["Hours", site.hoursDisplay],
  ];

  return (
    <>
      <PageHead
        title="Settings"
        accent="and connections."
        sub="What the site knows about the business, what is switched on, and the housekeeping for this dashboard."
      />

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <Card className="p-5 sm:p-6" index={0}>
          <h2 className="text-[0.9375rem] font-medium text-bone">Business details</h2>
          <p className="mt-1 text-xs leading-relaxed text-dust">
            These appear across the website and are what the booking assistant tells customers. To change any
            of them, send the new details to whoever looks after the site.
          </p>
          <dl className="mt-5 divide-y divide-line/70">
            {details.map(([k, v]) => (
              <div key={k} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3">
                <dt className="eyebrow">{k}</dt>
                <dd className="max-w-[26rem] text-right text-sm text-bone">{v}</dd>
              </div>
            ))}
          </dl>
          <Link href="/" className={`${btn.ghost} mt-5`}>
            <Icon name="external" className="h-3.5 w-3.5" /> View the website
          </Link>
        </Card>

        <Card className="p-5 sm:p-6" index={1}>
          <h2 className="text-[0.9375rem] font-medium text-bone">Connections</h2>
          <p className="mt-1 text-xs leading-relaxed text-dust">The services this dashboard relies on.</p>
          <ul className="mt-5 divide-y divide-line/70">
            <Row
              icon="inbox"
              title="Lead storage"
              aside={
                <Pill on={status ? status.storage : null}>
                  {!status ? "Checking" : status.storage ? "Connected" : "Not connected"}
                </Pill>
              }
            >
              Leads, reviews and visit counts are kept in a private store that only this dashboard can read.
            </Row>
            <Row
              icon="ask"
              title="Assistant on/off"
              aside={
                <button
                  type="button"
                  disabled={!status || !status.ai || aiBusy}
                  onClick={() => void toggleAi()}
                  className={btn.ghost}
                >
                  {aiBusy ? "Saving…" : aiOn ? "Turn off" : "Turn on"}
                </button>
              }
            >
              {aiOn
                ? "The website chat and Ask AI are allowed to answer. Turning this off stops both on the next request, with no redeploy; the chat then tells visitors to call or text."
                : "The assistant is switched off. The website chat tells visitors to call or text, and Ask AI is off. Turn it on to resume."}
            </Row>
            <Row
              icon="ask"
              title="AI assistants"
              aside={
                <Pill on={status ? status.ai : null}>
                  {!status ? "Checking" : status.ai ? "Connected" : "Not connected yet"}
                </Pill>
              }
            >
              {status?.ai ? (
                <>
                  The booking assistant on the website and Ask AI in this dashboard are both on, running on{" "}
                  <Code>{status.model}</Code>.
                </>
              ) : (
                <>
                  The booking assistant on the website and Ask AI here both switch on when an Anthropic API
                  key is added in Vercel as <Code>ANTHROPIC_API_KEY</Code>, followed by a redeploy.
                </>
              )}
            </Row>
            <Row
              icon="traffic"
              title="Visitor counting"
              aside={<Pill on>{counted ? "Counting" : "On"}</Pill>}
            >
              The site counts its own visits as anonymous daily totals. No cookies and no outside trackers.
            </Row>
            <Row
              icon="eye"
              title="Preview mode"
              aside={
                <Pill on={status ? !status.previewMode : null}>
                  {!status ? "Checking" : status.previewMode ? "On" : "Off"}
                </Pill>
              }
            >
              {status?.previewMode
                ? "The site is hidden from search engines while it is being reviewed. Switch this off at launch."
                : "The site is open to search engines."}
            </Row>
          </ul>
        </Card>

        <Card className="p-5 sm:p-6" index={2}>
          <h2 className="text-[0.9375rem] font-medium text-bone">Your data</h2>
          <ul className="mt-5 divide-y divide-line/70">
            <Row
              icon="download"
              title="Export leads"
              aside={
                <button type="button" onClick={exportCsv} className={btn.ghost}>
                  Download CSV
                </button>
              }
            >
              {num(leads.length)} lead{leads.length === 1 ? "" : "s"} as a spreadsheet file, for your records
              or your accountant.
            </Row>
            <Row
              icon="board"
              title="Sample data"
              aside={
                sampleCount > 0 ? (
                  <button
                    type="button"
                    disabled={sampleBusy}
                    onClick={() => void samples("clear")}
                    className={btn.ghost}
                  >
                    {sampleBusy ? "Removing…" : "Remove sample data"}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={sampleBusy}
                    onClick={() => void samples("load")}
                    className={btn.ghost}
                  >
                    {sampleBusy ? "Loading…" : "Load sample data"}
                  </button>
                )
              }
            >
              {sampleCount > 0
                ? `Loaded: ${sampleLeads} sample leads, ${sampleReviews} sample reviews and ${sampleDays} days of sample visits. Removing them never touches real records.`
                : "Fills the dashboard with made-up leads, reviews and visits so you can see how it looks when busy. Real records are never touched."}
            </Row>
          </ul>
        </Card>

        <Card className="p-5 sm:p-6" index={4}>
          <h2 className="text-[0.9375rem] font-medium text-bone">Latest update</h2>
          <p className="mt-1 text-xs leading-relaxed text-dust">2026-11-21. Reliability round.</p>
          <h3 className="mt-4 text-xs font-medium text-bone">Frontend changes (website)</h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-xs leading-relaxed text-dust">
            <li>Branded “page not found” and error pages in English and Spanish, with Home, Call and Text (and Try again on errors). Same for the dashboard.</li>
            <li>Home-screen icon for phones.</li>
            <li>If someone books a time that was just taken, they are told it’s unavailable and Alan still gets their request.</li>
          </ul>
          <h3 className="mt-4 text-xs font-medium text-bone">Other changes (dashboard and behind the scenes)</h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-xs leading-relaxed text-dust">
            <li>Alan gets an email for every new lead, with name, phone, service, requested time and a link to the lead.</li>
            <li>Assistant on/off switch in Settings; it stops the chat and Ask AI right away.</li>
            <li>Two people can no longer book the same time slot; two tabs editing one lead now warn instead of overwriting.</li>
            <li>Daily backup of leads and reviews, with a restore; failed background jobs email an alert.</li>
            <li>Private status page at /admin for the site’s health. Deleting a review now confirms inline.</li>
            <li>Assistant uses a cheaper model, shorter replies and prompt caching.</li>
          </ul>
        </Card>

        <Card className="p-5 sm:p-6" index={3}>
          <h2 className="text-[0.9375rem] font-medium text-bone">Access</h2>
          <ul className="mt-5 divide-y divide-line/70">
            <Row icon="settings" title="Dashboard password" aside={null}>
              One password opens this dashboard. To change it, update <Code>CRM_PASSWORD</Code> in the Vercel
              project’s environment variables and redeploy. Everyone signed in is signed out when it changes.
            </Row>
            <Row
              icon="logout"
              title="Sign out"
              aside={
                <button type="button" onClick={() => void signOut()} className={btn.ghost}>
                  Sign out
                </button>
              }
            >
              Sign out on this device. Do this on any shared computer.
            </Row>
          </ul>
        </Card>
      </div>
    </>
  );
}
