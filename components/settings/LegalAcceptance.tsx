import Link from "next/link";
import { acceptCurrentLegalTerms } from "@/app/settings/legal-actions";
import { Card, CardHeader } from "@/components/ui/Card";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { PRIVACY_VERSION, TERMS_VERSION } from "@/lib/legal";

export function LegalAcceptance({ acceptedAt }: { acceptedAt: Date | null }) {
  return <Card><CardHeader title="Privacy and terms" description="Versioned records prepare the private beta for a future wider onboarding flow."/><p className="text-sm text-muted">Read the <Link href="/legal/privacy" className="text-core underline">privacy notice</Link> and <Link href="/legal/terms" className="text-core underline">terms</Link>. Current versions: privacy {PRIVACY_VERSION}, terms {TERMS_VERSION}.</p>{acceptedAt ? <p className="mt-3 text-sm text-growth">Accepted {acceptedAt.toLocaleDateString()}.</p> : <form action={acceptCurrentLegalTerms} className="mt-4"><SubmitButton idle="Accept current versions" pending="Recording…"/></form>}</Card>;
}
