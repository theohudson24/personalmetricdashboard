"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getDefaultProfile } from "@/lib/profile";
import { prisma } from "@/lib/prisma";

export type DeletionState = { status: "idle" | "success" | "error"; message: string };
export const idleDeletionState: DeletionState = { status: "idle", message: "" };

export async function requestAccountDeletion(_state: DeletionState, formData: FormData): Promise<DeletionState> {
  const user = await requireUser(); const profile = await getDefaultProfile();
  const parsed = z.object({ reason: z.string().trim().max(1000).optional(), confirmation: z.literal("REQUEST DELETION") }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "Type REQUEST DELETION exactly to submit the request." };
  const existing = await prisma.accountDeletionRequest.findFirst({ where: { profileId: profile.id, status: { in: ["REQUESTED", "APPROVED"] } } });
  if (existing) return { status: "error", message: "A deletion request is already being reviewed." };
  await prisma.accountDeletionRequest.create({ data: { profileId: profile.id, authUserId: user.id, displayName: profile.displayName, reason: parsed.data.reason || null } });
  revalidatePath("/settings"); revalidatePath("/admin");
  return { status: "success", message: "Deletion request submitted. Your account remains active while an administrator reviews it." };
}

export async function cancelAccountDeletion(formData: FormData) {
  const profile = await getDefaultProfile();
  const id = z.string().min(1).max(100).parse(formData.get("id"));
  await prisma.accountDeletionRequest.updateMany({ where: { id, profileId: profile.id, status: "REQUESTED" }, data: { status: "CANCELLED", reviewedAt: new Date() } });
  revalidatePath("/settings"); revalidatePath("/admin");
}
