import { ensureDefaultData } from "@/app/actions";
import { DailySummaryCard } from "@/components/dashboard/DailySummaryCard";
import { GrowthBriefing } from "@/components/dashboard/GrowthBriefing";
import { TodoList } from "@/components/dashboard/TodoList";
import { PageHeader } from "@/components/layout/PageHeader";
import { dateInputValue, formatDisplayDate, startOfDay } from "@/lib/dates";
import { calculateNutritionTotals } from "@/lib/nutrition";
import { prisma } from "@/lib/prisma";
import { exerciseProgress } from "@/lib/workouts";
import { getDefaultProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await ensureDefaultData();
  const profile = await getDefaultProfile();

  const today = startOfDay();
  const date = dateInputValue(today);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 7);

  const [dailyLog, todos, meals, workouts, settings] =
    await Promise.all([
      prisma.dailyLog.findUnique({ where: { profileId_date: { profileId: profile.id, date: today } } }),
      prisma.todoItem.findMany({ where: { date: today, profileId: profile.id }, orderBy: { createdAt: "asc" } }),
      prisma.meal.findMany({
        where: { date: today, profileId: profile.id },
        include: { foodItems: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.workout.findMany({
        where: { date: { gte: weekStart }, profileId: profile.id },
        include: { exercises: { include: { sets: true } } },
        orderBy: { date: "desc" },
      }),
      prisma.userSettings.findUniqueOrThrow({ where: { profileId: profile.id } }),
    ]);

  const foodItems = meals.flatMap((meal) => meal.foodItems);
  const totals = calculateNutritionTotals(foodItems);
  const completedTodos = todos.filter((todo) => todo.completed).length;
  const completion = todos.length > 0 ? Math.round((completedTodos / todos.length) * 100) : 0;
  const workoutStatus = workouts.some((workout) => workout.date.getTime() === today.getTime())
    ? "Complete"
    : "Open";
  const hasMealsToday = meals.length > 0;
  const hasMorningReadiness =
    dailyLog?.energyLevel !== null &&
    dailyLog?.energyLevel !== undefined &&
    dailyLog?.sorenessLevel !== null &&
    dailyLog?.sorenessLevel !== undefined &&
    dailyLog?.stressLevel !== null &&
    dailyLog?.stressLevel !== undefined &&
    dailyLog?.mood !== null &&
    dailyLog?.mood !== undefined;
  const progress = exerciseProgress(workouts);
  const recentPr = progress[0] ? `${progress[0].name} ${progress[0].bestWeight} lb` : "None yet";

  const summaryItems = [
    { label: "Date", value: formatDisplayDate(today) },
    {
      label: "Body weight",
      value: dailyLog?.bodyWeight ? `${dailyLog.bodyWeight} lb` : "Needs input",
      missing: !dailyLog?.bodyWeight,
      helper: "Morning baseline",
    },
    {
      label: "Calories",
      value: hasMealsToday ? `${totals.calories} / ${settings.dailyCalorieGoal}` : "Needs meal log",
      missing: !hasMealsToday,
      helper: "Daily fuel target",
    },
    {
      label: "Protein",
      value: hasMealsToday
        ? `${Math.round(totals.protein)}g / ${settings.dailyProteinGoal}g`
        : "Needs protein plan",
      missing: !hasMealsToday,
      helper: "Recovery priority",
    },
    {
      label: "Water",
      value: dailyLog?.waterIntake ? `${dailyLog.waterIntake} / ${settings.dailyWaterGoal} oz` : "Needs input",
      missing: !dailyLog?.waterIntake,
      helper: "First hydration check",
    },
    {
      label: "Workout",
      value: workoutStatus === "Complete" ? "Complete" : "Needs plan/log",
      missing: workoutStatus !== "Complete",
      helper: "Training focus",
    },
    {
      label: "Sleep",
      value: dailyLog?.sleepHours ? `${dailyLog.sleepHours} hrs` : "Needs input",
      missing: !dailyLog?.sleepHours,
      helper: "Recovery baseline",
    },
    {
      label: "Readiness",
      value: hasMorningReadiness ? "Logged" : "Needs input",
      missing: !hasMorningReadiness,
      helper: "Energy, soreness, stress, mood",
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Personal growth system"
        title="Today's upgrade path"
        description="A living command center for execution, recovery, training, and nutrition signals."
      />
      <div className="grid gap-5">
        <GrowthBriefing
          completion={completion}
          calories={totals.calories}
          calorieGoal={settings.dailyCalorieGoal}
          protein={totals.protein}
          proteinGoal={settings.dailyProteinGoal}
          water={dailyLog?.waterIntake ?? 0}
          waterGoal={settings.dailyWaterGoal}
          workoutComplete={workoutStatus === "Complete"}
          sleepHours={dailyLog?.sleepHours ?? null}
          energyLevel={dailyLog?.energyLevel ?? null}
          recentPr={recentPr}
        />
        <DailySummaryCard items={summaryItems} completion={completion} />
        <TodoList todos={todos} date={date} />
      </div>
    </div>
  );
}
