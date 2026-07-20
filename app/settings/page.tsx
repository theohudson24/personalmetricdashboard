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

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await ensureDefaultData();
  const profile = await getDefaultProfile();
  const user = await requireUser();
  const settings = await prisma.userSettings.findUniqueOrThrow({ where: { profileId: profile.id } });
  const recommendation = calculateNutritionRecommendation(profile);

  return (
    <div>
      <PageHeader
        eyebrow="System calibration"
        title="Tune the targets behind your growth plan"
        description="Set your body profile, nutrition targets, and display preference."
      />
      <div className="grid gap-5">
        <AccountSettings account={{ displayName: profile.displayName, email: user.email ?? "", phone: user.phone ?? "" }} />
        <NutritionGoalsForm
          settings={settings}
          profile={profile}
          recommendation={recommendation}
          showProfileMetrics
        />
        <ThemePreference />
        <StrongImport />
      </div>
    </div>
  );
}
