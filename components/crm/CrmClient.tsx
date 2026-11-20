"use client";

import dynamic from "next/dynamic";

/**
 * The dashboard is entirely per-owner, live data, so it renders in the browser only.
 * Nothing about it is prerendered or cached on the server.
 */
const Dashboard = dynamic(() => import("./Dashboard").then((m) => m.Dashboard), {
  ssr: false,
  loading: () => <p className="py-40 text-center text-sm text-dust">Loading your dashboard</p>,
});

export function CrmClient() {
  return <Dashboard />;
}
