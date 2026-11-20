"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useState } from "react";
import { useMounted } from "@/lib/use-mounted";

/** A small brass dot with a trailing ring that swells over anything interactive. */
export function Cursor() {
  const mounted = useMounted();
  const enabled =
    mounted &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [hover, setHover] = useState(false);
  const [label, setLabel] = useState<string | null>(null);
  const [down, setDown] = useState(false);
  const [seen, setSeen] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const rx = useSpring(x, { stiffness: 260, damping: 26, mass: 0.5 });
  const ry = useSpring(y, { stiffness: 260, damping: 26, mass: 0.5 });

  useEffect(() => {
    if (!enabled) return;

    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setSeen(true);
      const el = (e.target as Element | null)?.closest?.(
        "a, button, summary, label, [data-cursor]",
      ) as HTMLElement | null;
      setHover(Boolean(el));
      setLabel(el?.dataset.cursorLabel ?? null);
    };
    const press = () => setDown(true);
    const release = () => setDown(false);
    const leave = () => setSeen(false);

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", press);
    window.addEventListener("pointerup", release);
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", press);
      window.removeEventListener("pointerup", release);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  const size = label ? 84 : hover ? 56 : 30;

  return (
    <div className="pointer-events-none fixed inset-0 z-[90]" style={{ opacity: seen ? 1 : 0 }} aria-hidden>
      <motion.div
        className="absolute left-0 top-0 flex items-center justify-center rounded-full border border-brass/70"
        style={{ x: rx, y: ry, translateX: "-50%", translateY: "-50%" }}
        animate={{
          width: size,
          height: size,
          scale: down ? 0.85 : 1,
          backgroundColor: label
            ? "rgb(200 164 106 / 1)"
            : hover
              ? "rgb(200 164 106 / 0.12)"
              : "rgb(200 164 106 / 0)",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
      >
        {label && (
          <span className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-ink">{label}</span>
        )}
      </motion.div>
      <motion.div
        className="absolute left-0 top-0 h-1 w-1 rounded-full bg-brass"
        style={{ x, y, translateX: "-50%", translateY: "-50%" }}
        animate={{ opacity: label ? 0 : 1 }}
      />
    </div>
  );
}
