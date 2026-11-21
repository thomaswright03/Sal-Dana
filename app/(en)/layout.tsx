import { RootHtml } from "@/lib/root-layout";

export { metadata, viewport } from "@/lib/root-layout";

export default function EnglishRootLayout({ children }: LayoutProps<"/">) {
  return <RootHtml lang="en">{children}</RootHtml>;
}
