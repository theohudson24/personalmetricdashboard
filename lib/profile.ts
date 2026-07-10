import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function getDefaultProfile() {
  const user = await requireUser();
  return prisma.profile.upsert({
    where: { authUserId: user.id },
    update: {},
    create: { authUserId: user.id, displayName: user.user_metadata?.full_name || user.email || "User", isDefault: false },
  });
}
