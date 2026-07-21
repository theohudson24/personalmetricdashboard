"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updateRecoveredPassword } from "@/app/auth/reset/actions";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function ResetPasswordPage() {
  const [message, action, pending] = useActionState(updateRecoveredPassword, null);
  return <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-5 py-12"><h1 className="text-3xl font-semibold">Choose a new password</h1><form action={action} className="mt-6 space-y-4 rounded-lg border border-line bg-black/15 p-5"><Field label="New password"><Input name="password" type="password" minLength={12} required autoComplete="new-password"/></Field><Field label="Confirm password"><Input name="confirmation" type="password" minLength={12} required autoComplete="new-password"/></Field>{message ? <p role="status" className="text-sm text-muted">{message}</p> : null}<Button disabled={pending}>{pending ? "Updating…" : "Update password"}</Button></form><Link className="mt-5 text-sm text-core underline" href="/login">Return to sign in</Link></main>;
}
