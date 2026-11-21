"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { LEGAL_LABELS, LEGAL_PATHS } from "@/lib/legal";
import { track } from "@/lib/track";
import { EASE, useIntroDone } from "./Intro";
import { useCopy, useLocale } from "./useCopy";

type Card = { type: "booked"; dateLabel: string; window: string } | { type: "callback" };
type Msg = { role: "user" | "assistant"; content: string; cards?: Card[]; error?: boolean };

// The greeting is ours, not the model's, so it is drawn from the page copy and never stored.
const STORAGE_KEY = "sd-chat-v2";

export function Chat() {
  const ready = useIntroDone();
  const locale = useLocale();
  const t = useCopy().chat;
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [working, setWorking] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);

  // Keep the conversation for the length of the browser session.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Msg[];
        // Restoring saved state after hydration is exactly what this effect is for.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (Array.isArray(parsed) && parsed.length) setMessages(parsed);
      }
    } catch {
      /* storage unavailable */
    }
  }, []);
  useEffect(() => {
    if (busy) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
    } catch {
      /* storage unavailable */
    }
  }, [messages, busy]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, working, open]);

  useEffect(() => {
    if (open) setTimeout(() => field.current?.focus(), 500);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const patchLast = (fn: (m: Msg) => Msg) =>
    setMessages((prev) => [...prev.slice(0, -1), fn(prev[prev.length - 1])]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    const history = [...messages, { role: "user" as const, content }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);

    const fail = (message: string) =>
      patchLast((m) => ({ ...m, content: m.content || message, error: !m.content }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          messages: history
            .filter((m) => m.content.trim() && !m.error)
            .slice(-30)
            .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) })),
        }),
      });
      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        fail(data.error ?? t.errorGeneric);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as
            | { type: "text"; delta: string }
            | { type: "working" }
            | { type: "event"; event: Card }
            | { type: "error"; message: string }
            | { type: "done" };
          if (event.type === "text") {
            setWorking(false);
            patchLast((m) => ({ ...m, content: (m.content + event.delta).replace(/^\s+/, "") }));
          } else if (event.type === "working") {
            setWorking(true);
          } else if (event.type === "event") {
            patchLast((m) => ({ ...m, cards: [...(m.cards ?? []), event.event] }));
          } else if (event.type === "error") {
            fail(event.message);
          }
        }
      }
      patchLast((m) => ({ ...m, content: m.content.trim() }));
    } catch {
      fail(t.errorDropped);
    } finally {
      setBusy(false);
      setWorking(false);
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  const last = messages[messages.length - 1];
  const waiting = busy && last?.role === "assistant" && !last.content;

  return (
    <>
      <AnimatePresence>
        {ready && !open && (
          <motion.button
            type="button"
            onClick={() => {
              track("chat_open", true);
              setOpen(true);
            }}
            className="group fixed bottom-5 right-5 z-[70] flex items-center gap-3 rounded-full border border-brass/40 bg-coal/90 py-3 pl-4 pr-5 text-sm shadow-[0_20px_60px_-15px_rgb(0_0_0/0.8)] backdrop-blur-xl transition-colors duration-500 hover:border-brass sm:bottom-7 sm:right-7"
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.2 }}
            aria-label={t.openLabel}
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-brass animate-pulse-dot" />
            </span>
            <span className="text-bone">{t.open}</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label={t.dialog}
            data-lenis-prevent
            className="fixed inset-0 z-[80] flex flex-col overflow-hidden bg-coal sm:inset-auto sm:bottom-7 sm:right-7 sm:h-[min(680px,calc(100dvh-3.5rem))] sm:w-[400px] sm:rounded-[1.5rem] sm:border sm:border-line sm:shadow-[0_40px_120px_-20px_rgb(0_0_0/0.9)]"
            style={{ transformOrigin: "100% 100%" }}
            initial={{ opacity: 0, scale: 0.6, y: 40, filter: "blur(12px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.7, y: 30, filter: "blur(10px)" }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
          >
            <div
              className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-brass/15 blur-3xl"
              aria-hidden
            />

            <header className="relative flex items-center justify-between border-b border-line px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-brass/50 font-serif text-lg text-brass">
                  SD
                </div>
                <div>
                  <p className="font-serif text-xl leading-none">{t.title}</p>
                  <p className="mt-1.5 flex items-center gap-2 text-[0.6875rem] text-dust">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {t.subtitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-sand transition-colors hover:border-brass/60 hover:text-bone"
                aria-label={t.close}
              >
                <svg
                  viewBox="0 0 12 12"
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                >
                  <path d="M1 1l10 10M11 1 1 11" />
                </svg>
              </button>
            </header>

            <div
              ref={scroller}
              className="relative flex-1 space-y-4 overflow-y-auto px-5 py-5"
              aria-live="polite"
            >
              <div className="flex flex-col items-start">
                <div className="max-w-[86%] whitespace-pre-wrap rounded-2xl rounded-bl-md bg-char px-4 py-3 text-[0.9375rem] leading-relaxed text-bone">
                  {t.greeting}
                </div>
              </div>
              {messages.map((m, i) => {
                if (m.role === "assistant" && !m.content && !m.cards?.length) return null;
                return (
                  <motion.div
                    key={i}
                    className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: EASE }}
                  >
                    {m.content && (
                      <div
                        className={`max-w-[86%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-[0.9375rem] leading-relaxed ${
                          m.role === "user"
                            ? "rounded-br-md bg-brass text-ink"
                            : m.error
                              ? "rounded-bl-md border border-red-400/30 bg-red-400/5 text-red-100"
                              : "rounded-bl-md bg-char text-bone"
                        }`}
                      >
                        {m.content}
                      </div>
                    )}
                    {m.cards?.map((card, j) => (
                      <motion.div
                        key={j}
                        className="mt-2 w-[86%] rounded-2xl border border-brass/40 bg-brass/10 p-4"
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                      >
                        <p className="eyebrow mb-2 flex items-center gap-2 !text-brass">
                          <svg
                            viewBox="0 0 12 12"
                            className="h-3 w-3"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.4"
                          >
                            <path d="M2 6.5 5 9.5 10.5 3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          {card.type === "booked" ? t.booked : t.callback}
                        </p>
                        {card.type === "booked" ? (
                          <>
                            <p className="font-serif text-2xl leading-tight">{card.dateLabel}</p>
                            <p className="mt-1 text-sm text-sand">{card.window}</p>
                          </>
                        ) : (
                          <p className="text-sm text-sand">{t.callbackBody}</p>
                        )}
                      </motion.div>
                    ))}
                  </motion.div>
                );
              })}

              {(waiting || working) && (
                <div className="flex items-center gap-2 pl-1 text-xs text-dust">
                  <span className="flex gap-1">
                    {[0, 1, 2].map((d) => (
                      <span
                        key={d}
                        className="h-1.5 w-1.5 rounded-full bg-brass animate-blink"
                        style={{ animationDelay: `${d * 0.18}s` }}
                      />
                    ))}
                  </span>
                  {working ? t.checking : t.thinking}
                </div>
              )}

              {messages.length === 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {t.suggestions.map((s, i) => (
                    <motion.button
                      key={s}
                      type="button"
                      onClick={() => void send(s)}
                      className="rounded-full border border-line px-3.5 py-2 text-[0.8125rem] text-sand transition-colors hover:border-brass/60 hover:text-bone"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, ease: EASE, delay: 0.35 + i * 0.07 }}
                    >
                      {s}
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={onSubmit} className="relative border-t border-line p-3">
              <div className="flex items-end gap-2 rounded-2xl border border-line bg-ink px-4 py-2.5 transition-colors focus-within:border-brass/60">
                <textarea
                  ref={field}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void send(input);
                    }
                  }}
                  rows={1}
                  maxLength={2000}
                  placeholder={t.placeholder}
                  aria-label={t.messageLabel}
                  className="max-h-28 min-h-[1.75rem] flex-1 resize-none bg-transparent py-1 text-[0.9375rem] text-bone outline-none placeholder:text-dust/70 focus-visible:outline-none [field-sizing:content]"
                />
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brass text-ink transition-all duration-300 hover:bg-brass-bright disabled:opacity-30"
                  aria-label={t.send}
                >
                  <svg
                    viewBox="0 0 12 12"
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                  >
                    <path d="M6 11V1M2 5l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
              <p className="mt-2 text-center text-[0.625rem] leading-relaxed text-dust">
                {t.footnote} {LEGAL_LABELS[locale].chatNotice}{" "}
                <a href={LEGAL_PATHS[locale].privacy} className="underline hover:text-brass">
                  {LEGAL_LABELS[locale].privacy}
                </a>
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
