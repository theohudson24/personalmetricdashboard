"use client";

import Link from "next/link";
import { CheckCircle2, CircleDashed, Dumbbell, Flame, ListChecks, RefreshCw, Repeat2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { StatusLabel } from "@/components/ui/StatusLabel";

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

  return <Card variant="primary">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <CardHeader title="Today at a glance" description="The four daily areas that require action. Open a section for its detailed history and controls." />
      {unavailable ? <Button type="button" variant="secondary" onClick={() => router.refresh()}><RefreshCw size={16}/><span className="ml-2">Retry unavailable data</span></Button> : null}
    </div>
    <div className="grid border-y border-line/70 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = icons[item.key as keyof typeof icons] ?? CircleDashed;
        const statusTone = item.status === "complete" ? "positive" : item.status === "needs-attention" ? "critical" : item.status === "unavailable" ? "warning" : item.status === "in-progress" ? "active" : "neutral";
        return <Link key={item.key} href={item.href} className="group border-b border-line/70 p-4 transition-colors hover:bg-core/[0.04] md:[&:nth-child(odd)]:border-r xl:border-b-0 xl:border-r xl:last:border-r-0">
          <div className="flex items-start justify-between gap-3"><Icon size={18} className={item.status === "complete" ? "text-growth" : "text-core"}/><StatusLabel tone={statusTone}>{statusLabel[item.status]}</StatusLabel></div>
          <h2 className="mt-5 text-sm font-medium text-muted">{item.title}</h2>
          <p className="mt-1 text-xl font-semibold tracking-[-0.025em]">{item.value}</p>
          <p className="mt-2 min-h-10 text-sm leading-5 text-muted">{item.detail}</p>
          <p className="mt-3 text-sm font-semibold text-core group-hover:underline group-hover:underline-offset-4">{item.action} →</p>
        </Link>;
      })}
    </div>
    <div className="mt-5 border-l-2 border-core bg-core/[0.04] px-4 py-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-ink"><CheckCircle2 size={16} className="text-core"/>Next useful action</div>
      <p className="mt-1 text-sm leading-6 text-muted">{nextMove}</p>
    </div>
  </Card>;
}

export function DashboardCompletion({ value }: { value: number }) {
  return <div className="mt-4"><ProgressBar value={value} max={100} label={`${value}% of today's priorities complete`}/></div>;
}
