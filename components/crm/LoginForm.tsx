"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/crm/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.replace("/crm");
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Couldn't sign in. Try again.");
    } catch {
      setError("Couldn't reach the server. Try again.");
    }
    setBusy(false);
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-6">
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brass/10 blur-[120px]"
        aria-hidden
      />
      <motion.form
        onSubmit={onSubmit}
        className="relative w-full max-w-sm rounded-[1.5rem] border border-line bg-coal p-8 sm:p-10"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="eyebrow mb-3">Sal Dana Renovations</p>
        <h1 className="font-serif text-5xl leading-none tracking-tight">Owner sign-in</h1>
        <p className="mt-4 text-sm leading-relaxed text-sand">
          Leads, visits, and your pipeline in one place.
        </p>

        <label className="mt-8 block">
          <span className="eyebrow mb-2 block">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            autoFocus
            required
            className="w-full rounded-xl border border-line bg-ink px-4 py-3 text-bone outline-none transition-colors focus:border-brass"
          />
        </label>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-red-400/30 bg-red-400/5 px-4 py-3 text-sm text-red-200"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || !password}
          className="mt-6 w-full rounded-full bg-brass py-3.5 text-sm font-medium text-ink transition-colors hover:bg-brass-bright disabled:opacity-50"
        >
          {busy ? "Signing in" : "Sign in"}
        </button>
        <Link
          href="/"
          className="mt-6 block text-center text-xs text-dust transition-colors hover:text-brass"
        >
          Back to the website
        </Link>
      </motion.form>
    </main>
  );
}
