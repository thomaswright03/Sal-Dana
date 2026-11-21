"use client";

import { m as motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { site } from "@/lib/site";
import { EASE } from "./Intro";
import { FadeUp } from "./Reveal";
import { useCopy } from "./useCopy";

export function Area() {
  const t = useCopy();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const sunY = useTransform(scrollYProgress, [0, 1], ["35%", "-25%"]);
  const sunScale = useTransform(scrollYProgress, [0, 1], [0.8, 1.15]);

  return (
    <section ref={ref} className="relative overflow-hidden border-y border-line bg-coal py-28 sm:py-40">
      {/* A low desert sun rising behind the list as you scroll */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[min(120vw,900px)] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgb(200_164_106/0.22)_0%,rgb(200_164_106/0.06)_45%,transparent_70%)]"
        style={{ y: sunY, scale: sunScale }}
        aria-hidden
      />
      <div className="shell relative text-center">
        <FadeUp>
          <p className="eyebrow mb-10">{t.area.eyebrow}</p>
        </FadeUp>
        <motion.ul
          className="mx-auto flex max-w-6xl flex-wrap items-baseline justify-center gap-x-5 gap-y-1 sm:gap-x-8"
          initial="hidden"
          whileInView="shown"
          viewport={{ once: true, margin: "-15% 0px" }}
          transition={{ staggerChildren: 0.06 }}
        >
          {site.cities.map((city, i) => (
            <li key={city} className="overflow-hidden pb-[0.1em]">
              <motion.span
                className={`inline-block font-serif text-[clamp(2.25rem,6.5vw,6rem)] leading-[1.05] tracking-[-0.02em] transition-colors duration-500 hover:text-brass ${
                  i % 3 === 1 ? "italic text-outline hover:[-webkit-text-stroke:1px_var(--color-brass)]" : ""
                }`}
                variants={{
                  hidden: { y: "115%" },
                  shown: { y: 0, transition: { duration: 1.1, ease: EASE } },
                }}
                data-cursor="hover"
              >
                {city}
                {i < site.cities.length - 1 && (
                  <span className="text-brass not-italic [-webkit-text-stroke:0]">,</span>
                )}
              </motion.span>
            </li>
          ))}
        </motion.ul>
        <FadeUp delay={0.3}>
          <p className="mx-auto mt-10 max-w-md text-[1.0625rem] leading-relaxed text-sand">{t.area.body}</p>
        </FadeUp>
      </div>
    </section>
  );
}
