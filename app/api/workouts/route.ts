import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const workouts = await prisma.workout.findMany({
    include: { exercises: { include: { sets: true } } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(workouts);
}
