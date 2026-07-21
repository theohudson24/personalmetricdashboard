import { NextResponse } from "next/server";
import { getDefaultProfile } from "@/lib/profile";
import { prisma } from "@/lib/prisma";
import {
  barcodeVariants,
  extractNutrition,
  normalizeBarcode,
  nutritionQuality,
  type FoodNutrition,
  type FoodSearchResult,
} from "@/lib/foodDataCentral";
import { consumeRateLimit, privateRateLimitKey } from "@/lib/rateLimit";

type Product = {
  product_name?: string;
  brands?: string;
  serving_size?: string;
  serving_quantity?: number | string;
  nutriments?: Record<string, number | string | undefined>;
};

function value(source: Product["nutriments"], key: string) {
  const parsed = Number(source?.[`${key}_100g`]);
  return Number.isFinite(parsed) ? parsed : 0;
}

function savedFoodResult(food: Awaited<ReturnType<typeof prisma.savedFood.findFirst>>): FoodSearchResult | null {
  if (!food) return null;
  const nutrientsPer100g: FoodNutrition = {
    calories: food.calories, protein: food.protein, carbs: food.carbs, fat: food.fat,
    fiber: food.fiber, sugar: food.sugar, sodium: food.sodium, vitaminA: food.vitaminA,
    vitaminC: food.vitaminC, vitaminD: food.vitaminD, vitaminB12: food.vitaminB12,
    calcium: food.calcium, iron: food.iron, magnesium: food.magnesium,
    potassium: food.potassium, zinc: food.zinc,
  };
  return {
    fdcId: Number(food.barcode.slice(-9)), description: food.name, brandOwner: food.brand ?? undefined,
    dataType: "Saved by you", source: "Saved by you", barcode: food.barcode,
    servingGrams: food.servingGrams, servingLabel: food.servingLabel ?? undefined,
    nutrientsPer100g, ...nutritionQuality(nutrientsPer100g),
  };
}

async function openFoodFacts(barcodes: string[]): Promise<FoodSearchResult | null> {
  for (const barcode of barcodes) {
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`, {
      headers: { "User-Agent": "MetricOS/1.0 (personal nutrition tracker)" },
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!response.ok) continue;
    const data = await response.json() as { status?: number; product?: Product };
    if (data.status !== 1 || !data.product?.product_name?.trim()) continue;
    const p = data.product; const productName = p.product_name?.trim();
    if (!productName) continue;
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
    return {
      fdcId: Number(barcode.slice(-9)), description: productName, brandOwner: p.brands,
      dataType: "Open Food Facts", source: "Open Food Facts", nutrientsPer100g, barcode,
      servingGrams: Number.isFinite(servingGrams) && servingGrams > 0 ? servingGrams : 100,
      servingLabel: p.serving_size || undefined, ...nutritionQuality(nutrientsPer100g),
    };
  }
  return null;
}

async function usdaBarcode(barcode: string): Promise<FoodSearchResult | null> {
  const apiKey = process.env.FDC_API_KEY || "DEMO_KEY";
  const response = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: barcode, pageSize: 5, dataType: ["Branded"] }),
    next: { revalidate: 60 * 60 * 24 },
  });
  if (!response.ok) return null;
  const data = await response.json() as { foods?: Array<{ fdcId: number; description: string; dataType: string; brandOwner?: string; gtinUpc?: string; servingSize?: number; servingSizeUnit?: string; foodNutrients?: Parameters<typeof extractNutrition>[0] }> };
  const match = data.foods?.find((food) => normalizeBarcode(food.gtinUpc ?? "") === barcode);
  if (!match?.description) return null;
  const nutrientsPer100g = extractNutrition(match.foodNutrients);
  return {
    fdcId: match.fdcId, description: match.description, brandOwner: match.brandOwner,
    dataType: "USDA FoodData Central", source: "USDA FoodData Central", barcode,
    servingGrams: match.servingSizeUnit?.toLowerCase() === "g" ? match.servingSize : 100,
    servingLabel: match.servingSize ? `${match.servingSize} ${match.servingSizeUnit ?? "g"}` : undefined,
    nutrientsPer100g, ...nutritionQuality(nutrientsPer100g),
  };
}

export async function GET(request: Request) {
  try {
    const profile = await getDefaultProfile();
    const rate = await consumeRateLimit(privateRateLimitKey("barcode", profile.id), 60, 60 * 1000);
    if (!rate.allowed) return NextResponse.json({ error: "Too many barcode lookups. Wait briefly and try again.", kind: "rate_limit" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
    const raw = new URL(request.url).searchParams.get("barcode") ?? "";
    const variants = barcodeVariants(raw);
    if (variants.length === 0) return NextResponse.json({ error: "Enter a valid 8–14 digit barcode.", kind: "input" }, { status: 400 });

    const saved = await prisma.savedFood.findFirst({ where: { profileId: profile.id, barcode: { in: variants } }, orderBy: { updatedAt: "desc" } });
    const personal = savedFoodResult(saved);
    if (personal) return NextResponse.json({ food: personal });

    let external = await openFoodFacts(variants).catch(() => null);
    if (!external) {
      for (const barcode of variants) {
        external = await usdaBarcode(barcode).catch(() => null);
        if (external) break;
      }
    }
    if (!external) return NextResponse.json({ error: "We could not find that product. Search by name or enter it manually, then it can be remembered for next time.", kind: "not_found" }, { status: 404 });
    return NextResponse.json({ food: external });
  } catch {
    return NextResponse.json({ error: "Food lookup is temporarily unavailable on our end. We know about this type of issue and are working to keep lookups reliable.", kind: "server" }, { status: 503 });
  }
}
