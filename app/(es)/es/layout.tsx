import { SiteLayout } from "@/components/site/SiteLayout";

export default function Layout({ children }: LayoutProps<"/es">) {
  return <SiteLayout>{children}</SiteLayout>;
}
