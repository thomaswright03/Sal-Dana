import type { TrafficEvent } from "./types";

/**
 * Browser side of the site's own visit counter. Sends anonymous counts only:
 * no cookies, no identifiers, nothing that follows a person between visits.
 */

function post(body: Record<string, unknown>) {
  try {
    const data = JSON.stringify(body);
    // keepalive lets the request finish even when the tap leaves the page (a call link, say).
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: data,
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    /* counting must never get in a visitor's way */
  }
}

const once = new Set<string>();

/** Counts something a visitor did. `oncePerPage` events are sent a single time per page load. */
export function track(event: TrafficEvent, oncePerPage = false) {
  if (oncePerPage) {
    if (once.has(event)) return;
    once.add(event);
  }
  post({ kind: "event", event });
}

export function trackView(lang: "en" | "es") {
  let first = true;
  try {
    first = !sessionStorage.getItem("sd-seen");
    sessionStorage.setItem("sd-seen", "1");
  } catch {
    /* storage unavailable: count the visit */
  }
  let ref = "";
  try {
    // Only the referring site's address is sent, never the full page it came from.
    if (document.referrer && new URL(document.referrer).host !== location.host) {
      ref = new URL(document.referrer).origin;
    }
  } catch {
    /* unreadable referrer */
  }
  const utm = new URLSearchParams(location.search).get("utm_source")?.slice(0, 80) ?? "";
  post({ kind: "view", first, lang, ref, utm });
}
