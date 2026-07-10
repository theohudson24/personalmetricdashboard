"use client";

import { useActionState } from "react";
import { signIn } from "@/app/login/actions";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";

export function LoginForm() {
  const [signInMessage, signInAction, signingIn] = useActionState(signIn, null);
  return (
    <div>
      <form action={signInAction} className="space-y-4 rounded-lg border border-line bg-black/15 p-5">
        <h2 className="text-lg font-semibold">Sign in</h2>
        <Field label="Email"><Input name="email" type="email" autoComplete="email" required /></Field>
        <Field label="Password"><Input name="password" type="password" autoComplete="current-password" minLength={12} required /></Field>
        {signInMessage ? <p className="text-sm text-muted" role="status">{signInMessage}</p> : null}
        <Button disabled={signingIn}>{signingIn ? "Signing in…" : "Sign in"}</Button>
      </form>
    </div>
  );
}
