import { ensureDefaultData } from "@/app/actions";
import { PageHeader } from "@/components/layout/PageHeader";
import { NutritionGoalsForm } from "@/components/meals/NutritionGoalsForm";
import { ThemePreference } from "@/components/settings/ThemePreference";
import { getDefaultProfile } from "@/lib/profile";
import { prisma } from "@/lib/prisma";
import { calculateNutritionRecommendation } from "@/lib/recommendations";
import { requireUser } from "@/lib/auth";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { DataImport } from "@/components/settings/DataImport";
import Link from "next/link";
import { DataPrivacyControls } from "@/components/settings/DataPrivacyControls";
import { isAdminEmail } from "@/lib/access";
import { InstallAppCard } from "@/components/settings/InstallAppCard";
import { LegalAcceptance } from "@/components/settings/LegalAcceptance";
import { PRIVACY_VERSION, TERMS_VERSION } from "@/lib/legal";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await ensureDefaultData();
  const profile = await getDefaultProfile();
  const user = await requireUser();
  const settings = await prisma.userSettings.findUniqueOrThrow({ where: { profileId: profile.id } });
  const recommendation = calculateNutritionRecommendation(profile);
  const deletionRequest = await prisma.accountDeletionRequest.findFirst({ where: { profileId: profile.id, status: { in: ["REQUESTED", "APPROVED", "REJECTED"] } }, select: { id: true, status: true }, orderBy: { createdAt: "desc" } });
  const legalAcceptance = await prisma.legalAcceptance.findUnique({ where: { profileId_termsVersion_privacyVersion: { profileId: profile.id, termsVersion: TERMS_VERSION, privacyVersion: PRIVACY_VERSION } }, select: { acceptedAt: true } });

  return (
    <div>
      <PageHeader
        eyebrow="System calibration"
        title="Tune the targets behind your growth plan"
        description="Set your body profile, nutrition targets, and display preference."
      />
      <div className="grid gap-8">
        <AccountSettings account={{ displayName: profile.displayName, email: user.email ?? "", emailVerified: Boolean(user.email_confirmed_at), phone: profile.phone ?? "" }} />
        <NutritionGoalsForm
          settings={settings}
          profile={profile}
          recommendation={recommendation}
          showProfileMetrics
        />
        <ThemePreference />
        <InstallAppCard />
        <DataImport />
        <DataPrivacyControls request={deletionRequest} />
        <LegalAcceptance acceptedAt={legalAcceptance?.acceptedAt ?? null} />
        <div className="flex flex-wrap gap-3 border-t border-line/70 pt-6">
          <Link href="/report-bug" className="inline-flex min-h-11 items-center justify-center rounded-product border border-line bg-panel px-4 text-sm font-semibold text-ink transition-colors hover:border-core/50">Report a bug</Link>
          {isAdminEmail(user.email) ? <Link href="/admin" className="inline-flex min-h-11 items-center justify-center rounded-product border border-core/40 bg-core/10 px-4 text-sm font-semibold text-core">Open admin dashboard</Link> : null}
        </div>
      </div>
    </div>
  );
}
