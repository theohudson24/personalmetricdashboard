"use client";

import { useRef, useState, type FormEvent } from "react";
import { Upload } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";

type ImportBatch = {
  added: number;
  updated: number;
  skipped: number;
  failed: number;
  rows: number;
  workouts: number;
  failures: string[];
  nextCursor: number;
  totalWorkouts: number;
  done: boolean;
};

type Totals = Pick<ImportBatch, "added" | "updated" | "skipped" | "failed">;
const emptyTotals: Totals = { added: 0, updated: 0, skipped: 0, failed: 0 };

export function StrongImport() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [totals, setTotals] = useState<Totals>(emptyTotals);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  async function runImport(file: File, startingCursor: number, startingTotals: Totals) {
    setPending(true);
    setStatus("idle");
    setMessage(startingCursor ? "Resuming Strong import…" : "Validating Strong export…");
    let nextCursor = startingCursor;
    let accumulated = startingTotals;

    try {
      while (true) {
        const formData = new FormData();
        formData.set("file", file);
        formData.set("cursor", String(nextCursor));
        const response = await fetch("/api/settings/strong-import", { method: "POST", body: formData });
        const result = await response.json() as ImportBatch | { message?: string };
        if (!response.ok || !("nextCursor" in result)) {
          throw new Error("message" in result && result.message ? result.message : "The import could not continue.");
        }

        accumulated = {
          added: accumulated.added + result.added,
          updated: accumulated.updated + result.updated,
          skipped: accumulated.skipped + result.skipped,
          failed: accumulated.failed + result.failed,
        };
        nextCursor = result.nextCursor;
        setTotals(accumulated);
        setCursor(nextCursor);
        setTotalWorkouts(result.totalWorkouts);

        if (result.done) {
          const summary = `${accumulated.added} added, ${accumulated.updated} updated, ${accumulated.skipped} skipped, ${accumulated.failed} failed`;
          const failureDetail = result.failures.length ? ` Review: ${result.failures.join(" ")}` : "";
          setStatus(accumulated.failed ? "error" : "success");
          setMessage(`Strong import complete: ${summary}. ${result.rows} rows across ${result.workouts} workout groups processed.${failureDetail}`);
          return;
        }
        setMessage(`Imported ${nextCursor} of ${result.totalWorkouts} workout groups…`);
      }
    } catch (error) {
      setStatus("error");
      setMessage(`${error instanceof Error ? error.message : "The import was interrupted."} Choose Retry to continue from workout ${nextCursor + 1}.`);
    } finally {
      setPending(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setStatus("error");
      setMessage("Choose a CSV exported from Strong.");
      return;
    }
    const mayResume = cursor > 0 && cursor < totalWorkouts;
    void runImport(file, mayResume ? cursor : 0, mayResume ? totals : emptyTotals);
  }

  function fileChanged() {
    setCursor(0);
    setTotalWorkouts(0);
    setTotals(emptyTotals);
    setStatus("idle");
    setMessage("");
  }

  const resumable = status === "error" && cursor > 0 && cursor < totalWorkouts;
  return (
    <Card>
      <CardHeader title="Import Strong workout data" description="Upload a Strong CSV export. Large histories import in safe batches; interrupted imports can resume without duplicating workouts." />
      <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
        <label className="min-w-64 flex-1 text-sm font-medium">
          Strong CSV
          <input ref={fileRef} onChange={fileChanged} name="file" type="file" accept=".csv,text/csv" required disabled={pending} className="mt-2 block w-full rounded-md border border-line bg-ink/[0.025] p-3 text-sm" />
        </label>
        <Button disabled={pending}>
          <Upload size={16} />
          <span className="ml-2">{pending ? "Importing…" : resumable ? "Retry import" : "Import / update"}</span>
        </Button>
      </form>
      {totalWorkouts > 0 && cursor < totalWorkouts ? <div className="mt-4"><ProgressBar value={cursor} max={totalWorkouts} label={`${cursor} of ${totalWorkouts} workout groups saved`} /></div> : null}
      {message ? <p className={`mt-3 text-sm ${status === "error" ? "text-ember" : "text-core"}`} role={status === "error" ? "alert" : "status"} aria-live="polite">{message}</p> : null}
    </Card>
  );
}
