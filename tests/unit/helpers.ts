import { site } from "@/lib/site";

/** The next working day at least `ahead` days from now, as YYYY-MM-DD (Arizona calendar, noon UTC to avoid edges). */
export function futureWorkingDay(ahead = 3): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + ahead);
  while (!(site.workingDays as readonly number[]).includes(d.getUTCDay())) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** The next non-working day (if any) at least 3 days ahead. */
export function futureClosedDay(): string | null {
  for (let i = 3; i < 12; i++) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + i);
    if (!(site.workingDays as readonly number[]).includes(d.getUTCDay())) return d.toISOString().slice(0, 10);
  }
  return null;
}
