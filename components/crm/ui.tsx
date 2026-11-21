"use client";

import { motion } from "motion/react";
import { useState, type ReactNode } from "react";
import { change, compact } from "./data";
import { Sparkline } from "./charts";

export const EASE = [0.16, 1, 0.3, 1] as const;

const ICONS = {
  overview: "M3 3h6v8H3zM11 3h6v5h-6zM11 10h6v7h-6zM3 13h6v4H3z",
  leads:
    "M7 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM1.5 17a5.5 5.5 0 0 1 11 0M13.5 3.4a3 3 0 0 1 0 5.2M15 12a5.5 5.5 0 0 1 3.5 5",
  schedule: "M3 5h14v12H3zM3 9h14M7 2.5v4M13 2.5v4",
  reviews: "M10 2.5l2.3 4.8 5.2.7-3.8 3.7.9 5.3-4.6-2.5-4.6 2.5.9-5.300L2.500 8l5.200-.7z",
  traffic: "M2.500 17.500h15M4 14l4-5 3 3 5-7",
  ask: "M10 2.500l1.600 4.400 4.400 1.600-4.400 1.600L10 14.500l-1.600-4.400L4 8.500l4.400-1.600zM15.500 13.500l.7 1.800 1.800.7-1.800.7-.7 1.800-.7-1.800-1.800-.7 1.800-.7z",
  settings:
    "M10 12.500a2.500 2.500 0 1 0 0-5 2.500 2.500 0 0 0 0 5zM16 10l1.500-1-1.500-2.600-1.800.5-1.200-.7L12.500 4.500h-3L9 6.200l-1.200.7L6 6.400 4.500 9 6 10l-1.500 1L6 13.600l1.800-.5 1.200.7.500 1.700h3l.500-1.700 1.200-.7 1.800.5L17.500 11z",
  search: "M9 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM13.500 13.500 17.500 17.500",
  bell: "M5 8a5 5 0 0 1 10 0c0 5 2 6 2 6H3s2-1 2-6M8.500 17a1.500 1.500 0 0 0 3 0",
  plus: "M10 4v12M4 10h12",
  table: "M3 4h14v12H3zM3 8h14M3 12h14M8 4v12",
  chart: "M3 17h14M5.500 14V9M10 14V5M14.500 14v-4",
  download: "M10 3v9M6 8.500l4 4 4-4M3.500 16.500h13",
  phone:
    "M5 2.500h3l1.500 4-2 1.500a9 9 0 0 0 4.500 4.500l1.500-2 4 1.500v3a1.500 1.500 0 0 1-1.500 1.500A13 13 0 0 1 3.500 4 1.500 1.500 0 0 1 5 2.500z",
  users: "M7 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM1.500 17a5.500 5.500 0 0 1 11 0",
  inbox: "M3 11l2-7h10l2 7v5H3zM3 11h4l1 2h4l1-2h4",
  percent:
    "M5 15L15 5M6.500 8a1.500 1.500 0 1 0 0-3 1.500 1.500 0 0 0 0 3zM13.500 15a1.500 1.500 0 1 0 0-3 1.500 1.500 0 0 0 0 3z",
  dollar:
    "M10 2.500v15M13.500 6c-.5-1.200-1.800-2-3.500-2-2 0-3.500 1-3.500 2.800C6.500 11 13.500 9 13.500 13c0 1.800-1.500 3-3.500 3-1.800 0-3.200-.9-3.700-2.200",
  eye: "M1.500 10s3-6 8.500-6 8.500 6 8.500 6-3 6-8.500 6-8.500-6-8.500-6zM10 12.500a2.500 2.500 0 1 0 0-5 2.500 2.500 0 0 0 0 5z",
  mobile: "M6 2.500h8v15H6zM9 15h2",
  globe:
    "M10 17.500a7.500 7.500 0 1 0 0-15 7.500 7.500 0 0 0 0 15zM2.500 10h15M10 2.500c2.500 2.500 2.500 12.500 0 15M10 2.500c-2.500 2.500-2.500 12.500 0 15",
  check: "M4 10.500l4 4 8-9",
  clock: "M10 17.500a7.500 7.500 0 1 0 0-15 7.500 7.500 0 0 0 0 15zM10 6v4.500l3 1.500",
  x: "M5 5l10 10M15 5L5 15",
  arrow: "M4 10h12M11 5l5 5-5 5",
  external: "M8 4H4v12h12v-4M11 3.500h5.500V9M16.500 3.500 9 11",
  menu: "M3 6h14M3 10h14M3 14h14",
  pin: "M10 18s6-5.500 6-10a6 6 0 0 0-12 0c0 4.500 6 10 6 10zM10 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  trophy: "M6 3h8v5a4 4 0 0 1-8 0zM6 5H3v1a3 3 0 0 0 3 3M14 5h3v1a3 3 0 0 1-3 3M10 12v3M7 17h6",
  edit: "M3.500 16.500l1-4L14 3l3 3-9.500 9.500zM12 5l3 3",
  trash: "M4 6h12M8 6V3.500h4V6M5.500 6l.7 10.500h7.600L14.500 6",
  message: "M3 4h14v10H9l-4 3v-3H3z",
  logout: "M8 3.500H4v13h4M12.500 6.500 16 10l-3.500 3.500M16 10H8",
  board: "M3 3.500h4v13H3zM8 3.500h4v8H8zM13 3.500h4v11h-4z",
  collapse: "M3 3.500h14v13H3zM8 3.500v13M13.500 8 11.500 10l2 2",
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, className = "h-4 w-4" }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

