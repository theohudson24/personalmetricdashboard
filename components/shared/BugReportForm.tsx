"use client";

import { useActionState, useEffect, useState } from "react";
import { Send } from "lucide-react";
import { createBugReport, idleBugReportState } from "@/app/report-bug/actions";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";

export function BugReportForm({ initialPage = "", errorReference = "" }: { initialPage?: string; errorReference?: string }) {
  const [state, action, pending] = useActionState(createBugReport, idleBugReportState);
  const [deviceInfo, setDeviceInfo] = useState("");
  useEffect(() => { setDeviceInfo(`${navigator.userAgent}; screen ${window.screen.width}x${window.screen.height}`); }, []);
  return <form action={action} className="space-y-4">
    <input type="hidden" name="deviceInfo" value={deviceInfo} />
    <Field label="Area affected"><Select name="category" defaultValue="OTHER"><option value="NUTRITION">Meals and nutrition</option><option value="WORKOUTS">Gym and workouts</option><option value="HABITS">Habits</option><option value="ACCOUNT">Settings and account</option><option value="LOGIN">Login or logout</option><option value="OTHER">Other</option></Select></Field>
    <Field label="Short title"><Input name="summary" required minLength={5} maxLength={120} placeholder="What went wrong?" /></Field>
    <Field label="What happened?"><Textarea name="description" required minLength={10} maxLength={4000} defaultValue={errorReference ? `Error reference: ${errorReference}\n\nWhat I was doing:\n\nWhat I expected:\n\nWhat happened:` : ""} placeholder="Include what you tapped, what you expected, and what appeared instead." /></Field>
    <Field label="Page or screen"><Input name="pageUrl" defaultValue={initialPage} maxLength={500} placeholder="/meals" /></Field>
    <p className="text-xs text-muted">Your browser and screen size are included automatically. Passwords, form contents, and private health records are not collected.</p>
    <div className="flex flex-wrap items-center gap-3"><Button disabled={pending}><Send size={16}/><span className="ml-2">{pending ? "Sending…" : "Send bug report"}</span></Button>{state.message ? <p role="status" className={`text-sm ${state.status === "error" ? "text-ember" : "text-core"}`}>{state.message}{state.reference ? ` Reference: ${state.reference}` : ""}</p> : null}</div>
  </form>;
}
