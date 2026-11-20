import type { ReactNode } from "react";
import { CrmClient } from "@/components/crm/CrmClient";

/**
 * One dashboard for every section. It stays mounted while the owner moves
 * between /crm, /crm/leads and the rest, so data loads once and the sidebar
 * animates instead of reloading. The section shown is read from the address.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <CrmClient />
      {children}
    </>
  );
}
