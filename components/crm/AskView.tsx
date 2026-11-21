"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { site } from "@/lib/site";
import { useCrm } from "./context";
import { btn, Card, EASE, Icon, PageHead, SampleTag } from "./ui";

interface LeadRef {
  id: string;
  name: string;
}
interface Msg {
  role: "user" | "assistant";
  content: string;
  leads?: LeadRef[];
  error?: boolean;
}

type StreamEvent =
  | { type: "text"; delta: string }
  | { type: "working" }
  | { type: "event"; event: { type: "leads"; leads: LeadRef[] } }
  | { type: "error"; message: string }
  | { type: "done" };

const SUGGESTIONS: { title: string; ask: string }[] = [
  { title: "This week", ask: "How many requests came in this week, and who still needs a reply?" },
  { title: "Money", ask: "What's the estimated value of jobs won this month compared with last month?" },
  { title: "Pipeline", ask: "Which open quotes are the biggest, and how long have they been waiting?" },
  { title: "Schedule", ask: "What visits are on the calendar for the next seven days?" },
  { title: "Website", ask: "Where did website visitors come from in the last 30 days?" },
  { title: "Work mix", ask: "Which kinds of jobs do people ask for most, and which ones do I win?" },
];

/** The assistant answers in plain text; lines that start with "- " become a list. */
function Answer({ text }: { text: string }) {
  const blocks: ({ kind: "p"; text: string } | { kind: "ul"; items: string[] })[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trimEnd();
    const bullet = /^\s*[-•]\s+(.*)$/.exec(line);
    const last = blocks[blocks.length - 1];
    if (bullet) {
      if (last?.kind === "ul") last.items.push(bullet[1]);
      else blocks.push({ kind: "ul", items: [bullet[1]] });
    } else if (line.trim()) {
      blocks.push({ kind: "p", text: line });
    }
  }
  return (
    <div className="space-y-2.5">
      {blocks.map((b, i) =>
        b.kind === "p" ? (
          <p key={i}>{b.text}</p>
        ) : (
          <ul key={i} className="space-y-1.5">
            {b.items.map((item, j) => (
              <li key={j} className="flex gap-2.5">
                <span className="mt-[0.6em] h-1 w-1 shrink-0 rounded-full bg-brass" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
}

export function AskView() {
  const { status, openLead, sampleCount } = useCrm();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [working, setWorking] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const abort = useRef<AbortController | null>(null);

  // `status` is null until it loads; treat that as connected so the box doesn't flash.
  const connected = status?.ai !== false;

  useEffect(() => {
    if (messages.length) end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, working]);

  useEffect(() => () => abort.current?.abort(), []);

  const patchLast = (fn: (m: Msg) => Msg) =>
    setMessages((prev) => [...prev.slice(0, -1), fn(prev[prev.length - 1])]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy || !connected) return;
    const history: Msg[] = [...messages, { role: "user", content }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    const fail = (message: string) =>
      patchLast((m) => ({ ...m, content: m.content || message, error: !m.content }));
    const controller = new AbortController();
    abort.current = controller;

    try {
      const res = await fetch("/api/crm/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          messages: history
            .filter((m) => m.content.trim() && !m.error)
            .slice(-30)
            .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) })),
        }),
      });
      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        fail(data.error ?? "Something went wrong. Please try again.");
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
          const event = JSON.parse(line) as StreamEvent;
          if (event.type === "text") {
            setWorking(false);
            patchLast((m) => ({ ...m, content: (m.content + event.delta).replace(/^\s+/, "") }));
          } else if (event.type === "working") {
            setWorking(true);
          } else if (event.type === "event" && event.event.type === "leads") {
            const found = event.event.leads;
            patchLast((m) => {
              const seen = new Set((m.leads ?? []).map((l) => l.id));
              return {
                ...m,
                leads: [...(m.leads ?? []), ...found.filter((l) => !seen.has(l.id))].slice(0, 8),
              };
            });
          } else if (event.type === "error") {
            fail(event.message);
          }
        }
      }
      patchLast((m) => ({ ...m, content: m.content.trim() }));
    } catch {
      if (!controller.signal.aborted) fail("The connection dropped. Please try again.");
    } finally {
      setBusy(false);
      setWorking(false);
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(input);
  };
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  };

  const empty = messages.length === 0;

  return (
    <>
      <PageHead
        title="Ask about"
        accent="your business."
        sub="Ask in plain words and get an answer from your own records: leads, visits, estimated job values, website traffic and reviews. It only reads; it never changes anything."
        action={
          <>
            {sampleCount > 0 && <SampleTag>Answers use sample data</SampleTag>}
            {!empty && (
              <button
                type="button"
                onClick={() => {
                  abort.current?.abort();
                  setMessages([]);
                }}
                className={btn.ghost}
              >
                New conversation
              </button>
            )}
          </>
        }
      />

      {!connected && (
        <Card className="mb-3 overflow-hidden" index={0}>
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-brass/40 bg-brass/10 px-3 py-1 text-micro uppercase tracking-[0.16em] text-brass">
                <span className="h-1.5 w-1.5 rounded-full bg-brass" /> Not connected yet
              </span>
              <h2 className="mt-4 font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
                Built and ready. It needs one key to <em className="text-brass">switch on.</em>
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-sand">
                The assistant runs on Claude, and it stays off until an Anthropic API key is added to the
                site. The same key also switches on the booking assistant visitors see on the website.
              </p>
            </div>
            <ol className="space-y-3 text-sm text-sand">
              {[
                "Create an API key at console.anthropic.com.",
                "In Vercel, open the sal-dana project, then Settings, then Environment Variables.",
                "Add ANTHROPIC_API_KEY with the key as its value, and redeploy.",
              ].map((step, i) => (
                <li key={step} className="flex gap-3 rounded-xl border border-line bg-ink/60 p-3.5">
                  <span className="font-mono text-micro text-brass">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </Card>
      )}

      <Card className="flex min-h-[28rem] flex-col" index={1}>
        <div className="flex-1 p-5 sm:p-8">
          {empty ? (
            <div className="mx-auto max-w-3xl py-4 sm:py-8">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brass text-ink">
                  <Icon name="ask" className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-body font-medium text-bone">
                    {connected ? `What would you like to know, ${site.owner}?` : "Questions it will answer"}
                  </p>
                  <p className="text-xs text-dust">
                    {connected
                      ? "Pick a question to start, or type your own."
                      : "A preview of what you can ask once it’s on."}
                  </p>
                </div>
              </div>
              <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {SUGGESTIONS.map((s, i) => (
                  <motion.li
                    key={s.title}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: EASE, delay: 0.1 + i * 0.05 }}
                  >
                    <button
                      type="button"
                      disabled={!connected}
                      onClick={() => void send(s.ask)}
                      className="group flex h-full w-full flex-col rounded-2xl border border-line bg-ink/50 p-4 text-left transition-colors enabled:hover:border-brass/50 disabled:cursor-default"
                    >
                      <span className="eyebrow">{s.title}</span>
                      <span className="mt-2 text-sm leading-relaxed text-sand transition-colors group-enabled:group-hover:text-bone">
                        {s.ask}
                      </span>
                    </button>
                  </motion.li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-6" aria-live="polite">
              <AnimatePresence initial={false}>
                {messages.map((m, i) => {
                  const last = i === messages.length - 1;
                  if (m.role === "user") {
                    return (
                      <motion.div
                        key={i}
                        className="flex justify-end"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: EASE }}
                      >
                        <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-brass px-4 py-3 text-sm leading-relaxed text-ink">
                          {m.content}
                        </p>
                      </motion.div>
                    );
                  }
                  return (
                    <motion.div
                      key={i}
                      className="flex gap-3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: EASE }}
                    >
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-brass">
                        <Icon name="ask" className="h-3.5 w-3.5" />
                      </span>
                      <div
                        className={`min-w-0 flex-1 text-sm leading-relaxed ${m.error ? "text-rose-200" : "text-bone"}`}
                      >
                        {m.content ? (
                          <Answer text={m.content} />
                        ) : (
                          last &&
                          busy && (
                            <p className="flex items-center gap-2.5 text-dust">
                              <span className="flex gap-1" aria-hidden>
                                {[0, 1, 2].map((d) => (
                                  <motion.span
                                    key={d}
                                    className="h-1.5 w-1.5 rounded-full bg-brass"
                                    animate={{ opacity: [0.25, 1, 0.25] }}
                                    transition={{ duration: 1.1, repeat: Infinity, delay: d * 0.18 }}
                                  />
                                ))}
                              </span>
                              {working ? "Looking through your records" : "Thinking"}
                            </p>
                          )
                        )}
                        {m.content && last && working && (
                          <p className="mt-2 text-xs text-dust">Looking through your records…</p>
                        )}
                        {m.leads && m.leads.length > 0 && (
                          <ul className="mt-3 flex flex-wrap gap-2">
                            {m.leads.map((l) => (
                              <li key={l.id}>
                                <button
                                  type="button"
                                  onClick={() => openLead(l.id)}
                                  className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs text-sand transition-colors hover:border-brass hover:text-brass"
                                >
                                  <Icon name="users" className="h-3 w-3" />
                                  {l.name}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={end} />
            </div>
          )}
        </div>

        <form onSubmit={onSubmit} className="border-t border-line p-3 sm:p-4">
          <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-line bg-ink px-4 py-2.5 transition-colors focus-within:border-brass">
            <label className="sr-only" htmlFor="ask-input">
              Ask a question about your business
            </label>
            <textarea
              id="ask-input"
              rows={1}
              value={input}
              disabled={!connected}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              maxLength={4000}
              placeholder={
                connected
                  ? "Ask about leads, visits, revenue, traffic or reviews"
                  : "Switches on once the key is added"
              }
              className="max-h-40 min-h-[2.25rem] flex-1 resize-none bg-transparent py-1.5 text-sm outline-none placeholder:text-dust disabled:cursor-not-allowed [field-sizing:content]"
            />
            <button
              type="submit"
              disabled={!connected || busy || !input.trim()}
              aria-label="Send"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brass text-ink transition-colors hover:bg-brass-bright disabled:opacity-40"
            >
              <Icon name="arrow" className="h-4 w-4 -rotate-90" />
            </button>
          </div>
          <p className="mx-auto mt-2 max-w-3xl px-1 text-micro text-dust">
            Answers come from the records in this dashboard. Dollar figures are the estimates you entered.
          </p>
        </form>
      </Card>
    </>
  );
}
