"use client";

import { useActionState, useState } from "react";
import { LogOut, ShieldCheck, UserRound } from "lucide-react";
import { updateAccount } from "@/app/settings/actions";
import { idleSettingsState } from "@/lib/actionStates";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { clearAllDrafts } from "@/lib/clientDraft";

export function AccountSettings({ account }: { account: { displayName: string; email: string; emailVerified: boolean; phone: string } }) {
  const [state, action, pending] = useActionState(updateAccount, idleSettingsState);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  async function logOut() {
    setLoggingOut(true); setLogoutError("");
    try { const response = await fetch("/api/auth/logout", { method: "POST" }); if (!response.ok) throw new Error("Logout failed"); clearAllDrafts(); window.location.replace("/login"); }
    catch { setLogoutError("Logout failed. Your session remains active; refresh and try again."); setLoggingOut(false); }
  }
  return <Card>
    <CardHeader title="Profile and account" description="Profile information is stored separately from verified Supabase sign-in details."/>
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <Field label="Account name"><Input name="displayName" defaultValue={account.displayName} required maxLength={80}/></Field>
      <Field label="Email"><Input name="email" type="email" defaultValue={account.email} required/><span className={`mt-1 flex items-center gap-1 text-xs ${account.emailVerified ? "text-growth" : "text-pulse"}`}><ShieldCheck size={13}/>{account.emailVerified ? "Verified by Supabase" : "Not yet verified"}</span></Field>
      <Field label="Contact phone (unverified)"><Input name="phone" type="tel" defaultValue={account.phone} placeholder="+15555555555"/><span className="mt-1 block text-xs text-muted">Stored for your profile only. It is not used for sign-in and is not SMS-verified.</span></Field>
      <div />
      <Field label="Current password"><Input name="currentPassword" type="password" autoComplete="current-password" placeholder="Required only to change password"/></Field>
      <Field label="New password"><Input name="password" type="password" autoComplete="new-password" minLength={12} placeholder="At least 12 characters"/></Field>
      <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3"><Button disabled={pending}><UserRound size={16}/><span className="ml-2">{pending ? "Updating…" : "Update account"}</span></Button>{state.message ? <p className={`text-sm ${state.status === "error" ? "text-ember" : "text-core"}`} role="status">{state.message}</p> : null}</div>
    </form>
    <div className="mt-5 border-t border-line pt-5"><Button type="button" variant="secondary" onClick={() => void logOut()} disabled={loggingOut}><LogOut size={16}/><span className="ml-2">{loggingOut ? "Logging out…" : "Log out of this account"}</span></Button>{logoutError ? <p className="mt-2 text-sm text-ember" role="alert">{logoutError}</p> : null}</div>
  </Card>;
}
