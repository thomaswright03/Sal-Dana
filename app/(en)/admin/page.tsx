import type { Metadata } from "next";
import { AdminStatus } from "@/components/admin/AdminStatus";

export const metadata: Metadata = { title: "Admin status", robots: { index: false, follow: false } };

export default function AdminPage() {
  return <AdminStatus />;
}
