import { LoginForm } from "@/app/login/LoginForm";
import Link from "next/link";

export default function LoginPage() {
  return <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-5 py-12"><p className="eyebrow">Private access</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">Your progress, kept personal.</h1><p className="mb-8 mt-3 max-w-lg leading-7 text-muted">Sign in to Metric OS. Your health, training, habits, and nutrition records remain isolated to your account.</p><LoginForm /><p className="mt-6 text-center text-xs text-muted"><Link className="underline decoration-line underline-offset-4" href="/legal/privacy">Privacy</Link> · <Link className="underline decoration-line underline-offset-4" href="/legal/terms">Terms</Link></p></main>;
}
