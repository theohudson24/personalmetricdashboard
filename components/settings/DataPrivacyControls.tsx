"use client";

import { Download, Trash2 } from "lucide-react";
import { useActionState } from "react";
import { cancelAccountDeletion, requestAccountDeletion } from "@/app/settings/data-actions";
import { idleDeletionState } from "@/lib/actionStates";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, Input, Textarea } from "@/components/ui/Input";

export function DataPrivacyControls({ request }: { request: { id: string; status: string } | null }) {
  const [state, action, pending] = useActionState(requestAccountDeletion, idleDeletionState);
  return <Card><CardHeader title="Your data" description="Download a complete copy or request administrator-reviewed account deletion."/>
    <a href="/api/account/export" className="inline-flex min-h-11 items-center rounded-md border border-core bg-core px-4 text-sm font-medium text-[#07100d]"><Download size={16}/><span className="ml-2">Download ZIP export</span></a>
    <details className="mt-4 rounded-md border border-ember/30 p-3"><summary className="cursor-pointer text-sm font-medium text-ember">Request account deletion</summary>
      {request ? <div className="mt-3 text-sm"><p>Status: <span className="font-semibold">{request.status.toLowerCase()}</span></p>{request.status === "REQUESTED" ? <form action={cancelAccountDeletion} className="mt-2"><input type="hidden" name="id" value={request.id}/><Button variant="secondary">Cancel request</Button></form> : null}</div> : <form action={action} className="mt-3 space-y-3"><Field label="Why are you leaving? (optional)"><Textarea name="reason" maxLength={1000}/></Field><Field label="Type REQUEST DELETION"><Input name="confirmation" required autoComplete="off"/></Field><p className="text-xs text-muted">This submits a review request only. It does not immediately delete your data or Supabase login.</p><Button disabled={pending} className="border-ember bg-ember text-white hover:bg-ember/80"><Trash2 size={16}/><span className="ml-2">{pending ? "Submitting…" : "Submit deletion request"}</span></Button></form>}
      {state.message ? <p className={`mt-2 text-sm ${state.status === "error" ? "text-ember" : "text-core"}`}>{state.message}</p> : null}
    </details>
  </Card>;
}
