import { randomUUID } from "node:crypto";
import type { FoodItem, Meal } from "@prisma/client";
import { deleteMealEntry, duplicateMealEntry, updateMealEntry } from "@/app/meals/actions";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { nutrientKeys } from "@/lib/meals";

type MealWithItems = Meal & { foodItems: FoodItem[] };

export function MealHistory({ meals }: { meals: MealWithItems[] }) {
  return <Card>
    <CardHeader title="Food and drinks logged" description="Edit, duplicate, move, or remove any nutrition entry." />
    <div className="space-y-3">
      {meals.length === 0 ? <EmptyState message="No nutrition entries logged for this day." /> : meals.map((meal) => {
        const calories = meal.foodItems.reduce((total, item) => total + item.calories, 0);
        const protein = meal.foodItems.reduce((total, item) => total + item.protein, 0);
        const dateKey = meal.dateKey || meal.date.toISOString().slice(0, 10);
        return <details key={meal.id} className="rounded-md border border-line p-3">
          <summary className="cursor-pointer list-none"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-medium">{meal.mealName}</p><p className="text-sm text-muted">{meal.entryKind.toLowerCase()} · {meal.mealType.replace("_", " ").toLowerCase()} {meal.time ? `/ ${meal.time}` : ""}</p></div><p className="text-sm text-muted">{calories} kcal / {Math.round(protein)}g protein</p></div></summary>
          <div className="mt-3 space-y-3 border-t border-line pt-3 text-sm">
            <form action={updateMealEntry} className="space-y-3">
              <input type="hidden" name="id" value={meal.id}/><input type="hidden" name="updatedAt" value={meal.updatedAt.toISOString()}/><input type="hidden" name="timezone" value={meal.timezone || "UTC"}/>
              <div className="grid gap-2 sm:grid-cols-4">
                <label className="text-muted">Name<input name="mealName" defaultValue={meal.mealName} className="mt-1 w-full rounded-md border border-line bg-black/20 px-3"/></label>
                <label className="text-muted">Entry type<select name="entryKind" defaultValue={meal.entryKind} className="mt-1 w-full rounded-md border border-line bg-black/20 px-3"><option value="MEAL">Meal</option><option value="ITEM">Item</option><option value="DRINK">Drink</option><option value="SNACK">Snack</option></select></label>
                <label className="text-muted">Date<input name="date" type="date" defaultValue={dateKey} className="mt-1 w-full rounded-md border border-line bg-black/20 px-3"/></label>
                <label className="text-muted">Time<input name="time" type="time" defaultValue={meal.time ?? ""} className="mt-1 w-full rounded-md border border-line bg-black/20 px-3"/></label>
              </div>
              <input type="hidden" name="mealType" value={meal.mealType}/>
              {meal.foodItems.map((item) => <div key={item.id} className="grid gap-2 rounded-md bg-black/15 p-3 sm:grid-cols-[1fr_8rem_7rem_7rem_auto]">
                <input name="foodName" defaultValue={item.name} aria-label="Ingredient name" className="rounded-md border border-line bg-black/20 px-3"/>
                <input name="foodGrams" type="number" min="0" step="0.1" defaultValue={item.grams} aria-label="Weight in grams" className="rounded-md border border-line bg-black/20 px-3"/>
                <input name="calories" type="number" min="0" defaultValue={item.calories} aria-label="Calories" className="rounded-md border border-line bg-black/20 px-3"/>
                <input name="protein" type="number" min="0" step="0.1" defaultValue={item.protein} aria-label="Protein" className="rounded-md border border-line bg-black/20 px-3"/>
                <select name="foodRemove" defaultValue="false" aria-label={`Keep or remove ${item.name}`} className="rounded-md border border-line bg-black/20 px-2"><option value="false">Keep</option><option value="on">Remove</option></select>
                <input type="hidden" name="servingSize" value={item.servingSize ?? ""}/><input type="hidden" name="foodBrand" value={item.brand ?? ""}/><input type="hidden" name="foodBarcode" value={item.barcode ?? ""}/><input type="hidden" name="foodSource" value={item.source}/><input type="hidden" name="foodSourceId" value={item.sourceId ?? ""}/><input type="hidden" name="foodServings" value={item.servings}/><input type="hidden" name="foodGramsPerServing" value={item.gramsPerServing}/><input type="hidden" name="foodConfidence" value={item.nutritionConfidence}/><input type="hidden" name="foodMissingNutrients" value={item.missingNutrients}/><input type="hidden" name="foodUserEdited" value="true"/><input type="hidden" name="referenceNutrition" value={JSON.stringify(item.referenceNutrition ?? {})}/>
                {nutrientKeys.filter((key) => key !== "calories" && key !== "protein").map((key) => <input key={key} type="hidden" name={key} value={item[key]}/>) }
              </div>)}
              <label className="block text-muted">Notes<textarea name="notes" defaultValue={meal.notes ?? ""} className="mt-1 min-h-20 w-full rounded-md border border-line bg-black/20 p-3"/></label>
              <Button variant="secondary">Save entry changes</Button>
            </form>
            <div className="flex flex-wrap gap-2">
              <form action={duplicateMealEntry}><input type="hidden" name="id" value={meal.id}/><input type="hidden" name="dateKey" value={dateKey}/><input type="hidden" name="clientRequestId" value={randomUUID()}/><Button variant="secondary">Duplicate entry</Button></form>
              <form action={deleteMealEntry}><input type="hidden" name="id" value={meal.id}/><Button variant="ghost" className="text-ember">Delete entry permanently</Button></form>
            </div>
          </div>
        </details>;
      })}
    </div>
  </Card>;
}
