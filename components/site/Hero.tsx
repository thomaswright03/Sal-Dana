"use client";

import { useReduced } from "./useReduced";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { site } from "@/lib/site";
import { Button } from "./Button";
import { EASE, useIntroDone } from "./Intro";
import { FadeUp, RevealLines } from "./Reveal";
import { ShaderCanvas } from "./ShaderCanvas";
import { headingLines, useCopy } from "./useCopy";

export function Hero() {
  const ready = useIntroDone();
  const t = useCopy();
  const reduce = useReduced();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "-22%"]);
  const fade = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  return (
    <section ref={ref} id="top" className="relative h-[100svh] min-h-[640px] overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(120%_90%_at_75%_20%,#2b2014_0%,#131210_45%,#0b0a09_80%)]"
        style={reduce ? undefined : { y: bgY, scale: bgScale }}
      >
        <ShaderCanvas />
      </motion.div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-ink to-transparent" />

      <motion.div
        className="shell relative flex h-full flex-col justify-end pb-10 sm:pb-14"
        style={reduce ? undefined : { y: textY, opacity: fade }}
      >
        <FadeUp show={ready} delay={0.1} className="mb-6 flex items-center gap-3 sm:mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-brass animate-pulse-dot" />
          <span className="eyebrow !text-sand">{t.hero.eyebrow}</span>
        </FadeUp>

        <RevealLines
          as="h1"
          show={ready}
          delay={0.15}
          stagger={0.11}
          className="font-serif text-[clamp(3.25rem,10.5vw,10.5rem)] leading-[0.92] tracking-[-0.02em]"
          lines={headingLines(t.hero.heading)}
        />

        <div className="mt-8 grid gap-8 sm:mt-12 md:grid-cols-12 md:items-end">
          <FadeUp show={ready} delay={0.55} className="md:col-span-5">
            <p className="max-w-md text-[1.0625rem] leading-relaxed text-sand">{t.hero.body}</p>
          </FadeUp>
          <FadeUp
            show={ready}
            delay={0.7}
            className="flex flex-wrap items-center gap-3 md:col-span-7 md:justify-end"
          >
            <Button href="#book">{t.bookCta}</Button>
            <Button href={site.phoneHref} variant="ghost">
              {site.phoneDisplay}
            </Button>
          </FadeUp>
        </div>

        <motion.div
          className="mt-10 flex items-center justify-between border-t border-bone/10 pt-5 sm:mt-14"
          initial={{ opacity: 0 }}
          animate={{ opacity: ready ? 1 : 0 }}
          transition={{ duration: 1.2, ease: EASE, delay: 1 }}
        >
          <span className="eyebrow">{t.registered}</span>
          <span className="eyebrow hidden sm:block">{t.hours}</span>
          <span className="eyebrow flex items-center gap-3">
            {t.scroll}
            <span className="relative block h-8 w-px overflow-hidden bg-bone/15">
              <motion.span
                className="absolute inset-x-0 top-0 h-3 bg-brass"
                animate={reduce ? undefined : { y: [-12, 32] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              />
            </span>
          </span>
        </motion.div>
      </motion.div>
    </section>
  );
}
