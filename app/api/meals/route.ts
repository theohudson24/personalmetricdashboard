import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getDefaultProfile } from "@/lib/profile";
import { mealInputSchema } from "@/lib/meals";
import { createMealForProfile, deleteMealForProfile, MealServiceError, updateMealForProfile } from "@/lib/mealService";

export const maxDuration = 10;

export async function GET() {
  const profile = await getDefaultProfile();
  const meals = await prisma.meal.findMany({
    where: { profileId: profile.id },
    include: { foodItems: true },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(meals, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  try {
    const profile = await getDefaultProfile();
    const input = mealInputSchema.parse(await limitedJson(request));
    const result = await createMealForProfile(profile.id, input);
    return NextResponse.json(result.meal, { status: result.created ? 201 : 200 });
  } catch (error) {
    return mealError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const profile = await getDefaultProfile();
    const body = z.object({ id: z.string().cuid(), updatedAt: z.coerce.date().optional(), meal: mealInputSchema }).parse(await limitedJson(request));
    const meal = await updateMealForProfile(profile.id, body.id, body.meal, body.updatedAt);
    return NextResponse.json(meal);
  } catch (error) {
    return mealError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const profile = await getDefaultProfile();
    const id = z.string().cuid().parse(new URL(request.url).searchParams.get("id"));
    await deleteMealForProfile(profile.id, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return mealError(error);
  }
}

async function limitedJson(request: Request) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 256_000) throw new MealServiceError("Nutrition entry is too large.", "INVALID");
  return request.json();
}

function mealError(error: unknown) {
  if (error instanceof z.ZodError) return NextResponse.json({ error: "Check the nutrition entry fields and try again.", details: error.flatten() }, { status: 400 });
  if (error instanceof MealServiceError) {
    const status = error.code === "NOT_FOUND" ? 404 : error.code === "CONFLICT" ? 409 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
  return NextResponse.json({ error: "The nutrition entry could not be saved on our end. Your input was not intentionally logged." }, { status: 500 });
}
