import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const meals = await prisma.meal.findMany({
    include: { foodItems: true },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(meals);
}
