import { ensureDefaultData } from "@/app/actions";
import { GymProgressCards } from "@/components/gym/GymProgressCards";
import { TrainingInsights } from "@/components/gym/TrainingInsights";
import { WorkoutForm } from "@/components/gym/WorkoutForm";
import { WorkoutHistoryList } from "@/components/gym/WorkoutHistoryList";
import { PageHeader } from "@/components/layout/PageHeader";
import { startOfDay } from "@/lib/dates";
import { trainingInsights } from "@/lib/insights";
import { calculateNutritionTotals } from "@/lib/nutrition";
import { prisma } from "@/lib/prisma";
import {
  exerciseProgressSeries,
  muscleGroupVolumeEntries,
  workoutVolumeSeries,
  workoutsPerWeekSeries,
} from "@/lib/workouts";

export const dynamic = "force-dynamic";

export default async function GymPage() {
  await ensureDefaultData();

  const today = startOfDay();
  const [
    workouts,
    dailyLog,
    meals,
    exerciseOptions,
    workoutNameRows,
    templates,
    progressWorkouts,
    dailyWeightLogs,
    bodyMeasurements,
  ] = await Promise.all([
    prisma.workout.findMany({
      include: { exercises: { include: { sets: true } } },
      orderBy: { date: "desc" },
      take: 20,
    }),
    prisma.dailyLog.findUnique({ where: { date: today } }),
    prisma.meal.findMany({
      where: { date: today },
      include: { foodItems: true },
    }),
    prisma.exerciseCatalog.findMany({
      orderBy: [{ muscleGroup: "asc" }, { name: "asc" }],
      select: { name: true, muscleGroup: true, equipment: true },
    }),
    prisma.workout.findMany({
      distinct: ["name"],
      select: { name: true },
      orderBy: { name: "asc" },
    }),
    prisma.workoutTemplate.findMany({
      include: {
        exercises: {
          include: {
            sets: {
              orderBy: { setNumber: "asc" },
              select: { reps: true, weight: true, setType: true },
            },
          },
          orderBy: { orderIndex: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.workout.findMany({
      include: { exercises: { include: { sets: true } } },
      orderBy: { date: "asc" },
    }),
    prisma.dailyLog.findMany({
      where: { bodyWeight: { not: null } },
      select: { date: true, bodyWeight: true },
      orderBy: { date: "asc" },
    }),
    prisma.bodyMeasurement.findMany({
      where: { bodyWeight: { not: null } },
      select: { date: true, bodyWeight: true },
      orderBy: { date: "asc" },
    }),
  ]);
  const totals = calculateNutritionTotals(meals.flatMap((meal) => meal.foodItems));
  const bodyWeightByDate = new Map<string, number>();

  for (const log of [...dailyWeightLogs, ...bodyMeasurements]) {
    if (log.bodyWeight !== null) {
      bodyWeightByDate.set(log.date.toISOString().slice(0, 10), log.bodyWeight);
    }
  }

  const bodyWeightPoints = Array.from(bodyWeightByDate.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, value]) => ({
      date: new Date(`${date}T00:00:00`).toISOString(),
      label: "Body weight",
      value,
    }));

  return (
    <div>
      <PageHeader
        title="Gym and lifting"
        description="Log workouts, inspect training history, and monitor strength progression."
      />
      <div className="grid gap-5">
        <WorkoutForm
          exerciseOptions={exerciseOptions}
          workoutNameOptions={workoutNameRows.map((workout) => workout.name)}
          templates={templates}
        />
        <GymProgressCards
          exercisePoints={exerciseProgressSeries(progressWorkouts)}
          workoutVolumePoints={workoutVolumeSeries(progressWorkouts)}
          weeklyWorkoutPoints={workoutsPerWeekSeries(progressWorkouts)}
          bodyWeightPoints={bodyWeightPoints}
          muscleGroupVolumeEntries={muscleGroupVolumeEntries(progressWorkouts)}
        />
        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <WorkoutHistoryList workouts={workouts} />
          <div className="grid gap-5">
            <TrainingInsights insights={trainingInsights(workouts, dailyLog, totals)} />
          </div>
        </div>
      </div>
    </div>
  );
}
