import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";

loadEnvConfig(process.cwd());
const prisma = new PrismaClient();

async function main() {
  const [profiles, settings, todos, workouts, meals, habits, ascensionGoals] = await Promise.all([
    prisma.profile.count(), prisma.userSettings.count(), prisma.todoItem.count(), prisma.workout.count(), prisma.meal.count(),
    prisma.habit.count(), prisma.ascensionGoal.count(),
  ]);
  console.log(JSON.stringify({ connection: "ok", profiles, settings, todos, workouts, meals, habits, ascensionGoals, ownershipSchema: "required" }));
}

main().finally(() => prisma.$disconnect());
