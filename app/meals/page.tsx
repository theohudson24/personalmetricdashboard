import { ensureDefaultData } from "@/app/actions";
import { PageHeader } from "@/components/layout/PageHeader";
import { MacroSummaryCard } from "@/components/meals/MacroSummaryCard";
import { MealForm } from "@/components/meals/MealForm";
import { MealHistory } from "@/components/meals/MealHistory";
import { MicronutrientGrid } from "@/components/meals/MicronutrientGrid";
import { NutritionInsights } from "@/components/meals/NutritionInsights";
import { calculateNutritionTotals, nutritionInsights } from "@/lib/nutrition";
import { prisma } from "@/lib/prisma";
import { startOfDay } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function MealsPage() {
  await ensureDefaultData();

  const today = startOfDay();
  const [settings, meals] = await Promise.all([
    prisma.userSettings.findFirstOrThrow(),
    prisma.meal.findMany({
      where: { date: today },
      include: { foodItems: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const totals = calculateNutritionTotals(meals.flatMap((meal) => meal.foodItems));

  return (
    <div>
      <PageHeader
        title="Meals and nutrition"
        description="Track intake, macros, micronutrients, and daily nutrition targets."
      />
      <div className="grid gap-5">
        <MacroSummaryCard totals={totals} settings={settings} />
        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <MealForm />
          <div className="grid gap-5">
            <NutritionInsights insights={nutritionInsights(totals, settings)} />
          </div>
        </div>
        <MicronutrientGrid totals={totals} settings={settings} />
        <MealHistory meals={meals} />
      </div>
    </div>
  );
}
