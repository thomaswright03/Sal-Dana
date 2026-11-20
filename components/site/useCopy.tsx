"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { copy, type Copy, type Heading } from "@/lib/copy";
import { localeFromPath, type Locale } from "@/lib/i18n";

/** The language of the page being viewed, read from its address (`/` or `/es`). */
export function useLocale(): Locale {
  return localeFromPath(usePathname());
}

export function useCopy(): Copy {
  return copy[useLocale()];
}

/** The two lines of a display heading, with its accented phrase in brass italics. */
export function headingLines(h: Heading): ReactNode[] {
  return [
    <>{h.first}</>,
    <>
      {h.lead ? `${h.lead} ` : null}
      <em className="text-brass">{h.accent}</em>
    </>,
  ];
}
