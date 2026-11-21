import Link from "next/link";
import { LEGAL_LABELS, legalDocs, LEGAL_PATHS } from "@/lib/legal";
import { LOCALE_PATHS, type Locale } from "@/lib/i18n";

/** Plain, readable page for the privacy policy and terms. */
export function LegalPage({ locale, kind }: { locale: Locale; kind: "privacy" | "terms" }) {
  const doc = legalDocs[locale][kind];
  const labels = LEGAL_LABELS[locale];
  const otherKind = kind === "privacy" ? "terms" : "privacy";
  return (
    <main id="top" className="shell py-32 sm:py-40">
      <article lang={locale} className="mx-auto max-w-2xl text-sand">
        <Link href={LOCALE_PATHS[locale]} className="text-sm text-brass hover:underline">
          ← {labels.back}
        </Link>
        <h1 className="mt-8 font-serif text-4xl tracking-tight text-bone sm:text-5xl">{doc.title}</h1>
        <p className="mt-3 text-sm text-dust">{doc.updated}</p>
        <p className="mt-8 leading-relaxed">{doc.intro}</p>
        {doc.sections.map((s) => (
          <section key={s.h} className="mt-10">
            <h2 className="text-lg font-medium text-bone">{s.h}</h2>
            {s.p.map((p) => (
              <p key={p} className="mt-3 leading-relaxed">
                {p.split("**").map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part))}
              </p>
            ))}
          </section>
        ))}
        <p className="mt-12 text-sm">
          <Link href={LEGAL_PATHS[locale][otherKind]} className="text-brass hover:underline">
            {labels[otherKind]}
          </Link>
        </p>
      </article>
    </main>
  );
}
