"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { windows } from "@/lib/site";
import {
  APPOINTMENT_STATUSES,
  LEAD_STATUSES,
  SOURCE_LABELS,
  STATUS_LABELS,
  type Appointment,
  type Lead,
} from "@/lib/types";
import { ago } from "./format";

const field =
  "w-full rounded-xl border border-line bg-ink px-3.5 py-2.5 text-sm text-bone outline-none transition-colors placeholder:text-dust focus:border-brass";

function Label({
  text,
  children,
  className = "",
}: {
  text: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="eyebrow mb-1.5 block">{text}</span>
      {children}
    </label>
  );
}

interface Draft {
  name: string;
  phone: string;
  email: string;
  address: string;
  service: string;
  details: string;
  status: Lead["status"];
  value: string;
  date: string;
  window: Appointment["window"];
  visitStatus: Appointment["status"];
}

const blank: Draft = {
  name: "",
  phone: "",
  email: "",
  address: "",
  service: "",
  details: "",
  status: "new",
  value: "",
  date: "",
  window: "morning",
  visitStatus: "confirmed",
};

const toDraft = (l: Lead): Draft => ({
  name: l.name,
  phone: l.phone,
  email: l.email,
  address: l.address,
  service: l.service,
  details: l.details,
  status: l.status,
  value: l.value != null ? String(l.value) : "",
  date: l.appointment?.date ?? "",
  window: l.appointment?.window ?? "morning",
  visitStatus: l.appointment?.status ?? "confirmed",
});

function toBody(d: Draft) {
  const value =
    d.value.trim() === "" ? null : Math.max(0, Math.round(Number(d.value.replace(/[^\d.]/g, "")) || 0));
  return {
    name: d.name.trim(),
    phone: d.phone.trim(),
    email: d.email.trim(),
    address: d.address.trim(),
    service: d.service.trim(),
    details: d.details.trim(),
    status: d.status,
    value,
    appointment: d.date ? { date: d.date, window: d.window, status: d.visitStatus } : null,
  };
}

