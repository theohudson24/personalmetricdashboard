import { PageHeader } from "@/components/layout/PageHeader";
import { BugReportForm } from "@/components/shared/BugReportForm";
import { Card } from "@/components/ui/Card";
import { getDefaultProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export default async function ReportBugPage({ searchParams }: { searchParams: Promise<{ page?: string; reference?: string }> }) {
  await getDefaultProfile();
  const params = await searchParams;
  return <div><PageHeader eyebrow="Testing feedback" title="Report a bug" description="Tell us what happened so the problem can be reproduced and fixed."/><Card className="mx-auto max-w-3xl"><BugReportForm initialPage={params.page ?? ""} errorReference={params.reference ?? ""}/></Card></div>;
}
