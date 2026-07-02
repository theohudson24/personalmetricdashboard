import type { DailyLog } from "@prisma/client";
import type { NutritionTotals } from "@/lib/nutrition";
import type { WorkoutWithExercises } from "@/lib/workouts";

export function trainingInsights(
  workouts: WorkoutWithExercises[],
  dailyLog: DailyLog | null,
  nutritionTotals: NutritionTotals,
) {
  const insights: string[] = [];
  const thisWeek = new Date();
  thisWeek.setDate(thisWeek.getDate() - 7);

  const recentGroups = workouts
    .filter((workout) => workout.date >= thisWeek)
    .flatMap((workout) =>
      workout.muscleGroups
        .split(",")
        .map((group) => group.trim().toLowerCase())
        .filter(Boolean),
    );

  if (!recentGroups.includes("legs")) {
    insights.push("You have not trained legs in the last week.");
  }

  if (nutritionTotals.protein > 0 && nutritionTotals.protein < 140) {
    insights.push("Protein intake was low around recent training.");
  }

  if (dailyLog?.sorenessLevel && dailyLog.sorenessLevel >= 4) {
    insights.push("Soreness is high. Recovery may need extra attention.");
  }

  const latest = workouts[0];
  const previous = workouts[1];

  if (latest && previous) {
    const latestVolume = latest.exercises.flatMap((e) => e.sets).reduce((t, s) => t + s.reps * s.weight, 0);
    const previousVolume = previous.exercises.flatMap((e) => e.sets).reduce((t, s) => t + s.reps * s.weight, 0);

    if (latestVolume > previousVolume) {
      insights.push("Training volume increased compared to your prior session.");
    }
  }

  return insights.length > 0
    ? insights
    : ["Log more workouts to generate training suggestions."];
}
