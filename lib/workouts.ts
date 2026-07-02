import type { Exercise, ExerciseSet, Workout } from "@prisma/client";

export type WorkoutWithExercises = Workout & {
  exercises: Array<Exercise & { sets: ExerciseSet[] }>;
};

export function workoutVolume(workout: WorkoutWithExercises) {
  return workout.exercises.reduce((workoutTotal, exercise) => {
    const exerciseTotal = exercise.sets.reduce(
      (setTotal, set) => setTotal + set.reps * set.weight,
      0,
    );
    return workoutTotal + exerciseTotal;
  }, 0);
}

export function estimatedOneRepMax(weight: number, reps: number) {
  if (reps <= 1) {
    return weight;
  }

  return Math.round(weight * (1 + reps / 30));
}

export function exerciseProgress(workouts: WorkoutWithExercises[]) {
  const progress = new Map<
    string,
    { bestWeight: number; bestReps: number; bestOneRepMax: number; volume: number }
  >();

  for (const workout of workouts) {
    for (const exercise of workout.exercises) {
      const current = progress.get(exercise.name) ?? {
        bestWeight: 0,
        bestReps: 0,
        bestOneRepMax: 0,
        volume: 0,
      };

      for (const set of exercise.sets) {
        current.bestWeight = Math.max(current.bestWeight, set.weight);
        current.bestReps = Math.max(current.bestReps, set.reps);
        current.bestOneRepMax = Math.max(
          current.bestOneRepMax,
          estimatedOneRepMax(set.weight, set.reps),
        );
        current.volume += set.reps * set.weight;
      }

      progress.set(exercise.name, current);
    }
  }

  return Array.from(progress.entries()).map(([name, values]) => ({
    name,
    ...values,
  }));
}

export type ExerciseProgressPoint = {
  exerciseName: string;
  muscleGroup: string;
  date: string;
  workoutName: string;
  topWeight: number;
  bestReps: number;
  estimatedOneRepMax: number;
  volume: number;
  totalSets: number;
  averageWeight: number;
};

export function exerciseProgressSeries(workouts: WorkoutWithExercises[]) {
  const points: ExerciseProgressPoint[] = [];

  const sortedWorkouts = [...workouts].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  for (const workout of sortedWorkouts) {
    for (const exercise of workout.exercises) {
      const workingSets = exercise.sets.filter(
        (set) => set.setType !== "REST_TIMER" && set.reps > 0,
      );

      if (workingSets.length === 0) {
        continue;
      }

      const volume = workingSets.reduce(
        (total, set) => total + set.weight * set.reps,
        0,
      );
      const topWeight = Math.max(...workingSets.map((set) => set.weight));
      const bestReps = Math.max(...workingSets.map((set) => set.reps));
      const bestOneRepMax = Math.max(
        ...workingSets.map((set) => estimatedOneRepMax(set.weight, set.reps)),
      );
      const averageWeight =
        workingSets.reduce((total, set) => total + set.weight, 0) /
        workingSets.length;

      points.push({
        exerciseName: exercise.name,
        muscleGroup: exercise.muscleGroup || "Uncategorized",
        date: workout.date.toISOString(),
        workoutName: workout.name,
        topWeight,
        bestReps,
        estimatedOneRepMax: bestOneRepMax,
        volume,
        totalSets: workingSets.length,
        averageWeight,
      });
    }
  }

  return points;
}

export type WorkoutVolumePoint = {
  date: string;
  label: string;
  value: number;
};

export function workoutVolumeSeries(workouts: WorkoutWithExercises[]) {
  return [...workouts]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((workout) => ({
      date: workout.date.toISOString(),
      label: workout.name,
      value: workoutVolume(workout),
    }))
    .filter((point) => point.value > 0);
}

export type WeeklyWorkoutPoint = {
  date: string;
  label: string;
  value: number;
};

function weekStart(date: Date) {
  const value = new Date(date);
  const day = value.getDay();
  value.setDate(value.getDate() - day);
  value.setHours(0, 0, 0, 0);
  return value;
}

export function workoutsPerWeekSeries(workouts: WorkoutWithExercises[]) {
  const weeks = new Map<string, number>();

  for (const workout of workouts) {
    const start = weekStart(workout.date);
    const key = start.toISOString();
    weeks.set(key, (weeks.get(key) ?? 0) + 1);
  }

  return Array.from(weeks.entries())
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([date, value]) => ({
      date,
      label: `Week of ${new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
      }).format(new Date(date))}`,
      value,
    }));
}

export type MuscleGroupVolumeEntry = {
  date: string;
  muscleGroup: string;
  value: number;
};

export function muscleGroupVolumeEntries(workouts: WorkoutWithExercises[]) {
  const entries: MuscleGroupVolumeEntry[] = [];

  for (const workout of workouts) {
    for (const exercise of workout.exercises) {
      const workingSets = exercise.sets.filter(
        (set) => set.setType !== "REST_TIMER" && set.reps > 0,
      );
      const value = workingSets.reduce(
        (total, set) => total + set.reps * set.weight,
        0,
      );

      if (value > 0) {
        entries.push({
          date: workout.date.toISOString(),
          muscleGroup: exercise.muscleGroup || "Uncategorized",
          value,
        });
      }
    }
  }

  return entries;
}
