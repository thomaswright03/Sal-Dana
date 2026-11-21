"use client";

import { AnimatePresence, m as motion } from "motion/react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { services, site, windows, type WindowId } from "@/lib/site";
import { formatDate } from "@/lib/schedule";
import { track } from "@/lib/track";
import { Button } from "./Button";
import { EASE } from "./Intro";
import { Magnetic } from "./Magnetic";
import { FadeUp, RevealLines } from "./Reveal";
import { WINDOW_TEXT } from "@/lib/i18n";
import { LEGAL_LABELS, LEGAL_PATHS } from "@/lib/legal";
import { headingLines, useCopy, useLocale } from "./useCopy";

type State =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "done"; booked: boolean; taken?: string }
  | { kind: "error"; message: string };

function Field({
  label,
  children,
  className = "",
  error,
  errorId,
}: {
  label: string;
  children: ReactNode;
  className?: string;
  error?: string | null;
  errorId?: string;
}) {
  return (
    <div className={className}>
      <label className="group relative block">
        <span className="eyebrow mb-2 block transition-colors duration-300 group-focus-within:text-brass">
          {label}
        </span>
        {children}
        <span className="absolute bottom-0 left-0 h-px w-full bg-line" />
        <span className="absolute bottom-0 left-0 h-px w-full origin-left scale-x-0 bg-brass transition-transform duration-700 ease-out-expo group-focus-within:scale-x-100" />
      </label>
      {error && (
        <p id={errorId} role="alert" className="mt-2 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

const inputCls =
  "w-full bg-transparent pb-3 text-lg text-bone placeholder:text-dust/60 outline-none focus-visible:outline-none";

type Day =
  | { kind: "none" }
  | { kind: "loading" }
  | { kind: "problem"; code: "invalid" | "past" | "far" | "closed" }
  | { kind: "open"; open: string[] }
  | { kind: "unknown" };

function Chip({
  active,
  onClick,
  children,
  disabled = false,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      disabled={disabled}
      className={`rounded-full border px-4 py-2 text-small transition-all duration-300 ${
        disabled
          ? "cursor-not-allowed border-line/60 text-dust/50 line-through"
          : active
            ? "border-brass bg-brass text-ink"
            : "border-line text-sand hover:border-bone/30 hover:text-bone"
      }`}
    >
      {children}
    </button>
  );
}

export function Booking() {
  const t = useCopy();
  const locale = useLocale();
  const b = t.booking;
  const [state, setState] = useState<State>({ kind: "idle" });
  const [service, setService] = useState("");
  const [win, setWin] = useState("");
  const [date, setDate] = useState("");
  const [day, setDay] = useState<Day>({ kind: "none" });
  const [fieldErr, setFieldErr] = useState<{ field: string; message: string } | null>(null);

  // Once a date is chosen, ask which windows are still free.
  useEffect(() => {
    if (!date) return;
    const ctl = new AbortController();
    fetch(`/api/availability?date=${encodeURIComponent(date)}`, { signal: ctl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("unavailable"))))
      .then((d: { ok: boolean; open?: string[]; code?: "invalid" | "past" | "far" | "closed" }) => {
        if (d.ok) {
          const open = d.open ?? [];
          setDay({ kind: "open", open });
          setWin((w) => (w && !open.includes(w) ? "" : w));
        } else {
          setDay({ kind: "problem", code: d.code ?? "invalid" });
          setWin("");
        }
      })
      .catch((e: unknown) => {
        if (!(e instanceof DOMException && e.name === "AbortError")) setDay({ kind: "unknown" });
      });
    return () => ctl.abort();
  }, [date]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setState({ kind: "sending" });
    setFieldErr(null);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...Object.fromEntries(form), service, window: win, language: locale }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        field?: string;
        booked?: boolean;
        slotTaken?: boolean;
        takenDate?: string;
        takenWindow?: WindowId;
      };
      if (!res.ok) {
        if (res.status === 400 && data.field && data.field in b.fieldError) {
          setFieldErr({ field: data.field, message: b.fieldError[data.field as keyof typeof b.fieldError] });
          setState({ kind: "idle" });
          return;
        }
        // The server answers in English; Spanish visitors get the matching message in Spanish.
        const local = res.status === 400 ? b.errorInvalid : res.status === 429 ? b.errorBusy : b.errorFailed;
        throw new Error(locale === "en" ? (data.error ?? local) : local);
      }
      track("form_submit");
      const taken =
        data.slotTaken && data.takenDate && data.takenWindow
          ? `${formatDate(data.takenDate, locale)} · ${WINDOW_TEXT[locale][data.takenWindow].label}`
          : undefined;
      setState({ kind: "done", booked: Boolean(data.booked), taken });
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error && err.message !== "Failed to fetch" ? err.message : b.errorFailed,
      });
    }
  }

  return (
    <section id="book" className="shell py-28 sm:py-44">
      <div className="grid gap-16 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <FadeUp>
            <p className="eyebrow mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-brass" />
              {b.eyebrow}
            </p>
          </FadeUp>
          <RevealLines
            className="font-serif text-[clamp(2.75rem,7vw,6.5rem)] leading-[0.92] tracking-[-0.02em]"
            lines={headingLines(b.heading)}
          />
          <FadeUp delay={0.2}>
            <p className="mt-8 max-w-sm text-[1.0625rem] leading-relaxed text-sand">{b.body}</p>
          </FadeUp>

          <FadeUp delay={0.3} className="mt-12 space-y-6">
            <div>
              <p className="eyebrow mb-2">{b.callOrText}</p>
              <Magnetic strength={0.15}>
                <a
                  href={site.phoneHref}
                  className="font-serif text-4xl tracking-tight transition-colors duration-500 hover:text-brass sm:text-5xl"
                >
                  {site.phoneDisplay}
                </a>
              </Magnetic>
            </div>
            <div>
              <p className="eyebrow mb-2">{b.email}</p>
              <a
                href={`mailto:${site.email}`}
                className="group relative inline-block break-all text-lg text-sand transition-colors duration-500 hover:text-bone"
              >
                {site.email}
                <span className="absolute -bottom-1 left-0 h-px w-full origin-right scale-x-0 bg-brass transition-transform duration-500 ease-out-expo group-hover:origin-left group-hover:scale-x-100" />
              </a>
            </div>
            <div>
              <p className="eyebrow mb-2">{b.hours}</p>
              <p className="text-lg text-sand">{t.hours}</p>
            </div>
          </FadeUp>
        </div>

        <FadeUp delay={0.15} className="lg:col-span-6 lg:col-start-7">
          <div className="relative overflow-hidden rounded-[1.5rem] border border-line bg-coal p-7 sm:p-12">
            <AnimatePresence mode="wait" initial={false}>
              {state.kind === "done" ? (
                <motion.div
                  key="done"
                  className="flex min-h-[520px] flex-col items-start justify-center"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.9, ease: EASE }}
                  role="status"
                >
                  <svg
                    viewBox="0 0 80 80"
                    className="mb-10 h-20 w-20 text-brass"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  >
                    <motion.circle
                      cx="40"
                      cy="40"
                      r="38"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.1, ease: EASE }}
                    />
                    <motion.path
                      d="M25 41l10 10 20-22"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.7, ease: EASE, delay: 0.6 }}
                    />
                  </svg>
                  <h3 className="font-serif text-5xl leading-none tracking-tight">
                    {state.taken ? b.doneTaken : state.booked ? b.doneBooked : b.doneReceived}
                  </h3>
                  <p className="mt-5 max-w-sm text-[1.0625rem] leading-relaxed text-sand">
                    {state.taken ? b.doneTakenBody(state.taken) : b.doneBody}
                  </p>
                  <button
                    type="button"
                    onClick={() => setState({ kind: "idle" })}
                    className="mt-10 text-sm text-brass underline-offset-4 hover:underline"
                  >
                    {b.again}
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={onSubmit}
                  onFocus={() => track("form_start", true)}
                  className="space-y-9"
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="grid gap-9 sm:grid-cols-2">
                    <Field
                      label={b.name}
                      error={fieldErr?.field === "name" ? fieldErr.message : null}
                      errorId="err-name"
                    >
                      <input
                        name="name"
                        aria-invalid={fieldErr?.field === "name"}
                        aria-describedby="err-name"
                        required
                        minLength={2}
                        maxLength={120}
                        autoComplete="name"
                        placeholder={b.namePlaceholder}
                        className={inputCls}
                      />
                    </Field>
                    <Field
                      label={b.phone}
                      error={fieldErr?.field === "phone" ? fieldErr.message : null}
                      errorId="err-phone"
                    >
                      <input
                        name="phone"
                        aria-invalid={fieldErr?.field === "phone"}
                        aria-describedby="err-phone"
                        required
                        type="tel"
                        maxLength={30}
                        autoComplete="tel"
                        placeholder="(480) 000-0000"
                        className={inputCls}
                      />
                    </Field>
                    <Field
                      label={b.emailField}
                      error={fieldErr?.field === "email" ? fieldErr.message : null}
                      errorId="err-email"
                    >
                      <input
                        name="email"
                        aria-invalid={fieldErr?.field === "email"}
                        aria-describedby="err-email"
                        type="email"
                        maxLength={200}
                        autoComplete="email"
                        placeholder={b.emailPlaceholder}
                        className={inputCls}
                      />
                    </Field>
                    <Field label={b.address}>
                      <input
                        name="address"
                        maxLength={200}
                        autoComplete="street-address"
                        placeholder="Scottsdale"
                        className={inputCls}
                      />
                    </Field>
                  </div>

                  {/* Hidden from people; bots tend to fill it in. */}
                  <div className="absolute -left-[9999px]" aria-hidden>
                    <label>
                      Company
                      <input name="company" tabIndex={-1} autoComplete="off" />
                    </label>
                  </div>

                  <fieldset>
                    <legend className="eyebrow mb-4">{b.need}</legend>
                    <div className="flex flex-wrap gap-2">
                      {/* The saved value stays in English so the dashboard reads the same in either language. */}
                      {services.map((s, i) => (
                        <Chip
                          key={s.id}
                          active={service === s.title}
                          onClick={() => setService(service === s.title ? "" : s.title)}
                        >
                          {t.services.list[i]?.title ?? s.title}
                        </Chip>
                      ))}
                      <Chip
                        active={service === "Something else"}
                        onClick={() => setService(service === "Something else" ? "" : "Something else")}
                      >
                        {b.somethingElse}
                      </Chip>
                    </div>
                  </fieldset>

                  <div className="grid gap-9 sm:grid-cols-2">
                    <Field label={b.day}>
                      <input
                        name="date"
                        type="date"
                        value={date}
                        onChange={(e) => {
                          setDate(e.target.value);
                          setDay({ kind: e.target.value ? "loading" : "none" });
                        }}
                        // Earliest bookable day is tomorrow; set on focus so it reflects the visitor's clock.
                        onFocus={(e) => {
                          e.currentTarget.min = new Date(Date.now() + 86_400_000).toLocaleDateString("en-CA");
                        }}
                        className={`${inputCls} [color-scheme:dark]`}
                      />
                    </Field>
                    <fieldset>
                      <legend className="eyebrow mb-3">{b.time}</legend>
                      <div className="flex flex-wrap gap-2">
                        {windows.map((w) => (
                          <Chip
                            key={w.id}
                            disabled={
                              day.kind === "problem" || (day.kind === "open" && !day.open.includes(w.id))
                            }
                            active={win === w.id}
                            onClick={() => setWin(win === w.id ? "" : w.id)}
                          >
                            {WINDOW_TEXT[locale][w.id].label}
                            {day.kind === "open" && !day.open.includes(w.id) ? ` · ${b.taken}` : ""}
                          </Chip>
                        ))}
                      </div>
                      <p className="mt-3 min-h-5 text-sm text-dust" role="status" aria-live="polite">
                        {day.kind === "loading"
                          ? b.checking
                          : day.kind === "problem"
                            ? b.dayProblem[day.code]
                            : ""}
                      </p>
                    </fieldset>
                  </div>

                  <Field label={b.details}>
                    <textarea
                      name="details"
                      rows={3}
                      maxLength={3000}
                      placeholder={b.detailsPlaceholder}
                      className={`${inputCls} resize-none`}
                    />
                  </Field>

                  <div className="flex flex-wrap items-center justify-between gap-5 pt-2">
                    <Button type="submit" disabled={state.kind === "sending"}>
                      {state.kind === "sending" ? b.sending : b.submit}
                    </Button>
                    <p className="max-w-[16rem] text-xs leading-relaxed text-dust">
                      {b.privacy}{" "}
                      <a href={LEGAL_PATHS[locale].privacy} className="underline hover:text-brass">
                        {LEGAL_LABELS[locale].privacy}
                      </a>
                      {" · "}
                      <a href={LEGAL_PATHS[locale].terms} className="underline hover:text-brass">
                        {LEGAL_LABELS[locale].terms}
                      </a>
                    </p>
                  </div>

                  {state.kind === "error" && (
                    <p
                      role="alert"
                      className="rounded-xl border border-red-400/30 bg-red-400/5 px-4 py-3 text-sm text-red-200"
                    >
                      {state.message}
                    </p>
                  )}
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
