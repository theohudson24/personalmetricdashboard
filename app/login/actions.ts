"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const credentialsSchema = z.object({ email: z.string().email().max(320), password: z.string().min(12).max(128) });

function isAllowed(email: string) {
  const allowed = new Set((process.env.TEST_USER_EMAILS ?? "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean));
  return allowed.size > 0 && allowed.has(email.toLowerCase());
}

export async function signIn(_state: string | null, formData: FormData) {
  const parsed = credentialsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return "Enter a valid email and a password of at least 12 characters.";
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
