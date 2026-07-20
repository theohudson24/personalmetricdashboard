"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const id = z.string().min(1).max(100);

export async function updateBugReport(formData: FormData) {
  await requireAdmin();
  const parsed = z.object({ id, status: z.enum(["OPEN", "INVESTIGATING", "RESOLVED", "ARCHIVED"]), developerNotes: z.string().trim().max(4000) }).parse({ id: formData.get("id"), status: formData.get("status"), developerNotes: formData.get("developerNotes") });
  await prisma.bugReport.update({ where: { id: parsed.id }, data: { status: parsed.status, developerNotes: parsed.developerNotes || null } });
  revalidatePath("/admin"); revalidatePath("/report-bug");
}

export async function updateErrorEvent(formData: FormData) {
  await requireAdmin();
  const parsed = z.object({ id, status: z.enum(["OPEN", "INVESTIGATING", "RESOLVED", "ARCHIVED"]) }).parse({ id: formData.get("id"), status: formData.get("status") });
  await prisma.errorEvent.update({ where: { id: parsed.id }, data: { status: parsed.status } });
  revalidatePath("/admin");
}

export async function updateDeletionRequest(formData: FormData) {
  await requireAdmin();
  const parsed = z.object({ id, status: z.enum(["REQUESTED", "APPROVED", "REJECTED", "COMPLETED", "CANCELLED"]), adminNotes: z.string().trim().max(4000) }).parse({ id: formData.get("id"), status: formData.get("status"), adminNotes: formData.get("adminNotes") });
  await prisma.accountDeletionRequest.update({ where: { id: parsed.id }, data: { status: parsed.status, adminNotes: parsed.adminNotes || null, reviewedAt: parsed.status === "REQUESTED" ? null : new Date() } });
  revalidatePath("/admin"); revalidatePath("/settings");
}
