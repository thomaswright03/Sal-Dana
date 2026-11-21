"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { localeFromPath } from "@/lib/i18n";
import { track, trackView } from "@/lib/track";

/** Counts page views and taps on the call, text and email links, and Renders nothing. */
export function Track() {
  const pathname = usePathname() ?? "/";

  const locale = localeFromPath(pathname);

  useEffect(() => {
    trackView(locale);
  }, [locale]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const href = (e.target as Element | null)?.closest?.("a[href]")?.getAttribute("href") ?? "";
      if (href.startsWith("tel:")) track("call");
      else if (href.startsWith("sms:")) track("text");
      else if (href.startsWith("mailto:")) track("email");
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
