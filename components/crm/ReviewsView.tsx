"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState, type FormEvent } from "react";
import { services, site } from "@/lib/site";
import { REVIEW_SOURCE_LABELS, REVIEW_SOURCES, type Review, type ReviewSource } from "@/lib/types";
import { BarList } from "./charts";
import { useCrm } from "./context";
import { cityOf, closedDay, num, todayAz } from "./data";
import { btn, Card, ChartCard, EASE, Empty, Icon, PageHead, SampleTag, Segmented, Tile } from "./ui";

const field =
  "w-full rounded-xl border border-line bg-ink px-3.5 py-2.5 text-sm text-bone outline-none transition-colors placeholder:text-dust focus:border-brass";

type Draft = Omit<Review, "id" | "createdAt" | "demo">;

const blank = (): Draft => ({
  name: "",
  city: "",
  service: "",
  rating: 5,
  text: "",
  date: todayAz(),
  source: "google",
  permission: "",
  relationship: "",
  published: false,
});

const monthYear = (date: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));

function Stars({ rating, className = "h-3.5 w-3.5" }: { rating: number; className?: string }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} viewBox="0 0 20 20" className={className} aria-hidden>
          <path
            d="M10 1.8l2.5 5.2 5.7.8-4.100 4 1 5.700L10 14.800l-5.100 2.700 1-5.700-4.100-4 5.700-.8z"
            className={n <= rating ? "fill-brass" : "fill-bone/10"}
          />
        </svg>
      ))}
    </span>
  );
}

