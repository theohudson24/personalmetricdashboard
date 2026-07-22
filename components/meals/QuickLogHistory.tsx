import type { FoodItem, Meal } from "@prisma/client";
import { History } from "lucide-react";
import { reuseLoggedEntry } from "@/app/actions";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

type Entry = Meal & { foodItems: FoodItem[] };

export function QuickLogHistory({ entries }: { entries: Entry[] }) {
  const unique = entries.filter((entry, index, all) => all.findIndex((candidate) => candidate.entryKind === entry.entryKind && candidate.mealName.toLowerCase() === entry.mealName.toLowerCase()) === index).slice(0, 8);
  return <Card>
    <CardHeader title="Quick log history" description="Reuse a recent item, drink, snack, or meal without scanning or typing it again." />
    {unique.length === 0 ? <EmptyState title="No recent items yet" message="After you log food or drinks, this section will let you add them again without re-entering their information." /> : <div className="grid gap-3 md:grid-cols-2">
      {unique.map((entry) => {
        const calories = entry.foodItems.reduce((sum, item) => sum + item.calories, 0);
        const protein = entry.foodItems.reduce((sum, item) => sum + item.protein, 0);
        return <article key={entry.id} className="flex items-center justify-between gap-3 rounded-md border border-line bg-ink/[0.025] p-3">
          <div className="min-w-0"><p className="truncate font-medium">{entry.mealName}</p><p className="text-xs text-muted">{entry.entryKind.toLowerCase()} · {Math.round(calories)} kcal · {Math.round(protein)}g protein</p></div>
          <form action={reuseLoggedEntry}><input type="hidden" name="id" value={entry.id} /><Button variant="secondary" className="shrink-0"><History size={15}/><span className="ml-2">Log again</span></Button></form>
        </article>;
      })}
    </div>}
  </Card>;
}
