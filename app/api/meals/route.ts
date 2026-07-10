import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDefaultProfile } from "@/lib/profile";

export async function GET() {
  const profile = await getDefaultProfile();
  const meals = await prisma.meal.findMany({
    where: { profileId: profile.id },
    include: { foodItems: true },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(meals);
}
