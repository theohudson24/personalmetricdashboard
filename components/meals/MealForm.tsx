"use client";

import { ChevronDown, ChevronUp, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { createMeal } from "@/app/actions";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { scaleNutrition, type FoodNutrition, type FoodSearchResult } from "@/lib/foodDataCentral";

type FoodDraft = FoodNutrition & {
  id: string;
  foodName: string;
  servingSize: string;
  grams: number;
  selectedFood?: FoodSearchResult;
  searchResults: FoodSearchResult[];
  isSearching: boolean;
};

const today = new Date().toISOString().slice(0, 10);
const mealTypes = [
  ["BREAKFAST", "Breakfast"],
  ["LUNCH", "Lunch"],
  ["DINNER", "Dinner"],
  ["SNACK", "Snack"],
  ["PRE_WORKOUT", "Pre-workout"],
  ["POST_WORKOUT", "Post-workout"],
];

const emptyNutrition: FoodNutrition = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
  sugar: 0,
  sodium: 0,
  vitaminA: 0,
  vitaminC: 0,
  vitaminD: 0,
  vitaminB12: 0,
  calcium: 0,
  iron: 0,
  magnesium: 0,
  potassium: 0,
  zinc: 0,
};

function newFoodDraft(): FoodDraft {
  return {
    id: crypto.randomUUID(),
    foodName: "",
    servingSize: "",
    grams: 100,
    searchResults: [],
    isSearching: false,
    ...emptyNutrition,
  };
}

