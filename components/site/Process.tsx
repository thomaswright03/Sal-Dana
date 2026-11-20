"use client";

import { motion, useScroll, useSpring } from "motion/react";
import { useRef } from "react";
import { processSteps } from "@/lib/site";
import { FadeUp, RevealLines } from "./Reveal";

export function Process() {
  const list = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: list, offset: ["start 0.7", "end 0.6"] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 90, damping: 24 });

  return (
    <section id="process" className="shell py-28 sm:py-44">
      <div className="grid gap-14 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-32">
            <FadeUp>
              <p className="eyebrow mb-5 flex items-center gap-3">
                <span className="h-px w-8 bg-brass" />
                How it works
              </p>
            </FadeUp>
            <RevealLines
              className="font-serif text-[clamp(2.5rem,6vw,5.5rem)] leading-[0.95] tracking-[-0.02em]"
              lines={[
                <>Simple,</>,
                <>
                  start to <em className="text-brass">finish.</em>
                </>,
              ]}
            />
            <FadeUp delay={0.2}>
              <p className="mt-8 max-w-sm text-[1.0625rem] leading-relaxed text-sand">
                No call centers and no crews you’ve never met. You deal with one person from the first message
                to the final walkthrough.
              </p>
            </FadeUp>
          </div>
        </div>

        <ol ref={list} className="relative lg:col-span-6 lg:col-start-7">
          <span className="absolute left-0 top-0 h-full w-px bg-line" aria-hidden />
          <motion.span
            className="absolute left-0 top-0 h-full w-px origin-top bg-brass"
            style={{ scaleY }}
            aria-hidden
          />
          {processSteps.map((step, i) => (
            <li key={step.title} className="relative pb-16 pl-8 last:pb-0 sm:pl-14">
              <motion.span
                className="absolute -left-[5px] top-3 h-[11px] w-[11px] rounded-full border border-brass bg-ink"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true, margin: "-30% 0px" }}
                transition={{ type: "spring", stiffness: 300, damping: 18 }}
                aria-hidden
              />
              <FadeUp>
                <span className="font-mono text-xs tracking-widest text-brass">
                  Step {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-serif text-4xl leading-none tracking-tight sm:text-5xl">
                  {step.title}
                </h3>
                <p className="mt-5 max-w-md text-[1.0625rem] leading-relaxed text-sand">{step.body}</p>
              </FadeUp>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
