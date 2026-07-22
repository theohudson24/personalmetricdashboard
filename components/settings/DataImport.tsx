"use client";

import { useRef, useState, type FormEvent } from "react";
import { Database, Upload } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Select } from "@/components/ui/Input";

type Source = "strong" | "cronometer";
type Totals = { added: number; updated: number; skipped: number; failed: number };
type BatchResponse = Totals & {
  rows: number;
  failures: string[];
  nextCursor: number;
  done: boolean;
  totalRecords?: number;
  totalWorkouts?: number;
  records?: number;
  workouts?: number;
};

const emptyTotals: Totals = { added: 0, updated: 0, skipped: 0, failed: 0 };

export function DataImport() {
  const strongRef = useRef<HTMLInputElement>(null);
  const summaryRef = useRef<HTMLInputElement>(null);
  const servingsRef = useRef<HTMLInputElement>(null);
  const biometricsRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<Source>("strong");
  const [pending, setPending] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totals, setTotals] = useState<Totals>(emptyTotals);
  const [failures, setFailures] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  function reset() {
    setCursor(0);
    setTotalRecords(0);
    setTotals(emptyTotals);
    setFailures([]);
    setStatus("idle");
    setMessage("");
  }

  function selectedFiles() {
    if (source === "strong") {
      const file = strongRef.current?.files?.[0];
      return file ? { file } : null;
    }
    const files = {
      dailySummary: summaryRef.current?.files?.[0],
      servings: servingsRef.current?.files?.[0],
      biometrics: biometricsRef.current?.files?.[0],
    };
    return Object.values(files).some(Boolean) ? files : null;
  }

  async function runImport(files: Record<string, File | undefined>, startingCursor: number, startingTotals: Totals, startingFailures: string[]) {
    setPending(true);
    setStatus("idle");
    setMessage(startingCursor ? `Resuming ${sourceName(source)} import…` : `Validating ${sourceName(source)} export…`);
    let nextCursor = startingCursor;
    let accumulated = startingTotals;
    let failureMessages = startingFailures;

    try {
      while (true) {
        const formData = new FormData();
        for (const [name, file] of Object.entries(files)) if (file) formData.set(name, file);
        formData.set("cursor", String(nextCursor));
        const endpoint = source === "strong" ? "/api/settings/strong-import" : "/api/settings/cronometer-import";
        const response = await fetch(endpoint, { method: "POST", body: formData, credentials: "same-origin" });
        let result: BatchResponse | { message?: string };
        try {
          result = await response.json() as BatchResponse | { message?: string };
        } catch {
          throw new Error("The server response was interrupted. Your completed batches remain saved.");
        }
        if (!response.ok || !("nextCursor" in result)) throw new Error("message" in result && result.message ? result.message : "The import could not continue.");

        accumulated = {
          added: accumulated.added + result.added,
          updated: accumulated.updated + result.updated,
          skipped: accumulated.skipped + result.skipped,
          failed: accumulated.failed + result.failed,
        };
        failureMessages = [...failureMessages, ...result.failures].slice(0, 10);
        nextCursor = result.nextCursor;
        const total = result.totalRecords ?? result.totalWorkouts ?? 0;
        setTotals(accumulated);
        setFailures(failureMessages);
        setCursor(nextCursor);
        setTotalRecords(total);

        if (result.done) {
          const recordCount = result.records ?? result.workouts ?? total;
          const summary = `${accumulated.added} added, ${accumulated.updated} updated, ${accumulated.skipped} skipped, ${accumulated.failed} failed`;
          const detail = failureMessages.length ? ` Review: ${failureMessages.join(" ")}` : "";
          setStatus(accumulated.failed ? "error" : "success");
          setMessage(`${sourceName(source)} import complete: ${summary}. ${result.rows} rows across ${recordCount} ${recordLabel(source)} processed.${detail}`);
          return;
        }
        setMessage(`Saved ${nextCursor} of ${total} ${recordLabel(source)}…`);
      }
    } catch (error) {
      setStatus("error");
      setMessage(`${error instanceof Error ? error.message : "The import was interrupted."} Choose Retry to continue from ${recordLabel(source)} ${nextCursor + 1}.`);
    } finally {
      setPending(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const files = selectedFiles();
    if (!files) {
      setStatus("error");
      setMessage(source === "strong" ? "Choose a Strong CSV export." : "Choose at least one Cronometer CSV export.");
      return;
    }
    const mayResume = cursor > 0 && cursor < totalRecords;
    void runImport(files, mayResume ? cursor : 0, mayResume ? totals : emptyTotals, mayResume ? failures : []);
  }

  const resumable = status === "error" && cursor > 0 && cursor < totalRecords;
  return (
    <Card>
      <CardHeader title="Import your data" description="Bring existing records into your private profile. Large histories are saved in retry-safe batches." />
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-medium">
          Import from
          <Select value={source} onChange={(event) => { setSource(event.target.value as Source); reset(); }} disabled={pending} className="mt-2 max-w-sm">
            <option value="strong">Strong</option>
            <option value="cronometer">Cronometer</option>
          </Select>
        </label>

        {source === "strong" ? (
          <FileField inputRef={strongRef} label="Strong workout CSV" help="Select the CSV exported from Strong." disabled={pending} onChange={reset} required />
        ) : (
          <div className="grid gap-3 lg:grid-cols-3">
            <FileField inputRef={summaryRef} label="Daily nutrition CSV" help="Usually named dailysummary.csv." disabled={pending} onChange={reset} />
            <FileField inputRef={servingsRef} label="Foods and recipes CSV" help="Usually named servings.csv." disabled={pending} onChange={reset} />
            <FileField inputRef={biometricsRef} label="Biometrics CSV" help="Usually named biometrics.csv." disabled={pending} onChange={reset} />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button disabled={pending}><Upload size={16} /><span className="ml-2">{pending ? "Importing…" : resumable ? "Retry import" : "Import / update"}</span></Button>
          <p className="flex items-center gap-2 text-xs text-muted"><Database size={14} />Imports are tied to your signed-in profile.</p>
        </div>
      </form>
      {totalRecords > 0 && cursor < totalRecords ? <div className="mt-4"><ProgressBar value={cursor} max={totalRecords} label={`${cursor} of ${totalRecords} ${recordLabel(source)} saved`} /></div> : null}
      {message ? <p className={`mt-3 text-sm ${status === "error" ? "text-ember" : "text-core"}`} role={status === "error" ? "alert" : "status"} aria-live="polite">{message}</p> : null}
    </Card>
  );
}

function FileField({ inputRef, label, help, disabled, onChange, required = false }: { inputRef: React.RefObject<HTMLInputElement | null>; label: string; help: string; disabled: boolean; onChange: () => void; required?: boolean }) {
  return <label className="block text-sm font-medium">{label}<input ref={inputRef} onChange={onChange} type="file" accept=".csv,text/csv" required={required} disabled={disabled} className="mt-2 block w-full rounded-md border border-line bg-ink/[0.025] p-3 text-sm" /><span className="mt-1 block text-xs font-normal text-muted">{help}</span></label>;
}

function sourceName(source: Source) { return source === "strong" ? "Strong" : "Cronometer"; }
function recordLabel(source: Source) { return source === "strong" ? "workout groups" : "dates"; }
