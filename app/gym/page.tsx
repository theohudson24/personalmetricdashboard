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
  workoutComparisonEntries,
  workoutVolumeSeries,
  workoutsPerWeekSeries,
} from "@/lib/workouts";
import { getDefaultProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export default async function GymPage() {
  const profile = await getDefaultProfile();

  const today = startOfDay();
  const [
    dailyLog,
    meals,
    exerciseOptions,
    templates,
    progressWorkouts,
    dailyWeightLogs,
    bodyMeasurements,
  ] = await Promise.all([
    prisma.dailyLog.findUnique({ where: { profileId_date: { profileId: profile.id, date: today } } }),
    prisma.meal.findMany({
      where: { date: today, profileId: profile.id },
      include: { foodItems: true },
    }),
    prisma.exerciseCatalog.findMany({
      orderBy: [{ muscleGroup: "asc" }, { name: "asc" }],
      select: { name: true, muscleGroup: true, equipment: true },
    }),
    prisma.workoutTemplate.findMany({
      where: { profileId: profile.id },
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
      where: { profileId: profile.id },
      include: { exercises: { include: { sets: true } } },
      orderBy: { date: "asc" },
    }),
    prisma.dailyLog.findMany({
      where: { bodyWeight: { not: null }, profileId: profile.id },
      select: { date: true, bodyWeight: true },
      orderBy: { date: "asc" },
    }),
    prisma.bodyMeasurement.findMany({
      where: { bodyWeight: { not: null }, profileId: profile.id },
      select: { date: true, bodyWeight: true },
      orderBy: { date: "asc" },
    }),
  ]);
  const workouts = [...progressWorkouts].reverse().slice(0, 20);
  const workoutNameOptions = [...new Set(progressWorkouts.map((workout) => workout.name))].sort();
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
        eyebrow="Training protocol"
        title="Build strength with visible progression"
        description="Log sessions, inspect muscle balance, and turn training history into targeted next moves."
      />
      <div className="grid gap-8">
        <WorkoutForm
          exerciseOptions={exerciseOptions}
          workoutNameOptions={workoutNameOptions}
          templates={templates}
          draftScope={profile.id}
        />
        <GymProgressCards
          exercisePoints={exerciseProgressSeries(progressWorkouts)}
          workoutVolumePoints={workoutVolumeSeries(progressWorkouts)}
          weeklyWorkoutPoints={workoutsPerWeekSeries(progressWorkouts)}
          bodyWeightPoints={bodyWeightPoints}
          muscleGroupVolumeEntries={muscleGroupVolumeEntries(progressWorkouts)}
          workoutComparisons={workoutComparisonEntries(progressWorkouts)}
        />
        <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <WorkoutHistoryList workouts={workouts} />
          <div className="grid gap-5">
            <TrainingInsights insights={trainingInsights(workouts, dailyLog, totals)} />
          </div>
        </div>
      </div>
    </div>
  );
}
