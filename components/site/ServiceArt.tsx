"use client";

import { useReduced } from "./useReduced";
import { motion } from "motion/react";
import { EASE } from "./Intro";

const rect = (x: number, y: number, w: number, h: number) => `M${x} ${y}h${w}v${h}h${-w}z`;
const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`;

/**
 * Blueprint-style line drawings, one per service. Each stroke is "inked in"
 * in sequence when the drawing scrolls into view.
 */
const drawings: Record<string, string[]> = {
  "kitchens-baths": [
    "M30 150h140",
    "M55 150v-8h90v8",
    "M100 142V88a26 26 0 0 1 52 0v6",
    "M146 94h12",
    "M88 118h24",
    "M152 108v10M152 126v6",
    "M48 166a52 8 0 1 0 104 0",
  ],
  carpentry: [
    rect(38, 38, 124, 124),
    rect(58, 58, 84, 84),
    "M38 38l20 20M162 38l-20 20M38 162l20-20M162 162l-20-20",
    "M78 100h44M100 78v44",
  ],
  "drywall-paint": [
    rect(46, 44, 92, 30),
    "M138 59h20v30H100v24",
    rect(92, 113, 16, 50),
    "M40 92h44M40 104h30",
  ],
  "doors-windows": [
    "M48 166V34h80v132",
    "M36 166h128",
    "M128 34l28 14v118",
    circle(116, 102, 4),
    "M128 166a72 72 0 0 0 28-48",
  ],
  "tile-flooring": [
    "M100 30l70 70-70 70-70-70z",
    "M65 65l70 70M135 65l-70 70",
    "M82.5 47.5l70 70M47.5 82.5l70 70",
    "M117.5 47.5l-70 70M152.5 82.5l-70 70",
  ],
  "mounting-assembly": [
    rect(40, 50, 120, 70),
    "M30 136h140",
    circle(100, 136, 5),
    "M100 120v11M100 141v19M70 160h60",
    "M56 66l16 0M56 76l28 0",
  ],
  outdoor: [
    "M30 70h140M38 60h124",
    "M52 70v96M148 70v96",
    "M68 60v10M88 60v10M108 60v10M128 60v10",
    "M30 166h140",
    circle(150, 34, 10),
    "M52 96l20-26M148 96l-20-26",
  ],
  "punch-list": [
    rect(48, 30, 104, 140),
    "M82 30v-6h36v6",
    rect(64, 58, 14, 14) + "M90 65h46",
    "M67 65l4 4 8-10",
    rect(64, 92, 14, 14) + "M90 99h46",
    "M67 99l4 4 8-10",
    rect(64, 126, 14, 14) + "M90 133h32",
  ],
};

export function ServiceArt({ id, className = "" }: { id: string; className?: string }) {
  const reduce = useReduced();
  return (
    <motion.svg
      viewBox="0 0 200 200"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={reduce ? "shown" : "hidden"}
      whileInView="shown"
      viewport={{ once: true }}
      transition={{ staggerChildren: 0.14 }}
      aria-hidden
    >
      {/* Corner ticks, as on a working drawing */}
      <path
        className="text-bone/20"
        d="M14 14h10M14 14v10M186 14h-10M186 14v10M14 186h10M14 186v-10M186 186h-10M186 186v-10"
      />
      {(drawings[id] ?? []).map((d, i) => (
        <motion.path
          key={i}
          d={d}
          vectorEffect="non-scaling-stroke"
          variants={{
            hidden: { pathLength: 0, opacity: 0 },
            shown: { pathLength: 1, opacity: 1, transition: { duration: 1.6, ease: EASE } },
          }}
        />
      ))}
    </motion.svg>
  );
}
