import { createHash } from "node:crypto";
import { Prisma, PrismaClient } from "@prisma/client";
import { inferExerciseDetails } from "@/lib/exerciseCatalog";

export type StrongRow = Record<string, string>;

export type StrongImportSummary = {
  added: number;
  updated: number;
  skipped: number;
  failed: number;
  rows: number;
  workouts: number;
  failures: string[];
};

type NormalizedSet = {
  setNumber: number;
  setType: string;
  reps: number;
  weight: number;
  distance: number;
  seconds: number;
  rpe: number | null;
  notes: string | null;
};

export type StrongWorkoutPlan = {
  externalId: string;
  fingerprint: string;
  date: Date;
  name: string;
  duration: string | null;
  durationMinutes: number | null;
  muscleGroups: string;
  notes: string | null;
  rowCount: number;
  exercises: Array<{
    name: string;
    muscleGroup: string;
    notes: string | null;
    sets: NormalizedSet[];
  }>;
};

const requiredHeaders = ["Date", "Workout Name", "Exercise Name"];
const maxRows = 50_000;
const maxTextLength = 1_000;
const maxSetValue = 1_000_000;

export function parseStrongCsv(content: string): StrongRow[] {
  if (content.includes("\0")) throw new Error("The CSV contains unsupported binary data.");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];
    const next = content[index + 1];
    if (character === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error("The CSV contains an unfinished quoted field.");
  if (field || row.length) {
    row.push(field);
    if (row.some((value) => value.trim())) rows.push(row);
  }

  const [rawHeaders, ...data] = rows;
  const headers = rawHeaders?.map((header, index) => index === 0 ? header.replace(/^\uFEFF/, "").trim() : header.trim());
  if (!headers || requiredHeaders.some((header) => !headers.includes(header))) {
    throw new Error("This does not look like a Strong CSV export.");
  }
  if (new Set(headers).size !== headers.length) throw new Error("The CSV contains duplicate column names.");
  if (data.length > maxRows) throw new Error("The export is too large to import at once.");

  return data.map((values) => Object.fromEntries(headers.map((header, index) => [header, (values[index] ?? "").trim()])));
}

