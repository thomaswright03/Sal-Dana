"use client";

import { animate, AnimatePresence, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect, useState } from "react";
import { EASE, EASE_IN_OUT } from "./Intro";

const WORD = "Sal Dana";

/** Opening curtain: the name sets itself, a brass rule fills, and the page is unveiled. */
export function Preloader({ onDone }: { onDone: () => void }) {
  const [visible, setVisible] = useState(true);
  const progress = useMotionValue(0);
  const count = useTransform(progress, (v) => String(Math.round(v)).padStart(3, "0"));
  const scaleX = useTransform(progress, [0, 100], [0, 1]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.documentElement.style.overflow = "hidden";
    const controls = animate(progress, 100, {
      duration: reduce ? 0.2 : 1.9,
      ease: [0.65, 0, 0.35, 1],
      onComplete: () => {
        setVisible(false);
        document.documentElement.style.overflow = "";
        // Let the curtain start lifting before the hero plays.
        setTimeout(onDone, reduce ? 0 : 450);
      },
    });
    return () => {
      controls.stop();
      document.documentElement.style.overflow = "";
    };
    // Runs once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="preloader fixed inset-0 z-[100] flex flex-col justify-between bg-ink p-6 sm:p-10"
          exit={{ clipPath: "inset(0% 0% 100% 0%)" }}
          initial={{ clipPath: "inset(0% 0% 0% 0%)" }}
          transition={{ duration: 1.1, ease: EASE_IN_OUT }}
          aria-hidden
        >
          <div className="flex items-center justify-between eyebrow">
            <span>Renovations LLC</span>
            <span>Arizona</span>
          </div>

          <motion.div
            className="flex justify-center overflow-hidden"
            exit={{ y: -60, opacity: 0 }}
            transition={{ duration: 0.8, ease: EASE_IN_OUT }}
          >
            <div className="font-serif text-[clamp(3.5rem,13vw,11rem)] leading-none tracking-tight">
              {WORD.split("").map((ch, i) => (
                <span key={i} className="inline-block overflow-hidden align-bottom">
                  <motion.span
                    className="inline-block"
                    initial={{ y: "105%" }}
                    animate={{ y: 0 }}
                    transition={{ duration: 1, ease: EASE, delay: 0.1 + i * 0.05 }}
                  >
                    {ch === " " ? " " : ch}
                  </motion.span>
                </span>
              ))}
            </div>
          </motion.div>

          <div>
            <div className="mb-4 flex items-end justify-between">
              <span className="eyebrow">Preparing the site</span>
              <motion.span className="font-mono text-sm tabular-nums text-brass">{count}</motion.span>
            </div>
            <div className="h-px w-full bg-line">
              <motion.div className="h-px origin-left bg-brass" style={{ scaleX }} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
