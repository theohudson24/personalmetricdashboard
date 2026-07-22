"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/app/auth/reset/actions";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function ResetRequestPage() {
  const [message, action, pending] = useActionState(requestPasswordReset, null);
  return <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-5 py-12"><h1 className="text-3xl font-semibold">Reset password</h1><p className="mt-2 text-muted">Request a time-limited recovery link for an approved private-beta account.</p><form action={action} className="mt-6 space-y-4 rounded-lg border border-line bg-black/15 p-5"><Field label="Email"><Input name="email" type="email" required autoComplete="email"/></Field>{message ? <p role="status" className="text-sm text-muted">{message}</p> : null}<Button disabled={pending}>{pending ? "Requesting…" : "Send recovery email"}</Button></form><Link className="mt-5 text-sm text-core underline" href="/login">Return to sign in</Link></main>;
}
