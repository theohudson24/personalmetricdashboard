import { ensureDefaultData } from "@/app/actions";
import { DashboardCompletion, DashboardStatusOverview, type DailyStatus, type StatusItem } from "@/components/dashboard/DashboardStatusOverview";
import { TodoList } from "@/components/dashboard/TodoList";
import { PageHeader } from "@/components/layout/PageHeader";
import { dateInputValue, startOfDay } from "@/lib/dates";
import { completionPercent, countStatus, nutritionTargetProgress } from "@/lib/dashboard";
import { calculateNutritionTotals } from "@/lib/nutrition";
import { prisma } from "@/lib/prisma";
import { getDefaultProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await ensureDefaultData();
  const profile = await getDefaultProfile();
  const today = startOfDay();
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const date = dateInputValue(today);

  const [todosResult, mealsResult, workoutResult, habitsResult, settingsResult] = await Promise.allSettled([
    prisma.todoItem.findMany({ where: { date: today, profileId: profile.id }, orderBy: { createdAt: "asc" } }),
    prisma.meal.findMany({ where: { date: today, profileId: profile.id }, include: { foodItems: true }, orderBy: { createdAt: "desc" } }),
    prisma.workout.findFirst({ where: { profileId: profile.id, date: { gte: today, lt: tomorrow } }, select: { id: true, name: true } }),
    prisma.habit.findMany({ where: { profileId: profile.id, status: "Active" }, include: { completions: { where: { date: today } } } }),
    prisma.userSettings.findUnique({ where: { profileId: profile.id } }),
  ]);

  const todos = todosResult.status === "fulfilled" ? todosResult.value : [];
  const meals = mealsResult.status === "fulfilled" ? mealsResult.value : [];
  const workout = workoutResult.status === "fulfilled" ? workoutResult.value : null;
  const habits = habitsResult.status === "fulfilled" ? habitsResult.value : [];
  const settings = settingsResult.status === "fulfilled" ? settingsResult.value : null;
  const totals = calculateNutritionTotals(meals.flatMap((meal) => meal.foodItems));
  const completedTodos = todos.filter((todo) => todo.completed).length;
  const completion = completionPercent(completedTodos, todos.length);
  const completedHabits = habits.filter((habit) => habit.completions.some((entry) => entry.status === "completed" || entry.status === "clean")).length;
  const nutritionProgress = settings ? nutritionTargetProgress(totals.calories, settings.dailyCalorieGoal, totals.protein, settings.dailyProteinGoal) : 0;

  const statuses: StatusItem[] = [
    todosResult.status === "rejected"
      ? { key: "priorities", title: "Daily priorities", status: "unavailable" as const, value: "Could not load", detail: "Your tasks were not changed. Retry this section.", href: "/", action: "Retry from dashboard" }
      : { key: "priorities", title: "Daily priorities", status: countStatus(completedTodos, todos.length) as DailyStatus, value: `${completedTodos} of ${todos.length}`, detail: "Complete the few actions that make today successful.", href: "/#daily-priorities", action: todos.length ? "Review priorities" : "Add a priority" },
    habitsResult.status === "rejected"
      ? { key: "habits", title: "Habits", status: "unavailable" as const, value: "Could not load", detail: "Habit records remain safely stored.", href: "/habits", action: "Open habits" }
      : { key: "habits", title: "Habits", status: countStatus(completedHabits, habits.length, "needs-attention") as DailyStatus, value: habits.length ? `${completedHabits} of ${habits.length}` : "No active habits", detail: habits.length ? "Today’s active habit check-ins." : "Create an active habit to begin tracking consistency.", href: "/habits", action: habits.length ? "Check in" : "Create a habit" },
    mealsResult.status === "rejected" || settingsResult.status === "rejected"
      ? { key: "nutrition", title: "Nutrition", status: "unavailable" as const, value: "Could not load", detail: "Nutrition records remain safely stored.", href: "/meals", action: "Open meals" }
      : { key: "nutrition", title: "Nutrition", status: (meals.length === 0 ? "not-started" : nutritionProgress >= 85 ? "complete" : "in-progress") as DailyStatus, value: meals.length ? `${nutritionProgress}% toward targets` : "Nothing logged", detail: settings ? `${totals.calories}/${settings.dailyCalorieGoal} kcal · ${Math.round(totals.protein)}/${settings.dailyProteinGoal}g protein` : "Set nutrition targets to measure progress.", href: "/meals", action: meals.length ? "Review nutrition" : "Log food or drink" },
    workoutResult.status === "rejected"
      ? { key: "workout", title: "Workout", status: "unavailable" as const, value: "Could not load", detail: "Workout records remain safely stored.", href: "/gym", action: "Open workouts" }
      : { key: "workout", title: "Workout", status: (workout ? "complete" : "not-started") as DailyStatus, value: workout ? "Logged" : "Not logged", detail: workout ? workout.name : "Log a workout only if one is planned today.", href: "/gym", action: workout ? "View session" : "Open workout tracker" },
  ];
  const nextMove = completion < 100 ? "Finish or intentionally revise your open priorities." : habits.length && completedHabits < habits.length ? "Complete today’s remaining habit check-ins." : meals.length === 0 ? "Log your first food, drink, snack, or meal." : !workout ? "If today is a training day, log the session; otherwise your daily actions are current." : "Your core daily areas are current. Review details only where you need them.";

  return <div>
    <PageHeader eyebrow="Daily command center" title="Today’s priorities and status" description="See what needs action now; use each dedicated page for detailed analysis and history." />
    <div className="grid gap-8">
      <DashboardStatusOverview items={statuses} nextMove={nextMove}/>
      <section id="daily-priorities"><TodoList todos={todos} date={date}/><DashboardCompletion value={completion}/></section>
    </div>
  </div>;
}
