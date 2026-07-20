import type { FoodItem, Meal } from "@prisma/client";
import { deleteMeal, updateMeal } from "@/app/actions";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

type MealWithItems = Meal & { foodItems: FoodItem[] };

export function MealHistory({ meals }: { meals: MealWithItems[] }) {
  return (
    <Card>
      <CardHeader title="Food and drinks logged" description="Items, drinks, snacks, and meals for the current day." />
      <div className="space-y-3">
        {meals.length === 0 ? (
          <EmptyState message="No meals logged for today yet." />
        ) : (
          meals.map((meal) => {
            const calories = meal.foodItems.reduce((total, item) => total + item.calories, 0);
            const protein = meal.foodItems.reduce((total, item) => total + item.protein, 0);

            return (
              <details key={meal.id} className="rounded-md border border-line p-3">
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{meal.mealName}</p>
                      <p className="text-sm text-muted">
                        {meal.entryKind.toLowerCase()} · {meal.mealType.replace("_", " ").toLowerCase()} {meal.time ? `/ ${meal.time}` : ""}
                      </p>
                    </div>
                    <p className="text-sm text-muted">
                      {calories} kcal / {Math.round(protein)}g protein
                    </p>
                  </div>
                </summary>
                <div className="mt-3 space-y-2 border-t border-line pt-3 text-sm">
                  <form action={updateMeal} className="space-y-3">
                    <input type="hidden" name="id" value={meal.id} />
                    <label className="block text-muted">Meal name<input name="mealName" defaultValue={meal.mealName} className="mt-1 w-full rounded-md border border-line bg-black/20 px-3 text-ink" /></label>
                    {meal.foodItems.map((item) => (
                      <div key={item.id} className="grid gap-2 rounded-md bg-black/15 p-3 sm:grid-cols-[1fr_8rem_7rem_7rem]">
                        <input name="foodName" defaultValue={item.name} aria-label="Ingredient name" className="rounded-md border border-line bg-black/20 px-3" />
                        <input name="servingSize" defaultValue={item.servingSize ?? ""} aria-label="Serving size" className="rounded-md border border-line bg-black/20 px-3" />
                        <input name="calories" type="number" defaultValue={item.calories} aria-label="Calories" className="rounded-md border border-line bg-black/20 px-3" />
                        <input name="protein" type="number" step="0.1" defaultValue={item.protein} aria-label="Protein" className="rounded-md border border-line bg-black/20 px-3" />
                      </div>
                    ))}
                    <label className="block text-muted">Notes<textarea name="notes" defaultValue={meal.notes ?? ""} className="mt-1 min-h-20 w-full rounded-md border border-line bg-black/20 p-3 text-ink" /></label>
                    <Button variant="secondary">Save meal edits</Button>
                  </form>
                  <form action={deleteMeal} className="pt-2">
                    <input type="hidden" name="id" value={meal.id} />
                    <Button variant="ghost" className="text-ember">Delete meal</Button>
                  </form>
                </div>
              </details>
            );
          })
        )}
      </div>
    </Card>
  );
}
