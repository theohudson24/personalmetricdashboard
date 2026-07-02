import { ensureDefaultData } from "@/app/actions";
import { DailySummaryCard } from "@/components/dashboard/DailySummaryCard";
import { HealthMarkerForm } from "@/components/dashboard/HealthMarkerForm";
import { ProgressPreview } from "@/components/dashboard/ProgressPreview";
import { TodoList } from "@/components/dashboard/TodoList";
import { PageHeader } from "@/components/layout/PageHeader";
import { dateInputValue, formatDisplayDate, startOfDay } from "@/lib/dates";
import { calculateNutritionTotals } from "@/lib/nutrition";
import { prisma } from "@/lib/prisma";
import { exerciseProgress } from "@/lib/workouts";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await ensureDefaultData();

  const today = startOfDay();
  const date = dateInputValue(today);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 7);

  const [dailyLog, todos, meals, workouts, settings, measurements] =
    await Promise.all([
      prisma.dailyLog.findUnique({ where: { date: today } }),
      prisma.todoItem.findMany({ where: { date: today }, orderBy: { createdAt: "asc" } }),
      prisma.meal.findMany({
        where: { date: today },
        include: { foodItems: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.workout.findMany({
        where: { date: { gte: weekStart } },
        include: { exercises: { include: { sets: true } } },
        orderBy: { date: "desc" },
      }),
      prisma.userSettings.findFirstOrThrow(),
      prisma.bodyMeasurement.findMany({
        where: {
          bodyWeight: { not: null },
          date: { lt: today },
        },
        orderBy: { date: "desc" },
        take: 1,
      }),
    ]);

  const foodItems = meals.flatMap((meal) => meal.foodItems);
  const totals = calculateNutritionTotals(foodItems);
  const completedTodos = todos.filter((todo) => todo.completed).length;
  const completion = todos.length > 0 ? Math.round((completedTodos / todos.length) * 100) : 0;
  const workoutStatus = workouts.some((workout) => workout.date.getTime() === today.getTime())
    ? "Complete"
    : "Open";
  const progress = exerciseProgress(workouts);
  const recentPr = progress[0] ? `${progress[0].name} ${progress[0].bestWeight} lb` : "None yet";
  const todayWeight = dailyLog?.bodyWeight ?? measurements[0]?.bodyWeight ?? null;
  const previousWeight = measurements[0]?.bodyWeight ?? null;
  const weightDelta =
    todayWeight !== null && previousWeight !== null ? todayWeight - previousWeight : null;
  const weightPercent =
    weightDelta !== null && previousWeight ? (weightDelta / previousWeight) * 100 : null;
  const weightTrend =
    todayWeight !== null && previousWeight !== null && weightPercent !== null
      ? `${previousWeight.toFixed(1)} lb -> ${todayWeight.toFixed(1)} lb (${weightPercent >= 0 ? "+" : ""}${weightPercent.toFixed(1)}%)`
      : todayWeight !== null
        ? `${todayWeight.toFixed(1)} lb`
        : "No data";
  const weightTrendDirection =
    weightDelta === null ? "none" : weightDelta > 0 ? "up" : weightDelta < 0 ? "down" : "flat";
  const proteinValue = `${Math.round(totals.protein)}g / ${settings.dailyProteinGoal}g`;

  const summaryItems = [
    { label: "Date", value: formatDisplayDate(today) },
    { label: "Body weight", value: dailyLog?.bodyWeight ? `${dailyLog.bodyWeight} lb` : "--" },
    { label: "Calories", value: `${totals.calories} / ${settings.dailyCalorieGoal}` },
    { label: "Protein", value: `${Math.round(totals.protein)}g / ${settings.dailyProteinGoal}g` },
    { label: "Water", value: `${dailyLog?.waterIntake ?? 0} / ${settings.dailyWaterGoal} oz` },
    { label: "Workout", value: workoutStatus },
    { label: "Sleep", value: dailyLog?.sleepHours ? `${dailyLog.sleepHours} hrs` : "--" },
    { label: "Completion", value: `${completion}%` },
  ];

  return (
    <div>
      <PageHeader
        title="Home dashboard"
        description="Today's command center for health markers, tasks, training, and nutrition."
      />
      <div className="grid gap-5">
        <DailySummaryCard items={summaryItems} completion={completion} />
        <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
          <TodoList todos={todos} date={date} />
          <HealthMarkerForm log={dailyLog} date={date} />
        </div>
        <ProgressPreview
          workoutCount={workouts.length}
          proteinValue={proteinValue}
          recentPr={recentPr}
          weightTrend={weightTrend}
          weightTrendDirection={weightTrendDirection}
        />
      </div>
    </div>
  );
}
