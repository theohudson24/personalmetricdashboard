"use client";

import { useMemo, useState } from "react";
import { formatDisplayDate } from "@/lib/dates";
import { exerciseProgressSeries, workoutDisplayName, workoutVolume, type WorkoutWithExercises } from "@/lib/workouts";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export function WorkoutHistoryList({
  workouts,
}: {
  workouts: WorkoutWithExercises[];
}) {
  const [visibleCount, setVisibleCount] = useState(5);
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("all");
  const [recordsOnly, setRecordsOnly] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const recordsByExercise = useMemo(() => new Map(exerciseProgressSeries(workouts).map((point) => [point.exerciseId, point.personalRecords])), [workouts]);
  const filteredWorkouts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return workouts.filter((workout) => {
      const names = [workout.name, workoutDisplayName(workout), ...workout.exercises.map((exercise) => exercise.name)].join(" ").toLowerCase();
      const dateKey = workout.date.toISOString().slice(0, 10);
      return (!normalizedQuery || names.includes(normalizedQuery))
        && (source === "all" || workout.source === source)
        && (!recordsOnly || workout.exercises.some((exercise) => (recordsByExercise.get(exercise.id)?.length ?? 0) > 0))
        && (!dateFrom || dateKey >= dateFrom)
        && (!dateTo || dateKey <= dateTo);
    });
  }, [dateFrom, dateTo, query, recordsByExercise, recordsOnly, source, workouts]);
  const visibleWorkouts = filteredWorkouts.slice(0, visibleCount);
  const canShowMore = visibleCount < filteredWorkouts.length;
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
      <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <label className="text-sm text-muted">Exercise or workout<input value={query} onChange={(event) => { setQuery(event.target.value); setVisibleCount(5); }} placeholder="Bench press" className="mt-1 min-h-11 w-full rounded-md border border-line bg-black/20 px-3 text-ink"/></label>
        <label className="text-sm text-muted">Source<select value={source} onChange={(event) => { setSource(event.target.value); setVisibleCount(5); }} className="mt-1 min-h-11 w-full rounded-md border border-line bg-black/20 px-3 text-ink"><option value="all">All sources</option><option value="manual">Manual</option><option value="strong">Strong</option></select></label>
        <label className="text-sm text-muted">From<input type="date" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); setVisibleCount(5); }} className="mt-1 min-h-11 w-full rounded-md border border-line bg-black/20 px-3 text-ink"/></label>
        <label className="text-sm text-muted">To<input type="date" value={dateTo} onChange={(event) => { setDateTo(event.target.value); setVisibleCount(5); }} className="mt-1 min-h-11 w-full rounded-md border border-line bg-black/20 px-3 text-ink"/></label>
        <label className="flex min-h-11 items-center gap-2 self-end rounded-md border border-line bg-black/20 px-3 text-sm text-muted"><input type="checkbox" checked={recordsOnly} onChange={(event) => { setRecordsOnly(event.target.checked); setVisibleCount(5); }} className="accent-[#4db7a7]"/> Personal records only</label>
      </div>
      <div className="space-y-3">
        {filteredWorkouts.length === 0 ? (
          <EmptyState message={workouts.length ? "No workouts match these filters." : "No workouts logged yet."} />
        ) : (
          <>
            {visibleWorkouts.map((workout) => (
              <details key={workout.id} className="rounded-md border border-line p-3">
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{workoutDisplayName(workout)}</p>
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
                      <div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium">{exercise.name}</p>{(recordsByExercise.get(exercise.id) ?? []).map((record) => <span key={record} className="rounded-full border border-growth/40 bg-growth/10 px-2 py-0.5 text-[10px] font-semibold text-growth">PR: {record === "TOP_WEIGHT" ? "top weight" : record === "ESTIMATED_1RM" ? "estimated 1RM" : record.toLowerCase()}</span>)}</div>
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
            {filteredWorkouts.length > 5 ? (
              <div className="flex flex-wrap justify-center gap-2 pt-1">
                {canShowMore ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      setVisibleCount((current) => Math.min(current + 5, filteredWorkouts.length))
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
