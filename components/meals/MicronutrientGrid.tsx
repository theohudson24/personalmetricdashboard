import type { UserSettings } from "@prisma/client";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatTile } from "@/components/shared/StatTile";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { NutritionTotals } from "@/lib/nutrition";

export function MicronutrientGrid({
  totals,
  settings,
}: {
  totals: NutritionTotals;
  settings: UserSettings;
}) {
  const items = [
    ["Vitamin A", totals.vitaminA, settings.dailyVitaminAGoal, "mcg"],
    ["Vitamin C", totals.vitaminC, settings.dailyVitaminCGoal, "mg"],
    ["Vitamin D", totals.vitaminD, settings.dailyVitaminDGoal, "mcg"],
    ["Vitamin B12", totals.vitaminB12, settings.dailyVitaminB12Goal, "mcg"],
    ["Calcium", totals.calcium, settings.dailyCalciumGoal, "mg"],
    ["Iron", totals.iron, settings.dailyIronGoal, "mg"],
    ["Magnesium", totals.magnesium, settings.dailyMagnesiumGoal, "mg"],
    ["Potassium", totals.potassium, settings.dailyPotassiumGoal, "mg"],
    ["Zinc", totals.zinc, settings.dailyZincGoal, "mg"],
    ["Sodium", totals.sodium, settings.dailySodiumLimit, "mg limit"],
  ] as const;

  return (
    <Card>
      <CardHeader
        title="Micronutrients"
        description="Manual micronutrient totals for the selected day."
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {items.map(([label, value, goal, unit]) => (
          <div key={label} className="rounded-md border border-line bg-neutral-50 p-3">
            <StatTile
              label={label}
              value={`${Math.round(value)} / ${Math.round(goal)}`}
              helper={unit}
            />
            <div className="mt-3">
              <ProgressBar value={value} max={goal} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
