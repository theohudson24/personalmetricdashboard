import type { UserSettings } from "@prisma/client";
import { StatTile } from "@/components/shared/StatTile";
import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { NutritionTotals } from "@/lib/nutrition";

export function MacroSummaryCard({
  totals,
  settings,
}: {
  totals: NutritionTotals;
  settings: UserSettings;
}) {
  const rows = [
    ["Calories", totals.calories, settings.dailyCalorieGoal, "kcal"],
    ["Protein", totals.protein, settings.dailyProteinGoal, "g"],
    ["Carbs", totals.carbs, settings.dailyCarbGoal, "g"],
    ["Fat", totals.fat, settings.dailyFatGoal, "g"],
    ["Fiber", totals.fiber, settings.dailyFiberGoal, "g"],
  ] as const;

  return (
    <Card>
      <CardHeader
        title="Macro summary"
        description="Daily totals compared against your targets."
      />
      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-5">
        {rows.map(([label, value, goal, unit]) => (
          <StatTile
            key={label}
            label={label}
            value={`${Math.round(value)} ${unit}`}
            helper={`Goal ${goal} ${unit}`}
          />
        ))}
      </div>
      <div className="space-y-3">
        {rows.map(([label, value, goal, unit]) => (
          <ProgressBar
            key={label}
            value={value}
            max={goal}
            label={`${label}: ${Math.round(value)} / ${goal} ${unit}`}
          />
        ))}
      </div>
    </Card>
  );
}