export function Card({
  children,
  className = "",
  index = 0,
}: {
  children: ReactNode;
  className?: string;
  /** Position in the grid, used to stagger the entrance. */
  index?: number;
}) {
  return (
    <motion.section
      className={`rounded-2xl border border-line bg-coal ${className}`}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: EASE, delay: Math.min(index, 8) * 0.05 }}
    >
      {children}
    </motion.section>
  );
}

export interface TableData {
  head: string[];
  rows: (string | number)[][];
}

/** A titled chart card. Every chart can also be read as a plain table. */
export function ChartCard({
  title,
  hint,
  children,
  table,
  action,
  className = "",
  index,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  table?: TableData;
  action?: ReactNode;
  className?: string;
  index?: number;
}) {
  const [asTable, setAsTable] = useState(false);
  return (
    <Card className={`flex flex-col p-5 sm:p-6 ${className}`} index={index}>
      <header className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-body font-medium text-bone">{title}</h2>
          {hint && <p className="mt-1 text-xs leading-relaxed text-dust">{hint}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {action}
          {table && (
            <button
              type="button"
              onClick={() => setAsTable((v) => !v)}
              aria-pressed={asTable}
              title={asTable ? "Show the chart" : "Show as a table"}
              aria-label={asTable ? `Show ${title} as a chart` : `Show ${title} as a table`}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                asTable
                  ? "border-brass/50 text-brass"
                  : "border-line text-dust hover:border-bone/25 hover:text-bone"
              }`}
            >
              <Icon name={asTable ? "chart" : "table"} className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </header>
      <div className="min-h-0 flex-1">
        {asTable && table ? (
          <div className="max-h-80 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  {table.head.map((h, i) => (
                    <th
                      key={h}
                      className={`eyebrow sticky top-0 bg-coal pb-2 font-normal ${i ? "text-right" : ""}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((r, i) => (
                  <tr key={i} className="border-t border-line/70">
                    {r.map((cell, j) => (
                      <td key={j} className={`py-2 ${j ? "text-right tabular-nums text-bone" : "text-sand"}`}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          children
        )}
      </div>
    </Card>
  );
}

/** Signed change against the prior period, with an arrow so it never relies on color. */
function Delta({
  value,
  label,
  goodWhenUp = true,
}: {
  value: number | null;
  label: string;
  goodWhenUp?: boolean;
}) {
  if (value === null) return <p className="text-micro text-dust">No earlier data to compare</p>;
  const flat = Math.abs(value) < 0.05;
  const up = value > 0;
  const good = flat ? null : up === goodWhenUp;
  const tone =
    good === null
      ? "border-line bg-bone/5 text-sand"
      : good
        ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
        : "border-rose-400/25 bg-rose-400/10 text-rose-200";
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-micro text-dust">
      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium ${tone}`}>
        <svg
          viewBox="0 0 10 10"
          className="h-2.5 w-2.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden
        >
          {flat ? (
            <path d="M1.500 5h7" />
          ) : up ? (
            <path d="M1.500 7 5 3l3.500 4" />
          ) : (
            <path d="M1.500 3 5 7l3.500-4" />
          )}
        </svg>
        <span className="sr-only">{flat ? "No change" : up ? "Up" : "Down"}</span>
        {flat
          ? "0%"
          : `${up ? "+" : "−"}${Math.abs(value) >= 100 ? Math.round(Math.abs(value)) : Math.abs(value).toFixed(1)}%`}
      </span>
      {label}
    </p>
  );
}

export function Tile({
  label,
  value,
  icon,
  current,
  previous,
  compareLabel,
  goodWhenUp,
  series,
  note,
  index = 0,
}: {
  label: string;
  value: string;
  icon: IconName;
  /** Raw numbers behind the change pill. Omit both to hide it. */
  current?: number;
  previous?: number;
  compareLabel?: string;
  goodWhenUp?: boolean;
  /** Daily values for the sparkline. */
  series?: number[];
  note?: string;
  index?: number;
}) {
  return (
    <Card className="relative overflow-hidden p-5" index={index}>
      <div className="flex items-start justify-between gap-3">
        <p className="eyebrow">{label}</p>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line text-brass">
          <Icon name={icon} />
        </span>
      </div>
      <p className="mt-2 text-[2rem] font-semibold leading-none tracking-tight text-bone sm:text-[2.25rem]">
        {value}
      </p>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          {current !== undefined && previous !== undefined ? (
            <Delta value={change(current, previous)} label={compareLabel ?? ""} goodWhenUp={goodWhenUp} />
          ) : (
            <p className="text-micro text-dust">{note}</p>
          )}
          {current !== undefined && note && <p className="mt-1 text-micro text-dust">{note}</p>}
        </div>
        {series && series.some((v) => v > 0) && (
          <Sparkline values={compact(series)} className="hidden h-9 w-24 shrink-0 sm:block" />
        )}
      </div>
    </Card>
  );
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
  id,
}: {
  value: T;
  options: { value: T; label: string; count?: number }[];
  onChange: (v: T) => void;
  label: string;
  /** Unique per control so the sliding highlight doesn't jump between groups. */
  id: string;
}) {
  return (
    <div
      className="inline-flex max-w-full overflow-x-auto rounded-full border border-line p-1"
      role="group"
      aria-label={label}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className="relative shrink-0 rounded-full px-3.5 py-1.5 text-small"
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-full bg-brass"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span
              className={`relative flex items-center gap-1.5 transition-colors ${active ? "text-ink" : "text-sand"}`}
            >
              {o.label}
              {o.count !== undefined && (
                <span
                  className={`rounded-full px-1.5 text-micro tabular-nums ${active ? "bg-ink/15" : "bg-bone/10 text-sand"}`}
                >
                  {o.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function PageHead({
  title,
  accent,
  after,
  sub,
  action,
}: {
  title: string;
  /** The italic, brass part of the headline. */
  accent?: string;
  after?: string;
  sub: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        <h1 className="font-serif text-[clamp(2.25rem,4.5vw,3.5rem)] leading-none tracking-tight">
          {title}
          {accent && <em className="text-brass"> {accent}</em>}
          {after}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-sand">{sub}</p>
      </motion.div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}

export function SampleTag({ children = "Sample data" }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-brass/40 bg-brass/10 px-2.5 py-1 text-micro uppercase tracking-[0.16em] text-brass">
      <Icon name="ask" className="h-3 w-3" />
      {children}
    </span>
  );
}

export function Empty({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex h-full min-h-32 flex-col items-center justify-center px-4 py-6 text-center">
      <p className="text-sm text-sand">{title}</p>
      <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-dust">{children}</p>
    </div>
  );
}

export const btn = {
  primary:
    "inline-flex items-center gap-2 rounded-full bg-brass px-4 py-2 text-small font-medium text-ink transition-colors hover:bg-brass-bright disabled:opacity-50",
  ghost:
    "inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-small text-sand transition-colors hover:border-bone/30 hover:text-bone disabled:opacity-50",
};
