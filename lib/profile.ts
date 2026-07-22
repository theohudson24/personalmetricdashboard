import { Prisma } from "@prisma/client";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export const getDefaultProfile = cache(async () => {
  const user = await requireUser();
  const existing = await prisma.profile.findUnique({ where: { authUserId: user.id } });
  if (existing) return existing;

  try {
    return await prisma.profile.create({
      data: {
        authUserId: user.id,
        displayName: user.user_metadata?.full_name || user.email || "User",
        isDefault: false,
        settings: { create: {} },
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return prisma.profile.findUniqueOrThrow({ where: { authUserId: user.id } });
    }
    throw error;
  }
});
