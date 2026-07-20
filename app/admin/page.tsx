import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select, Textarea } from "@/components/ui/Input";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateBugReport, updateDeletionRequest, updateErrorEvent } from "@/app/admin/actions";

export const dynamic = "force-dynamic";
const statuses = ["OPEN", "INVESTIGATING", "RESOLVED", "ARCHIVED"];

export default async function AdminPage() {
  await requireAdmin();
  const [reports, errors, deletions] = await Promise.all([
    prisma.bugReport.findMany({ include: { profile: { select: { displayName: true } } }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.errorEvent.findMany({ include: { profile: { select: { displayName: true } } }, orderBy: { lastSeenAt: "desc" }, take: 100 }),
    prisma.accountDeletionRequest.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
  ]);
  return <div><PageHeader eyebrow="Private administration" title="Testing operations" description="Review tester feedback, privacy-filtered errors, and account deletion requests."/><div className="grid gap-5">
    <Card><CardHeader title="Bug reports" description="Archive instead of deleting so the testing history remains useful."/>{reports.length === 0 ? <EmptyState message="No bug reports."/> : <div className="space-y-3">{reports.map((report) => <details key={report.id} className="rounded-md border border-line p-3"><summary className="cursor-pointer"><span className="font-medium">{report.summary}</span><span className="ml-2 text-xs text-muted">{report.status} · {report.profile.displayName} · {report.id.slice(-8).toUpperCase()}</span></summary><p className="mt-3 whitespace-pre-wrap text-sm text-muted">{report.description}</p><p className="mt-2 text-xs text-muted">{report.category} · {report.pageUrl || "unknown page"} · {report.deviceInfo || "unknown device"}</p><form action={updateBugReport} className="mt-3 grid gap-2"><input type="hidden" name="id" value={report.id}/><Select name="status" defaultValue={report.status}>{statuses.map((status) => <option key={status}>{status}</option>)}</Select><Textarea name="developerNotes" defaultValue={report.developerNotes ?? ""} placeholder="Private developer notes"/><Button variant="secondary">Update report</Button></form></details>)}</div>}</Card>
    <Card><CardHeader title="Application errors" description="Counts contain no stack traces, form values, health data, or passwords."/>{errors.length === 0 ? <EmptyState message="No recorded application errors."/> : <div className="space-y-2">{errors.map((event) => <form key={event.id} action={updateErrorEvent} className="grid gap-2 rounded-md border border-line p-3 sm:grid-cols-[1fr_12rem_auto]"><input type="hidden" name="id" value={event.id}/><div><p className="font-medium">{event.route} · {event.category}</p><p className="text-xs text-muted">{event.profile.displayName} · {event.deviceClass || "unknown"} · {event.occurrences} occurrence(s) · reference {event.digest || "none"}</p></div><Select name="status" defaultValue={event.status}>{statuses.map((status) => <option key={status}>{status}</option>)}</Select><Button variant="secondary">Save</Button></form>)}</div>}</Card>
    <Card><CardHeader title="Account deletion requests" description="Approval does not delete data automatically. Complete the Auth and profile deletion manually after confirming identity."/>{deletions.length === 0 ? <EmptyState message="No deletion requests."/> : <div className="space-y-3">{deletions.map((request) => <form key={request.id} action={updateDeletionRequest} className="grid gap-2 rounded-md border border-line p-3"><input type="hidden" name="id" value={request.id}/><p className="font-medium">{request.displayName} <span className="text-xs text-muted">· {request.status}</span></p><p className="break-all text-xs text-muted">Auth user: {request.authUserId}</p><p className="text-sm text-muted">{request.reason || "No reason provided."}</p><Select name="status" defaultValue={request.status}>{["REQUESTED", "APPROVED", "REJECTED", "COMPLETED", "CANCELLED"].map((status) => <option key={status}>{status}</option>)}</Select><Textarea name="adminNotes" defaultValue={request.adminNotes ?? ""} placeholder="Private administrator notes"/><Button variant="secondary">Update request</Button></form>)}</div>}</Card>
  </div></div>;
}
