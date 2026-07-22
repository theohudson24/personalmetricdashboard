"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getDefaultProfile } from "@/lib/profile";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { emailSet } from "@/lib/access";
import { normalizePhone } from "@/lib/account";
import type { SettingsActionState } from "@/lib/actionStates";

export async function updateAccount(_state: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  const user = await requireUser();
  try {
    const profile = await getDefaultProfile();
    const parsed = z.object({ displayName: z.string().trim().min(1).max(80), email: z.string().email().max(320), phone: z.string().trim().max(30).optional(), password: z.string().max(128).optional(), currentPassword: z.string().max(128).optional() }).safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { status: "error", message: "Check the account details and try again." };
    if (parsed.data.password && parsed.data.password.length < 12) return { status: "error", message: "A new password must be at least 12 characters." };
    if (parsed.data.password && !parsed.data.currentPassword) return { status: "error", message: "Enter your current password before choosing a new password." };
    const phone = normalizePhone(parsed.data.phone || "");
    if (phone === null) return { status: "error", message: "Enter a valid international phone number or leave it blank." };
    const emailChanged = parsed.data.email.toLowerCase() !== user.email?.toLowerCase();
    const allowedEmails = emailSet(process.env.TEST_USER_EMAILS);
    if (emailChanged && allowedEmails.size > 0 && !allowedEmails.has(parsed.data.email.toLowerCase())) {
      return { status: "error", message: "To prevent an account lockout during private testing, add the new email to TEST_USER_EMAILS in Vercel and redeploy before changing it here." };
    }
    const supabase = await createSupabaseServerClient();
    if (parsed.data.password && user.email) {
      const { error: reauthenticationError } = await supabase.auth.signInWithPassword({ email: user.email, password: parsed.data.currentPassword || "" });
      if (reauthenticationError) return { status: "error", message: "Your current password was not accepted. No account changes were made." };
    }
    const changes: { email?: string; password?: string; data?: { full_name: string } } = { data: { full_name: parsed.data.displayName } };
    if (emailChanged) changes.email = parsed.data.email;
    if (parsed.data.password) changes.password = parsed.data.password;
    const { error } = await supabase.auth.updateUser(changes);
    if (error) return { status: "error", message: "Supabase could not update the account. Check the new email or password and try again." };
    await prisma.profile.update({ where: { id: profile.id }, data: { displayName: parsed.data.displayName, phone: phone || null } });
    revalidatePath("/settings");
    return { status: "success", message: changes.email ? "Account updated. Check for a verification message to confirm the new email." : "Account updated." };
  } catch {
    return { status: "error", message: "The account update failed on our end. No password or database details were exposed. Please try again." };
  }
}
