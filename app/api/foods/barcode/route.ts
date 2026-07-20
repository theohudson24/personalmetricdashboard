import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import type { FoodNutrition, FoodSearchResult } from "@/lib/foodDataCentral";

type Product = {
  product_name?: string; brands?: string; serving_size?: string;
  serving_quantity?: number | string; nutriments?: Record<string, number | string | undefined>;
};

function value(source: Product["nutriments"], key: string) {
  const parsed = Number(source?.[`${key}_100g`]);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function GET(request: Request) {
  await requireUser();
  const barcode = new URL(request.url).searchParams.get("barcode")?.replace(/\D/g, "");
  if (!barcode || barcode.length < 8 || barcode.length > 14) {
    return NextResponse.json({ error: "Enter a valid 8–14 digit barcode." }, { status: 400 });
  }
  const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`, {
    headers: { "User-Agent": "MetricOS/1.0 (personal nutrition tracker)" },
    next: { revalidate: 60 * 60 * 24 },
  });
  if (!response.ok) return NextResponse.json({ error: "Barcode lookup is unavailable." }, { status: 502 });
  const data = await response.json() as { status?: number; product?: Product };
  if (data.status !== 1 || !data.product) return NextResponse.json({ error: "No food was found for that barcode." }, { status: 404 });
  const p = data.product;
  const n = p.nutriments;
  const nutrientsPer100g: FoodNutrition = {
    calories: value(n, "energy-kcal"), protein: value(n, "proteins"), carbs: value(n, "carbohydrates"),
    fat: value(n, "fat"), fiber: value(n, "fiber"), sugar: value(n, "sugars"), sodium: value(n, "sodium") * 1000,
    vitaminA: value(n, "vitamin-a") * 1_000_000, vitaminC: value(n, "vitamin-c") * 1000,
    vitaminD: value(n, "vitamin-d") * 1_000_000, vitaminB12: value(n, "vitamin-b12") * 1_000_000,
    calcium: value(n, "calcium") * 1000, iron: value(n, "iron") * 1000, magnesium: value(n, "magnesium") * 1000,
    potassium: value(n, "potassium") * 1000, zinc: value(n, "zinc") * 1000,
  };
  const servingGrams = Number(p.serving_quantity);
  const food: FoodSearchResult = {
    fdcId: Number(barcode.slice(-9)), description: p.product_name || p.brands || `Barcode ${barcode}`,
    brandOwner: p.brands, dataType: "Open Food Facts", nutrientsPer100g, barcode,
    servingGrams: Number.isFinite(servingGrams) && servingGrams > 0 ? servingGrams : 100,
    servingLabel: p.serving_size || undefined,
  };
  return NextResponse.json({ food });
}
