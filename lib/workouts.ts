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
        workoutName: workoutDisplayName(workout),
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
      label: workoutDisplayName(workout),
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

function formatGroupList(groups: string[]) {
  if (groups.length === 0) {
    return "General Workout";
  }

  if (groups.length === 1) {
    return groups[0];
  }

  if (groups.length === 2) {
    return `${groups[0]} and ${groups[1]}`;
  }

  return `${groups.slice(0, -1).join(", ")} and ${groups[groups.length - 1]}`;
}

function workoutTypeGroups(workout: WorkoutWithExercises) {
  const groupVolumes = new Map<string, number>();

  for (const exercise of workout.exercises) {
    const volume = exerciseSnapshot(exercise).volume;
    const muscleGroup = exercise.muscleGroup || "General";

    groupVolumes.set(muscleGroup, (groupVolumes.get(muscleGroup) ?? 0) + volume);
  }

  const priority = [
    "Chest",
    "Back",
    "Legs",
    "Quads",
    "Hamstrings",
    "Posterior Chain",
    "Shoulders",
    "Triceps",
    "Biceps",
    "Core",
    "Calves",
    "Cardio",
    "General",
  ];
  const priorityIndex = (group: string) => {
    const index = priority.indexOf(group);
    return index === -1 ? priority.length : index;
  };
  const significantGroups = Array.from(groupVolumes.entries())
    .filter(([, volume]) => volume > 0)
    .sort((a, b) => {
      const volumeDiff = b[1] - a[1];

      if (Math.abs(volumeDiff) > 500) {
        return volumeDiff;
      }

      return priorityIndex(a[0]) - priorityIndex(b[0]);
    })
    .slice(0, 3)
    .map(([group]) => group);

  return significantGroups.sort(
    (a, b) => priorityIndex(a) - priorityIndex(b),
  );
}

export function workoutDisplayName(workout: WorkoutWithExercises) {
  const groups = workoutTypeGroups(workout);

  if (groups.includes("Back") && groups.includes("Biceps")) {
    return "Back and Biceps";
  }

  if (
    groups.includes("Chest") &&
    groups.includes("Triceps") &&
    groups.includes("Shoulders")
  ) {
    return "Chest, Triceps and Shoulders";
  }

  if (groups.includes("Chest") && groups.includes("Triceps")) {
    return "Chest and Triceps";
  }

  if (groups.includes("Legs") || groups.includes("Quads") || groups.includes("Hamstrings")) {
    const legGroups = groups.filter((group) =>
      ["Legs", "Quads", "Hamstrings", "Posterior Chain", "Calves"].includes(group),
    );

    return formatGroupList(legGroups.length > 0 ? legGroups : ["Legs"]);
  }

  return formatGroupList(groups);
}

function exerciseSnapshot(exercise: Exercise & { sets: ExerciseSet[] }) {
  const workingSets = exercise.sets.filter(
    (set) => set.setType !== "REST_TIMER" && set.reps > 0,
  );
  const volume = workingSets.reduce((total, set) => total + set.reps * set.weight, 0);
  const topWeight = workingSets.length > 0 ? Math.max(...workingSets.map((set) => set.weight)) : 0;
  const bestOneRepMax =
    workingSets.length > 0
      ? Math.max(...workingSets.map((set) => estimatedOneRepMax(set.weight, set.reps)))
      : 0;

  return {
    volume,
    topWeight,
    bestOneRepMax,
    sets: workingSets.length,
  };
}

export type WorkoutComparisonEntry = {
  id: string;
  name: string;
  date: string;
  label: string;
  volume: number;
  previous?: {
    id: string;
    date: string;
    label: string;
    volume: number;
  };
  volumeDelta: number | null;
  volumeDeltaPercent: number | null;
  exerciseComparisons: Array<{
    name: string;
    currentVolume: number;
    previousVolume: number | null;
    volumeDelta: number | null;
    currentTopWeight: number;
    previousTopWeight: number | null;
    topWeightDelta: number | null;
    currentOneRepMax: number;
    previousOneRepMax: number | null;
    oneRepMaxDelta: number | null;
  }>;
};

export function workoutComparisonEntries(workouts: WorkoutWithExercises[]) {
  const previousByName = new Map<string, WorkoutWithExercises>();
  const entries: WorkoutComparisonEntry[] = [];
  const sortedWorkouts = [...workouts].sort((a, b) => a.date.getTime() - b.date.getTime());

  for (const workout of sortedWorkouts) {
    const displayName = workoutDisplayName(workout);
    const key = displayName.trim().toLowerCase();
    const previous = previousByName.get(key);
    const volume = workoutVolume(workout);
    const previousVolume = previous ? workoutVolume(previous) : null;
    const dateLabel = new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(workout.date);
    const previousExercises = new Map(
      previous?.exercises.map((exercise) => [exercise.name.trim().toLowerCase(), exercise]) ?? [],
    );

    entries.push({
      id: workout.id,
      name: displayName,
      date: workout.date.toISOString(),
      label: `${displayName} / ${dateLabel}`,
      volume,
      previous: previous
        ? {
            id: previous.id,
            date: previous.date.toISOString(),
            label: `${workoutDisplayName(previous)} / ${new Intl.DateTimeFormat("en", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }).format(previous.date)}`,
            volume: previousVolume ?? 0,
          }
        : undefined,
      volumeDelta: previousVolume === null ? null : volume - previousVolume,
      volumeDeltaPercent:
        previousVolume && previousVolume > 0 ? ((volume - previousVolume) / previousVolume) * 100 : null,
      exerciseComparisons: workout.exercises.map((exercise) => {
        const current = exerciseSnapshot(exercise);
        const previousExercise = previousExercises.get(exercise.name.trim().toLowerCase());
        const previousSnapshot = previousExercise ? exerciseSnapshot(previousExercise) : null;

        return {
          name: exercise.name,
          currentVolume: current.volume,
          previousVolume: previousSnapshot?.volume ?? null,
          volumeDelta: previousSnapshot ? current.volume - previousSnapshot.volume : null,
          currentTopWeight: current.topWeight,
          previousTopWeight: previousSnapshot?.topWeight ?? null,
          topWeightDelta: previousSnapshot ? current.topWeight - previousSnapshot.topWeight : null,
          currentOneRepMax: current.bestOneRepMax,
          previousOneRepMax: previousSnapshot?.bestOneRepMax ?? null,
          oneRepMaxDelta: previousSnapshot
            ? current.bestOneRepMax - previousSnapshot.bestOneRepMax
            : null,
        };
      }),
    });

    previousByName.set(key, workout);
  }

  return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
