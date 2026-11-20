"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { site } from "@/lib/site";
import { Button } from "./Button";
import { FadeUp } from "./Reveal";

export function Footer() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const y = useTransform(scrollYProgress, [0, 1], ["45%", "0%"]);
  const opacity = useTransform(scrollYProgress, [0.2, 1], [0, 1]);

  return (
    <footer ref={ref} className="relative overflow-hidden bg-ink pt-24 sm:pt-32">
      <div className="shell">
        <div className="flex flex-col items-start justify-between gap-10 border-b border-line pb-16 md:flex-row md:items-end">
          <FadeUp>
            <p className="max-w-xl font-serif text-[clamp(2rem,4.5vw,4rem)] leading-[1] tracking-[-0.02em]">
              Something at home needs doing <em className="text-brass">well?</em>
            </p>
          </FadeUp>
          <FadeUp delay={0.15} className="flex flex-wrap gap-3">
            <Button href="#book">Book a visit</Button>
            <Button href={site.smsHref} variant="ghost">
              Send a text
            </Button>
          </FadeUp>
        </div>

        <div className="grid gap-10 py-14 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="eyebrow mb-4">Contact</p>
            <a href={site.phoneHref} className="block text-sand transition-colors hover:text-brass">
              {site.phoneDisplay}
            </a>
            <a
              href={`mailto:${site.email}`}
              className="mt-1 block break-all text-sand transition-colors hover:text-brass"
            >
              {site.email}
            </a>
          </div>
          <div>
            <p className="eyebrow mb-4">Hours</p>
            <p className="text-sand">{site.hoursDisplay}</p>
          </div>
          <div>
            <p className="eyebrow mb-4">Area</p>
            <p className="text-sand">
              {site.region}, {site.state}
            </p>
          </div>
          <div>
            <p className="eyebrow mb-4">Explore</p>
            <ul className="space-y-1 text-sand">
              {[
                ["#services", "Services"],
                ["#process", "Process"],
                ["#standard", "Standard"],
                ["#faq", "Questions"],
              ].map(([href, label]) => (
                <li key={href}>
                  <a href={href} className="transition-colors hover:text-brass">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <motion.div
        className="pointer-events-none select-none px-4 text-center"
        style={{ y, opacity }}
        aria-hidden
      >
        <span className="block font-serif text-[23vw] leading-[0.8] tracking-[-0.04em] text-transparent [-webkit-text-stroke:1px_rgb(200_164_106/0.55)] bg-[linear-gradient(180deg,rgb(200_164_106/0.3),transparent_85%)] bg-clip-text">
          Sal Dana
        </span>
      </motion.div>

      <div className="relative border-t border-line bg-ink">
        <div className="shell flex flex-col gap-2 py-6 text-xs text-dust sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 {site.legalName}. A registered Arizona limited liability company.</p>
          <a href="/crm" className="transition-colors hover:text-brass">
            Owner sign-in
          </a>
        </div>
      </div>
    </footer>
  );
}