function nutrientValue(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function updatesForWeight(item: FoodDraft, grams: number): Partial<FoodDraft> {
  if (!item.selectedFood) {
    return { grams, servingSize: `${grams} g` };
  }

  return {
    grams,
    servingSize: `${grams} g`,
    ...scaleNutrition(item.selectedFood.nutrientsPer100g, grams),
  };
}

export function MealForm() {
  const [items, setItems] = useState<FoodDraft[]>([newFoodDraft()]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(items.map((item) => item.id)));

  function updateItem(id: string, updates: Partial<FoodDraft>) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    );
  }

  async function searchFood(item: FoodDraft) {
    if (!item.foodName.trim()) {
      return;
    }

    updateItem(item.id, { isSearching: true, searchResults: [] });

    try {
      const response = await fetch(
        `/api/foods/search?query=${encodeURIComponent(item.foodName)}`,
      );
      const data = (await response.json()) as { foods?: FoodSearchResult[] };
      updateItem(item.id, {
        searchResults: data.foods ?? [],
        isSearching: false,
      });
    } catch {
      updateItem(item.id, { searchResults: [], isSearching: false });
    }
  }

  function applyFoodResult(item: FoodDraft, result: FoodSearchResult) {
    const grams = item.grams > 0 ? item.grams : 100;
    const scaled = scaleNutrition(result.nutrientsPer100g, grams);

    updateItem(item.id, {
      foodName: result.description,
      servingSize: `${grams} g`,
      selectedFood: result,
      searchResults: [],
      ...scaled,
    });
  }

  return (
    <Card>
      <CardHeader
        title="Daily meal logger"
        description="Search foods by weight or manually edit nutrition values."
      />
      <form action={createMeal} className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Date">
            <Input name="date" type="date" defaultValue={today} />
          </Field>
          <Field label="Meal type">
            <Select name="mealType" defaultValue="BREAKFAST">
              {mealTypes.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Meal name">
            <Input name="mealName" placeholder="Chicken rice bowl" required />
          </Field>
          <Field label="Time">
            <Input name="time" type="time" />
          </Field>
        </div>
        <Field label="Meal notes">
          <Textarea name="notes" />
        </Field>

        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id} className="rounded-md border border-line bg-black/10 p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">Ingredient #{index + 1}</p>
                <div className="flex gap-1">
                <Button type="button" variant="ghost" className="h-10 w-10 p-0" onClick={() => setExpandedIds((current) => { const next = new Set(current); if (next.has(item.id)) next.delete(item.id); else next.add(item.id); return next; })} title={expandedIds.has(item.id) ? "Collapse ingredient" : "Expand ingredient"}>
                  {expandedIds.has(item.id) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-12 w-12 border-line bg-black/15 p-0 text-muted hover:border-ember/50 hover:bg-ember/15 hover:text-ember active:bg-ember/20"
                  onClick={() =>
                    setItems((current) =>
                      current.length === 1
                        ? current
                        : current.filter((food) => food.id !== item.id),
                    )
                  }
                  title="Remove ingredient"
                >
                  <Trash2 size={26} strokeWidth={2.7} />
                </Button>
                </div>
              </div>

              {expandedIds.has(item.id) ? <>
              <div className="mb-4 rounded-md border border-line bg-black/15 p-3">
                <div className="grid gap-3 sm:grid-cols-[1fr_9rem_auto]">
                  <Field label="Ingredient">
                    <Input
                      value={item.foodName}
                      onChange={(event) =>
                        updateItem(item.id, {
                          foodName: event.target.value,
                          selectedFood: undefined,
                        })
                      }
                      placeholder="Ingredient Name"
                    />
                  </Field>
                  <Field label="Weight g">
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={item.grams}
                      onChange={(event) =>
                        updateItem(
                          item.id,
                          updatesForWeight(item, Number(event.target.value)),
                        )
                      }
                    />
                  </Field>
                  <Button
                    type="button"
                    variant="secondary"
                    className="self-end"
                    onClick={() => searchFood(item)}
                    disabled={item.isSearching}
                  >
                    <Search size={16} />
                    <span className="ml-2">{item.isSearching ? "Searching" : "Search"}</span>
                  </Button>
                </div>

                {item.searchResults.length > 0 ? (
                  <div className="mt-3 grid gap-2">
                    {item.searchResults.map((result) => (
                      <button
                        key={result.fdcId}
                        type="button"
                        onClick={() => applyFoodResult(item, result)}
                        className="rounded-md border border-line bg-black/15 p-3 text-left transition hover:border-core/40 hover:bg-white/[0.06]"
                      >
                        <span className="block text-sm font-medium">{result.description}</span>
                        <span className="mt-1 block text-xs text-muted">
                          {result.dataType}
                          {result.brandOwner ? ` / ${result.brandOwner}` : ""} / per 100g:{" "}
                          {Math.round(result.nutrientsPer100g.calories)} kcal,{" "}
                          {Math.round(result.nutrientsPer100g.protein)}g protein
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <input type="hidden" name="foodName" value={item.foodName} />
              <input type="hidden" name="servingSize" value={item.servingSize || `${item.grams} g`} />

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["calories", "Calories", "1"],
                  ["protein", "Protein", "0.1"],
                  ["carbs", "Carbs", "0.1"],
                  ["fat", "Fat", "0.1"],
                  ["fiber", "Fiber", "0.1"],
                  ["sugar", "Sugar", "0.1"],
                  ["sodium", "Sodium mg", "0.1"],
                  ["vitaminA", "Vitamin A", "0.1"],
                  ["vitaminC", "Vitamin C", "0.1"],
                  ["vitaminD", "Vitamin D", "0.1"],
                  ["vitaminB12", "Vitamin B12", "0.1"],
                  ["calcium", "Calcium", "0.1"],
                  ["iron", "Iron", "0.1"],
                  ["magnesium", "Magnesium", "0.1"],
                  ["potassium", "Potassium", "0.1"],
                  ["zinc", "Zinc", "0.1"],
                ].map(([name, label, step]) => (
                  <Field key={name} label={label}>
                    <Input
                      name={name}
                      type="number"
                      min="0"
                      step={step}
                      value={nutrientValue(item[name as keyof FoodNutrition])}
                      onChange={(event) =>
                        updateItem(item.id, {
                          [name]: Number(event.target.value),
                        } as Partial<FoodDraft>)
                      }
                    />
                  </Field>
                ))}
              </div>
              </> : (
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
                  <span>{item.foodName || "Ingredient details not entered"} · {item.servingSize || `${item.grams} g`}</span>
                  <span>{Math.round(item.calories)} kcal · {Math.round(item.protein)}g protein</span>
                  <input type="hidden" name="foodName" value={item.foodName} />
                  <input type="hidden" name="servingSize" value={item.servingSize || `${item.grams} g`} />
                  {Object.keys(emptyNutrition).map((name) => <input key={name} type="hidden" name={name} value={item[name as keyof FoodNutrition]} />)}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              const next = newFoodDraft();
              setExpandedIds(new Set([next.id]));
              setItems((current) => [...current, next]);
            }}
          >
            <Plus size={16} />
            <span className="ml-2">Add food</span>
          </Button>
          <Button>Save meal</Button>
          <label className="flex min-h-11 items-center gap-2 rounded-md border border-line bg-black/15 px-3 text-sm text-muted">
            <input type="checkbox" name="saveAsTemplate" className="accent-[#4db7a7]" />
            Save this meal as a reusable template
          </label>
        </div>
      </form>
    </Card>
  );
}
