import { NextResponse } from "next/server";
import { extractNutrition, nutritionQuality, type FoodSearchResult } from "@/lib/foodDataCentral";
import { requireUser } from "@/lib/auth";
import { consumeRateLimit, privateRateLimitKey } from "@/lib/rateLimit";

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
  const rate = await consumeRateLimit(privateRateLimitKey("food-search", user.id), 60, 60 * 1000);
  if (!rate.allowed) return NextResponse.json({ error: "Too many searches. Wait briefly and try again.", foods: [] }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim();

  if (!query) {
    return NextResponse.json({ foods: [] });
  }

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

  return NextResponse.json({ foods });
}
