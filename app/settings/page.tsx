import { ensureDefaultData } from "@/app/actions";
import { PageHeader } from "@/components/layout/PageHeader";
import { NutritionGoalsForm } from "@/components/meals/NutritionGoalsForm";
import { ThemePreference } from "@/components/settings/ThemePreference";
import { getDefaultProfile } from "@/lib/profile";
import { prisma } from "@/lib/prisma";
import { calculateNutritionRecommendation } from "@/lib/recommendations";
import { requireUser } from "@/lib/auth";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { StrongImport } from "@/components/settings/StrongImport";
import Link from "next/link";
import { DataPrivacyControls } from "@/components/settings/DataPrivacyControls";
import { isAdminEmail } from "@/lib/access";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await ensureDefaultData();
  const profile = await getDefaultProfile();
  const user = await requireUser();
  const settings = await prisma.userSettings.findUniqueOrThrow({ where: { profileId: profile.id } });
  const recommendation = calculateNutritionRecommendation(profile);
  const deletionRequest = await prisma.accountDeletionRequest.findFirst({ where: { profileId: profile.id, status: { in: ["REQUESTED", "APPROVED", "REJECTED"] } }, select: { id: true, status: true }, orderBy: { createdAt: "desc" } });

  return (
    <div>
      <PageHeader
        eyebrow="System calibration"
        title="Tune the targets behind your growth plan"
        description="Set your body profile, nutrition targets, and display preference."
      />
      <div className="grid gap-5">
        <AccountSettings account={{ displayName: profile.displayName, email: user.email ?? "", phone: profile.phone ?? user.phone ?? "" }} />
        <NutritionGoalsForm
          settings={settings}
          profile={profile}
          recommendation={recommendation}
          showProfileMetrics
        />
        <ThemePreference />
        <StrongImport />
        <DataPrivacyControls request={deletionRequest} />
        <Link href="/report-bug" className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white/[0.07] px-4 text-sm font-medium text-ink">Report a bug</Link>
        {isAdminEmail(user.email) ? <Link href="/admin" className="inline-flex min-h-11 items-center justify-center rounded-md border border-core/40 bg-core/10 px-4 text-sm font-medium text-core">Open admin dashboard</Link> : null}
      </div>
    </div>
  );
}
