import { randomUUID } from "node:crypto";
import { archiveSavedMeal, renameSavedMeal, reuseSavedMeal } from "@/app/meals/actions";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

type SavedMeal = {
  id: string;
  name: string;
  mealType: string;
  entryKind: string;
  useCount: number;
  foodItems: Array<{ name: string; calories: number; protein: number; fiber: number; sodium: number }>;
};

export function SavedMeals({ templates }: { templates: SavedMeal[] }) {
  const now = new Date();
  const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return (
    <Card>
      <CardHeader title="Saved meals" description="Reuse frequent meals with the same ingredients and proportions." />
      {templates.length === 0 ? <EmptyState message="Save a meal from the logger and it will appear here." /> : (
        <div className="grid gap-3 lg:grid-cols-2">
          {templates.map((template) => {
            const totals = template.foodItems.reduce((sum, item) => ({ calories: sum.calories + item.calories, protein: sum.protein + item.protein, fiber: sum.fiber + item.fiber, sodium: sum.sodium + item.sodium }), { calories: 0, protein: 0, fiber: 0, sodium: 0 });
            const suggestion = totals.fiber < 8 ? "Add vegetables, beans, or whole grains to raise fiber." : totals.sodium > 1200 ? "Try a lower-sodium sauce or seasoning blend." : "Strong balance—keep the current proportions.";
            return (
              <article key={template.id} className="rounded-lg border border-line bg-black/15 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-core">{template.entryKind} · {template.mealType.replace("_", " ")}</p>
                <h3 className="mt-1 text-lg font-semibold">{template.name}</h3>
                <p className="mt-2 text-sm text-muted">{Math.round(totals.calories)} kcal · {Math.round(totals.protein)}g protein · {Math.round(totals.fiber)}g fiber</p>
                <p className="mt-3 rounded-md bg-core/10 p-3 text-sm text-muted"><span className="font-semibold text-core">Healthier option: </span>{suggestion}</p>
                <p className="mt-2 text-xs text-muted">Logged {template.useCount} time(s) from this template.</p>
                <form action={renameSavedMeal} className="mt-3 flex gap-2"><input type="hidden" name="id" value={template.id}/><input name="name" defaultValue={template.name} aria-label="Saved meal name" className="min-w-0 flex-1 rounded-md border border-line bg-black/20 px-3 text-sm"/><Button variant="secondary">Rename</Button></form>
                <div className="mt-3 flex gap-2"><form action={reuseSavedMeal}><input type="hidden" name="id" value={template.id}/><input type="hidden" name="dateKey" value={dateKey}/><input type="hidden" name="timezone" value="UTC"/><input type="hidden" name="clientRequestId" value={randomUUID()}/><Button>Log today</Button></form><form action={archiveSavedMeal}><input type="hidden" name="id" value={template.id}/><Button variant="ghost">Archive</Button></form></div>
              </article>
            );
          })}
        </div>
      )}
    </Card>
  );
}
