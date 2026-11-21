import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";
import { legalDocs } from "@/lib/legal";

const doc = legalDocs.es.terms;

export const metadata: Metadata = {
  title: doc.title,
  alternates: { canonical: "/es/terms" },
};

export default function Page() {
  return <LegalPage locale="es" kind="terms" />;
}
