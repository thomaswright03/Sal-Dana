"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.replace("/admin");
        return;
      }
      setError(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Couldn't sign in.");
    } catch {
      setError("Couldn't reach the server. Try again.");
    }
    setBusy(false);
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-[1.5rem] border border-line bg-coal p-8 sm:p-10">
        <p className="eyebrow mb-3">Sal Dana Renovations</p>
        <h1 className="font-serif text-4xl leading-none tracking-tight">Admin sign-in</h1>
        <p className="mt-4 text-sm text-sand">System status. This is not the owner dashboard password.</p>
        <label className="mt-8 block">
          <span className="eyebrow mb-2 block">Admin password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            autoFocus
            required
            className="w-full rounded-xl border border-line bg-ink px-4 py-3 text-bone outline-none focus:border-brass"
          />
        </label>
        {error && (
          <p role="alert" className="mt-4 rounded-xl border border-red-400/30 bg-red-400/5 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy || !password}
          className="mt-6 w-full rounded-full bg-brass py-3.5 text-sm font-medium text-ink hover:bg-brass-bright disabled:opacity-50"
        >
          {busy ? "Signing in" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
