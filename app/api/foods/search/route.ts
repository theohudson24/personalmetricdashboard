import { NextResponse } from "next/server";
import { extractNutrition, type FoodSearchResult } from "@/lib/foodDataCentral";

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
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim();

  if (!query) {
    return NextResponse.json({ foods: [] });
  }

  const apiKey = process.env.FDC_API_KEY || "DEMO_KEY";
  const response = await fetch(
    `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        pageSize: 8,
        dataType: ["Foundation", "SR Legacy", "Survey (FNDDS)", "Branded"],
      }),
      next: { revalidate: 60 * 60 * 24 },
    },
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: "FoodData Central search failed", foods: [] },
      { status: response.status },
    );
  }

  const data = (await response.json()) as { foods?: FdcSearchFood[] };
  const foods: FoodSearchResult[] = (data.foods ?? []).map((food) => ({
    fdcId: food.fdcId,
    description: food.description,
    dataType: food.dataType,
    brandOwner: food.brandOwner,
    nutrientsPer100g: extractNutrition(food.foodNutrients),
  }));

  return NextResponse.json({ foods });
}
