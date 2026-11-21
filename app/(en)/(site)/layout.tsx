import { SiteLayout } from "@/components/site/SiteLayout";

export default function Layout({ children }: LayoutProps<"/">) {
  return <SiteLayout>{children}</SiteLayout>;
}