export function ReviewsView() {
  const { reviews, setReviews, leads, notify, openLead } = useCrm();
  const [filter, setFilter] = useState<"all" | "shown" | "hidden">("all");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Review | "new" | null>(null);
  const [link, setLink] = useState(() => {
    try {
      return localStorage.getItem("sd-review-link") ?? "";
    } catch {
      return "";
    }
  });

  const stats = useMemo(() => {
    const total = reviews.length;
    const average = total ? reviews.reduce((n, r) => n + r.rating, 0) / total : 0;
    return {
      total,
      average,
      shown: reviews.filter((r) => r.published).length,
      five: reviews.filter((r) => r.rating === 5).length,
      byStars: [5, 4, 3, 2, 1].map((s) => ({
        label: `${s} star${s === 1 ? "" : "s"}`,
        value: reviews.filter((r) => r.rating === s).length,
      })),
      bySource: REVIEW_SOURCES.map((s) => ({
        label: REVIEW_SOURCE_LABELS[s],
        value: reviews.filter((r) => r.source === s).length,
      }))
        .filter((s) => s.value > 0)
        .sort((a, b) => b.value - a.value),
      sample: reviews.some((r) => r.demo),
    };
  }, [reviews]);

  // Finished jobs with no review on file yet: the people worth asking.
  const toAsk = useMemo(() => {
    const reviewed = new Set(reviews.map((r) => r.name.trim().toLowerCase()));
    return leads
      .filter((l) => l.status === "won" && l.phone && !reviewed.has(l.name.trim().toLowerCase()))
      .sort((a, b) => closedDay(b).localeCompare(closedDay(a)))
      .slice(0, 5);
  }, [leads, reviews]);

  const list = reviews.filter((r) =>
    filter === "all" ? true : filter === "shown" ? r.published : !r.published,
  );

  const askText = (name: string) =>
    `Hi ${name.split(" ")[0]}, it's ${site.owner} with ${site.name}. Thank you again for having me out. If you were happy with the work, a short review would mean a lot${link.trim() ? `: ${link.trim()}` : "."}`;

  async function save(draft: Draft, id?: string) {
    const res = await fetch(id ? `/api/crm/reviews/${id}` : "/api/crm/reviews", {
      method: id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    }).catch(() => null);
    const data = res ? ((await res.json().catch(() => ({}))) as { review?: Review; error?: string }) : {};
    if (!res?.ok || !data.review) {
      notify(data.error ?? "Couldn't save the review.");
      return false;
    }
    const saved = data.review;
    setReviews((rs) =>
      (id ? rs.map((r) => (r.id === id ? saved : r)) : [saved, ...rs]).sort((a, b) =>
        b.date.localeCompare(a.date),
      ),
    );
    return true;
  }

  async function toggle(r: Review) {
    setReviews((rs) => rs.map((x) => (x.id === r.id ? { ...x, published: !r.published } : x)));
    const res = await fetch(`/api/crm/reviews/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !r.published }),
    }).catch(() => null);
    if (!res?.ok) {
      setReviews((rs) => rs.map((x) => (x.id === r.id ? { ...x, published: r.published } : x)));
      notify("Couldn't update the review.");
    } else {
      notify(r.published ? "Hidden from the website." : "Now showing on the website.");
    }
  }

  async function remove(r: Review) {
    setConfirmId(null);
    const before = reviews;
    setReviews((rs) => rs.filter((x) => x.id !== r.id));
    const res = await fetch(`/api/crm/reviews/${r.id}`, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) {
      setReviews(() => before);
      notify("Couldn't delete the review.");
    }
  }

  return (
    <>
      <PageHead
        title="What customers"
        accent="say."
        sub="Keep every review in one place and choose which ones appear on the website. Anything you switch on shows up in the site's reviews section within a minute."
        action={
          <button type="button" onClick={() => setEditing("new")} className={btn.primary}>
            <Icon name="plus" className="h-3.5 w-3.5" /> Add a review
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Tile
          index={0}
          label="Average rating"
          icon="reviews"
          value={stats.total ? stats.average.toFixed(1) : "–"}
          note={
            stats.total
              ? `across ${num(stats.total)} review${stats.total === 1 ? "" : "s"}`
              : "No reviews yet"
          }
        />
        <Tile
          index={1}
          label="Reviews on file"
          icon="message"
          value={num(stats.total)}
          note="from every platform"
        />
        <Tile
          index={2}
          label="Showing on the website"
          icon="globe"
          value={num(stats.shown)}
          note={stats.total - stats.shown > 0 ? `${stats.total - stats.shown} kept private` : "All of them"}
        />
        <Tile
          index={3}
          label="Five-star share"
          icon="trophy"
          value={stats.total ? `${Math.round((stats.five / stats.total) * 100)}%` : "–"}
          note={stats.total ? `${stats.five} of ${stats.total}` : "No reviews yet"}
        />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-3">
        <div className="space-y-3 xl:col-span-2">
          <Card className="flex flex-wrap items-center justify-between gap-3 p-3" index={4}>
            <Segmented
              id="review-filter"
              label="Filter reviews"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all" as const, label: "All", count: reviews.length },
                { value: "shown" as const, label: "On the website", count: stats.shown },
                { value: "hidden" as const, label: "Private", count: stats.total - stats.shown },
              ]}
            />
            {stats.sample && <SampleTag>Sample reviews</SampleTag>}
          </Card>

          {list.length === 0 && (
            <Card className="p-6" index={5}>
              <Empty title={reviews.length ? "Nothing in this view" : "No reviews yet"}>
                {reviews.length
                  ? "Switch the filter to see the rest."
                  : "When a customer leaves a review on Google, Facebook or Nextdoor, add it here and it can go straight onto the website."}
              </Empty>
            </Card>
          )}

          <ul className="space-y-3">
            <AnimatePresence initial={false}>
              {list.map((r, i) => (
                <motion.li
                  key={r.id}
                  layout
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.5, ease: EASE, delay: Math.min(i, 8) * 0.03 }}
                  className="rounded-2xl border border-line bg-coal p-5 sm:p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line font-serif text-lg text-brass">
                        {r.name[0]?.toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[0.9375rem] font-medium text-bone">{r.name}</p>
                        <p className="truncate text-xs text-dust">
                          {[r.city, r.service, REVIEW_SOURCE_LABELS[r.source], monthYear(r.date)]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.demo && <SampleTag>Sample</SampleTag>}
                      <Stars rating={r.rating} />
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-sand">{r.text}</p>
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line/70 pt-4">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={r.published}
                      onClick={() => void toggle(r)}
                      className="group flex items-center gap-3 text-[0.8125rem] text-sand"
                    >
                      <span
                        className={`relative h-6 w-11 rounded-full border transition-colors ${
                          r.published ? "border-brass bg-brass" : "border-line bg-ink"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-[18px] w-[18px] rounded-full transition-all ${
                            r.published ? "left-[22px] bg-ink" : "left-0.5 bg-dust"
                          }`}
                        />
                      </span>
                      {r.published ? "Showing on the website" : "Private, not on the website"}
                    </button>
                    <span className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditing(r)}
                        className="flex h-8 items-center gap-2 rounded-full px-3 text-xs text-dust transition-colors hover:bg-bone/5 hover:text-bone"
                      >
                        <Icon name="edit" className="h-3.5 w-3.5" /> Edit
                      </button>
                      {confirmId === r.id ? (
                        <span className="flex items-center gap-2 text-xs">
                          <span className="text-sand">Delete for good?</span>
                          <button
                            type="button"
                            onClick={() => void remove(r)}
                            className="rounded-full bg-red-500/90 px-3.5 py-1.5 font-medium text-white"
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmId(null)}
                            className="rounded-full border border-line px-3.5 py-1.5 text-sand"
                          >
                            Keep
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmId(r.id)}
                          className="flex h-8 items-center gap-2 rounded-full px-3 text-xs text-dust transition-colors hover:bg-rose-400/10 hover:text-rose-200"
                        >
                          <Icon name="trash" className="h-3.5 w-3.5" /> Delete
                        </button>
                      )}
                    </span>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>

        <div className="space-y-3">
          <ChartCard
            index={5}
            title="Ratings"
            hint="How many reviews gave each score."
            table={{ head: ["Score", "Reviews"], rows: stats.byStars.map((s) => [s.label, s.value]) }}
          >
            {stats.total ? (
              <BarList items={stats.byStars} />
            ) : (
              <Empty title="Nothing to chart yet">Add a review and the breakdown appears here.</Empty>
            )}
          </ChartCard>

          <ChartCard
            index={6}
            title="Where reviews were left"
            table={{ head: ["Platform", "Reviews"], rows: stats.bySource.map((s) => [s.label, s.value]) }}
          >
            {stats.bySource.length ? (
              <BarList items={stats.bySource} />
            ) : (
              <Empty title="Nothing to chart yet">
                Each review is tagged with the platform it came from.
              </Empty>
            )}
          </ChartCard>

          <Card className="p-5 sm:p-6" index={7}>
            <h2 className="text-[0.9375rem] font-medium text-bone">Ask for a review</h2>
            <p className="mt-1 text-xs leading-relaxed text-dust">
              Finished jobs with no review on file. Text opens your messages app with a note ready to send.
            </p>
            <label className="mt-4 block">
              <span className="eyebrow mb-1.5 block">Your review link (optional)</span>
              <input
                value={link}
                onChange={(e) => {
                  setLink(e.target.value);
                  try {
                    localStorage.setItem("sd-review-link", e.target.value);
                  } catch {
                    /* storage unavailable */
                  }
                }}
                placeholder="Paste your Google review link"
                inputMode="url"
                className={field}
              />
            </label>
            {toAsk.length === 0 ? (
              <p className="mt-4 text-xs text-dust">No finished jobs are waiting on a review request.</p>
            ) : (
              <ul className="mt-4 divide-y divide-line/70">
                {toAsk.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-3 py-3">
                    <button type="button" onClick={() => openLead(l.id)} className="min-w-0 text-left">
                      <span className="block truncate text-sm text-bone hover:text-brass">{l.name}</span>
                      <span className="block truncate text-xs text-dust">
                        {[cityOf(l.address), l.service].filter(Boolean).join(" · ")}
                      </span>
                    </button>
                    <span className="flex shrink-0 items-center gap-1.5">
                      <a
                        href={`sms:${l.phone.replace(/[^\d+]/g, "")}?&body=${encodeURIComponent(askText(l.name))}`}
                        className="rounded-full border border-line px-3 py-1.5 text-xs text-sand transition-colors hover:border-brass hover:text-brass"
                      >
                        Text
                      </a>
                      <button
                        type="button"
                        onClick={() =>
                          void navigator.clipboard
                            ?.writeText(askText(l.name))
                            .then(() => notify("Message copied."))
                            .catch(() => notify("Couldn't copy the message."))
                        }
                        className="rounded-full border border-line px-3 py-1.5 text-xs text-sand transition-colors hover:border-bone/30 hover:text-bone"
                      >
                        Copy
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <AnimatePresence>
        {editing && (
          <ReviewForm
            key={editing === "new" ? "new" : editing.id}
            review={editing === "new" ? null : editing}
            onClose={() => setEditing(null)}
            onSave={async (draft) => {
              const ok = await save(draft, editing === "new" ? undefined : editing.id);
              if (ok) {
                setEditing(null);
                notify(editing === "new" ? "Review added." : "Review saved.");
              }
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function ReviewForm({
  review,
  onClose,
  onSave,
}: {
  review: Review | null;
  onClose: () => void;
  onSave: (draft: Draft) => Promise<void>;
}) {
  const [draft, setDraft] = useState<Draft>(() =>
    review
      ? {
          name: review.name,
          city: review.city,
          service: review.service,
          rating: review.rating,
          text: review.text,
          date: review.date,
          source: review.source,
          permission: review.permission ?? "",
          relationship: review.relationship ?? "",
          published: review.published,
        }
      : blank(),
  );
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await onSave(draft);
    setBusy(false);
  };

  return (
    <>
      <motion.button
        type="button"
        aria-label="Close"
        className="fixed inset-0 z-50 cursor-default bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.form
          onSubmit={submit}
          role="dialog"
          aria-label={review ? `Edit the review from ${review.name}` : "Add a review"}
          className="pointer-events-auto max-h-full w-full max-w-lg overflow-y-auto rounded-3xl border border-line bg-coal p-6 shadow-2xl sm:p-8"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          <p className="eyebrow">{review ? "Edit review" : "New review"}</p>
          <h2 className="mt-2 font-serif text-4xl leading-none tracking-tight">
            {review ? review.name : "Add a review"}
          </h2>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <label className="col-span-2 block sm:col-span-1">
              <span className="eyebrow mb-1.5 block">Customer</span>
              <input
                required
                value={draft.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="First name and last initial"
                className={field}
              />
            </label>
            <label className="col-span-2 block sm:col-span-1">
              <span className="eyebrow mb-1.5 block">City</span>
              <input
                value={draft.city}
                onChange={(e) => set("city", e.target.value)}
                list="review-cities"
                className={field}
              />
              <datalist id="review-cities">
                {site.cities.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </label>
            <label className="col-span-2 block">
              <span className="eyebrow mb-1.5 block">Job</span>
              <input
                value={draft.service}
                onChange={(e) => set("service", e.target.value)}
                list="review-services"
                className={field}
              />
              <datalist id="review-services">
                {services.map((s) => (
                  <option key={s.id} value={s.title} />
                ))}
              </datalist>
            </label>
            <fieldset className="col-span-2">
              <legend className="eyebrow mb-1.5">Rating</legend>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-pressed={draft.rating === n}
                    aria-label={`${n} star${n === 1 ? "" : "s"}`}
                    onClick={() => set("rating", n)}
                    className="rounded-lg p-1 transition-transform hover:scale-110"
                  >
                    <svg viewBox="0 0 20 20" className="h-7 w-7" aria-hidden>
                      <path
                        d="M10 1.8l2.5 5.2 5.7.8-4.100 4 1 5.700L10 14.800l-5.100 2.700 1-5.700-4.100-4 5.700-.8z"
                        className={n <= draft.rating ? "fill-brass" : "fill-bone/10"}
                      />
                    </svg>
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="col-span-2 block">
              <span className="eyebrow mb-1.5 block">What they wrote</span>
              <textarea
                required
                rows={5}
                value={draft.text}
                onChange={(e) => set("text", e.target.value)}
                placeholder="Copy the review exactly as the customer wrote it"
                className={`${field} resize-y`}
              />
            </label>
            <label className="block">
              <span className="eyebrow mb-1.5 block">Left on</span>
              <select
                value={draft.source}
                onChange={(e) => set("source", e.target.value as ReviewSource)}
                className={field}
              >
                {REVIEW_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {REVIEW_SOURCE_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="eyebrow mb-1.5 block">Date</span>
              <input
                type="date"
                required
                max={todayAz()}
                value={draft.date}
                onChange={(e) => set("date", e.target.value)}
                className={`${field} [color-scheme:dark]`}
              />
            </label>
            <label className="col-span-2 block">
              <span className="eyebrow mb-2 block">Permission on record (required to show it)</span>
              <input
                value={draft.permission}
                onChange={(e) => set("permission", e.target.value)}
                maxLength={300}
                placeholder="Who agreed, when and where, e.g. Maria texted yes on 2026-11-20"
                className={field}
              />
            </label>
            <label className="col-span-2 block">
              <span className="eyebrow mb-2 block">Relationship or incentive (leave blank if none)</span>
              <input
                value={draft.relationship}
                onChange={(e) => set("relationship", e.target.value)}
                maxLength={300}
                placeholder="Family, staff, paid, discount or free work in return"
                className={field}
              />
            </label>
            <p className="col-span-2 text-xs leading-relaxed text-dust">
              Show only real reviews from real customers who agreed. Don’t hide honest reviews you dislike
              or only publish good ones to mislead: that is review gating.
            </p>
            <label className="col-span-2 flex items-center gap-3 text-sm text-sand">
              <input
                type="checkbox"
                checked={draft.published}
                onChange={(e) => set("published", e.target.checked)}
                className="h-4 w-4 accent-[#c8a46a]"
              />
              Show this review on the website
            </label>
          </div>

          <div className="mt-7 flex justify-end gap-2">
            <button type="button" onClick={onClose} className={btn.ghost}>
              Cancel
            </button>
            <button type="submit" disabled={busy} className={btn.primary}>
              {busy ? "Saving…" : review ? "Save changes" : "Add review"}
            </button>
          </div>
        </motion.form>
      </div>
    </>
  );
}
