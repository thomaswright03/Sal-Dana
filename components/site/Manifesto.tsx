"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { site } from "@/lib/site";
import { FadeUp } from "./Reveal";

const TEXT = `${site.name} is the work of one craftsman. ${site.owner} measures twice, protects your floors, and finishes by hand. Whether it’s a single stubborn door or a whole room made new, it gets the same patience, the same care, and the same eye for the details nobody else will notice.`;

function Word({
  children,
  progress,
  range,
}: {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
}) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  return (
    <motion.span style={{ opacity }} className="inline-block mr-[0.24em]">
      {children}
    </motion.span>
  );
}

/** A statement that lights up word by word as it is scrolled through. */
export function Manifesto() {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.45"] });
  const words = TEXT.split(" ");

  return (
    <section className="shell py-28 sm:py-44">
      <div className="grid gap-10 md:grid-cols-12">
        <FadeUp className="md:col-span-3">
          <p className="eyebrow flex items-center gap-3">
            <span className="h-px w-8 bg-brass" />
            The approach
          </p>
        </FadeUp>
        <p
          ref={ref}
          className="font-serif text-[clamp(1.875rem,4.4vw,4.25rem)] leading-[1.08] tracking-[-0.01em] md:col-span-9"
        >
          {words.map((word, i) => (
            <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>
              {word}
            </Word>
          ))}
        </p>
      </div>
    </section>
  );
}
