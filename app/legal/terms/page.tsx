import Link from "next/link";
import { TERMS_VERSION } from "@/lib/legal";

export default function TermsPage() {
  return <main className="mx-auto max-w-3xl px-5 py-12"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-core">Version {TERMS_VERSION}</p><h1 className="mt-2 text-3xl font-semibold">Private-beta terms</h1><div className="mt-7 space-y-5 leading-7 text-muted">
    <section><h2 className="text-lg font-semibold text-ink">Purpose</h2><p>Metric OS is experimental software for personal tracking. Access may change or be withdrawn during development, and features may contain errors.</p></section>
    <section><h2 className="text-lg font-semibold text-ink">Health information</h2><p>Calculations, estimates, and recommendations are general informational tools, not diagnoses, treatment, or medical advice. Consult an appropriate qualified professional before acting on health decisions, especially for symptoms, medications, injuries, eating concerns, or emergencies.</p></section>
    <section><h2 className="text-lg font-semibold text-ink">Your responsibilities</h2><p>Keep your credentials private, enter only data you are authorized to store, verify imported and calculated information, and report suspected unauthorized access promptly.</p></section>
    <section><h2 className="text-lg font-semibold text-ink">Availability and liability</h2><p>The service is provided as available for testing without a guarantee of uninterrupted operation or fitness for a particular purpose. Keep independent copies of information you cannot afford to lose.</p></section>
    <section><h2 className="text-lg font-semibold text-ink">Changes and ending access</h2><p>Material changes receive a new version. Future wider-user onboarding will require acceptance of the current versions. You may export data or request account deletion from Settings.</p></section>
  </div><p className="mt-8"><Link className="text-core underline" href="/legal/privacy">Read the privacy notice</Link></p></main>;
}
