"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useEffect, useState } from "react";
import { site } from "@/lib/site";
import { EASE, EASE_IN_OUT, useIntroDone } from "./Intro";
import { Magnetic } from "./Magnetic";

const links = [
  { href: "#services", label: "Services" },
  { href: "#process", label: "Process" },
  { href: "#standard", label: "Standard" },
  { href: "#faq", label: "Questions" },
];

export function Nav() {
  const ready = useIntroDone();
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 40);
    setHidden(y > 400 && y > prev);
  });

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <motion.header
        className="fixed inset-x-0 top-0 z-50"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: !ready || (hidden && !open) ? -100 : 0, opacity: ready ? 1 : 0 }}
        transition={{ duration: 0.8, ease: EASE }}
      >
        <div
          className={`transition-[background-color,backdrop-filter,border-color] duration-500 border-b ${
            scrolled && !open ? "border-line/70 bg-ink/70 backdrop-blur-xl" : "border-transparent"
          }`}
        >
          <div className="shell flex h-[72px] items-center justify-between">
            <a href="#top" className="group flex items-baseline gap-2" aria-label={`${site.name} home`}>
              <span className="font-serif text-2xl leading-none tracking-tight">Sal Dana</span>
              <span className="eyebrow hidden transition-colors duration-500 group-hover:text-brass sm:inline">
                Renovations
              </span>
            </a>

            <nav className="hidden items-center gap-9 md:flex" aria-label="Primary">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="group relative text-[0.8125rem] text-sand transition-colors duration-300 hover:text-bone"
                >
                  {l.label}
                  <span className="absolute -bottom-1.5 left-0 h-px w-full origin-right scale-x-0 bg-brass transition-transform duration-500 ease-out-expo group-hover:origin-left group-hover:scale-x-100" />
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <a
                href={site.phoneHref}
                className="hidden font-mono text-xs tracking-wider text-sand transition-colors hover:text-brass lg:block"
              >
                {site.phoneDisplay}
              </a>
              <Magnetic strength={0.3}>
                <a
                  href="#book"
                  className="group relative hidden overflow-hidden rounded-full border border-bone/20 px-5 py-2.5 text-[0.8125rem] sm:block"
                >
                  <span className="absolute inset-0 translate-y-[101%] rounded-full bg-brass transition-transform duration-700 ease-out-expo group-hover:translate-y-0" />
                  <span className="relative transition-colors duration-500 group-hover:text-ink">
                    Book a visit
                  </span>
                </a>
              </Magnetic>
              <button
                type="button"
                className="relative flex h-11 w-11 items-center justify-center rounded-full border border-bone/20 md:hidden"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-label={open ? "Close menu" : "Open menu"}
              >
                <span
                  className={`absolute h-px w-4 bg-bone transition-transform duration-500 ease-out-expo ${open ? "rotate-45" : "-translate-y-[3px]"}`}
                />
                <span
                  className={`absolute h-px w-4 bg-bone transition-transform duration-500 ease-out-expo ${open ? "-rotate-45" : "translate-y-[3px]"}`}
                />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col justify-between bg-coal px-6 pb-28 pt-28 md:hidden"
            initial={{ clipPath: "inset(0% 0% 100% 0%)" }}
            animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
            exit={{ clipPath: "inset(0% 0% 100% 0%)" }}
            transition={{ duration: 0.8, ease: EASE_IN_OUT }}
          >
            <nav className="flex flex-col" aria-label="Mobile">
              {[...links, { href: "#book", label: "Book a visit" }].map((l, i) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="overflow-hidden border-b border-line py-4"
                >
                  <motion.span
                    className="flex items-baseline justify-between font-serif text-5xl"
                    initial={{ y: "110%" }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.9, ease: EASE, delay: 0.25 + i * 0.06 }}
                  >
                    {l.label}
                    <span className="font-mono text-xs text-brass">0{i + 1}</span>
                  </motion.span>
                </a>
              ))}
            </nav>
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <a href={site.phoneHref} className="block font-serif text-3xl text-brass">
                {site.phoneDisplay}
              </a>
              <a href={`mailto:${site.email}`} className="block text-sm text-sand">
                {site.email}
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
