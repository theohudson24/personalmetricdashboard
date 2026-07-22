import { PageHeader } from "@/components/layout/PageHeader";
import { BugReportForm } from "@/components/shared/BugReportForm";
import { Card } from "@/components/ui/Card";
import { getDefaultProfile } from "@/lib/profile";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ReportBugPage({ searchParams }: { searchParams: Promise<{ page?: string; reference?: string }> }) {
  const profile = await getDefaultProfile();
  const params = await searchParams;
  const reports = await prisma.bugReport.findMany({ where: { profileId: profile.id }, select: { id: true, summary: true, status: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 5 });
  return <div><PageHeader eyebrow="Testing feedback" title="Report a bug" description="Tell us what happened so the problem can be reproduced and fixed."/><div className="mx-auto grid max-w-3xl gap-4"><Card><BugReportForm initialPage={params.page ?? ""} errorReference={params.reference ?? ""} draftScope={profile.id}/></Card>{reports.length ? <Card className="p-3 sm:p-3"><details><summary className="cursor-pointer text-sm font-medium">My reports <span className="text-muted">({reports.length})</span></summary><div className="mt-2 divide-y divide-line">{reports.map((report) => <div key={report.id} className="flex items-center justify-between gap-3 py-2 text-xs"><span className="truncate">{report.summary}</span><span className="shrink-0 text-muted">{report.status.toLowerCase()} · {report.id.slice(-8).toUpperCase()}</span></div>)}</div></details></Card> : null}</div></div>;
}
