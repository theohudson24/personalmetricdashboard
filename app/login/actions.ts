"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isEmailAllowed } from "@/lib/access";
import { consumeRateLimit, privateRateLimitKey } from "@/lib/rateLimit";

const credentialsSchema = z.object({ email: z.string().email().max(320), password: z.string().min(12).max(128) });

function isAllowed(email: string) {
  return isEmailAllowed(email, process.env.TEST_USER_EMAILS);
}

export async function signIn(_state: string | null, formData: FormData) {
  const parsed = credentialsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return "Enter a valid email and a password of at least 12 characters.";
  const rate = await consumeRateLimit(privateRateLimitKey("login", parsed.data.email), 8, 15 * 60 * 1000);
  if (!rate.allowed) return `Too many sign-in attempts. Try again in about ${Math.ceil(rate.retryAfterSeconds / 60)} minute(s).`;
  if (!isAllowed(parsed.data.email)) return "This email is not approved for private testing.";
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return "Sign-in failed. Check your email and password.";
  redirect("/");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
