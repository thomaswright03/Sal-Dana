"use client";

import dynamic from "next/dynamic";

/**
 * The CRM is entirely per-owner, live data, so it renders in the browser only.
 * Nothing about it is prerendered or cached on the server.
 */
const CrmApp = dynamic(() => import("./CrmApp").then((m) => m.CrmApp), {
  ssr: false,
  loading: () => <p className="py-40 text-center text-sm text-dust">Loading your leads</p>,
});

export function CrmClient() {
  return <CrmApp />;
}
