import { Plus, RefreshCcw, Trash2 } from "lucide-react";
import { addTodo, deleteTodo, resetTodos, toggleTodo } from "@/app/actions";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";

type Todo = {
  id: string;
  title: string;
  completed: boolean;
};

export function TodoList({ todos, date }: { todos: Todo[]; date: string }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <CardHeader
          title="Daily to-do list"
          description="Track the fundamentals that make the day count."
        />
        <form action={resetTodos}>
          <input type="hidden" name="date" value={date} />
          <Button
            variant="ghost"
            className="h-12 w-12 border-line bg-neutral-50 p-0 text-neutral-800 hover:border-yellow-300 hover:bg-yellow-100 hover:text-yellow-900 active:bg-yellow-200"
            title="Reset tasks"
          >
            <RefreshCcw size={26} strokeWidth={2.7} />
          </Button>
        </form>
      </div>

      <div className="space-y-2">
        {todos.length === 0 ? (
          <EmptyState message="No tasks for this date yet." />
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              className="flex min-h-12 items-center gap-3 rounded-md border border-line px-3"
            >
              <form action={toggleTodo}>
                <input type="hidden" name="id" value={todo.id} />
                <input type="hidden" name="completed" value={String(todo.completed)} />
                <button
                  className={`h-5 w-5 rounded border ${
                    todo.completed ? "border-ink bg-ink" : "border-neutral-400 bg-white"
                  }`}
                  title={todo.completed ? "Mark incomplete" : "Mark complete"}
                />
              </form>
              <span
                className={`flex-1 text-sm ${
                  todo.completed ? "text-muted line-through" : "text-ink"
                }`}
              >
                {todo.title}
              </span>
              <form action={deleteTodo}>
                <input type="hidden" name="id" value={todo.id} />
                <Button
                  variant="ghost"
                  className="h-12 w-12 border-line bg-neutral-50 p-0 text-neutral-800 hover:border-red-300 hover:bg-red-100 hover:text-red-800 active:bg-red-200"
                  title="Delete task"
                >
                  <Trash2 size={26} strokeWidth={2.7} />
                </Button>
              </form>
            </div>
          ))
        )}
      </div>

      <form action={addTodo} className="mt-4 flex gap-2">
        <input type="hidden" name="date" value={date} />
        <Input name="title" placeholder="Add a task" aria-label="Add a task" />
        <Button className="w-12 px-0" title="Add task">
          <Plus size={18} />
        </Button>
      </form>
    </Card>
  );
}
