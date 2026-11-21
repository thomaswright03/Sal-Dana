export type Status = "ok" | "warning" | "down" | "unknown";
export type Tier = "important" | "key" | "basic";

export interface StatusItem {
  id: string;
  label: string;
  status: Status;
  /** ISO time of the check, or null */
  lastChecked: string | null;
  /** ISO time it last worked, or null */
  lastSuccess: string | null;
  detail: string;
}

export interface StatusReport {
  project: string;
  overall: Status;
  checkedAt: string;
  version: { commit: string | null; deployedAt: string | null };
  groups: { tier: Tier; items: StatusItem[] }[];
}

