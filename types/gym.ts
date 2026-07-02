export type WorkoutFormExercise = {
  name: string;
  muscleGroup: string;
  notes?: string;
  sets: Array<{
    reps: number;
    weight: number;
  }>;
};
