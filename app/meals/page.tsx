import { ensureDefaultData } from "@/app/actions";
import { PageHeader } from "@/components/layout/PageHeader";
import { MacroSummaryCard } from "@/components/meals/MacroSummaryCard";
import { MealForm } from "@/components/meals/MealForm";
import { MealHistory } from "@/components/meals/MealHistory";
import { MicronutrientGrid } from "@/components/meals/MicronutrientGrid";
import { NutritionInsights } from "@/components/meals/NutritionInsights";
import { SavedMeals } from "@/components/meals/SavedMeals";
import { calculateNutritionTotals, nutritionInsights } from "@/lib/nutrition";
import { prisma } from "@/lib/prisma";
import { startOfDay } from "@/lib/dates";
import { getDefaultProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export default async function MealsPage() {
  await ensureDefaultData();
  const profile = await getDefaultProfile();

  const today = startOfDay();
  const [settings, meals, templates] = await Promise.all([
    prisma.userSettings.findUniqueOrThrow({ where: { profileId: profile.id } }),
    prisma.meal.findMany({
      where: { date: today, profileId: profile.id },
      include: { foodItems: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.mealTemplate.findMany({ where: { profileId: profile.id }, include: { foodItems: true }, orderBy: { updatedAt: "desc" } }),
  ]);
  const totals = calculateNutritionTotals(meals.flatMap((meal) => meal.foodItems));

  return (
    <div>
      <PageHeader
        eyebrow="Fuel system"
        title="Nutrition that powers the next level"
        description="Track intake, macros, micronutrients, and the daily targets that support adaptation."
      />
      <div className="grid gap-5">
        <MacroSummaryCard totals={totals} settings={settings} />
        <MicronutrientGrid totals={totals} settings={settings} />
        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <MealForm />
          <div className="grid gap-5">
            <NutritionInsights insights={nutritionInsights(totals, settings)} />
          </div>
        </div>
        <MealHistory meals={meals} />
        <SavedMeals templates={templates} />
      </div>
    </div>
  );
}
