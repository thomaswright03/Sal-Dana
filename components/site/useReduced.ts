"use client";

import { useReducedMotion } from "motion/react";
import { useMounted } from "@/lib/use-mounted";

/**
 * Reduced-motion preference that is false on the server and during hydration, then follows
 * the visitor's setting, so the first client render always matches the server HTML.
 */
export function useReduced(): boolean {
  const pref = useReducedMotion();
  return useMounted() && !!pref;
}
