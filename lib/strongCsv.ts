import { PrismaClient } from "@prisma/client";
import { inferExerciseDetails } from "@/lib/exerciseCatalog";

type Row = Record<string, string>;

export function parseStrongCsv(content: string): Row[] {
  const rows: string[][] = []; let row: string[] = []; let field = ""; let quoted = false;
  for (let i = 0; i < content.length; i += 1) {
    const char = content[i]; const next = content[i + 1];
    if (char === '"' && quoted && next === '"') { field += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(field); field = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) { if (char === "\r" && next === "\n") i += 1; row.push(field); if (row.some(Boolean)) rows.push(row); row = []; field = ""; }
    else field += char;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [headers, ...data] = rows;
  if (!headers?.includes("Date") || !headers.includes("Workout Name") || !headers.includes("Exercise Name")) throw new Error("This does not look like a Strong CSV export.");
  return data.map((values) => Object.fromEntries(headers.map((header, index) => [header.trim(), values[index] ?? ""])));
}

const num = (value: string) => Number.isFinite(Number(value)) ? Number(value) : 0;
const optional = (value: string) => value?.trim() && Number.isFinite(Number(value)) ? Number(value) : null;
function date(value: string) { const parsed = new Date(value.replace(" ", "T")); if (Number.isNaN(parsed.getTime())) throw new Error(`Invalid workout date: ${value}`); return parsed; }
function minutes(value: string) { return Math.round((Number(value.match(/([\d.]+)h/)?.[1]) || 0) * 60 + (Number(value.match(/([\d.]+)m/)?.[1]) || 0) + (Number(value.match(/([\d.]+)s/)?.[1]) || 0) / 60); }
function type(value: string) { const v = value.trim().toUpperCase(); return v === "D" ? "DROP_SET" : v === "W" ? "WARM_UP" : v === "F" ? "FAILURE" : "WORKING"; }

export async function importStrongCsv(prisma: PrismaClient, profileId: string, content: string) {
  const rows = parseStrongCsv(content).filter((row) => row.Date && row["Workout Name"] && row["Exercise Name"]);
  if (!rows.length) throw new Error("No valid workout rows were found in this file.");
  if (rows.length > 50_000) throw new Error("The export is too large to import at once.");
  const groups = new Map<string, Row[]>();
  for (const row of rows) { const key = `${row.Date}::${row["Workout Name"]}`; groups.set(key, [...(groups.get(key) ?? []), row]); }
  let created = 0; let updated = 0;
  for (const [key, workoutRows] of groups) {
    const split = key.indexOf("::"); const dateValue = key.slice(0, split); const name = key.slice(split + 2);
    const externalId = `strong:${dateValue}:${name}`;
    const existing = await prisma.workout.findUnique({ where: { profileId_source_externalId: { profileId, source: "strong", externalId } } });
    const names = [...new Set(workoutRows.map((row) => row["Exercise Name"]))];
    const exercises = names.map((exerciseName) => ({
      name: exerciseName, muscleGroup: inferExerciseDetails(exerciseName).muscleGroup,
      notes: workoutRows.find((row) => row["Exercise Name"] === exerciseName && row.Notes)?.Notes || null,
      sets: { create: workoutRows.filter((row) => row["Exercise Name"] === exerciseName).map((row, index) => ({ setNumber: /^\d+$/.test(row["Set Order"]?.trim()) ? Number(row["Set Order"]) : index + 1, setType: type(row["Set Order"] || ""), reps: Math.round(num(row.Reps)), weight: num(row.Weight), distance: num(row.Distance), seconds: num(row.Seconds), rpe: optional(row.RPE), notes: row.Notes || null })) },
    }));
    const data = { date: date(dateValue), name, duration: workoutRows[0].Duration || null, durationMinutes: workoutRows[0].Duration ? minutes(workoutRows[0].Duration) : null, muscleGroups: [...new Set(names.map((item) => inferExerciseDetails(item).muscleGroup))].join(", ") || "General", notes: workoutRows.find((row) => row["Workout Notes"])?.["Workout Notes"] || null };
    await prisma.$transaction(async (tx) => {
      if (existing) { await tx.exercise.deleteMany({ where: { workoutId: existing.id } }); await tx.workout.update({ where: { id: existing.id }, data: { ...data, exercises: { create: exercises } } }); updated += 1; }
      else { await tx.workout.create({ data: { ...data, profileId, source: "strong", externalId, exercises: { create: exercises } } }); created += 1; }
    });
  }
  return { created, updated, rows: rows.length };
}
