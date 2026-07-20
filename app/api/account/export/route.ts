import { strToU8, zipSync } from "fflate";
import { getDefaultProfile } from "@/lib/profile";
import { prisma } from "@/lib/prisma";

function csvCell(value: unknown) {
  let text = value === null || value === undefined ? "" : value instanceof Date ? value.toISOString() : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

function csv(rows: Array<Record<string, unknown>>) {
  if (!rows.length) return "";
  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  return `${headers.map(csvCell).join(",")}\n${rows.map((row) => headers.map((header) => csvCell(row[header])).join(",")).join("\n")}\n`;
}

export async function GET() {
  const profile = await getDefaultProfile();
  const [settings, meals, savedFoods, workouts, habits, goals, routines, checklist, reviews, bugReports, deletionRequests] = await Promise.all([
    prisma.userSettings.findUnique({ where: { profileId: profile.id } }),
    prisma.meal.findMany({ where: { profileId: profile.id }, include: { foodItems: true }, orderBy: { date: "desc" } }),
    prisma.savedFood.findMany({ where: { profileId: profile.id }, orderBy: { updatedAt: "desc" } }),
    prisma.workout.findMany({ where: { profileId: profile.id }, include: { exercises: { include: { sets: true } } }, orderBy: { date: "desc" } }),
    prisma.habit.findMany({ where: { profileId: profile.id }, include: { completions: true, relapses: true }, orderBy: { createdAt: "desc" } }),
    prisma.ascensionGoal.findMany({ where: { profileId: profile.id }, orderBy: { createdAt: "desc" } }),
    prisma.selfImprovementRoutine.findMany({ where: { profileId: profile.id }, include: { tasks: true }, orderBy: { createdAt: "desc" } }),
    prisma.selfImprovementChecklistItem.findMany({ where: { profileId: profile.id }, orderBy: { date: "desc" } }),
    prisma.selfImprovementWeeklyReview.findMany({ where: { profileId: profile.id }, orderBy: { weekStart: "desc" } }),
    prisma.bugReport.findMany({ where: { profileId: profile.id }, select: { id: true, category: true, summary: true, description: true, pageUrl: true, status: true, createdAt: true, updatedAt: true }, orderBy: { createdAt: "desc" } }),
    prisma.accountDeletionRequest.findMany({ where: { profileId: profile.id }, select: { id: true, reason: true, status: true, createdAt: true, updatedAt: true, reviewedAt: true }, orderBy: { createdAt: "desc" } }),
  ]);
  const publicProfile = { displayName: profile.displayName, heightInches: profile.heightInches, weightLb: profile.weightLb, age: profile.age, gender: profile.gender, activityLevel: profile.activityLevel, phone: profile.phone, createdAt: profile.createdAt, updatedAt: profile.updatedAt };
  const data = { exportedAt: new Date(), profile: publicProfile, settings, meals, savedFoods, workouts, habits, selfImprovement: { goals, routines, checklist, reviews }, bugReports, deletionRequests };
  const mealRows = meals.flatMap((meal) => meal.foodItems.map((item) => ({ date: meal.date, entryKind: meal.entryKind, mealType: meal.mealType, mealName: meal.mealName, item: item.name, servingSize: item.servingSize, calories: item.calories, protein: item.protein, carbs: item.carbs, fat: item.fat, fiber: item.fiber })));
  const workoutRows = workouts.flatMap((workout) => workout.exercises.flatMap((exercise) => exercise.sets.map((set) => ({ date: workout.date, workout: workout.name, exercise: exercise.name, muscleGroup: exercise.muscleGroup, setNumber: set.setNumber, setType: set.setType, reps: set.reps, weight: set.weight, distance: set.distance, seconds: set.seconds, rpe: set.rpe }))));
  const habitRows = habits.flatMap((habit) => habit.completions.map((completion) => ({ habit: habit.name, type: habit.type, date: completion.date, status: completion.status, notes: completion.notes })));
  const files = {
    "metric-os-export.json": strToU8(JSON.stringify(data, null, 2)),
    "profile.csv": strToU8(csv([{ ...publicProfile, settings: settings ? "See JSON export for complete nutrition settings" : "" } ])),
    "meals.csv": strToU8(csv(mealRows)),
    "workouts.csv": strToU8(csv(workoutRows)),
    "habits.csv": strToU8(csv(habitRows)),
    "bug-reports.csv": strToU8(csv(bugReports)),
  };
  const archive = zipSync(files, { level: 6 });
  const date = new Date().toISOString().slice(0, 10);
  return new Response(archive, { headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="metric-os-export-${date}.zip"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
