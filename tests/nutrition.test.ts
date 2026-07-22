import assert from "node:assert/strict";
import test from "node:test";
import { barcodeVariants, normalizeBarcode, nutritionQuality, scaleNutrition, type FoodNutrition } from "@/lib/foodDataCentral";
import { calculateNutritionRecommendation } from "@/lib/recommendations";
import { nutritionGoalStatus, nutritionGoalTone } from "@/lib/nutrition";

const nutrition: FoodNutrition = { calories: 200, protein: 10, carbs: 30, fat: 5, fiber: 4, sugar: 2, sodium: 100, vitaminA: 10, vitaminC: 10, vitaminD: 10, vitaminB12: 10, calcium: 10, iron: 10, magnesium: 10, potassium: 10, zinc: 10 };

test("barcodes are normalized and compatible UPC/EAN variants are produced", () => {
  assert.equal(normalizeBarcode(" 123-456-789012 "), "123456789012");
  assert.deepEqual(barcodeVariants("123456789012"), ["123456789012", "0123456789012"]);
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

test("nutrition goal tones progress from reached to above-goal warnings", () => {
  assert.equal(nutritionGoalTone(99, 100), "default");
  assert.equal(nutritionGoalTone(100, 100), "success");
  assert.equal(nutritionGoalTone(120, 100), "success");
  assert.equal(nutritionGoalTone(121, 100), "warning");
  assert.equal(nutritionGoalTone(150, 100), "warning");
  assert.equal(nutritionGoalTone(151, 100), "danger");
  assert.equal(nutritionGoalStatus("danger"), "Well above goal");
});

test("limit-based nutrients warn only after their configured limit", () => {
  assert.equal(nutritionGoalTone(89, 100, "limit"), "default");
  assert.equal(nutritionGoalTone(95, 100, "limit"), "success");
  assert.equal(nutritionGoalTone(110, 100, "limit"), "warning");
  assert.equal(nutritionGoalTone(121, 100, "limit"), "danger");
});
