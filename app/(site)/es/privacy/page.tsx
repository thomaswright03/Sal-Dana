import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";
import { legalDocs } from "@/lib/legal";

const doc = legalDocs.es.privacy;

export const metadata: Metadata = {
  title: doc.title,
  alternates: { canonical: "/es/privacy" },
};

export default function Page() {
  return <LegalPage locale="es" kind="privacy" />;
}
