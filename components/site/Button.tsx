import type { ReactNode } from "react";
import { Magnetic } from "./Magnetic";

const base =
  "group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full px-7 py-4 text-small font-medium tracking-wide transition-colors duration-500";

const variants = {
  solid: "bg-bone text-ink",
  ghost: "border border-bone/20 text-bone hover:border-brass/60",
} as const;

/** Pill button with a brass fill that sweeps up from below on hover. */
export function Button({
  children,
  href,
  variant = "solid",
  type,
  disabled,
  className = "",
}: {
  children: ReactNode;
  href?: string;
  variant?: keyof typeof variants;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  const inner = (
    <>
      <span
        aria-hidden
        className="absolute inset-0 translate-y-[101%] rounded-full bg-brass transition-transform duration-700 ease-out-expo group-hover:translate-y-0"
      />
      <span className="relative z-10 flex items-center gap-3 transition-colors duration-500 group-hover:text-ink">
        {children}
        <Arrow />
      </span>
    </>
  );
  const cls = `${base} ${variants[variant]} ${className}`;
  return (
    <Magnetic strength={0.25}>
      {href ? (
        <a href={href} className={cls} data-cursor="hover">
          {inner}
        </a>
      ) : (
        <button
          type={type ?? "button"}
          disabled={disabled}
          className={`${cls} disabled:opacity-60`}
          data-cursor="hover"
        >
          {inner}
        </button>
      )}
    </Magnetic>
  );
}

function Arrow({ className = "" }: { className?: string }) {
  return (
    <span className={`relative block h-3 w-3 overflow-hidden ${className}`} aria-hidden>
      <svg
        viewBox="0 0 12 12"
        className="absolute inset-0 transition-transform duration-500 ease-out-expo group-hover:translate-x-3 group-hover:-translate-y-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      >
        <path d="M2 10 10 2M4 2h6v6" />
      </svg>
      <svg
        viewBox="0 0 12 12"
        className="absolute inset-0 -translate-x-3 translate-y-3 transition-transform duration-500 ease-out-expo group-hover:translate-x-0 group-hover:translate-y-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      >
        <path d="M2 10 10 2M4 2h6v6" />
      </svg>
    </span>
  );
}
