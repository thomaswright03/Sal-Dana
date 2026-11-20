"use client";

import { motion, useReducedMotion } from "motion/react";
import type { PublicReview } from "@/lib/types";
import { EASE } from "./Intro";
import { FadeUp, RevealLines } from "./Reveal";

function Star({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="currentColor" aria-hidden>
      <path d="M10 1.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.9l-5.200 2.700 1-5.800L1.600 7.700l5.800-.8z" />
    </svg>
  );
}

const monthYear = (date: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${date}T12:00:00Z`),
  );

function Card({ review }: { review: PublicReview }) {
  return (
    <figure
      data-cursor="hover"
      className="group relative flex w-[min(82vw,420px)] shrink-0 flex-col justify-between rounded-[1.25rem] border border-line bg-ink p-7 transition-colors duration-700 hover:border-brass/40"
    >
      <div>
        <div className="flex items-center justify-between">
          <div className="flex gap-1" role="img" aria-label={`${review.rating} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className={`h-3.5 w-3.5 ${i <= review.rating ? "text-brass" : "text-bone/15"}`} />
            ))}
          </div>
          <span className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-dust">
            {monthYear(review.date)}
          </span>
        </div>
        <blockquote className="mt-6 font-serif text-[1.375rem] leading-[1.3] tracking-[-0.005em] text-bone/90">
          “{review.text}”
        </blockquote>
      </div>
      <figcaption className="mt-8 flex items-center gap-3 border-t border-line pt-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-brass/40 font-serif text-lg text-brass">
          {review.name[0]}
        </span>
        <span>
          <span className="block text-sm text-bone">{review.name}</span>
          <span className="block text-xs text-dust">
            {[review.city, review.service].filter(Boolean).join(" · ")}
          </span>
        </span>
      </figcaption>
    </figure>
  );
}

/** One endless row of review cards. Pauses while hovered or focused. */
function Row({ reviews, reverse = false }: { reviews: PublicReview[]; reverse?: boolean }) {
  const reduce = useReducedMotion();
  if (reduce) {
    return (
      <div className="flex gap-5 overflow-x-auto px-[clamp(1.25rem,4vw,4rem)] pb-2">
        {reviews.map((r) => (
          <Card key={r.id} review={r} />
        ))}
      </div>
    );
  }
  return (
    <div className="group/row flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
      <div
        className="flex w-max shrink-0 animate-marquee gap-5 pr-5 [animation-duration:70s] group-hover/row:[animation-play-state:paused]"
        style={reverse ? { animationDirection: "reverse" } : undefined}
      >
        {[...reviews, ...reviews].map((r, i) => (
          <div key={i} className="flex" aria-hidden={i >= reviews.length}>
            <Card review={r} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function Reviews({ reviews }: { reviews: PublicReview[] }) {
  const half = Math.ceil(reviews.length / 2);
  const average = reviews.reduce((n, r) => n + r.rating, 0) / Math.max(reviews.length, 1);
  const sample = reviews.some((r) => r.demo);
  const allGoogle = reviews.every((r) => r.source === "google");
  // A moving row needs enough cards to fill the screen; a few reviews sit still instead.
  const few = reviews.length < 4;

  return (
    <section id="reviews" className="overflow-hidden border-t border-line bg-coal py-28 sm:py-40">
      <div className="shell mb-14 grid gap-10 md:grid-cols-12 md:items-end sm:mb-20">
        <div className="md:col-span-7">
          <FadeUp>
            <p className="eyebrow mb-5 flex flex-wrap items-center gap-3">
              <span className="h-px w-8 bg-brass" />
              Reviews
              {sample && (
                <span className="rounded-full border border-brass/40 px-2.5 py-1 text-[0.5625rem] tracking-[0.18em] text-brass">
                  Sample reviews for preview
                </span>
              )}
            </p>
          </FadeUp>
          <RevealLines
            className="font-serif text-[clamp(2.5rem,6vw,5.5rem)] leading-[0.95] tracking-[-0.02em]"
            lines={[
              <>Word of mouth,</>,
              <>
                <em className="text-brass">written down.</em>
              </>,
            ]}
          />
        </div>

        <FadeUp delay={0.15} className="md:col-span-4 md:col-start-9">
          <div className="flex items-end gap-5">
            <span className="font-serif text-[5.5rem] leading-[0.8] tracking-tight">
              {average.toFixed(1)}
            </span>
            <div className="pb-1">
              <motion.div
                className="flex gap-1 text-brass"
                initial="hidden"
                whileInView="shown"
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ staggerChildren: 0.09, delayChildren: 0.3 }}
              >
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.span
                    key={i}
                    variants={{
                      hidden: { scale: 0, rotate: -70, opacity: 0 },
                      shown: {
                        scale: 1,
                        rotate: 0,
                        opacity: 1,
                        transition: { type: "spring", stiffness: 280, damping: 14 },
                      },
                    }}
                  >
                    <Star className="h-5 w-5" />
                  </motion.span>
                ))}
              </motion.div>
              <p className="mt-2 text-sm text-sand">
                {allGoogle ? "Reviews on Google" : `From ${reviews.length} customer reviews`}
              </p>
            </div>
          </div>
        </FadeUp>
      </div>

      <motion.div
        className="space-y-5"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10% 0px" }}
        transition={{ duration: 1.1, ease: EASE }}
      >
        {few ? (
          <div className="shell flex flex-wrap justify-center gap-5">
            {reviews.map((r) => (
              <Card key={r.id} review={r} />
            ))}
          </div>
        ) : (
          <>
            <Row reviews={reviews.slice(0, half)} />
            <Row reviews={reviews.slice(half)} reverse />
          </>
        )}
      </motion.div>
    </section>
  );
}
