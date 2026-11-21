"use client";

import { createContext, useContext } from "react";
import type { Lead, Review, TrafficDay } from "@/lib/types";
import type { Range } from "./data";

export interface Status {
  ai: boolean;
  aiEnabled?: boolean;
  model: string;
  storage: boolean;
  previewMode: boolean;
}

export interface Crm {
  leads: Lead[];
  /** Daily site activity for the last 180 days, oldest first */
  traffic: TrafficDay[];
  reviews: Review[];
  status: Status | null;
  range: Range;
  setRange: (r: Range) => void;
  query: string;
  setQuery: (q: string) => void;
  openLead: (id: string) => void;
  newLead: () => void;
  patchLead: (id: string, body: Record<string, unknown>) => Promise<void>;
  setReviews: (fn: (reviews: Review[]) => Review[]) => void;
  notify: (message: string) => void;
  /** How many loaded records are samples */
  sampleCount: number;
  sampleBusy: boolean;
  samples: (action: "load" | "clear") => Promise<void>;
  exportCsv: () => void;
  signOut: () => Promise<void>;
}

export const CrmContext = createContext<Crm | null>(null);

export function useCrm(): Crm {
  const crm = useContext(CrmContext);
  if (!crm) throw new Error("useCrm must be used inside the dashboard");
  return crm;
}
