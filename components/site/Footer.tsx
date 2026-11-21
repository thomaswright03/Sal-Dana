"use client";

import { m as motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { site } from "@/lib/site";
import { Button } from "./Button";
import { FadeUp } from "./Reveal";
import { LOCALE_NAMES, LOCALE_PATHS } from "@/lib/i18n";
import { LEGAL_LABELS, LEGAL_PATHS } from "@/lib/legal";
import { useCopy, useLocale } from "./useCopy";

export function Footer() {
  const t = useCopy();
  const locale = useLocale();
  const other = locale === "en" ? "es" : "en";
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
              {t.footer.lead} <em className="text-brass">{t.footer.accent}</em>
            </p>
          </FadeUp>
          <FadeUp delay={0.15} className="flex flex-wrap gap-3">
            <Button href="#book">{t.bookCta}</Button>
            <Button href={site.smsHref} variant="ghost">
              {t.footer.text}
            </Button>
          </FadeUp>
        </div>

        <div className="grid gap-10 py-14 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="eyebrow mb-4">{t.footer.contact}</p>
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
            <p className="eyebrow mb-4">{t.footer.hours}</p>
            <p className="text-sand">{t.hours}</p>
          </div>
          <div>
            <p className="eyebrow mb-4">{t.footer.area}</p>
            <p className="text-sand">
              {t.region}, {site.state}
            </p>
          </div>
          <div>
            <p className="eyebrow mb-4">{t.footer.explore}</p>
            <ul className="space-y-1 text-sand">
              {[
                ["#services", t.nav.services],
                ["#process", t.nav.process],
                ["#standard", t.nav.standard],
                ["#faq", t.nav.questions],
              ].map(([href, label]) => (
                <li key={href}>
                  <a href={href} className="transition-colors hover:text-brass">
                    {label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href={LOCALE_PATHS[other]}
                  hrefLang={other}
                  lang={other}
                  className="transition-colors hover:text-brass"
                >
                  {LOCALE_NAMES[other]}
                </a>
              </li>
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
          <p>
            © 2026 {site.legalName}.{t.footer.legal ? ` ${t.footer.legal}` : ""}
          </p>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-1">
            <a href={LEGAL_PATHS[locale].privacy} className="transition-colors hover:text-brass">
              {LEGAL_LABELS[locale].privacy}
            </a>
            <a href={LEGAL_PATHS[locale].terms} className="transition-colors hover:text-brass">
              {LEGAL_LABELS[locale].terms}
            </a>
            <a href="/crm" className="transition-colors hover:text-brass">
              {t.footer.owner}
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
