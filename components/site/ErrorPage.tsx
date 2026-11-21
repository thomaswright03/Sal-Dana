import Link from "next/link";
import { site } from "@/lib/site";

const COPY = {
  en: {
    notFoundTitle: "That page isn't here",
    notFoundBody: "The link may be old or mistyped. Start from the home page, or reach Alan directly.",
    errorTitle: "Something went wrong",
    errorBody: "That's on our side. Try again, or reach Alan directly.",
    home: "Home",
    call: "Call",
    text: "Text",
    retry: "Try again",
  },
  es: {
    notFoundTitle: "Esa página no existe",
    notFoundBody: "El enlace puede ser viejo o tener un error. Empieza por el inicio o comunícate directo con Alan.",
    errorTitle: "Algo salió mal",
    errorBody: "Fue un problema de nuestro lado. Inténtalo de nuevo o comunícate directo con Alan.",
    home: "Inicio",
    call: "Llamar",
    text: "Mensaje",
    retry: "Intentar de nuevo",
  },
} as const;

const pill =
  "rounded-full border border-line px-5 py-3 text-sm text-sand transition-colors hover:border-brass hover:text-bone";

function Block({ lang, kind, onRetry }: { lang: "en" | "es"; kind: "notFound" | "error"; onRetry?: () => void }) {
  const c = COPY[lang];
  return (
    <section lang={lang} className="max-w-md">
      <h2 className="font-serif text-4xl leading-none tracking-tight">
        {kind === "notFound" ? c.notFoundTitle : c.errorTitle}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-sand">{kind === "notFound" ? c.notFoundBody : c.errorBody}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        {onRetry && (
          <button type="button" onClick={onRetry} className="rounded-full bg-brass px-5 py-3 text-sm font-medium text-ink hover:bg-brass-bright">
            {c.retry}
          </button>
        )}
        <Link href={lang === "es" ? "/es" : "/"} className={pill}>
          {c.home}
        </Link>
        <a href={site.phoneHref} className={pill}>
          {c.call} {site.phoneDisplay}
        </a>
        <a href={site.smsHref} className={pill}>
          {c.text}
        </a>
      </div>
    </section>
  );
}

/** Branded 404 / error screen in English and Spanish, in the site's dark style. */
export function ErrorPage({ kind, onRetry, code }: { kind: "notFound" | "error"; onRetry?: () => void; code?: string }) {
  return (
    <main className="flex min-h-dvh flex-col justify-center gap-12 px-6 py-16 sm:px-12 lg:px-24">
      <p className="eyebrow">
        {site.name}
        {code ? ` · ${code}` : ""}
      </p>
      <Block lang="en" kind={kind} onRetry={onRetry} />
      <Block lang="es" kind={kind} onRetry={onRetry} />
    </main>
  );
}
