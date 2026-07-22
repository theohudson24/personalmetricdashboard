import Link from "next/link";
import { PRIVACY_VERSION } from "@/lib/legal";

export default function PrivacyPage() {
  return <main className="mx-auto max-w-3xl px-5 py-12"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-core">Version {PRIVACY_VERSION}</p><h1 className="mt-2 text-3xl font-semibold">Privacy notice</h1><div className="mt-7 space-y-5 leading-7 text-muted">
    <section><h2 className="text-lg font-semibold text-ink">What is stored</h2><p>Metric OS stores account identifiers, profile and body metrics, nutrition targets and logs, workouts, habits, self-improvement records, bug reports, and requests you submit. It does not intentionally store passwords; Supabase Authentication handles credentials.</p></section>
    <section><h2 className="text-lg font-semibold text-ink">Why and where</h2><p>Data is used to provide your private dashboard, sync it across devices, troubleshoot failures, and administer account requests. Supabase provides authentication and PostgreSQL storage, Vercel hosts the application, USDA FoodData Central and Open Food Facts supply optional food lookup data, and GitHub stores source code—not user health records.</p></section>
    <section><h2 className="text-lg font-semibold text-ink">Retention and control</h2><p>Your records remain until you delete them or an administrator completes your deletion request. Privacy-limited error and performance records are retained only as needed to troubleshoot the private beta. Settings provides a ZIP export and an administrator-reviewed deletion request. Backups may temporarily retain deleted data until their normal expiry.</p></section>
    <section><h2 className="text-lg font-semibold text-ink">Security and limits</h2><p>Access is authenticated and records are scoped to an account. No online service can promise absolute security. Do not enter passwords or unnecessary sensitive details in notes or bug reports.</p></section>
    <section><h2 className="text-lg font-semibold text-ink">Contact</h2><p>Use the in-app Report a bug form for privacy or security concerns while this project remains a private beta.</p></section>
  </div><p className="mt-8"><Link className="text-core underline" href="/legal/terms">Read the terms</Link></p></main>;
}
