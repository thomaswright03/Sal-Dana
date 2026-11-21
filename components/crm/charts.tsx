"use client";

import { motion } from "motion/react";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { num } from "./data";

/**
 * Chart colors. The five series colors were checked together for contrast and
 * color-blind separation on the dashboard's dark surface, in this order.
 */
export const VIZ = {
  gold: "#c98500",
  blue: "#3987e5",
  aqua: "#199e70",
  violet: "#9085e9",
  magenta: "#d55181",
  /** De-emphasised marks, such as "everything else" */
  muted: "#6f6a5f",
  grid: "#2a2722",
  surface: "#131210",
} as const;

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** A round number at or just above the largest value, so axis ticks read cleanly. */
function niceMax(max: number): number {
  if (max <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(max));
  for (const step of [1, 2, 2.5, 4, 5, 8, 10]) if (step * pow >= max) return step * pow;
  return 10 * pow;
}

const compactNumber = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const axisNumber = (n: number, top: number) => (top >= 10_000 ? compactNumber.format(n) : num(n));

export function Sparkline({ values, className = "" }: { values: number[]; className?: string }) {
  const w = 96;
  const h = 36;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => [
    3 + (i / Math.max(values.length - 1, 1)) * (w - 6),
    h - 4 - (v / max) * (h - 8),
  ]);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("");
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} aria-hidden>
      <path
        d={d}
        fill="none"
        stroke={VIZ.muted}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={last[0]} cy={last[1]} r="3" fill={VIZ.gold} stroke={VIZ.surface} strokeWidth="1.5" />
    </svg>
  );
}

export function Legend({ items }: { items: { label: string; color: string; line?: boolean }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-sand">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-2">
          <span
            className={it.line ? "h-0.5 w-3 rounded-full" : "h-2.5 w-2.5 rounded-[3px]"}
            style={{ background: it.color }}
          />
          {it.label}
        </li>
      ))}
    </ul>
  );
}

/**
 * One measure over an ordered axis, as a line with a soft wash or as columns.
 * Hovering (or arrow keys, when focused) reads out the value under a crosshair.
 * `hover` / `onHover` let two charts share one crosshair.
 */
