"use client";

import Link from "next/link";
import { CheckCircle2, CircleDashed, Dumbbell, Flame, ListChecks, RefreshCw, Repeat2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";

export type DailyStatus = "complete" | "in-progress" | "not-started" | "needs-attention" | "unavailable";
export type StatusItem = {
  key: string;
  title: string;
  status: DailyStatus;
  value: string;
  detail: string;
  href: string;
  action: string;
};

const statusLabel: Record<DailyStatus, string> = {
  complete: "Complete", "in-progress": "In progress", "not-started": "Not started",
  "needs-attention": "Needs attention", unavailable: "Unavailable",
};

export function DashboardStatusOverview({ items, nextMove }: { items: StatusItem[]; nextMove: string }) {
  const router = useRouter();
  const unavailable = items.some((item) => item.status === "unavailable");
  const icons = { priorities: ListChecks, habits: Repeat2, nutrition: Flame, workout: Dumbbell };

  return <Card>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <CardHeader title="Today at a glance" description="The four daily areas that require action. Open a section for its detailed history and controls." />
      {unavailable ? <Button type="button" variant="secondary" onClick={() => router.refresh()}><RefreshCw size={16}/><span className="ml-2">Retry unavailable data</span></Button> : null}
    </div>
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = icons[item.key as keyof typeof icons] ?? CircleDashed;
        const tone = item.status === "complete" ? "border-growth/40 bg-growth/10" : item.status === "needs-attention" ? "border-ember/40 bg-ember/10" : item.status === "unavailable" ? "border-pulse/40 bg-pulse/10" : "border-line bg-black/15";
        return <Link key={item.key} href={item.href} className={`rounded-lg border p-4 transition hover:border-core/50 ${tone}`}>
          <div className="flex items-start justify-between gap-3"><Icon size={20} className={item.status === "complete" ? "text-growth" : "text-core"}/><span className="rounded-full bg-black/20 px-2 py-1 text-[11px] font-semibold text-muted">{statusLabel[item.status]}</span></div>
          <h2 className="mt-4 font-semibold">{item.title}</h2>
          <p className="mt-1 text-xl font-semibold">{item.value}</p>
          <p className="mt-2 min-h-10 text-sm leading-5 text-muted">{item.detail}</p>
          <p className="mt-3 text-sm font-semibold text-core">{item.action} →</p>
        </Link>;
      })}
    </div>
    <div className="mt-4 rounded-md border border-core/25 bg-core/10 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-core"><CheckCircle2 size={17}/>Next useful action</div>
      <p className="mt-1 text-sm leading-6 text-muted">{nextMove}</p>
    </div>
  </Card>;
}

export function DashboardCompletion({ value }: { value: number }) {
  return <div className="mt-4"><ProgressBar value={value} max={100} label={`${value}% of today's priorities complete`}/></div>;
}
