import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import { exerciseCatalogSeeds } from "../lib/exerciseCatalog";

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

const today = new Date();
today.setHours(0, 0, 0, 0);

async function main() {
  const authUserId = process.env.TEST_AUTH_USER_ID;
  if (!authUserId) throw new Error("Set TEST_AUTH_USER_ID to the authenticated Supabase user ID before seeding.");
  const profile = await prisma.profile.upsert({ where: { authUserId }, update: {}, create: { authUserId, displayName: "Test User" } });

  const settings = await prisma.userSettings.findUnique({ where: { profileId: profile.id } });

  if (!settings) {
    await prisma.userSettings.create({
      data: {
        profileId: profile.id,
        dailyCalorieGoal: 3000,
        dailyProteinGoal: 180,
        dailyCarbGoal: 350,
        dailyFatGoal: 85,
        dailyFiberGoal: 30,
        dailyWaterGoal: 128,
      },
    });
  }

  const existingTodos = await prisma.todoItem.count({ where: { date: today, profileId: profile.id } });

  if (existingTodos === 0) {
    await prisma.todoItem.createMany({
      data: [
        "Log morning body weight",
        "Log sleep hours",
        "Score energy, soreness, stress, and mood",
        "Log first water intake",
        "Plan protein and calories for the day",
        "Choose today's training focus",
        "Review yesterday's nutrition and workout notes",
      ].map((title) => ({ date: today, title, profileId: profile.id })),
    });
  }

  for (const exercise of exerciseCatalogSeeds) {
    await prisma.exerciseCatalog.upsert({
      where: { name: exercise.name },
      update: exercise,
      create: exercise,
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