interface PanelProps {
  lead: Lead | null;
  creating: boolean;
  onClose: () => void;
  onPatch: (id: string, body: Record<string, unknown>) => Promise<void>;
  onCreate: (body: Record<string, unknown>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function Panel({ lead, onClose, onPatch, onCreate, onDelete }: PanelProps) {
  const [draft, setDraft] = useState<Draft>(() => (lead ? toDraft(lead) : blank));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmNote, setConfirmNote] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const dirty = lead ? JSON.stringify(toBody(draft)) !== JSON.stringify(toBody(toDraft(lead))) : true;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (lead) await onPatch(lead.id, toBody(draft));
      else await onCreate(toBody(draft));
    } finally {
      setSaving(false);
    }
  }

  async function addNote() {
    if (!lead || !note.trim()) return;
    const text = note.trim();
    setNote("");
    await onPatch(lead.id, { addNote: text });
  }

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        aria-hidden
      />
      <motion.aside
        role="dialog"
        aria-label={lead ? `Lead: ${lead.name}` : "New lead"}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-line bg-coal"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 36 }}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line p-6">
          <div className="min-w-0">
            <p className="eyebrow">
              {lead ? `${SOURCE_LABELS[lead.source]} · added ${ago(lead.createdAt)}` : "New lead"}
              {lead?.demo && " · sample"}
            </p>
            <h2 className="mt-2 truncate font-serif text-4xl leading-none tracking-tight">
              {lead ? draft.name || lead.name : "Add a lead"}
            </h2>
            {lead?.language === "es" && (
              <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-brass/40 bg-brass/10 px-3 py-1 text-micro text-brass">
                Prefers Spanish · used the site in Spanish
              </p>
            )}
            {lead && (
              <div className="mt-4 flex flex-wrap gap-2">
                {lead.phone && (
                  <>
                    <a
                      href={`tel:${lead.phone.replace(/[^\d+]/g, "")}`}
                      className="rounded-full bg-brass px-4 py-1.5 text-xs font-medium text-ink hover:bg-brass-bright"
                    >
                      Call
                    </a>
                    <a
                      href={`sms:${lead.phone.replace(/[^\d+]/g, "")}`}
                      className="rounded-full border border-line px-4 py-1.5 text-xs text-sand hover:border-bone/30 hover:text-bone"
                    >
                      Text
                    </a>
                  </>
                )}
                {lead.email && (
                  <a
                    href={`mailto:${lead.email}`}
                    className="rounded-full border border-line px-4 py-1.5 text-xs text-sand hover:border-bone/30 hover:text-bone"
                  >
                    Email
                  </a>
                )}
                {lead.address && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-line px-4 py-1.5 text-xs text-sand hover:border-bone/30 hover:text-bone"
                  >
                    Map
                  </a>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-sand hover:text-bone"
          >
            <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M1 1l10 10M11 1 1 11" />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          <form id="lead-form" onSubmit={onSubmit} className="grid grid-cols-2 gap-4 p-6">
            <Label text="Name" className="col-span-2 sm:col-span-1">
              <input
                className={field}
                value={draft.name}
                onChange={(e) => set("name", e.target.value)}
                required
                maxLength={120}
              />
            </Label>
            <Label text="Phone" className="col-span-2 sm:col-span-1">
              <input
                className={field}
                value={draft.phone}
                onChange={(e) => set("phone", e.target.value)}
                type="tel"
                maxLength={30}
              />
            </Label>
            <Label text="Email" className="col-span-2 sm:col-span-1">
              <input
                className={field}
                value={draft.email}
                onChange={(e) => set("email", e.target.value)}
                maxLength={200}
              />
            </Label>
            <Label text="Address" className="col-span-2 sm:col-span-1">
              <input
                className={field}
                value={draft.address}
                onChange={(e) => set("address", e.target.value)}
                maxLength={200}
              />
            </Label>
            <Label text="Job" className="col-span-2">
              <input
                className={field}
                value={draft.service}
                onChange={(e) => set("service", e.target.value)}
                maxLength={120}
                placeholder="e.g. Door hanging"
              />
            </Label>
            <Label text="Details" className="col-span-2">
              <textarea
                className={`${field} resize-y`}
                rows={4}
                value={draft.details}
                onChange={(e) => set("details", e.target.value)}
                maxLength={3000}
              />
            </Label>
            <Label text="Stage">
              <select
                className={field}
                value={draft.status}
                onChange={(e) => set("status", e.target.value as Draft["status"])}
              >
                {LEAD_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </Label>
            <Label text="Estimated value ($)">
              <input
                className={field}
                value={draft.value}
                onChange={(e) => set("value", e.target.value)}
                inputMode="numeric"
                placeholder="0"
              />
            </Label>

            <fieldset className="col-span-2 rounded-2xl border border-line p-4">
              <legend className="eyebrow px-2">Visit</legend>
              <div className="grid grid-cols-3 gap-3">
                <Label text="Day">
                  <input
                    className={`${field} [color-scheme:dark]`}
                    type="date"
                    value={draft.date}
                    onChange={(e) => set("date", e.target.value)}
                  />
                </Label>
                <Label text="Window">
                  <select
                    className={field}
                    value={draft.window}
                    onChange={(e) => set("window", e.target.value as Draft["window"])}
                    disabled={!draft.date}
                  >
                    {windows.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.label}
                      </option>
                    ))}
                  </select>
                </Label>
                <Label text="Status">
                  <select
                    className={`${field} capitalize`}
                    value={draft.visitStatus}
                    onChange={(e) => set("visitStatus", e.target.value as Draft["visitStatus"])}
                    disabled={!draft.date}
                  >
                    {APPOINTMENT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Label>
              </div>
              {draft.date && (
                <button
                  type="button"
                  onClick={() => set("date", "")}
                  className="mt-3 text-xs text-dust hover:text-red-200"
                >
                  Remove visit
                </button>
              )}
            </fieldset>
          </form>

          {lead && (
            <div className="space-y-6 border-t border-line p-6">
              <section>
                <p className="eyebrow mb-3">Notes</p>
                <div className="flex gap-2">
                  <input
                    className={field}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), void addNote())}
                    placeholder="Add a note, then press Enter"
                    maxLength={2000}
                  />
                  <button
                    type="button"
                    onClick={() => void addNote()}
                    disabled={!note.trim()}
                    className="shrink-0 rounded-xl border border-line px-4 text-sm text-sand hover:text-bone disabled:opacity-40"
                  >
                    Add
                  </button>
                </div>
                <ul className="mt-3 space-y-2">
                  {lead.notes.map((n) => (
                    <li
                      key={n.id}
                      className="group flex items-start justify-between gap-3 rounded-xl bg-ink p-3.5"
                    >
                      <div>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{n.text}</p>
                        <p className="mt-1 text-micro text-dust">{ago(n.at)}</p>
                      </div>
                      {confirmNote === n.id ? (
                        <span className="flex shrink-0 items-center gap-2 text-xs">
                          <span className="text-sand">Delete for good?</span>
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmNote(null);
                              void onPatch(lead.id, { removeNoteId: n.id });
                            }}
                            className="rounded-full bg-red-500/90 px-3 py-1 font-medium text-white"
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmNote(null)}
                            className="rounded-full border border-line px-3 py-1 text-sand"
                          >
                            Keep
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmNote(n.id)}
                          aria-label="Delete note"
                          className="text-dust opacity-0 transition-opacity hover:text-red-200 group-hover:opacity-100 focus:opacity-100"
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
                      )}
                    </li>
                  ))}
                </ul>
              </section>

              {lead.transcript && (
                <section>
                  <button
                    type="button"
                    onClick={() => setShowTranscript((v) => !v)}
                    className="eyebrow flex items-center gap-2 hover:text-brass"
                  >
                    Assistant conversation
                    <span>{showTranscript ? "−" : "+"}</span>
                  </button>
                  {showTranscript && (
                    <pre className="mt-3 max-h-80 overflow-y-auto whitespace-pre-wrap rounded-xl bg-ink p-4 font-sans text-xs leading-relaxed text-sand">
                      {lead.transcript}
                    </pre>
                  )}
                </section>
              )}
            </div>
          )}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-line p-4">
          {lead ? (
            confirmDelete ? (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-sand">Delete for good?</span>
                <button
                  type="button"
                  onClick={() => void onDelete(lead.id)}
                  className="rounded-full bg-red-500/90 px-3.5 py-1.5 font-medium text-white"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-full border border-line px-3.5 py-1.5 text-sand"
                >
                  Keep
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="text-xs text-dust hover:text-red-200"
              >
                Delete lead
              </button>
            )
          ) : (
            <span />
          )}
          <button
            type="submit"
            form="lead-form"
            disabled={saving || !dirty || !draft.name.trim()}
            className="rounded-full bg-brass px-6 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-brass-bright disabled:opacity-40"
          >
            {saving ? "Saving" : lead ? "Save changes" : "Create lead"}
          </button>
        </footer>
      </motion.aside>
    </>
  );
}

/** Slide-over for viewing, editing, or creating a lead. */
export function LeadDrawer(props: PanelProps) {
  const open = Boolean(props.lead) || props.creating;
  // Keyed by lead so opening a different one starts from a fresh form.
  return <AnimatePresence>{open && <Panel key={props.lead?.id ?? "new"} {...props} />}</AnimatePresence>;
}
