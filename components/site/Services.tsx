"use client";

import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { services } from "@/lib/site";
import { FadeUp, RevealLines } from "./Reveal";
import { ServiceArt } from "./ServiceArt";

/**
 * On wide screens the section pins and vertical scrolling drives a horizontal
 * gallery of service cards. On small screens it is an ordinary vertical stack.
 */
export function Services() {
  const reduce = useReducedMotion();
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    const measure = () => {
      const wide = window.matchMedia("(min-width: 1024px)").matches && !reduce;
      setPinned(wide);
      if (track.current && wide) {
        setDistance(Math.max(0, track.current.scrollWidth - window.innerWidth));
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (track.current) ro.observe(track.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [reduce]);

  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  const eased = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.4 });
  const x = useTransform(eased, [0, 1], [0, -distance]);
  const bar = useTransform(eased, [0, 1], [0, 1]);

  return (
    <section
      ref={section}
      id="services"
      className="relative bg-coal"
      style={pinned ? { height: `calc(100vh + ${distance}px)` } : undefined}
    >
      <div
        className={pinned ? "sticky top-0 flex h-screen flex-col justify-center overflow-hidden" : "py-24"}
      >
        <div className="shell mb-10 flex items-end justify-between gap-8 lg:mb-12">
          <div>
            <FadeUp>
              <p className="eyebrow mb-5 flex items-center gap-3">
                <span className="h-px w-8 bg-brass" />
                What we do
              </p>
            </FadeUp>
            <RevealLines
              className="font-serif text-[clamp(2.5rem,6vw,5.5rem)] leading-[0.95] tracking-[-0.02em]"
              lines={[
                <>One call for</>,
                <>
                  <em className="text-brass">the whole list.</em>
                </>,
              ]}
            />
          </div>
          {pinned && (
            <div className="hidden w-56 pb-3 lg:block">
              <div className="eyebrow mb-3 flex justify-between">
                <span>Scroll</span>
                <span>{String(services.length).padStart(2, "0")} services</span>
              </div>
              <div className="h-px w-full bg-line">
                <motion.div className="h-px origin-left bg-brass" style={{ scaleX: bar }} />
              </div>
            </div>
          )}
        </div>

        <motion.div
          ref={track}
          className={
            pinned
              ? "flex w-max gap-5 pl-[clamp(1.25rem,4vw,4rem)] pr-[clamp(1.25rem,4vw,4rem)] will-change-transform"
              : "shell grid gap-5 sm:grid-cols-2"
          }
          style={pinned ? { x } : undefined}
        >
          {services.map((s, i) => (
            <article
              key={s.id}
              data-cursor="hover"
              className={`group relative flex flex-col overflow-hidden rounded-[1.25rem] border border-line bg-ink p-7 transition-colors duration-700 hover:border-brass/40 sm:p-8 ${
                pinned ? "h-[min(60vh,560px)] w-[min(78vw,400px)] shrink-0" : ""
              }`}
            >
              <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brass/10 opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-100" />
              <div className="flex items-start justify-between">
                <span className="font-mono text-xs tracking-widest text-brass">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <ServiceArt
                  id={s.id}
                  className="h-36 w-36 text-brass/80 transition-transform duration-1000 ease-out-expo group-hover:scale-110 group-hover:-rotate-3 sm:h-44 sm:w-44"
                />
              </div>
              <div className="mt-auto pt-8">
                <h3 className="font-serif text-[2rem] leading-none tracking-tight sm:text-4xl">{s.title}</h3>
                <p className="mt-4 text-[0.9375rem] leading-relaxed text-sand">{s.blurb}</p>
                <ul className="mt-6 flex flex-wrap gap-2">
                  {s.items.map((item) => (
                    <li
                      key={item}
                      className="rounded-full border border-line px-3 py-1.5 text-[0.6875rem] tracking-wide text-dust transition-colors duration-500 group-hover:border-bone/15 group-hover:text-sand"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}

          <a
            href="#book"
            data-cursor="hover"
            data-cursor-label="Book"
            className={`group flex flex-col justify-between rounded-[1.25rem] bg-brass p-8 text-ink ${
              pinned ? "h-[min(60vh,560px)] w-[min(78vw,400px)] shrink-0" : "min-h-72 sm:col-span-2"
            }`}
          >
            <span className="font-mono text-xs uppercase tracking-widest">Not on the list?</span>
            <span>
              <span className="block font-serif text-5xl leading-[0.95] tracking-tight">Ask anyway.</span>
              <span className="mt-4 block max-w-xs text-sm leading-relaxed text-ink/70">
                If it’s in or around your home and it needs doing well, tell us about it.
              </span>
            </span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
