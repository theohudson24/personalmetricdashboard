"use client";
import { useActionState } from "react";
import { Upload } from "lucide-react";
import { uploadStrongCsv } from "@/app/settings/actions";
import { idleSettingsState } from "@/lib/actionStates";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
export function StrongImport() { const [state, action, pending] = useActionState(uploadStrongCsv, idleSettingsState); return <Card><CardHeader title="Import Strong workout data" description="Upload a Strong CSV export. Existing Strong workouts with the same date and name are refreshed; new workouts are added."/><form action={action} className="flex flex-wrap items-end gap-3"><label className="min-w-64 flex-1 text-sm font-medium">Strong CSV<input name="file" type="file" accept=".csv,text/csv" required className="mt-2 block w-full rounded-md border border-line bg-black/15 p-3 text-sm"/></label><Button disabled={pending}><Upload size={16}/><span className="ml-2">{pending ? "Importing…" : "Import / update"}</span></Button></form>{state.message ? <p className={`mt-3 text-sm ${state.status === "error" ? "text-ember" : "text-core"}`} role="status">{state.message}</p> : null}</Card>; }
