"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getDefaultProfile } from "@/lib/profile";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { importStrongCsv } from "@/lib/strongCsv";

export type SettingsActionState = { status: "idle" | "success" | "error"; message: string };
export const idleSettingsState: SettingsActionState = { status: "idle", message: "" };

export async function uploadStrongCsv(_state: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  try {
    const file = formData.get("file");
    if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".csv")) return { status: "error", message: "Choose a CSV exported from Strong." };
    if (file.size > 5_000_000) return { status: "error", message: "The CSV must be smaller than 5 MB." };
    const profile = await getDefaultProfile();
    const result = await importStrongCsv(prisma, profile.id, await file.text()); revalidatePath("/gym"); return { status: "success", message: `Strong import complete: ${result.created} added, ${result.updated} updated.` };
  }
  catch (error) {
    const message = error instanceof Error ? error.message : "";
    const fileProblem = message.startsWith("This does not look") || message.startsWith("No valid workout") || message.startsWith("Invalid workout date") || message.startsWith("The export is too large");
    return { status: "error", message: fileProblem ? message : "The Strong import failed on our end. Your existing workouts were not removed; our development team is working to keep imports reliable." };
  }
}

export async function updateAccount(_state: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  const user = await requireUser();
  try {
    const profile = await getDefaultProfile();
    const parsed = z.object({ displayName: z.string().trim().min(1).max(80), email: z.string().email(), phone: z.string().trim().max(30).optional(), password: z.string().max(128).optional() }).safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { status: "error", message: "Check the account details and try again." };
    if (parsed.data.password && parsed.data.password.length < 12) return { status: "error", message: "A new password must be at least 12 characters." };
    const emailChanged = parsed.data.email.toLowerCase() !== user.email?.toLowerCase();
    const allowedEmails = new Set((process.env.TEST_USER_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean));
    if (emailChanged && allowedEmails.size > 0 && !allowedEmails.has(parsed.data.email.toLowerCase())) {
      return { status: "error", message: "To prevent an account lockout during private testing, add the new email to TEST_USER_EMAILS in Vercel and redeploy before changing it here." };
    }
    const supabase = await createSupabaseServerClient();
    const changes: { email?: string; password?: string; data?: { full_name: string } } = { data: { full_name: parsed.data.displayName } };
    if (emailChanged) changes.email = parsed.data.email;
    if (parsed.data.password) changes.password = parsed.data.password;
    const { error } = await supabase.auth.updateUser(changes);
    if (error) return { status: "error", message: "Supabase could not update the account. Check the new email or password and try again." };
    await prisma.profile.update({ where: { id: profile.id }, data: { displayName: parsed.data.displayName, phone: parsed.data.phone || null } });
    revalidatePath("/settings");
    return { status: "success", message: changes.email ? "Account updated. Check for a verification message to confirm the new email." : "Account updated." };
  } catch {
    return { status: "error", message: "The account update failed on our end. No password or database details were exposed. Please try again." };
  }
}
