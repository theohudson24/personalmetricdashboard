import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { emailSet, isAdminEmail } from "@/lib/access";

export const requireUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  const user = data.user;

  if (error || !user?.email) redirect("/login");
  const allowlist = emailSet(process.env.TEST_USER_EMAILS);
  if (allowlist.size > 0 && !allowlist.has(user.email.toLowerCase())) redirect("/login");
  return user;
});

export async function requireAdmin() {
  const user = await requireUser();
  if (!isAdminEmail(user.email)) redirect("/");
  return user;
}
