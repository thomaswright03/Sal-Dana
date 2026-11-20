import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "./auth";
import { StorageNotConfiguredError } from "./store";

/** Defence in depth: route handlers re-check the session the proxy already checked. */
export async function requireOwner(): Promise<NextResponse | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (verifySessionToken(token)) return null;
  return NextResponse.json({ error: "Not signed in" }, { status: 401 });
}

export function storageError(err: unknown): NextResponse {
  if (err instanceof StorageNotConfiguredError) {
    return NextResponse.json({ error: err.message, code: "storage" }, { status: 503 });
  }
  console.error("crm storage error", err);
  return NextResponse.json({ error: "Something went wrong talking to storage." }, { status: 500 });
}
