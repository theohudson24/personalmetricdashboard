"use client";

import { Plus, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createWorkout } from "@/app/actions";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { clearDraft, readDraft, writeDraft } from "@/lib/clientDraft";

type SetDraft = {
  id: string;
  reps: number | "";
  weight: number | "";
  setType: string;
};

type ExerciseDraft = {
  id: string;
  name: string;
  notes: string;
  sets: SetDraft[];
};

type WorkoutTemplate = {
  id: string;
  name: string;
  notes: string | null;
  exercises: Array<{
    name: string;
    notes: string | null;
    sets: Array<{
      reps: number;
      weight: number;
      setType: string;
    }>;
  }>;
};

const today = new Date().toISOString().slice(0, 10);
const workoutTypes = [
  "Push",
  "Pull",
  "Legs",
  "Upper",
  "Lower",
  "Full Body",
  "Chest/Tri/Shoulders",
  "Back/Bi",
  "Abs/Legs",
  "Arms",
  "Shoulders",
  "Cardio",
  "Mobility",
];

function newSet(set?: Partial<SetDraft>): SetDraft {
  return {
    id: crypto.randomUUID(),
    reps: set?.reps ?? "",
    weight: set?.weight ?? "",
    setType: set?.setType ?? "WORKING",
  };
}

function newExercise(exercise?: Partial<ExerciseDraft>): ExerciseDraft {
  return {
    id: crypto.randomUUID(),
    name: exercise?.name ?? "",
    notes: exercise?.notes ?? "",
    sets: exercise?.sets?.length ? exercise.sets : [newSet()],
  };
}

