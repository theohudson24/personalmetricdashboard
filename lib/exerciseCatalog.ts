export type ExerciseCatalogSeed = {
  name: string;
  muscleGroup: string;
  category?: string;
  equipment?: string;
  aliases?: string;
};

export const exerciseCatalogSeeds: ExerciseCatalogSeed[] = [
  { name: "Bench Press", muscleGroup: "Chest", equipment: "Barbell" },
  { name: "Incline Bench Press", muscleGroup: "Chest", equipment: "Barbell" },
  { name: "Bench Press (Dumbbell)", muscleGroup: "Chest", equipment: "Dumbbell" },
  { name: "Incline Bench Press (Dumbbell)", muscleGroup: "Chest", equipment: "Dumbbell" },
  { name: "Chest Fly", muscleGroup: "Chest", equipment: "Machine" },
  { name: "Push Up", muscleGroup: "Chest", equipment: "Bodyweight" },
  { name: "Overhead Press", muscleGroup: "Shoulders", equipment: "Barbell" },
  { name: "Shoulder Press (Dumbbell)", muscleGroup: "Shoulders", equipment: "Dumbbell" },
  { name: "Shoulder Press (Machine)", muscleGroup: "Shoulders", equipment: "Machine" },
  { name: "Lateral Raise (Dumbbell)", muscleGroup: "Shoulders", equipment: "Dumbbell" },
  { name: "Lateral Raise (Cable)", muscleGroup: "Shoulders", equipment: "Cable" },
  { name: "Rear Delt Fly", muscleGroup: "Shoulders", equipment: "Machine" },
  { name: "Pull Up", muscleGroup: "Back", equipment: "Bodyweight" },
  { name: "Lat Pulldown (Cable)", muscleGroup: "Back", equipment: "Cable" },
  { name: "Lat Pulldown (Machine)", muscleGroup: "Back", equipment: "Machine" },
  { name: "Seated Row (Cable)", muscleGroup: "Back", equipment: "Cable" },
  { name: "Seated Row (Machine)", muscleGroup: "Back", equipment: "Machine" },
  { name: "Barbell Row", muscleGroup: "Back", equipment: "Barbell" },
  { name: "Back Extension (Machine)", muscleGroup: "Back", equipment: "Machine" },
  { name: "Shrug (Dumbbell)", muscleGroup: "Traps", equipment: "Dumbbell" },
  { name: "Squat", muscleGroup: "Legs", equipment: "Barbell" },
  { name: "Leg Press", muscleGroup: "Legs", equipment: "Machine" },
  { name: "Leg Extension", muscleGroup: "Quads", equipment: "Machine" },
  { name: "Leg Curl", muscleGroup: "Hamstrings", equipment: "Machine" },
  { name: "Romanian Deadlift", muscleGroup: "Hamstrings", equipment: "Barbell" },
  { name: "Calf Raise", muscleGroup: "Calves", equipment: "Machine" },
  { name: "Deadlift", muscleGroup: "Posterior Chain", equipment: "Barbell" },
  { name: "Bicep Curl (Dumbbell)", muscleGroup: "Biceps", equipment: "Dumbbell" },
  { name: "Bicep Curl (Machine)", muscleGroup: "Biceps", equipment: "Machine" },
  { name: "Hammer Curl (Dumbbell)", muscleGroup: "Biceps", equipment: "Dumbbell" },
  { name: "Hammer Curl (Cable)", muscleGroup: "Biceps", equipment: "Cable" },
  { name: "Triceps Pushdown (Cable - Straight Bar)", muscleGroup: "Triceps", equipment: "Cable" },
  { name: "Triceps Extension (Cable)", muscleGroup: "Triceps", equipment: "Cable" },
  { name: "Triceps Extension (Machine)", muscleGroup: "Triceps", equipment: "Machine" },
  { name: "Skullcrusher", muscleGroup: "Triceps", equipment: "Barbell" },
  { name: "Crunch (Machine)", muscleGroup: "Core", equipment: "Machine" },
  { name: "Decline Crunch", muscleGroup: "Core", equipment: "Bodyweight" },
  { name: "Flat Leg Raise", muscleGroup: "Core", equipment: "Bodyweight" },
  { name: "Hanging Leg Raise", muscleGroup: "Core", equipment: "Bodyweight" },
  { name: "Torso Rotation (Machine)", muscleGroup: "Core", equipment: "Machine" },
  { name: "Treadmill Run", muscleGroup: "Cardio", category: "Cardio", equipment: "Treadmill" },
  { name: "Stationary Bike", muscleGroup: "Cardio", category: "Cardio", equipment: "Bike" },
  { name: "Stair Climber", muscleGroup: "Cardio", category: "Cardio", equipment: "Machine" },
];

export function inferExerciseDetails(name: string): ExerciseCatalogSeed {
  const lower = name.toLowerCase();
  const equipment = lower.includes("dumbbell")
    ? "Dumbbell"
    : lower.includes("barbell")
      ? "Barbell"
      : lower.includes("cable")
        ? "Cable"
        : lower.includes("machine")
          ? "Machine"
          : lower.includes("bodyweight")
            ? "Bodyweight"
            : undefined;

  const muscleGroup =
    lower.includes("bench") || lower.includes("chest") || lower.includes("fly")
      ? "Chest"
      : lower.includes("pulldown") ||
          lower.includes("row") ||
          lower.includes("back extension") ||
          lower.includes("pull up")
        ? "Back"
        : lower.includes("shoulder") ||
            lower.includes("lateral") ||
            lower.includes("rear delt") ||
            lower.includes("overhead")
          ? "Shoulders"
          : lower.includes("triceps") || lower.includes("pushdown") || lower.includes("skull")
            ? "Triceps"
            : lower.includes("bicep") || lower.includes("curl")
              ? "Biceps"
              : lower.includes("leg") ||
                  lower.includes("squat") ||
                  lower.includes("deadlift") ||
                  lower.includes("calf") ||
                  lower.includes("hamstring")
                ? "Legs"
                : lower.includes("crunch") ||
                    lower.includes("raise") ||
                    lower.includes("torso") ||
                    lower.includes("plank") ||
                    lower.includes("abs")
                  ? "Core"
                  : lower.includes("run") ||
                      lower.includes("bike") ||
                      lower.includes("treadmill") ||
                      lower.includes("stair")
                    ? "Cardio"
                    : "General";

  return {
    name,
    muscleGroup,
    category: muscleGroup === "Cardio" ? "Cardio" : "Strength",
    equipment,
  };
}
