import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const profiles = await prisma.profile.findMany({
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  const primary =
    profiles.find((profile) => profile.isDefault) ??
    profiles[0] ??
    (await prisma.profile.create({
      data: { displayName: "Theo", isDefault: true },
    }));

  await prisma.profile.update({
    where: { id: primary.id },
    data: { displayName: "Theo", isDefault: true },
  });

  const settingsRows = await prisma.userSettings.findMany({
    orderBy: { createdAt: "asc" },
  });
  const primarySettings =
    settingsRows.find((settings) => settings.profileId === primary.id) ??
    settingsRows[0] ??
    (await prisma.userSettings.create({ data: { profileId: primary.id } }));

  for (const settings of settingsRows) {
    if (settings.id !== primarySettings.id) {
      await prisma.userSettings.delete({ where: { id: settings.id } });
    }
  }

  await prisma.userSettings.update({
    where: { id: primarySettings.id },
    data: { profileId: primary.id },
  });
  await prisma.workout.updateMany({ data: { profileId: primary.id } });
  await prisma.dailyLog.updateMany({ data: { profileId: primary.id } });
  await prisma.todoItem.updateMany({ data: { profileId: primary.id } });
  await prisma.meal.updateMany({ data: { profileId: primary.id } });
  await prisma.bodyMeasurement.updateMany({ data: { profileId: primary.id } });
  await prisma.exerciseSet.updateMany({
    where: { setType: "D" },
    data: { setType: "DROP_SET" },
  });
  await prisma.exerciseSet.updateMany({
    where: { setType: "W" },
    data: { setType: "WARM_UP" },
  });
  await prisma.exerciseSet.updateMany({
    where: { setType: "F" },
    data: { setType: "FAILURE" },
  });

  for (const profile of profiles) {
    if (profile.id !== primary.id) {
      await prisma.profile.delete({ where: { id: profile.id } });
    }
  }

  console.log(`Normalized profile data under ${primary.displayName}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
