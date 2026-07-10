import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDefaultProfile } from "@/lib/profile";

export async function GET() {
  const profile = await getDefaultProfile();
  const workouts = await prisma.workout.findMany({
    where: { profileId: profile.id },
    include: { exercises: { include: { sets: true } } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(workouts);
}
