export type Status = "ok" | "warning" | "down" | "unknown";
export type Tier = "important" | "key" | "basic";

/** One checked function, in the shape the CAO reads from /admin/status.json. */
interface StatusFunction {
  tier: Tier;
  name: string;
  status: Status;
  /** ISO time of the check */
  last_checked: string | null;
  /** ISO time it last worked, or null */
  last_success: string | null;
  /** ISO time a scheduled job is next due, or null for things that aren't scheduled */
  next_expected_run: string | null;
  /** Empty when the status is ok */
  detail: string;
}

export interface StatusReport {
  product: string;
  checked_at: string;
  /** Worst status among the Important functions */
  overall: Status;
  functions: StatusFunction[];
}
