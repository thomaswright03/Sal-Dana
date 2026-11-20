"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { faqs } from "@/lib/site";
import { EASE } from "./Intro";
import { FadeUp, RevealLines } from "./Reveal";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="border-t border-line bg-coal py-28 sm:py-40">
      <div className="shell grid gap-14 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <FadeUp>
            <p className="eyebrow mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-brass" />
              Questions
            </p>
          </FadeUp>
          <RevealLines
            className="font-serif text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.95] tracking-[-0.02em]"
            lines={[
              <>Good to</>,
              <>
                <em className="text-brass">know.</em>
              </>,
            ]}
          />
        </div>

        <div className="lg:col-span-7 lg:col-start-6">
          {faqs.map((item, i) => {
            const isOpen = open === i;
            return (
              <FadeUp key={item.q} delay={i * 0.05} y={16}>
                <div className="border-b border-line">
                  <button
                    type="button"
                    className="group flex w-full items-center justify-between gap-6 py-7 text-left"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                  >
                    <span
                      className={`font-serif text-2xl leading-tight tracking-tight transition-colors duration-500 sm:text-[2rem] ${
                        isOpen ? "text-brass" : "group-hover:text-brass"
                      }`}
                    >
                      {item.q}
                    </span>
                    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line transition-colors duration-500 group-hover:border-brass/50">
                      <span className="absolute h-px w-3.5 bg-bone" />
                      <span
                        className={`absolute h-3.5 w-px bg-bone transition-transform duration-500 ease-out-expo ${isOpen ? "rotate-90 scale-y-0" : ""}`}
                      />
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.7, ease: EASE }}
                        className="overflow-hidden"
                      >
                        <p className="max-w-xl pb-8 text-[1.0625rem] leading-relaxed text-sand">{item.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </FadeUp>
            );
          })}
        </div>
      </div>
    </section>
  );
}
