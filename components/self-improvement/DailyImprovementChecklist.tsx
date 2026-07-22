import { Check, Plus, Trash2 } from "lucide-react";
import {
  addImprovementChecklistItem,
  deleteImprovementChecklistItem,
  toggleImprovementChecklistItem,
} from "@/app/self-improvement/actions";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Select } from "@/components/ui/Input";

export function DailyImprovementChecklist({
  items,
  categories,
}: {
  items: Array<{ id: string; title: string; category: string; completed: boolean }>;
  categories: readonly string[];
}) {
  return (
    <Card id="today">
      <CardHeader
        title="Today"
        description="A short, customizable list. You do not need to work on every category every day."
      />
      {items.length === 0 ? (
        <EmptyState
          title="Add your first self-improvement action"
          message="Choose one manageable action for today and assign it to the area it supports."
        />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-2 rounded-md border border-line bg-ink/[0.025] p-2">
              <form action={toggleImprovementChecklistItem}>
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="completed" value={String(item.completed)} />
                <button
                  aria-label={`${item.completed ? "Undo" : "Complete"} ${item.title}`}
                  className={`grid h-10 w-10 place-items-center rounded-md border ${item.completed ? "border-core bg-core text-white" : "border-line text-muted"}`}
                >
                  <Check size={17} />
                </button>
              </form>
              <div className="min-w-0 flex-1">
                <p className={item.completed ? "line-through opacity-60" : ""}>{item.title}</p>
                <p className="text-xs text-muted">{item.category}</p>
              </div>
              <form action={deleteImprovementChecklistItem}>
                <input type="hidden" name="id" value={item.id} />
                <button aria-label={`Delete ${item.title}`} className="grid h-10 w-10 place-items-center rounded-md text-muted hover:bg-ember/10 hover:text-ember">
                  <Trash2 size={16} />
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
      <form action={addImprovementChecklistItem} className="mt-4 grid gap-2 sm:grid-cols-[1fr_14rem_auto]">
        <Input name="title" required maxLength={160} placeholder="Add a manageable action" aria-label="Action title" />
        <Select name="category" aria-label="Action category">
          {categories.map((category) => <option key={category}>{category}</option>)}
        </Select>
        <Button><Plus size={16} /><span className="ml-2">Add</span></Button>
      </form>
    </Card>
  );
}
