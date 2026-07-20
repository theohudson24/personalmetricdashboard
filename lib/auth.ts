import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function allowedEmails() {
  return new Set((process.env.TEST_USER_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean));
}

export const requireUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  const user = data.user;

  if (error || !user?.email) redirect("/login");
  const allowlist = allowedEmails();
  if (allowlist.size > 0 && !allowlist.has(user.email.toLowerCase())) redirect("/login");
  return user;
});
