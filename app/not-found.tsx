import type { Metadata } from "next";
import { ErrorPage } from "@/components/site/ErrorPage";

export const metadata: Metadata = { title: "Page not found / Página no encontrada" };

export default function NotFound() {
  return <ErrorPage kind="notFound" code="404" />;
}
