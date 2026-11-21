"use client";

import { useEffect } from "react";
import { ErrorPage } from "@/components/site/ErrorPage";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return <ErrorPage kind="error" onRetry={reset} code={error.digest} />;
}
