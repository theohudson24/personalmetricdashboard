import { LoginForm } from "@/app/login/LoginForm";
import Link from "next/link";

export default function LoginPage() {
  return <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-5 py-12"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-core">Private access</p><h1 className="mt-2 text-3xl font-semibold">Personal Metric Dashboard</h1><p className="mb-7 mt-2 text-muted">Sign in with an approved test-user email. Your health and training records remain isolated to your account.</p><LoginForm /><p className="mt-5 text-center text-xs text-muted"><Link className="underline" href="/legal/privacy">Privacy</Link> · <Link className="underline" href="/legal/terms">Terms</Link></p></main>;
}
