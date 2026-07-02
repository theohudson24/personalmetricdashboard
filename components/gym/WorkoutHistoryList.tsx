"use client";

import { useState } from "react";
import { formatDisplayDate } from "@/lib/dates";
import { workoutVolume, type WorkoutWithExercises } from "@/lib/workouts";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export function WorkoutHistoryList({
  workouts,
}: {
  workouts: WorkoutWithExercises[];
}) {
  const [visibleCount, setVisibleCount] = useState(5);
  const visibleWorkouts = workouts.slice(0, visibleCount);
  const canShowMore = visibleCount < workouts.length;
  const canHide = visibleCount > 5;

  function setTypeLabel(setType: string) {
    switch (setType) {
      case "DROP_SET":
      case "D":
        return "Drop set";
      case "WARM_UP":
      case "W":
        return "Warm-up";
      case "FAILURE":
      case "F":
        return "Failure";
      default:
        return null;
    }
  }

  return (
    <Card>
      <CardHeader
        title="Workout history"
        description="Recent sessions with volume and exercise details."
      />
      <div className="space-y-3">
        {workouts.length === 0 ? (
          <EmptyState message="No workouts logged yet." />
        ) : (
          <>
            {visibleWorkouts.map((workout) => (
              <details key={workout.id} className="rounded-md border border-line p-3">
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{workout.name}</p>
                      <p className="text-sm text-muted">
                        {formatDisplayDate(workout.date)} / {workout.muscleGroups}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p>{workout.exercises.length} exercises</p>
                      <p className="text-muted">
                        {Math.round(workoutVolume(workout)).toLocaleString()} lb volume
                        {workout.duration ? ` / ${workout.duration}` : ""}
                      </p>
                    </div>
                  </div>
                  {workout.notes ? (
                    <p className="mt-2 text-sm text-muted">{workout.notes}</p>
                  ) : null}
                </summary>
                <div className="mt-3 space-y-3 border-t border-line pt-3">
                  {workout.exercises.map((exercise) => (
                    <div key={exercise.id}>
                      <p className="text-sm font-medium">{exercise.name}</p>
                      <div className="mt-1 grid gap-1 text-sm text-muted">
                        {exercise.sets
                          .filter((set) => set.setType !== "REST_TIMER")
                          .map((set) => {
                            const label = setTypeLabel(set.setType);

                            return (
                              <span key={set.id}>
                                {label ? `${label}: ` : `Set ${set.setNumber}: `}
                                {set.weight} lb x {set.reps}
                                {set.rpe ? ` / RPE ${set.rpe}` : ""}
                                {set.distance ? ` / ${set.distance} distance` : ""}
                                {set.seconds ? ` / ${Math.round(set.seconds)} seconds` : ""}
                              </span>
                            );
                          })}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            ))}
            {workouts.length > 5 ? (
              <div className="flex flex-wrap justify-center gap-2 pt-1">
                {canShowMore ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      setVisibleCount((current) => Math.min(current + 5, workouts.length))
                    }
                  >
                    Show more
                  </Button>
                ) : null}
                {canHide ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setVisibleCount(5)}
                  >
                    Hide
                  </Button>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </div>
    </Card>
  );
}
