"use client";

import { motion, useMotionTemplate, useMotionValue } from "motion/react";
import type { PointerEvent } from "react";
import { principles, site } from "@/lib/site";
import { EASE } from "./Intro";
import { FadeUp, RevealLines } from "./Reveal";

function Card({ title, body, index }: { title: string; body: string; index: number }) {
  const mx = useMotionValue(-400);
  const my = useMotionValue(-400);
  const glow = useMotionTemplate`radial-gradient(340px circle at ${mx}px ${my}px, rgb(200 164 106 / 0.16), transparent 70%)`;
  const edge = useMotionTemplate`radial-gradient(260px circle at ${mx}px ${my}px, rgb(232 204 150 / 0.7), transparent 70%)`;

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(e.clientX - r.left);
    my.set(e.clientY - r.top);
  };

  return (
    <motion.div
      onPointerMove={onMove}
      className="group relative rounded-[1.25rem] bg-line p-px"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 1, ease: EASE, delay: (index % 2) * 0.12 }}
    >
      {/* A highlight that tracks the pointer along the card's edge */}
      <motion.div
        className="absolute inset-0 rounded-[1.25rem] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: edge }}
        aria-hidden
      />
      <div className="relative h-full overflow-hidden rounded-[calc(1.25rem-1px)] bg-coal p-8 sm:p-10">
        <motion.div
          className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: glow }}
          aria-hidden
        />
        <div className="relative">
          <span className="font-mono text-xs tracking-widest text-brass">
            {String(index + 1).padStart(2, "0")}
          </span>
          <h3 className="mt-10 font-serif text-4xl leading-none tracking-tight sm:mt-16 sm:text-5xl">
            {title}
          </h3>
          <p className="mt-5 max-w-sm text-[1.0625rem] leading-relaxed text-sand">{body}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function Standard() {
  return (
    <section id="standard" className="bg-ink py-28 sm:py-44">
      <div className="shell">
        <div className="mb-14 grid gap-8 md:grid-cols-12 md:items-end sm:mb-20">
          <div className="md:col-span-8">
            <FadeUp>
              <p className="eyebrow mb-5 flex items-center gap-3">
                <span className="h-px w-8 bg-brass" />
                The standard
              </p>
            </FadeUp>
            <RevealLines
              className="font-serif text-[clamp(2.5rem,6vw,5.5rem)] leading-[0.95] tracking-[-0.02em]"
              lines={[
                <>The small things</>,
                <>
                  are <em className="text-brass">the whole point.</em>
                </>,
              ]}
            />
          </div>
          <FadeUp delay={0.15} className="md:col-span-4">
            <p className="text-[1.0625rem] leading-relaxed text-sand">
              Anyone can make a repair. {site.owner} makes it look like nothing was ever wrong.
            </p>
          </FadeUp>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {principles.map((p, i) => (
            <Card key={p.title} title={p.title} body={p.body} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
