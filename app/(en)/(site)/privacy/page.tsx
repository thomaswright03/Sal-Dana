import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";
import { legalDocs } from "@/lib/legal";

const doc = legalDocs.en.privacy;

export const metadata: Metadata = {
  title: doc.title,
  alternates: { canonical: "/privacy" },
};

export default function Page() {
  return <LegalPage locale="en" kind="privacy" />;
}
