import type { Metadata } from "next";
import { Home } from "@/components/site/Home";
import { copy } from "@/lib/copy";
import { site } from "@/lib/site";

const t = copy.es.meta;

export const metadata: Metadata = {
  title: { absolute: t.title },
  description: t.description,
  alternates: { canonical: "/es", languages: { en: "/", es: "/es", "x-default": "/" } },
  openGraph: {
    title: site.name,
    description: t.tagline,
    siteName: site.name,
    type: "website",
    locale: "es_US",
    url: "/es",
  },
  twitter: { card: "summary_large_image", title: site.name, description: t.tagline },
};

/** The Spanish version of the site. */
export default function InicioPage() {
  return <Home locale="es" />;
}
