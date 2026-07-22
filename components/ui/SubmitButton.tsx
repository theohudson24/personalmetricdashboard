"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";

export function SubmitButton({ idle, pending = "Saving…", className = "" }: { idle: string; pending?: string; className?: string }) {
  const status = useFormStatus();
  return <Button className={className} disabled={status.pending} aria-disabled={status.pending}>{status.pending ? pending : idle}</Button>;
}
