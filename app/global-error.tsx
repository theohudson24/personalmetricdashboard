"use client";

import { useEffect } from "react";
import { ErrorPanel } from "@/components/shared/ErrorPanel";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <html lang="en"><body><ErrorPanel error={error} reset={reset} global /></body></html>;
}
