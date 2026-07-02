import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";
import { inferExerciseDetails } from "../lib/exerciseCatalog";

const prisma = new PrismaClient();
const filePath = process.argv[2] ?? join(process.cwd(), "imports", "strong_workouts.csv");

type StrongRow = {
  Date: string;
  "Workout Name": string;
  Duration: string;
  "Exercise Name": string;
  "Set Order": string;
  Weight: string;
  Reps: string;
  Distance: string;
  Seconds: string;
  Notes: string;
  "Workout Notes": string;
  RPE: string;
};

function parseCsv(content: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(field);
      if (row.some((value) => value.length > 0)) {
        rows.push(row);
      }
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const [headers, ...data] = rows;

  return data.map((values) =>
    headers.reduce<Record<string, string>>((record, header, index) => {
      record[header] = values[index] ?? "";
      return record;
    }, {}),
  ) as StrongRow[];
}

function numberValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function optionalNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && value.trim() !== "" ? parsed : null;
}

function parseDurationMinutes(value: string) {
  const hours = value.match(/(\d+(?:\.\d+)?)h/);
  const minutes = value.match(/(\d+(?:\.\d+)?)m/);
  const seconds = value.match(/(\d+(?:\.\d+)?)s/);

  return Math.round(
    (hours ? Number(hours[1]) * 60 : 0) +
      (minutes ? Number(minutes[1]) : 0) +
      (seconds ? Number(seconds[1]) / 60 : 0),
  );
}

function parseStrongDate(value: string) {
  const normalized = value.replace(" ", "T");
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid Strong workout date: ${value}`);
  }

  return date;
}

function setType(setOrder: string) {
  const normalized = setOrder.trim().toUpperCase();

  if (normalized === "D") {
    return "DROP_SET";
  }

  if (normalized === "W") {
    return "WARM_UP";
  }

  if (normalized === "F") {
    return "FAILURE";
  }

  if (/^\d+$/.test(setOrder.trim())) {
    return "WORKING";
  }

  return normalized.replace(/[^A-Z0-9]+/g, "_") || "WORKING";
}

async function main() {
  if (!existsSync(filePath)) {
    throw new Error(`Strong CSV file not found: ${filePath}`);
  }

  const profile =
    (await prisma.profile.findFirst({ where: { isDefault: true } })) ??
    (await prisma.profile.create({
      data: { displayName: "Theo", isDefault: true },
    }));

  await prisma.userSettings.upsert({
    where: { profileId: profile.id },
    update: {},
    create: { profileId: profile.id },
  });

  await prisma.workout.updateMany({
    where: { profileId: null },
    data: { profileId: profile.id },
  });
  await prisma.dailyLog.updateMany({
    where: { profileId: null },
    data: { profileId: profile.id },
  });
  await prisma.todoItem.updateMany({
    where: { profileId: null },
    data: { profileId: profile.id },
  });
  await prisma.meal.updateMany({
    where: { profileId: null },
    data: { profileId: profile.id },
  });
  await prisma.bodyMeasurement.updateMany({
    where: { profileId: null },
    data: { profileId: profile.id },
  });

  const rows = parseCsv(readFileSync(filePath, "utf8")).filter(
    (row) => row.Date && row["Workout Name"] && row["Exercise Name"],
  );

  const grouped = new Map<string, StrongRow[]>();

  for (const row of rows) {
    const key = `${row.Date}::${row["Workout Name"]}`;
    grouped.set(key, [...(grouped.get(key) ?? []), row]);

    const inferred = inferExerciseDetails(row["Exercise Name"]);
    await prisma.exerciseCatalog.upsert({
      where: { name: inferred.name },
      update: {
        muscleGroup: inferred.muscleGroup,
        category: inferred.category,
        equipment: inferred.equipment,
        importedFrom: "strong",
      },
      create: {
        ...inferred,
        importedFrom: "strong",
      },
    });
  }

  let created = 0;
  let skipped = 0;

  for (const [key, workoutRows] of grouped.entries()) {
    const [dateValue, workoutName] = key.split("::");
    const externalId = `strong:${dateValue}:${workoutName}`;
    const existing = await prisma.workout.findUnique({ where: { externalId } });

    if (existing) {
      skipped += 1;
      continue;
    }

    const exerciseNames = Array.from(
      new Set(workoutRows.map((row) => row["Exercise Name"])),
    );
    const inferredGroups = Array.from(
      new Set(exerciseNames.map((name) => inferExerciseDetails(name).muscleGroup)),
    );
    const workoutNotes = workoutRows.find((row) => row["Workout Notes"])?.[
      "Workout Notes"
    ];

    await prisma.workout.create({
      data: {
        profileId: profile.id,
        date: parseStrongDate(dateValue),
        name: workoutName,
        duration: workoutRows[0].Duration || null,
        durationMinutes: workoutRows[0].Duration
          ? parseDurationMinutes(workoutRows[0].Duration)
          : null,
        muscleGroups: inferredGroups.join(", ") || "General",
        notes: workoutNotes || null,
        source: "strong",
        externalId,
        exercises: {
          create: exerciseNames.map((exerciseName) => {
            const exerciseRows = workoutRows.filter(
              (row) => row["Exercise Name"] === exerciseName,
            );
            const exerciseNotes = exerciseRows.find((row) => row.Notes)?.Notes;

            return {
              name: exerciseName,
              muscleGroup: inferExerciseDetails(exerciseName).muscleGroup,
              notes: exerciseNotes || null,
              sets: {
                create: exerciseRows.map((row, index) => ({
                  setNumber: /^\d+$/.test(row["Set Order"].trim())
                    ? Number(row["Set Order"])
                    : index + 1,
                  setType: setType(row["Set Order"]),
                  reps: Math.round(numberValue(row.Reps)),
                  weight: numberValue(row.Weight),
                  distance: numberValue(row.Distance),
                  seconds: numberValue(row.Seconds),
                  rpe: optionalNumber(row.RPE),
                  notes: row.Notes || null,
                })),
              },
            };
          }),
        },
      },
    });

    created += 1;
  }

  console.log(
    `Imported ${created} Strong workouts for ${profile.displayName}. Skipped ${skipped} duplicates. Parsed ${rows.length} CSV rows.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
