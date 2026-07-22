import type { UserSettings } from "@prisma/client";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatTile } from "@/components/shared/StatTile";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { nutritionGoalStatus, nutritionGoalTone, type NutritionTotals } from "@/lib/nutrition";

export function MicronutrientGrid({
  totals,
  settings,
}: {
  totals: NutritionTotals;
  settings: UserSettings;
}) {
  const items = [
    ["Vitamin A", totals.vitaminA, settings.dailyVitaminAGoal, "mcg", "target"],
    ["Vitamin C", totals.vitaminC, settings.dailyVitaminCGoal, "mg", "target"],
    ["Vitamin D", totals.vitaminD, settings.dailyVitaminDGoal, "mcg", "target"],
    ["Vitamin B12", totals.vitaminB12, settings.dailyVitaminB12Goal, "mcg", "target"],
    ["Calcium", totals.calcium, settings.dailyCalciumGoal, "mg", "target"],
    ["Iron", totals.iron, settings.dailyIronGoal, "mg", "target"],
    ["Magnesium", totals.magnesium, settings.dailyMagnesiumGoal, "mg", "target"],
    ["Potassium", totals.potassium, settings.dailyPotassiumGoal, "mg", "target"],
    ["Zinc", totals.zinc, settings.dailyZincGoal, "mg", "target"],
    ["Sodium", totals.sodium, settings.dailySodiumLimit, "mg limit", "limit"],
  ] as const;

  return (
    <Card>
      <CardHeader
        title="Micronutrients"
        description="Daily micronutrient totals compared with your personal targets."
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {items.map(([label, value, goal, unit, mode]) => {
          const tone = nutritionGoalTone(value, goal, mode);
          const cardTone = tone === "success" ? "border-growth/60 bg-growth/[0.05]" : tone === "warning" ? "border-pulse/60 bg-pulse/[0.06]" : tone === "danger" ? "border-ember/60 bg-ember/[0.06]" : "border-line bg-ink/[0.025]";
          return <div key={label} className={`rounded-md border p-3 transition-colors ${cardTone}`}>
            <StatTile
              label={label}
              value={`${Math.round(value)} / ${Math.round(goal)}`}
              helper={`${unit} · ${nutritionGoalStatus(tone, mode)}`}
              tone={tone}
            />
            <div className="mt-3">
              <ProgressBar value={value} max={goal} tone={tone} />
            </div>
          </div>;
        })}
      </div>
      <p className="mt-4 text-xs text-muted">Green means the target zone is reached. Orange and red mean intake is above your configured goal—not that a medical toxicity threshold has been diagnosed.</p>
    </Card>
  );
}
