import type { WindowId } from "./site";

export const LOCALES = ["en", "es"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_NAMES: Record<Locale, string> = { en: "English", es: "Español" };

/** Where each language's home page lives. */
export const LOCALE_PATHS: Record<Locale, string> = { en: "/", es: "/es" };

export function localeFromPath(pathname: string | null): Locale {
  return pathname === "/es" || pathname?.startsWith("/es/") ? "es" : "en";
}

export const WINDOW_TEXT: Record<Locale, Record<WindowId, { label: string; range: string }>> = {
  en: {
    morning: { label: "Morning", range: "9 to 11am" },
    midday: { label: "Midday", range: "11am to 2pm" },
    afternoon: { label: "Afternoon", range: "2 to 5pm" },
  },
  es: {
    morning: { label: "Mañana", range: "9 a 11 a. m." },
    midday: { label: "Mediodía", range: "11 a. m. a 2 p. m." },
    afternoon: { label: "Tarde", range: "2 a 5 p. m." },
  },
};
