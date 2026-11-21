"use client";

import type { AppointmentStatus, Lead } from "@/lib/types";
import { dayLabel } from "./format";
import { Icon } from "./ui";

const TONE: Record<AppointmentStatus, string> = {
  requested: "border-brass/40 bg-brass/10 text-brass",
  confirmed: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  completed: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  cancelled: "border-line bg-bone/5 text-dust",
};

const LABEL: Record<AppointmentStatus, string> = {
  requested: "To confirm",
  confirmed: "Confirmed",
  completed: "Done",
  cancelled: "Cancelled",
};

export function VisitPill({ status }: { status: AppointmentStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-micro ${TONE[status]}`}
    >
      <Icon
        name={status === "completed" ? "check" : status === "cancelled" ? "x" : "clock"}
        className="h-3 w-3"
      />
      {LABEL[status]}
    </span>
  );
}

/** The visit's state plus the one or two things the owner would do next. */
export function VisitStatus({
  lead,
  onChange,
}: {
  lead: Lead;
  onChange: (status: AppointmentStatus) => void;
}) {
  const a = lead.appointment;
  if (!a) return null;
  const action =
    "rounded-full border border-line px-3 py-1 text-micro text-sand transition-colors hover:border-brass/60 hover:text-bone";
  return (
    <span className="flex flex-wrap items-center gap-2">
      <VisitPill status={a.status} />
      {a.status === "requested" && (
        <button type="button" className={action} onClick={() => onChange("confirmed")}>
          Confirm
        </button>
      )}
      {a.status === "confirmed" && (
        <button type="button" className={action} onClick={() => onChange("completed")}>
          Mark done
        </button>
      )}
      {(a.status === "requested" || a.status === "confirmed") && (
        <button type="button" className={action} onClick={() => onChange("cancelled")}>
          Cancel
        </button>
      )}
    </span>
  );
}

/** A small calendar chip for lead cards. */
export function VisitBadge({ lead }: { lead: Lead }) {
  if (!lead.appointment || lead.appointment.status === "cancelled") return null;
  const a = lead.appointment;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-micro ${a.status === "requested" ? "bg-brass/15 text-brass" : "bg-bone/10 text-sand"}`}
    >
      <Icon name="schedule" className="h-3 w-3" />
      {dayLabel(a.date)}
      {a.status === "requested" && " · confirm"}
    </span>
  );
}
