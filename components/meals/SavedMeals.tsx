import { reuseMealTemplate } from "@/app/actions";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

type SavedMeal = {
  id: string;
  name: string;
  mealType: string;
  foodItems: Array<{ name: string; calories: number; protein: number; fiber: number; sodium: number }>;
};

export function SavedMeals({ templates }: { templates: SavedMeal[] }) {
  return (
    <Card>
      <CardHeader title="Saved meals" description="Reuse frequent meals with the same ingredients and proportions." />
      {templates.length === 0 ? <EmptyState title="Create your first saved meal" message="Build a meal in the logger and select the save-as-template option to reuse its ingredients and proportions." /> : (
        <div className="grid gap-3 lg:grid-cols-2">
          {templates.map((template) => {
            const totals = template.foodItems.reduce((sum, item) => ({ calories: sum.calories + item.calories, protein: sum.protein + item.protein, fiber: sum.fiber + item.fiber, sodium: sum.sodium + item.sodium }), { calories: 0, protein: 0, fiber: 0, sodium: 0 });
            const suggestion = totals.fiber < 8 ? "Add vegetables, beans, or whole grains to raise fiber." : totals.sodium > 1200 ? "Try a lower-sodium sauce or seasoning blend." : "Strong balance—keep the current proportions.";
            return (
              <article key={template.id} className="rounded-lg border border-line bg-ink/[0.025] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-core">{template.mealType.replace("_", " ")}</p>
                <h3 className="mt-1 text-lg font-semibold">{template.name}</h3>
                <p className="mt-2 text-sm text-muted">{Math.round(totals.calories)} kcal · {Math.round(totals.protein)}g protein · {Math.round(totals.fiber)}g fiber</p>
                <p className="mt-3 rounded-md bg-core/10 p-3 text-sm text-muted"><span className="font-semibold text-core">Healthier option: </span>{suggestion}</p>
                <form action={reuseMealTemplate} className="mt-3"><input type="hidden" name="id" value={template.id} /><Button>Log this meal today</Button></form>
              </article>
            );
          })}
        </div>
      )}
    </Card>
  );
}