export function buildStrongImportPlan(content: string) {
  const rows = parseStrongCsv(content);
  if (!rows.length) throw new Error("No workout rows were found in this file.");
  const groups = new Map<string, StrongRow[]>();
  const invalidRows: string[] = [];

  rows.forEach((row, index) => {
    if (!row.Date || !row["Workout Name"] || !row["Exercise Name"]) {
      invalidRows.push(`Row ${index + 2} is missing a date, workout name, or exercise name.`);
      return;
    }
    const key = `${normalizeText(row.Date)}::${normalizeText(row["Workout Name"]).toLowerCase()}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  });

  if (!groups.size) throw new Error("No valid workout rows were found in this file.");
  const plans: StrongWorkoutPlan[] = [];
  const failures = [...invalidRows];

  for (const workoutRows of groups.values()) {
    try {
      plans.push(normalizeWorkout(workoutRows));
    } catch (error) {
      failures.push(error instanceof Error ? error.message : "A workout could not be normalized.");
    }
  }

  return { plans, rows: rows.length, failures };
}

export async function importStrongCsv(prisma: PrismaClient, profileId: string, content: string): Promise<StrongImportSummary> {
  const prepared = buildStrongImportPlan(content);
  const summary: StrongImportSummary = {
    added: 0, updated: 0, skipped: 0, failed: prepared.failures.length,
    rows: prepared.rows, workouts: prepared.plans.length + prepared.failures.length,
    failures: prepared.failures.slice(0, 10),
  };

  for (const plan of prepared.plans) {
    try {
      const result = await importWorkout(prisma, profileId, plan);
      summary[result] += 1;
    } catch {
      summary.failed += 1;
      if (summary.failures.length < 10) summary.failures.push(`${plan.name} on ${plan.date.toISOString().slice(0, 10)} could not be imported.`);
    }
  }

  return summary;
}

async function importWorkout(prisma: PrismaClient, profileId: string, plan: StrongWorkoutPlan): Promise<"added" | "updated" | "skipped"> {
  const canonical = await prisma.workout.findUnique({
    where: { profileId_source_externalId: { profileId, source: "strong", externalId: plan.externalId } },
  });
  const legacy = canonical ?? await prisma.workout.findFirst({
    where: { profileId, source: "strong", date: plan.date, name: { equals: plan.name, mode: "insensitive" } },
  });
  if (legacy?.importFingerprint === plan.fingerprint) return "skipped";

  const data = {
    date: plan.date, name: plan.name, duration: plan.duration,
    durationMinutes: plan.durationMinutes, muscleGroups: plan.muscleGroups,
    notes: plan.notes, externalId: plan.externalId, importFingerprint: plan.fingerprint,
  };
  const exercises = plan.exercises.map((exercise) => ({
    name: exercise.name, muscleGroup: exercise.muscleGroup, notes: exercise.notes,
    sets: { create: exercise.sets },
  }));

  try {
    await replaceWorkout(prisma, profileId, legacy?.id, data, exercises);
  } catch (error) {
    if (!isUniqueConstraintError(error) || legacy) throw error;
    const raced = await prisma.workout.findUnique({
      where: { profileId_source_externalId: { profileId, source: "strong", externalId: plan.externalId } },
    });
    if (!raced) throw error;
    if (raced.importFingerprint === plan.fingerprint) return "skipped";
    await replaceWorkout(prisma, profileId, raced.id, data, exercises);
    return "updated";
  }
  return legacy ? "updated" : "added";
}

async function replaceWorkout(
  prisma: PrismaClient,
  profileId: string,
  existingId: string | undefined,
  data: Omit<StrongWorkoutPlan, "exercises" | "rowCount" | "fingerprint"> & { importFingerprint: string },
  exercises: Array<{ name: string; muscleGroup: string; notes: string | null; sets: { create: NormalizedSet[] } }>,
) {
  await prisma.$transaction(async (transaction) => {
    if (existingId) {
      await transaction.exercise.deleteMany({ where: { workoutId: existingId } });
      await transaction.workout.update({ where: { id: existingId }, data: { ...data, exercises: { create: exercises } } });
    } else {
      await transaction.workout.create({ data: { ...data, profileId, source: "strong", exercises: { create: exercises } } });
    }
  });
}

function normalizeWorkout(rows: StrongRow[]): StrongWorkoutPlan {
  const first = rows[0];
  const workoutDate = parseStrongDate(first.Date);
  const name = boundedText(first["Workout Name"], "Workout name");
  const exerciseNames = [...new Set(rows.map((row) => boundedText(row["Exercise Name"], "Exercise name")))];
  const exercises = exerciseNames.map((exerciseName) => ({
    name: exerciseName,
    muscleGroup: inferExerciseDetails(exerciseName).muscleGroup,
    notes: nullableText(rows.find((row) => row["Exercise Name"] === exerciseName && row.Notes)?.Notes),
    sets: rows.filter((row) => row["Exercise Name"] === exerciseName).map((row, index) => normalizeSet(row, index)),
  }));
  const duration = nullableText(first.Duration);
  const normalized = {
    date: workoutDate.toISOString(), name, duration,
    durationMinutes: duration ? durationMinutes(duration) : null,
    muscleGroups: [...new Set(exerciseNames.map((exercise) => inferExerciseDetails(exercise).muscleGroup))].join(", ") || "General",
    notes: nullableText(rows.find((row) => row["Workout Notes"])?.["Workout Notes"]),
    exercises,
  };
  const identity = `${normalized.date}::${normalizeText(name).toLowerCase()}`;
  return {
    ...normalized,
    date: workoutDate,
    rowCount: rows.length,
    externalId: `strong:${sha256(identity).slice(0, 32)}`,
    fingerprint: sha256(JSON.stringify(canonicalize(normalized))),
  };
}

function normalizeSet(row: StrongRow, index: number): NormalizedSet {
  const setOrder = row["Set Order"] || "";
  return {
    setNumber: /^\d+$/.test(setOrder) ? boundedNumber(setOrder, "Set number", true) : index + 1,
    setType: setType(setOrder), reps: boundedNumber(row.Reps, "Repetitions", true),
    weight: boundedNumber(row.Weight, "Weight"), distance: boundedNumber(row.Distance, "Distance"),
    seconds: boundedNumber(row.Seconds, "Seconds"), rpe: optionalNumber(row.RPE, "RPE", 10),
    notes: nullableText(row.Notes),
  };
}

function parseStrongDate(value: string) {
  const normalized = value.trim();
  const local = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(normalized);
  const parsed = local
    ? new Date(Date.UTC(Number(local[1]), Number(local[2]) - 1, Number(local[3]), Number(local[4]), Number(local[5]), Number(local[6] || 0)))
    : new Date(normalized);
  if (Number.isNaN(parsed.getTime())) throw new Error(`Invalid workout date: ${value}`);
  return parsed;
}

function durationMinutes(value: string) {
  const hours = Number(value.match(/([\d.]+)h/i)?.[1]) || 0;
  const minutes = Number(value.match(/([\d.]+)m/i)?.[1]) || 0;
  const seconds = Number(value.match(/([\d.]+)s/i)?.[1]) || 0;
  return Math.round(hours * 60 + minutes + seconds / 60);
}

function setType(value: string) {
  const normalized = value.trim().toUpperCase();
  return normalized === "D" ? "DROP_SET" : normalized === "W" ? "WARM_UP" : normalized === "F" ? "FAILURE" : "WORKING";
}

function boundedNumber(raw: string | undefined, label: string, integer = false) {
  if (!raw?.trim()) return 0;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || value > maxSetValue) throw new Error(`${label} contains an invalid value.`);
  return integer ? Math.round(value) : value;
}

function optionalNumber(raw: string | undefined, label: string, maximum: number) {
  if (!raw?.trim()) return null;
  const value = boundedNumber(raw, label);
  if (value > maximum) throw new Error(`${label} must not exceed ${maximum}.`);
  return value;
}

function boundedText(value: string, label: string) {
  const normalized = normalizeText(value);
  if (!normalized) throw new Error(`${label} is required.`);
  if (normalized.length > 200) throw new Error(`${label} is too long.`);
  return normalized;
}

function nullableText(value?: string) {
  const normalized = normalizeText(value || "");
  if (!normalized) return null;
  return normalized.slice(0, maxTextLength);
}

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonicalize(entry)]));
  }
  return value;
}

export function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}
