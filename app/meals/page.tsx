import { ensureDefaultData } from "@/app/actions";
import { PageHeader } from "@/components/layout/PageHeader";
import { MacroSummaryCard } from "@/components/meals/MacroSummaryCard";
import { MealForm } from "@/components/meals/MealForm";
import { MealHistory } from "@/components/meals/MealHistory";
import { MicronutrientGrid } from "@/components/meals/MicronutrientGrid";
import { NutritionInsights } from "@/components/meals/NutritionInsights";
import { SavedMeals } from "@/components/meals/SavedMeals";
import { QuickLogHistory } from "@/components/meals/QuickLogHistory";
import { calculateNutritionTotals, nutritionInsights } from "@/lib/nutrition";
import { prisma } from "@/lib/prisma";
import { startOfDay } from "@/lib/dates";
import { getDefaultProfile } from "@/lib/profile";
import { dateFromKey } from "@/lib/meals";

export const dynamic = "force-dynamic";

function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default async function MealsPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  await ensureDefaultData();
  const profile = await getDefaultProfile();

  const requestedDate = (await searchParams).date;
  const selectedDateKey = requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) ? requestedDate : localDateKey();
  const selectedDate = dateFromKey(selectedDateKey);
  const legacyToday = startOfDay(selectedDate);
  const [settings, meals, templates, recentEntries] = await Promise.all([
    prisma.userSettings.findUniqueOrThrow({ where: { profileId: profile.id } }),
    prisma.meal.findMany({
      where: { profileId: profile.id, OR: [{ dateKey: selectedDateKey }, { dateKey: null, date: legacyToday }] },
      include: { foodItems: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.mealTemplate.findMany({ where: { profileId: profile.id, archived: false }, include: { foodItems: true }, orderBy: [{ lastUsedAt: "desc" }, { useCount: "desc" }, { updatedAt: "desc" }] }),
    prisma.meal.findMany({ where: { profileId: profile.id }, include: { foodItems: true }, orderBy: { createdAt: "desc" }, take: 30 }),
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
        <form method="get" className="flex flex-wrap items-end gap-2 rounded-lg border border-line bg-black/10 p-4">
          <label className="text-sm text-muted">View nutrition date<input name="date" type="date" defaultValue={selectedDateKey} className="mt-1 block min-h-11 rounded-md border border-line bg-black/20 px-3 text-ink"/></label>
          <button className="min-h-11 rounded-md bg-core px-4 text-sm font-semibold text-[#07100d]">View day</button>
        </form>
        <MacroSummaryCard totals={totals} settings={settings} />
        <MicronutrientGrid totals={totals} settings={settings} />
        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <MealForm />
          <div className="grid gap-5">
            <NutritionInsights insights={nutritionInsights(totals, settings)} />
          </div>
        </div>
        <MealHistory meals={meals} />
        <QuickLogHistory entries={recentEntries} />
        <SavedMeals templates={templates} />
      </div>
    </div>
  );
}
