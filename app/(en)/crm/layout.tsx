import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CRM",
  robots: { index: false, follow: false },
};

export default function CrmLayout({ children }: LayoutProps<"/crm">) {
  return <div className="min-h-dvh bg-ink text-bone">{children}</div>;
}
