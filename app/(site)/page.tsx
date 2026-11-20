import type { Metadata } from "next";
import { Home } from "@/components/site/Home";

export const metadata: Metadata = {
  alternates: { canonical: "/", languages: { en: "/", es: "/es", "x-default": "/" } },
};

export default function HomePage() {
  return <Home locale="en" />;
}
