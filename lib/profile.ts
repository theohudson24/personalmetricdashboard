import { prisma } from "@/lib/prisma";

export async function getDefaultProfile() {
  const existing = await prisma.profile.findFirst({
    where: { isDefault: true },
  });

  if (existing) {
    return existing;
  }

  const fallback = await prisma.profile.findFirst();

  if (fallback) {
    return prisma.profile.update({
      where: { id: fallback.id },
      data: { isDefault: true },
    });
  }

  return prisma.profile.create({
    data: {
      displayName: "Theo",
      isDefault: true,
    },
  });
}
