export function emailSet(value: string | undefined) {
  return new Set((value ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean));
}

export function isEmailAllowed(email: string | null | undefined, configured: string | undefined) {
  if (!email) return false;
  const allowed = emailSet(configured);
  return allowed.size > 0 && allowed.has(email.toLowerCase());
}

export function isAdminEmail(email: string | null | undefined) {
  return isEmailAllowed(email, process.env.ADMIN_EMAILS);
}
