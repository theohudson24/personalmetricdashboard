import assert from "node:assert/strict";
import test from "node:test";
import { barcodeVariants, hasValidBarcodeCheckDigit, normalizeBarcode, nutritionQuality, scaleNutrition, type FoodNutrition } from "@/lib/foodDataCentral";
import { normalizeFoodItem, quantitiesFromServings, quantitiesFromWeight, referenceFromCurrent } from "@/lib/meals";
import { calculateNutritionRecommendation } from "@/lib/recommendations";

const nutrition: FoodNutrition = { calories: 200, protein: 10, carbs: 30, fat: 5, fiber: 4, sugar: 2, sodium: 100, vitaminA: 10, vitaminC: 10, vitaminD: 10, vitaminB12: 10, calcium: 10, iron: 10, magnesium: 10, potassium: 10, zinc: 10 };

test("barcodes are normalized and compatible UPC/EAN variants are produced", () => {
  assert.equal(normalizeBarcode(" 123-456-789012 "), "123456789012");
  assert.deepEqual(barcodeVariants("123456789012"), ["123456789012", "0123456789012", "00123456789012"]);
  assert.equal(hasValidBarcodeCheckDigit("036000291452"), true);
  assert.equal(hasValidBarcodeCheckDigit("036000291453"), false);
});

test("weight and serving quantities remain synchronized", () => {
  assert.deepEqual(quantitiesFromWeight(225, 75), { grams: 225, gramsPerServing: 75, servings: 3 });
  assert.deepEqual(quantitiesFromServings(2.5, 40), { servings: 2.5, gramsPerServing: 40, grams: 100 });
});

test("manual nutrient corrections become the new scalable reference", () => {
  const correctedTotal = { ...nutrition, calories: 150, protein: 12 };
  const reference = referenceFromCurrent(correctedTotal, 50);
  const item = normalizeFoodItem({
    name: "Corrected item", source: "User corrected", grams: 100, servings: 2,
    gramsPerServing: 50, referenceNutrition: reference, nutrition: correctedTotal,
    nutritionConfidence: "partial", missingNutrients: [], userEdited: true,
  });
  assert.equal(item.nutrition.calories, 300);
  assert.equal(item.nutrition.protein, 24);
});

test("nutrition scales from per-100g data", () => {
  const scaled = scaleNutrition(nutrition, 50);
  assert.equal(scaled.calories, 100);
  assert.equal(scaled.protein, 5);
});

test("missing core nutrients lower confidence", () => {
  assert.equal(nutritionQuality({ ...nutrition, calories: 0, protein: 0 }).confidence, "partial");
});

test("height and activity affect calorie recommendations", () => {
  const base = calculateNutritionRecommendation({ heightInches: 66, weightLb: 150, age: 30, gender: "male", activityLevel: "sedentary" });
  const tallerActive = calculateNutritionRecommendation({ heightInches: 72, weightLb: 150, age: 30, gender: "male", activityLevel: "very_active" });
  assert.ok(base && tallerActive);
  assert.ok(tallerActive.dailyCalorieGoal > base.dailyCalorieGoal);
});