export function WorkoutForm({
  exerciseOptions,
  workoutNameOptions,
  templates,
  draftScope,
}: {
  exerciseOptions: Array<{
    name: string;
    muscleGroup: string;
    equipment: string | null;
  }>;
  workoutNameOptions: string[];
  templates: WorkoutTemplate[];
  draftScope: string;
}) {
  const [isLogging, setIsLogging] = useState(false);
  const [workoutName, setWorkoutName] = useState("");
  const [workoutNotes, setWorkoutNotes] = useState("");
  const [exercises, setExercises] = useState<ExerciseDraft[]>([]);
  const [formKey, setFormKey] = useState(crypto.randomUUID());
  const restored = useRef(false);

  useEffect(() => {
    clearDraft("workout");
    const saved = readDraft<{ workoutName: string; workoutNotes: string; exercises: ExerciseDraft[] }>(`${draftScope}:workout`);
    if (saved?.exercises?.length) {
      setWorkoutName(saved.workoutName);
      setWorkoutNotes(saved.workoutNotes);
      setExercises(saved.exercises);
      setIsLogging(true);
    }
    restored.current = true;
  }, [draftScope]);

  useEffect(() => { if (restored.current && isLogging) writeDraft(`${draftScope}:workout`, { workoutName, workoutNotes, exercises }); }, [draftScope, exercises, isLogging, workoutName, workoutNotes]);

  function startBlankWorkout() {
    setWorkoutName("");
    setWorkoutNotes("");
    setExercises([newExercise()]);
    setIsLogging(true);
    setFormKey(crypto.randomUUID());
  }

  function startFromTemplate(template: WorkoutTemplate) {
    setWorkoutName(template.name);
    setWorkoutNotes(template.notes ?? "");
    setExercises(
      template.exercises.map((exercise) =>
        newExercise({
          name: exercise.name,
          notes: exercise.notes ?? "",
          sets: exercise.sets.length
            ? exercise.sets.map((set) =>
                newSet({
                  reps: set.reps,
                  weight: set.weight,
                  setType: set.setType,
                }),
              )
            : [newSet()],
        }),
      ),
    );
    setIsLogging(true);
    setFormKey(crypto.randomUUID());
  }

  function addExercise() {
    setExercises((current) => [...current, newExercise()]);
  }

  function removeExercise(id: string) {
    setExercises((current) =>
      current.length === 1 ? current : current.filter((exercise) => exercise.id !== id),
    );
  }

  function addSet(exerciseId: string) {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.id === exerciseId
          ? { ...exercise, sets: [...exercise.sets, newSet()] }
          : exercise,
      ),
    );
  }

  function removeSet(exerciseId: string, setId: string) {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.id === exerciseId && exercise.sets.length > 1
          ? { ...exercise, sets: exercise.sets.filter((set) => set.id !== setId) }
          : exercise,
      ),
    );
  }

  if (!isLogging) {
    return (
      <Card>
        <CardHeader
          title="Workout logger"
          description="Start a blank workout or load one of your saved templates."
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={startBlankWorkout}>
            <Plus size={16} />
            <span className="ml-2">Start workout</span>
          </Button>
        </div>
        <div className="mt-5">
          <h3 className="mb-3 text-sm font-semibold">Saved templates</h3>
          {templates.length === 0 ? (
            <EmptyState title="No workout templates yet" message="Start a workout above and choose to save it as a template when you want to reuse the same structure." />
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => startFromTemplate(template)}
                  className="rounded-md border border-line bg-ink/[0.025] p-3 text-left transition hover:border-core/40 hover:bg-ink/[0.04]"
                >
                  <span className="block text-sm font-medium">{template.name}</span>
                  <span className="mt-1 block text-xs text-muted">
                    {template.exercises.length} exercises
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Workout logger"
        description="Create a workout with exercises, sets, reps, and weight."
      />
      <form key={formKey} action={async (data) => { await createWorkout(data); clearDraft(`${draftScope}:workout`); }} className="space-y-5">
        <datalist id="workout-name-options">
          {[...new Set([...workoutTypes, ...workoutNameOptions])].map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <datalist id="exercise-name-options">
          {exerciseOptions.map((exercise) => (
            <option
              key={exercise.name}
              value={exercise.name}
              label={`${exercise.muscleGroup}${exercise.equipment ? ` / ${exercise.equipment}` : ""}`}
            />
          ))}
        </datalist>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Date">
            <Input name="date" type="date" defaultValue={today} />
          </Field>
          <Field label="Workout name">
            <Input
              name="name"
              list="workout-name-options"
              placeholder="Push day"
              defaultValue={workoutName}
              onChange={(event) => setWorkoutName(event.target.value)}
              required
            />
          </Field>
        </div>
        <Field label="Workout notes">
          <Textarea
            name="notes"
            placeholder="Energy, focus, pump, recovery..."
            defaultValue={workoutNotes}
            onChange={(event) => setWorkoutNotes(event.target.value)}
          />
        </Field>

        <div className="space-y-4">
          {exercises.map((exercise, exerciseIndex) => (
            <div key={exercise.id} className="rounded-md border border-line bg-ink/[0.02] p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">Exercise {exerciseIndex + 1}</p>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 w-9 p-0 text-muted hover:border-ember/50 hover:bg-ember/15 hover:text-ember active:bg-ember/20"
                  onClick={() => removeExercise(exercise.id)}
                  title="Remove exercise"
                >
                  <X size={17} />
                </Button>
              </div>
              <div className="grid gap-3">
                <Field label="Exercise">
                  <Input
                    name="exerciseName"
                    list="exercise-name-options"
                    placeholder="Bench press"
                    defaultValue={exercise.name}
                    onChange={(event) => setExercises((current) => current.map((entry) => entry.id === exercise.id ? { ...entry, name: event.target.value } : entry))}
                    required
                  />
                </Field>
              </div>
              <div className="mt-3">
                <Field label="Exercise notes">
                  <Input
                    name="exerciseNotes"
                    placeholder="Grip, tempo, form notes"
                    defaultValue={exercise.notes}
                    onChange={(event) => setExercises((current) => current.map((entry) => entry.id === exercise.id ? { ...entry, notes: event.target.value } : entry))}
                  />
                </Field>
              </div>

              <div className="mt-4 space-y-2">
                {exercise.sets.map((set, setIndex) => (
                  <div
                    key={set.id}
                    className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_9rem_auto]"
                  >
                    <input type="hidden" name="setExerciseIndex" value={exerciseIndex} />
                    <Input
                      name="reps"
                      type="number"
                      min="0"
                      placeholder={`Set ${setIndex + 1} reps`}
                      defaultValue={set.reps}
                      onChange={(event) => setExercises((current) => current.map((entry) => entry.id === exercise.id ? { ...entry, sets: entry.sets.map((row) => row.id === set.id ? { ...row, reps: event.target.value === "" ? "" : Number(event.target.value) } : row) } : entry))}
                      required
                    />
                    <Input
                      name="weight"
                      type="number"
                      step="0.5"
                      min="0"
                      placeholder="Weight"
                      defaultValue={set.weight}
                      onChange={(event) => setExercises((current) => current.map((entry) => entry.id === exercise.id ? { ...entry, sets: entry.sets.map((row) => row.id === set.id ? { ...row, weight: event.target.value === "" ? "" : Number(event.target.value) } : row) } : entry))}
                      required
                    />
                    <select
                      name="setType"
                      defaultValue={set.setType}
                      aria-label={`Set ${setIndex + 1} type`}
                      onChange={(event) => setExercises((current) => current.map((entry) => entry.id === exercise.id ? { ...entry, sets: entry.sets.map((row) => row.id === set.id ? { ...row, setType: event.target.value } : row) } : entry))}
                      className="min-h-11 w-full rounded-md border border-line bg-ink/[0.04] px-3 text-sm text-ink transition focus:border-core"
                    >
                      <option value="WORKING">Working</option>
                      <option value="DROP_SET">Drop set</option>
                      <option value="WARM_UP">Warm-up</option>
                      <option value="FAILURE">Failure</option>
                    </select>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-11 w-11 p-0 text-muted hover:border-ember/50 hover:bg-ember/15 hover:text-ember active:bg-ember/20"
                      onClick={() => removeSet(exercise.id, set.id)}
                      title="Remove set"
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="secondary" className="mt-3" onClick={() => addSet(exercise.id)}>
                <Plus size={16} />
                <span className="ml-2">Add set</span>
              </Button>
            </div>
          ))}
        </div>

        <div className="rounded-md border border-line bg-ink/[0.025] p-3">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input name="saveAsTemplate" type="checkbox" className="h-4 w-4" />
            Save this workout as a template
          </label>
          <div className="mt-3">
            <Field label="Template name">
              <Input name="templateName" defaultValue={workoutName} placeholder="Push day" />
            </Field>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={addExercise}>
            <Plus size={16} />
            <span className="ml-2">Add exercise</span>
          </Button>
          <SubmitButton idle="Save workout" pending="Saving workout…" />
          <Button type="button" variant="ghost" onClick={() => setIsLogging(false)}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
