import { ensureDefaultData } from "@/app/actions";
import { PageHeader } from "@/components/layout/PageHeader";
import { NutritionGoalsForm } from "@/components/meals/NutritionGoalsForm";
import { Card, CardHeader } from "@/components/ui/Card";
import { getDefaultProfile } from "@/lib/profile";
import { prisma } from "@/lib/prisma";
import { calculateNutritionRecommendation } from "@/lib/recommendations";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await ensureDefaultData();
  const profile = await getDefaultProfile();
  const settings = await prisma.userSettings.findFirstOrThrow();
  const recommendation = calculateNutritionRecommendation(profile);

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage local goals and keep the app ready for future integrations."
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
        <NutritionGoalsForm
          settings={settings}
          profile={profile}
          recommendation={recommendation}
          showProfileMetrics
        />
        <Card>
          <CardHeader
            title="Future device sync"
            description="The MVP stores health markers manually while preserving room for Bluetooth and health platform integrations."
          />
          <div className="space-y-3 text-sm text-neutral-700">
            <p className="rounded-md border border-line bg-neutral-50 p-3">
              Smart rings, heart-rate monitors, body scales, and sleep trackers can be added later through integration-specific modules.
            </p>
            <p className="rounded-md border border-line bg-neutral-50 p-3">
              Current storage is local SQLite through Prisma, so the app works fully on your machine.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
