import { NextResponse } from "next/server";
import { z } from "zod";
import { extractNutrition, nutritionQuality, type FoodSearchResult } from "@/lib/foodDataCentral";
import { requireUser } from "@/lib/auth";
import { getDefaultProfile } from "@/lib/profile";
import { prisma } from "@/lib/prisma";
import { allowRequest } from "@/lib/rateLimit";

type FdcSearchFood = {
  fdcId: number;
  description: string;
  dataType: string;
  brandOwner?: string;
  foodNutrients?: Array<{
    nutrientId?: number;
    nutrientNumber?: string;
    nutrientName?: string;
    unitName?: string;
    value?: number;
  }>;
};

export async function GET(request: Request) {
  const user = await requireUser();
  const profile = await getDefaultProfile();
  const rate = allowRequest(`food-search:${user.id}`, 30, 60_000);
  if (!rate.allowed) return NextResponse.json({ error: "Too many searches. Wait briefly and try again.", foods: [] }, { status: 429, headers: { "Retry-After": String(rate.retryAfter) } });
  const { searchParams } = new URL(request.url);
  const parsed = z.string().trim().min(2).max(100).safeParse(searchParams.get("query"));
  if (!parsed.success) return NextResponse.json({ error: "Enter between 2 and 100 characters.", foods: [] }, { status: 400 });
  const query = parsed.data.replace(/\s+/g, " ");

  const personalFoods = await prisma.savedFood.findMany({
    where: { profileId: profile.id, name: { contains: query, mode: "insensitive" } },
    orderBy: [{ lastUsedAt: "desc" }, { updatedAt: "desc" }], take: 5,
  });
  const personalResults: FoodSearchResult[] = personalFoods.map((food) => {
    const nutrientsPer100g = { calories: food.calories, protein: food.protein, carbs: food.carbs, fat: food.fat, fiber: food.fiber, sugar: food.sugar, sodium: food.sodium, vitaminA: food.vitaminA, vitaminC: food.vitaminC, vitaminD: food.vitaminD, vitaminB12: food.vitaminB12, calcium: food.calcium, iron: food.iron, magnesium: food.magnesium, potassium: food.potassium, zinc: food.zinc };
    return { fdcId: Number(food.barcode.slice(-9)), description: food.name, dataType: "Saved by you", brandOwner: food.brand ?? undefined, barcode: food.barcode, servingGrams: food.servingGrams, servingLabel: food.servingLabel ?? undefined, source: "Saved by you", nutrientsPer100g, confidence: food.confidence as FoodSearchResult["confidence"], missingNutrients: food.missingNutrients.split(",").filter(Boolean) };
  });

  const apiKey = process.env.FDC_API_KEY || "DEMO_KEY";
  let response: Response;
  try {
    response = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          pageSize: 8,
          dataType: ["Foundation", "SR Legacy", "Survey (FNDDS)", "Branded"],
        }),
        signal: AbortSignal.timeout(8_000),
        next: { revalidate: 60 * 60 * 24 },
      },
    );
  } catch {
    return NextResponse.json({ error: "Food search is temporarily unavailable on our end. Our development team is working to keep it reliable.", foods: [] }, { status: 503 });
  }

  if (!response.ok) {
    return NextResponse.json(
      { error: "Food search is temporarily unavailable on our end. Our development team is working to keep it reliable.", foods: [] },
      { status: response.status },
    );
  }

  const data = (await response.json()) as { foods?: FdcSearchFood[] };
  const foods: FoodSearchResult[] = (data.foods ?? []).map((food) => {
    const nutrientsPer100g = extractNutrition(food.foodNutrients);
    return {
      fdcId: food.fdcId, description: food.description, dataType: food.dataType,
      source: "USDA FoodData Central", brandOwner: food.brandOwner, nutrientsPer100g,
      ...nutritionQuality(nutrientsPer100g),
    };
  });

  const external = foods.filter((food) => !personalResults.some((personal) => personal.description.toLowerCase() === food.description.toLowerCase()));
  return NextResponse.json({ foods: [...personalResults, ...external].slice(0, 10) }, { headers: { "Cache-Control": "private, no-store" } });
}
