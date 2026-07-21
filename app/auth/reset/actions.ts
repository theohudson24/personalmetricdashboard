"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isEmailAllowed } from "@/lib/access";

export async function requestPasswordReset(_state: string | null, formData: FormData) {
  const parsed = z.string().email().max(320).safeParse(formData.get("email"));
  const generic = "If that approved account exists, a password-reset email has been requested.";
  if (!parsed.success || !isEmailAllowed(parsed.data, process.env.TEST_USER_EMAILS)) return generic;
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") || (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "");
  const siteUrl = configuredUrl.replace(/\/$/, "");
  if (!siteUrl) return "Password recovery is not configured yet. Contact the private-beta administrator.";
  const supabase = await createSupabaseServerClient();
  await supabase.auth.resetPasswordForEmail(parsed.data, { redirectTo: `${siteUrl}/auth/confirm` });
  return generic;
}

export async function updateRecoveredPassword(_state: string | null, formData: FormData) {
  const parsed = z.object({ password: z.string().min(12).max(128), confirmation: z.string().min(12).max(128) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success || parsed.data.password !== parsed.data.confirmation) return "Passwords must match and contain at least 12 characters.";
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return "This recovery link is missing or expired. Request a new one.";
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  return error ? "The password could not be updated. Request a new recovery link." : "Password updated. You can return to the application.";
}
