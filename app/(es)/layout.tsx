import { RootHtml } from "@/lib/root-layout";

export { metadata, viewport } from "@/lib/root-layout";

export default function SpanishRootLayout({ children }: LayoutProps<"/">) {
  return <RootHtml lang="es">{children}</RootHtml>;
}
