import { windows, type WindowId } from "@/lib/site";
import type { Lead, LeadStatus } from "@/lib/types";

export const money = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Phoenix" });

export function dayLabel(date: string, long = false): string {
  const t = today();
  if (date === t) return "Today";
  const tomorrow = new Date(`${t}T12:00:00Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  if (date === tomorrow.toISOString().slice(0, 10)) return "Tomorrow";
  return new Intl.DateTimeFormat("en-US", {
    weekday: long ? "long" : "short",
    month: long ? "long" : "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

export function windowText(id: WindowId): string {
  const w = windows.find((x) => x.id === id);
  return w ? `${w.label}, ${w.range}` : id;
}

export function ago(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export const STATUS_TONE: Record<LeadStatus, string> = {
  new: "bg-brass text-ink",
  contacted: "bg-sky-400/15 text-sky-200",
  quoted: "bg-violet-400/15 text-violet-200",
  scheduled: "bg-amber-400/15 text-amber-200",
  won: "bg-emerald-400/15 text-emerald-200",
  lost: "bg-bone/10 text-sand",
};

export function toCsv(leads: Lead[]): string {
  const esc = (v: unknown) => {
    let s = String(v ?? "");
    // Stop spreadsheet apps from treating visitor-typed text as a formula.
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const head = [
    "Created",
    "Name",
    "Phone",
    "Email",
    "Address",
    "Service",
    "Details",
    "Source",
    "Status",
    "Value",
    "Visit date",
    "Visit window",
    "Visit status",
  ];
  const rows = leads.map((l) =>
    [
      l.createdAt,
      l.name,
      l.phone,
      l.email,
      l.address,
      l.service,
      l.details,
      l.source,
      l.status,
      l.value ?? "",
      l.appointment?.date ?? "",
      l.appointment?.window ?? "",
      l.appointment?.status ?? "",
    ]
      .map(esc)
      .join(","),
  );
  return [head.map(esc).join(","), ...rows].join("\r\n");
}
