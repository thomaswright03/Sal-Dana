"use client";

import { useReduced } from "./useReduced";
import {
  m as motion,
  useAnimationFrame,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react";
import { useRef } from "react";

const wrap = (min: number, max: number, v: number) => {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
};

/** An endless band of type that speeds up and reverses with the scroll. */
export function Marquee({ items, baseVelocity = 2.2 }: { items: readonly string[]; baseVelocity?: number }) {
  const reduce = useReduced();
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const smooth = useSpring(velocity, { damping: 50, stiffness: 300 });
  const factor = useTransform(smooth, [0, 1200], [0, 4], { clamp: false });
  const x = useTransform(baseX, (v) => `${wrap(-50, 0, v)}%`);
  const skew = useTransform(smooth, [-2500, 2500], [6, -6]);
  const direction = useRef(-1);

  useAnimationFrame((_, delta) => {
    if (reduce) return;
    const f = factor.get();
    if (f < 0) direction.current = 1;
    else if (f > 0) direction.current = -1;
    const moveBy = direction.current * baseVelocity * (delta / 1000) * (1 + Math.abs(f));
    baseX.set(baseX.get() + moveBy);
  });

  const row = (
    <div className="flex shrink-0 items-center">
      {items.map((item, i) => (
        <span key={i} className="flex items-center">
          <span
            className={`whitespace-nowrap px-6 font-serif text-[clamp(3rem,8vw,7.5rem)] leading-none sm:px-10 ${
              i % 2 ? "text-outline italic" : "text-bone"
            }`}
          >
            {item}
          </span>
          <span className="h-2 w-2 rotate-45 bg-brass" />
        </span>
      ))}
    </div>
  );

  return (
    <div className="overflow-hidden border-y border-line py-8 sm:py-12" aria-hidden>
      <motion.div className="flex w-max will-change-transform" style={{ x, skewX: reduce ? 0 : skew }}>
        {row}
        {row}
      </motion.div>
    </div>
  );
}
