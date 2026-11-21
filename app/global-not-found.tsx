import type { Metadata } from "next";
import { ErrorPage } from "@/components/site/ErrorPage";
import { RootHtml } from "@/lib/root-layout";

export const metadata: Metadata = { title: "Page not found / Página no encontrada" };

export default function GlobalNotFound() {
  return (
    <RootHtml lang="en">
      <ErrorPage kind="notFound" code="404" />
    </RootHtml>
  );
}
