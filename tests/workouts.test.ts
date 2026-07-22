import assert from "node:assert/strict";
import test from "node:test";
import { estimatedOneRepMax, exerciseProgressSeries, workoutChartScale, workoutComparisonEntries, workoutVolume, type WorkoutWithExercises } from "@/lib/workouts";

function workout(id: string, date: string, weight: number, reps: number): WorkoutWithExercises {
  return {
    id, profileId: "profile-a", date: new Date(date), name: "Push Day",
    duration: null, durationMinutes: null, muscleGroups: "Chest", notes: null,
    source: "strong", externalId: `strong-${id}`, importFingerprint: `hash-${id}`,
    createdAt: new Date(date), updatedAt: new Date(date),
    exercises: [{
      id: `exercise-${id}`, workoutId: id, name: "Bench Press", muscleGroup: "Chest", notes: null,
      sets: [{ id: `set-${id}`, exerciseId: `exercise-${id}`, setNumber: 1, setType: "WORKING", reps, weight, distance: 0, seconds: 0, rpe: null, notes: null, createdAt: new Date(date) }],
    }],
  };
}

test("workout volume and estimated one-rep max are calculated consistently", () => {
  const entry = workout("one", "2026-07-01T12:00:00Z", 100, 10);
  assert.equal(workoutVolume(entry), 1000);
  assert.equal(estimatedOneRepMax(100, 10), 133);
});

test("exercise progression marks only improvements after the initial baseline", () => {
  const points = exerciseProgressSeries([
    workout("one", "2026-07-01T12:00:00Z", 100, 8),
    workout("two", "2026-07-08T12:00:00Z", 110, 8),
  ]);
  assert.deepEqual(points[0].personalRecords, []);
  assert.ok(points[1].personalRecords.includes("TOP_WEIGHT"));
  assert.ok(points[1].personalRecords.includes("ESTIMATED_1RM"));
  assert.ok(points[1].personalRecords.includes("VOLUME"));
});

test("workout comparisons use the prior matching session", () => {
  const comparisons = workoutComparisonEntries([
    workout("one", "2026-07-01T12:00:00Z", 100, 8),
    workout("two", "2026-07-08T12:00:00Z", 110, 8),
  ]);
  assert.equal(comparisons[0].previous?.id, "one");
  assert.equal(comparisons[0].volumeDelta, 80);
  assert.equal(comparisons[0].exerciseComparisons[0].topWeightDelta, 10);
});

test("workout chart axes use consistent readable increments", () => {
  assert.deepEqual(workoutChartScale([40, 45, 55, 60]), {
    min: 40,
    max: 60,
    step: 5,
    ticks: [40, 45, 50, 55, 60],
  });
  assert.equal(workoutChartScale([100, 155]).step, 10);
  assert.equal(workoutChartScale([1000, 1250]).step, 50);
  assert.deepEqual(workoutChartScale([55, 55]).ticks, [50, 55, 60]);
});
