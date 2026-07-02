import { PrismaClient } from "@prisma/client";
import { exerciseCatalogSeeds } from "../lib/exerciseCatalog";

const prisma = new PrismaClient();

const today = new Date();
today.setHours(0, 0, 0, 0);

async function main() {
  const profile =
    (await prisma.profile.findFirst({ where: { isDefault: true } })) ??
    (await prisma.profile.create({
      data: { displayName: "Theo", isDefault: true },
    }));

  const settings = await prisma.userSettings.findFirst();

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

  const existingTodos = await prisma.todoItem.count({ where: { date: today } });

  if (existingTodos === 0) {
    await prisma.todoItem.createMany({
      data: [
        "Drink water",
        "Take morning supplements",
        "Complete workout",
        "Hit protein goal",
        "Log meals",
        "Stretch or mobility work",
        "Complete nighttime routine",
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
