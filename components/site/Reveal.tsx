"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { EASE } from "./Intro";

/**
 * Lines of display type that rise out from behind a mask, one after another.
 * Pass `show` to drive it manually; otherwise it plays when scrolled into view.
 * The in-view trigger sits on the wrapper, because the lines themselves start
 * out fully clipped and so would never count as visible.
 */
export function RevealLines({
  lines,
  className = "",
  lineClassName = "",
  delay = 0,
  stagger = 0.09,
  show,
  as = "h2",
}: {
  lines: ReactNode[];
  className?: string;
  lineClassName?: string;
  delay?: number;
  stagger?: number;
  show?: boolean;
  as?: "h1" | "h2" | "h3" | "p" | "div";
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  const controlled = show !== undefined;
  return (
    <Tag
      className={className}
      initial="hidden"
      {...(controlled
        ? { animate: show ? "shown" : "hidden" }
        : { whileInView: "shown", viewport: { once: true, margin: "-12% 0px" } })}
      transition={{ staggerChildren: stagger, delayChildren: delay }}
    >
      {lines.map((line, i) => (
        <span key={i} className="-mb-[0.12em] block overflow-hidden pb-[0.12em]">
          <motion.span
            className={`block will-change-transform ${lineClassName}`}
            variants={{
              hidden: reduce ? { opacity: 0 } : { y: "110%", rotate: 2.5 },
              shown: { y: 0, rotate: 0, opacity: 1, transition: { duration: 1.15, ease: EASE } },
            }}
            style={{ transformOrigin: "0% 100%" }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

/** A soft rise-and-fade for body copy and blocks. */
export function FadeUp({
  children,
  className = "",
  delay = 0,
  y = 28,
  show,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  show?: boolean;
}) {
  const reduce = useReducedMotion();
  const controlled = show !== undefined;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      {...(controlled
        ? { animate: show ? { opacity: 1, y: 0 } : undefined }
        : { whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-10% 0px" } })}
      transition={{ duration: 1, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}
