import type { FoodItem, Meal } from "@prisma/client";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

type MealWithItems = Meal & { foodItems: FoodItem[] };

export function MealHistory({ meals }: { meals: MealWithItems[] }) {
  return (
    <Card>
      <CardHeader title="Meals logged" description="Food entries for the current day." />
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
                        {meal.mealType.replace("_", " ").toLowerCase()} {meal.time ? `/ ${meal.time}` : ""}
                      </p>
                    </div>
                    <p className="text-sm text-muted">
                      {calories} kcal / {Math.round(protein)}g protein
                    </p>
                  </div>
                </summary>
                <div className="mt-3 space-y-2 border-t border-line pt-3 text-sm">
                  {meal.foodItems.map((item) => (
                    <div key={item.id} className="flex justify-between gap-3 text-muted">
                      <span>{item.name}</span>
                      <span>{item.calories} kcal</span>
                    </div>
                  ))}
                </div>
              </details>
            );
          })
        )}
      </div>
    </Card>
  );
}
