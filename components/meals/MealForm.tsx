"use client";

import { ChevronDown, ChevronUp, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, type ComponentProps } from "react";
import { createMeal } from "@/app/actions";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { scaleNutrition, type FoodNutrition, type FoodSearchResult } from "@/lib/foodDataCentral";
import { BarcodeLookup } from "@/components/meals/BarcodeLookup";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { clearDraft, readDraft, writeDraft } from "@/lib/clientDraft";

type FoodDraft = FoodNutrition & {
  id: string;
  foodName: string;
  servingSize: string;
  grams: number;
  servings: number;
  gramsPerServing: number;
  selectedFood?: FoodSearchResult;
  searchResults: FoodSearchResult[];
  isSearching: boolean;
  searchError: string;
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
    servings: 1,
    gramsPerServing: 100,
    searchResults: [],
    isSearching: false,
    searchError: "",
    ...emptyNutrition,
  };
}

function nutrientValue(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function EditableNumberInput({ value, onValueChange, ...props }: Omit<ComponentProps<typeof Input>, "value" | "onChange"> & { value: number; onValueChange: (value: number) => void }) {
  const [draft, setDraft] = useState(() => nutrientValue(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (document.activeElement !== inputRef.current) setDraft(nutrientValue(value));
  }, [value]);

  return <Input {...props} ref={inputRef} value={draft} onChange={(event) => { const next = event.target.value; setDraft(next); if (next !== "") onValueChange(Number(next)); }} onBlur={() => { if (draft === "" || !Number.isFinite(Number(draft))) { setDraft("0"); onValueChange(0); } else { const normalized = Number(draft); setDraft(nutrientValue(normalized)); onValueChange(normalized); } }} />;
}

function updatesForWeight(item: FoodDraft, grams: number): Partial<FoodDraft> {
  const servings = item.gramsPerServing > 0 ? grams / item.gramsPerServing : 0;
  if (!item.selectedFood) {
    return { grams, servings, servingSize: `${grams} g` };
  }

  return {
    grams,
    servings,
    servingSize: `${Number(servings.toFixed(2))} serving(s) · ${grams} g`,
    ...scaleNutrition(item.selectedFood.nutrientsPer100g, grams),
  };
}

export function MealForm({ draftScope }: { draftScope: string }) {
  const [entryKind, setEntryKind] = useState<"MEAL" | "ITEM" | "DRINK" | "SNACK">("ITEM");
  const [items, setItems] = useState<FoodDraft[]>([newFoodDraft()]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(items.map((item) => item.id)));
  const [resetKey, setResetKey] = useState(0);
  const [submitMessage, setSubmitMessage] = useState("");
  const restored = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    clearDraft("meal");
    const saved = readDraft<{ entryKind: typeof entryKind; items: FoodDraft[] }>(`${draftScope}:meal`);
    if (saved?.items?.length) {
      setEntryKind(saved.entryKind);
      setItems(saved.items);
      setExpandedIds(new Set(saved.items.map((item) => item.id)));
    }
    restored.current = true;
  }, [draftScope]);

  useEffect(() => { if (restored.current) writeDraft(`${draftScope}:meal`, { entryKind, items }); }, [draftScope, entryKind, items]);

  function updateItem(id: string, updates: Partial<FoodDraft>) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    );
  }

  async function searchFood(item: FoodDraft) {
    if (!item.foodName.trim()) {
      return;
    }

    updateItem(item.id, { isSearching: true, searchResults: [], searchError: "" });

    try {
      const response = await fetch(
        `/api/foods/search?query=${encodeURIComponent(item.foodName)}`,
      );
      const data = (await response.json()) as { foods?: FoodSearchResult[]; error?: string };
      if (!response.ok) throw new Error(data.error || "Food search failed on our end.");
      updateItem(item.id, {
        searchResults: data.foods ?? [],
        isSearching: false,
        searchError: data.foods?.length ? "" : "No matching foods were found. Try a brand name or enter the nutrition manually.",
      });
    } catch (error) {
      updateItem(item.id, { searchResults: [], isSearching: false, searchError: error instanceof Error ? error.message : "Food search is temporarily unavailable on our end. Our development team is working to keep it reliable." });
    }
  }

  function applyFoodResult(item: FoodDraft, result: FoodSearchResult) {
    const gramsPerServing = result.servingGrams || 100;
    const grams = gramsPerServing;
    const scaled = scaleNutrition(result.nutrientsPer100g, grams);

    updateItem(item.id, {
      foodName: result.description,
      servingSize: `${grams} g`,
      servings: 1,
      gramsPerServing,
      selectedFood: result,
      searchResults: [],
      ...scaled,
    });
  }

  async function submitMeal(data: FormData) {
    setSubmitMessage("");
    const result = await createMeal(data);
    if (result.status !== "success") {
      setSubmitMessage(result.message);
      return;
    }

    const next = newFoodDraft();
    clearDraft(`${draftScope}:meal`);
    formRef.current?.reset();
    setEntryKind("ITEM");
    setItems([next]);
    setExpandedIds(new Set([next.id]));
    setResetKey((current) => current + 1);
    setSubmitMessage("Saved. The logger is ready for a new entry.");
  }

  return (
    <Card>
      <CardHeader
        title="Log food and drinks"
        description="Add one item, drink, or snack quickly—or build a complete meal from multiple ingredients."
      />
      <form ref={formRef} action={submitMeal} className="space-y-5">
        <input type="hidden" name="entryKind" value={entryKind} />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Nutrition entry type">
          {([['ITEM','Item'],['DRINK','Drink'],['SNACK','Snack'],['MEAL','Build a meal']] as const).map(([value,label]) => <button key={value} type="button" onClick={() => { setEntryKind(value); if (value !== "MEAL") { setItems((current) => [current[0]]); setExpandedIds(new Set([items[0].id])); } }} className={`min-h-11 rounded-md border px-3 text-sm font-medium ${entryKind === value ? "border-core bg-core text-white" : "border-line bg-ink/[0.025] text-muted"}`}>{label}</button>)}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Date">
            <Input name="date" type="date" defaultValue={today} />
          </Field>
          <Field label={entryKind === "MEAL" ? "Meal type" : "Time of day"}>
            <Select key={entryKind} name="mealType" defaultValue={entryKind === "SNACK" ? "SNACK" : "BREAKFAST"}>
              {mealTypes.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          {entryKind === "MEAL" ? <Field label="Meal name"><Input name="mealName" placeholder="Chicken rice bowl" required /></Field> : null}
          <Field label="Time">
            <Input name="time" type="time" />
          </Field>
        </div>
        <Field label="Meal notes">
          <Textarea name="notes" />
        </Field>

        <BarcodeLookup key={resetKey} onFound={(food) => applyFoodResult(items.find((item) => expandedIds.has(item.id)) ?? items[items.length - 1], food)} />

        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id} className="rounded-md border border-line bg-ink/[0.02] p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">{entryKind === "MEAL" ? `Ingredient #${index + 1}` : entryKind === "DRINK" ? "Drink" : entryKind === "SNACK" ? "Snack" : "Item"}</p>
                <div className="flex gap-1">
                <Button type="button" variant="secondary" className="h-11 border-core/50 bg-core/10 px-3 text-core hover:bg-core/20" onClick={() => setExpandedIds((current) => { const next = new Set(current); if (next.has(item.id)) next.delete(item.id); else next.add(item.id); return next; })} title={expandedIds.has(item.id) ? "Collapse ingredient" : "Expand ingredient"} aria-expanded={expandedIds.has(item.id)}>
                  {expandedIds.has(item.id) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  <span className="ml-2">{expandedIds.has(item.id) ? "Collapse" : "Expand"}</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-12 w-12 border-line bg-ink/[0.025] p-0 text-muted hover:border-ember/50 hover:bg-ember/15 hover:text-ember active:bg-ember/20"
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
              <div className="mb-4 rounded-md border border-line bg-ink/[0.025] p-3">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_8rem_8rem_8rem_auto]">
                  <Field label="Ingredient">
                    <Input
                      value={item.foodName}
                      onChange={(event) =>
                        updateItem(item.id, {
                          foodName: event.target.value,
                        })
                      }
                      placeholder="Ingredient Name"
                    />
                  </Field>
                  <Field label="Servings">
                    <EditableNumberInput type="number" min="0" step="0.1" value={Number(item.servings.toFixed(2))} onValueChange={(servings) => { const grams = servings * item.gramsPerServing; updateItem(item.id, { servings, grams, servingSize: `${servings} serving(s) · ${Number(grams.toFixed(1))} g`, ...(item.selectedFood ? scaleNutrition(item.selectedFood.nutrientsPer100g, grams) : {}) }); }} />
                  </Field>
                  <Field label="g / serving">
                    <EditableNumberInput type="number" min="0" step="0.1" value={item.gramsPerServing} onValueChange={(gramsPerServing) => { const grams = item.servings * gramsPerServing; updateItem(item.id, { gramsPerServing, grams, servingSize: `${item.servings} serving(s) · ${Number(grams.toFixed(1))} g`, ...(item.selectedFood ? scaleNutrition(item.selectedFood.nutrientsPer100g, grams) : {}) }); }} />
                  </Field>
                  <Field label="Weight g">
                    <EditableNumberInput
                      type="number"
                      min="0"
                      step="0.1"
                      value={item.grams}
                      onValueChange={(value) => updateItem(item.id, updatesForWeight(item, value))}
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
                        className="rounded-md border border-line bg-ink/[0.025] p-3 text-left transition hover:border-core/40 hover:bg-ink/[0.04]"
                      >
                        <span className="block text-sm font-medium">{result.description}</span>
                        <span className="mt-1 block text-xs text-muted">
                          {result.source ?? result.dataType}
                          {result.brandOwner ? ` / ${result.brandOwner}` : ""} / per 100g:{" "}
                          {Math.round(result.nutrientsPer100g.calories)} kcal,{" "}
                          {Math.round(result.nutrientsPer100g.protein)}g protein
                        </span>
                        {result.confidence !== "complete" ? <span className="mt-1 block text-xs text-ember">{result.confidence === "missing" ? "Nutrition is mostly missing—review before logging." : "Some nutrients are not provided—review highlighted values before logging."}</span> : null}
                      </button>
                    ))}
                  </div>
                ) : null}
                {item.searchError ? <p className="mt-3 text-sm text-ember" role="alert">{item.searchError}</p> : null}
              </div>

              <input type="hidden" name="foodName" value={item.foodName} />
              <input type="hidden" name="servingSize" value={item.servingSize || `${item.grams} g`} />
              <input type="hidden" name="foodBarcode" value={item.selectedFood?.barcode ?? ""} />
              <input type="hidden" name="foodSource" value={item.selectedFood?.source ?? item.selectedFood?.dataType ?? "Manual"} />
              <input type="hidden" name="foodBrand" value={item.selectedFood?.brandOwner ?? ""} />
              <input type="hidden" name="foodGrams" value={item.grams} />

              {item.selectedFood ? <div className={`mb-3 rounded-md border p-3 text-sm ${item.selectedFood.confidence === "complete" ? "border-core/30 bg-core/10 text-muted" : "border-ember/40 bg-ember/10 text-ink"}`}>
                <span className="font-semibold">Source: {item.selectedFood.source ?? item.selectedFood.dataType}.</span>{" "}
                {item.selectedFood.confidence === "complete" ? "Core nutrition data is available." : `${item.selectedFood.missingNutrients?.length ?? 0} nutrient values were not provided. Check and correct the values before logging; your corrected barcode will be remembered.`}
              </div> : null}

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
                    <EditableNumberInput
                      name={name}
                      type="number"
                      min="0"
                      step={step}
                      value={item[name as keyof FoodNutrition]}
                      onValueChange={(value) => updateItem(item.id, { [name]: value } as Partial<FoodDraft>)}
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
                  <input type="hidden" name="foodBarcode" value={item.selectedFood?.barcode ?? ""} />
                  <input type="hidden" name="foodSource" value={item.selectedFood?.source ?? item.selectedFood?.dataType ?? "Manual"} />
                  <input type="hidden" name="foodBrand" value={item.selectedFood?.brandOwner ?? ""} />
                  <input type="hidden" name="foodGrams" value={item.grams} />
                  {Object.keys(emptyNutrition).map((name) => <input key={name} type="hidden" name={name} value={item[name as keyof FoodNutrition]} />)}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {entryKind === "MEAL" ? <Button
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
          </Button> : null}
          <SubmitButton idle={entryKind === "MEAL" ? "Save meal" : `Log ${entryKind.toLowerCase()}`} pending="Saving…" />
          {entryKind === "MEAL" ? <label className="flex min-h-11 items-center gap-2 rounded-md border border-line bg-ink/[0.025] px-3 text-sm text-muted">
            <input type="checkbox" name="saveAsTemplate" className="accent-core" />
            Save this meal as a reusable template
          </label> : null}
        </div>
        {submitMessage ? <p className="text-sm text-muted" role="status" aria-live="polite">{submitMessage}</p> : null}
      </form>
    </Card>
  );
}
