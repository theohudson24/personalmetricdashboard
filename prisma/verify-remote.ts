import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";

loadEnvConfig(process.cwd());
const prisma = new PrismaClient();

async function main() {
  const [profiles, settings, todos, workouts, meals] = await Promise.all([
    prisma.profile.count(), prisma.userSettings.count(), prisma.todoItem.count(), prisma.workout.count(), prisma.meal.count(),
  ]);
  console.log(JSON.stringify({ connection: "ok", profiles, settings, todos, workouts, meals, ownershipSchema: "required" }));
}

main().finally(() => prisma.$disconnect());