export function Plot({
  kind,
  values,
  titles,
  ticks,
  name,
  color = VIZ.gold,
  height = 200,
  hover,
  onHover,
  format = num,
  accent,
}: {
  kind: "line" | "columns";
  values: number[];
  /** What each point is called in the readout, e.g. "Tue, Nov 3". */
  titles: string[];
  /** Axis label under each point; empty strings are skipped. */
  ticks: string[];
  /** The measure, e.g. "Visitors". */
  name: string;
  color?: string;
  height?: number;
  hover?: number | null;
  onHover?: (i: number | null) => void;
  format?: (n: number) => string;
  /** Index of a column to draw in the accent color (others are muted). */
  accent?: number;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [own, setOwn] = useState<number | null>(null);
  const active = hover !== undefined ? hover : own;
  const setActive = onHover ?? setOwn;
  const gradient = useId();

  const n = values.length;
  const pad = { l: 38, r: 10, t: 10, b: 24 };
  const plotW = Math.max(width - pad.l - pad.r, 10);
  const plotH = height - pad.t - pad.b;
  const top = niceMax(Math.max(...values, 0));
  const band = plotW / Math.max(n, 1);
  const xAt = (i: number) =>
    kind === "line" ? pad.l + (n > 1 ? (i / (n - 1)) * plotW : plotW / 2) : pad.l + band * (i + 0.5);
  const yAt = (v: number) => pad.t + plotH - (v / top) * plotH;

  const indexAt = (clientX: number, el: Element) => {
    const x = clientX - el.getBoundingClientRect().left - pad.l;
    const i = kind === "line" ? Math.round((x / plotW) * (n - 1)) : Math.floor(x / band);
    return Math.max(0, Math.min(n - 1, i));
  };
  const onMove = (e: PointerEvent<SVGSVGElement>) => setActive(indexAt(e.clientX, e.currentTarget));
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const from = active ?? n - 1;
    setActive(Math.max(0, Math.min(n - 1, from + (e.key === "ArrowRight" ? 1 : -1))));
  };

  const line = values.map((v, i) => `${i ? "L" : "M"}${xAt(i).toFixed(1)} ${yAt(v).toFixed(1)}`).join("");
  const colW = Math.max(2, Math.min(24, band - 2));
  const tipLeft = active !== null && active !== undefined ? xAt(active) : 0;
  const flip = tipLeft > width * 0.62;

  return (
    <div
      ref={ref}
      className="relative outline-none focus-visible:ring-1 focus-visible:ring-brass/60"
      style={{ height }}
      tabIndex={0}
      role="img"
      aria-label={`${name}: ${n} points, highest ${format(Math.max(...values, 0))}. Use the arrow keys to read values.`}
      onKeyDown={onKey}
      onBlur={() => setActive(null)}
    >
      {width > 0 && (
        <svg
          width={width}
          height={height}
          className="block touch-pan-y"
          onPointerMove={onMove}
          onPointerLeave={() => setActive(null)}
        >
          <defs>
            <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity="0.2" />
              <stop offset="1" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 0.5, 1].map((f) => (
            <g key={f}>
              <line
                x1={pad.l}
                x2={width - pad.r}
                y1={yAt(top * f)}
                y2={yAt(top * f)}
                stroke={VIZ.grid}
                strokeWidth="1"
              />
              <text
                x={pad.l - 8}
                y={yAt(top * f) + 3.5}
                textAnchor="end"
                className="fill-dust text-[10px] tabular-nums"
              >
                {axisNumber(top * f, top)}
              </text>
            </g>
          ))}
          {ticks.map((t, i) =>
            t ? (
              <text
                key={i}
                x={xAt(i)}
                y={height - 6}
                textAnchor={
                  i === 0 && kind === "line" ? "start" : i === n - 1 && kind === "line" ? "end" : "middle"
                }
                className="fill-dust text-[10px]"
              >
                {t}
              </text>
            ) : null,
          )}

          {kind === "line" ? (
            <>
              <path d={`${line}L${xAt(n - 1)} ${yAt(0)}L${xAt(0)} ${yAt(0)}Z`} fill={`url(#${gradient})`} />
              <path
                d={line}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </>
          ) : (
            values.map((v, i) => {
              const h = Math.max(v > 0 ? 2 : 0, (v / top) * plotH);
              const x = xAt(i) - colW / 2;
              const y = pad.t + plotH - h;
              const r = Math.min(4, colW / 2, h);
              const dim = accent !== undefined ? i !== accent : false;
              return (
                <path
                  key={i}
                  d={`M${x} ${y + h}V${y + r}a${r} ${r} 0 0 1 ${r} ${-r}h${colW - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}V${y + h}Z`}
                  fill={dim ? VIZ.muted : color}
                  opacity={active === null || active === undefined || active === i ? 1 : 0.55}
                />
              );
            })
          )}

          {active !== null && active !== undefined && (
            <g pointerEvents="none">
              {kind === "line" && (
                <>
                  <line
                    x1={tipLeft}
                    x2={tipLeft}
                    y1={pad.t}
                    y2={pad.t + plotH}
                    stroke="#5a554c"
                    strokeWidth="1"
                  />
                  <circle
                    cx={tipLeft}
                    cy={yAt(values[active])}
                    r="4.5"
                    fill={color}
                    stroke={VIZ.surface}
                    strokeWidth="2"
                  />
                </>
              )}
            </g>
          )}
        </svg>
      )}
      {active !== null && active !== undefined && width > 0 && (
        <div
          className="pointer-events-none absolute top-0 z-10 whitespace-nowrap rounded-lg border border-line bg-ink/95 px-3 py-2 shadow-xl"
          style={flip ? { right: width - tipLeft + 10 } : { left: tipLeft + 10 }}
        >
          <p className="eyebrow !tracking-[0.14em]">{titles[active]}</p>
          <p className="mt-1 flex items-center gap-2 text-xs text-sand">
            <span className="h-0.5 w-3 rounded-full" style={{ background: color }} />
            {name}
            <span className="ml-2 text-sm font-semibold tabular-nums text-bone">
              {format(values[active])}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

/** Ranked horizontal bars with the value at the tip. One color: the length is the encoding. */
export function BarList({
  items,
  color = VIZ.gold,
  format = num,
  limit = 8,
}: {
  items: { label: string; value: number; note?: string }[];
  color?: string;
  format?: (n: number) => string;
  limit?: number;
}) {
  const shown = items.slice(0, limit);
  const max = Math.max(...shown.map((i) => i.value), 1);
  return (
    <ul className="space-y-2.5">
      {shown.map((it, i) => (
        <li
          key={it.label}
          className="group grid grid-cols-[minmax(0,7.5rem)_1fr_auto] items-center gap-3 text-[0.8125rem]"
          title={`${it.label}: ${format(it.value)}${it.note ? ` (${it.note})` : ""}`}
        >
          <span className="truncate text-sand transition-colors group-hover:text-bone">{it.label}</span>
          <span className="block h-2">
            <motion.span
              className="block h-2 rounded-r-[4px] transition-[filter] group-hover:brightness-125"
              style={{ background: color, minWidth: it.value > 0 ? 2 : 0 }}
              initial={{ width: 0 }}
              animate={{ width: `${(it.value / max) * 100}%` }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: i * 0.04 }}
            />
          </span>
          <span className="flex items-baseline gap-2 tabular-nums text-bone">
            {it.note && <span className="text-[0.6875rem] text-dust">{it.note}</span>}
            {format(it.value)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Ordered stages, each showing how many made it and the drop from the stage before. */
export function Funnel({ stages }: { stages: { label: string; value: number }[] }) {
  const max = Math.max(...stages.map((s) => s.value), 1);
  return (
    <ol className="space-y-4">
      {stages.map((s, i) => {
        const prev = i > 0 ? stages[i - 1].value : 0;
        const kept = i > 0 && prev > 0 ? Math.round((s.value / prev) * 100) : null;
        return (
          <li key={s.label}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[0.8125rem]">
              <span className="flex items-baseline gap-2 text-sand">
                <span className="font-mono text-[0.625rem] text-dust">{String(i + 1).padStart(2, "0")}</span>
                {s.label}
              </span>
              <span className="flex items-baseline gap-2.5 tabular-nums">
                {kept !== null && (
                  <span className="text-[0.6875rem] text-dust">{kept}% of the step before</span>
                )}
                <span className="font-semibold text-bone">{num(s.value)}</span>
              </span>
            </div>
            <div className="h-2 rounded-r-[4px] bg-bone/[0.06]">
              <motion.div
                className="h-2 rounded-r-[4px]"
                style={{ background: VIZ.gold, minWidth: s.value > 0 ? 3 : 0 }}
                initial={{ width: 0 }}
                animate={{ width: `${(s.value / max) * 100}%` }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: i * 0.08 }}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** A whole split into a few parts: a thin bar, with the names and shares listed underneath. */
export function SplitBar({ parts }: { parts: { label: string; value: number; color: string }[] }) {
  const total = parts.reduce((n, p) => n + p.value, 0);
  const share = (v: number) => (total ? Math.round((v / total) * 100) : 0);
  return (
    <div>
      <div
        className="flex h-2 gap-0.5 overflow-hidden rounded-full"
        role="img"
        aria-label={parts.map((p) => `${p.label} ${share(p.value)}%`).join(", ")}
      >
        {parts
          .filter((p) => p.value > 0)
          .map((p) => (
            <motion.span
              key={p.label}
              className="h-2"
              style={{ background: p.color }}
              initial={{ flexGrow: 0 }}
              animate={{ flexGrow: p.value }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              title={`${p.label}: ${num(p.value)} (${share(p.value)}%)`}
            />
          ))}
        {total === 0 && <span className="h-2 flex-1 bg-bone/[0.06]" />}
      </div>
      <ul className="mt-4 space-y-2 text-[0.8125rem]">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sand">
              <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: p.color }} />
              {p.label}
            </span>
            <span className="tabular-nums text-bone">
              {num(p.value)}
              <span className="ml-2 inline-block w-9 text-right text-[0.6875rem] text-dust">
                {share(p.value)}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Thins axis labels so about `want` of them are shown, always including the last. */
export function thin(labels: string[], want = 6): string[] {
  const step = Math.max(1, Math.ceil(labels.length / want));
  return labels.map((l, i) => ((labels.length - 1 - i) % step === 0 ? l : ""));
}
