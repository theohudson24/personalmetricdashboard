"use client";

import { ErrorPanel } from "@/components/shared/ErrorPanel";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="en"><body><ErrorPanel error={error} reset={reset} global /></body></html>;
}
