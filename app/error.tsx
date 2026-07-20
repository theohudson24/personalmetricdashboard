"use client";

import { useEffect } from "react";
import { ErrorPanel } from "@/components/shared/ErrorPanel";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <ErrorPanel error={error} reset={reset} />;
}
