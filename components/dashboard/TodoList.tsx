"use client";

import { Plus, Trash2 } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";
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
  const [addState, addAction, addPending] = useActionState(addTodo, { status: "idle" as const, message: "" });
  const addFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (addState.status === "success") addFormRef.current?.reset();
  }, [addState.status]);

  return (
    <Card variant="minimal" className="rounded-none px-0 sm:px-0">
      <div className="flex items-start justify-between gap-4">
        <CardHeader
          title="Daily to-do list"
          description="Track the fundamentals that make the day count."
        />
        <form action={resetTodos}>
          <input type="hidden" name="date" value={date} />
          <Button
            variant="ghost"
            className="h-12 w-12 border-line bg-ink/[0.025] p-0 text-muted hover:border-pulse/50 hover:bg-pulse/15 hover:text-pulse active:bg-pulse/20"
            title="Clear all tasks"
            aria-label="Clear all tasks"
          >
            <Trash2 size={22} strokeWidth={2.4} />
          </Button>
        </form>
      </div>

      <div className="space-y-2">
        {todos.length === 0 ? (
          <EmptyState title="Add your first task" message="Choose one clear action that would make today feel successful, then add it below." />
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
            className="flex min-h-12 items-center gap-3 border-b border-line/60 px-1 last:border-b-0"
            >
              <form action={toggleTodo}>
                <input type="hidden" name="id" value={todo.id} />
                <input type="hidden" name="completed" value={String(todo.completed)} />
                <button
                  className={`h-5 w-5 rounded-sm border ${
                    todo.completed ? "border-growth bg-growth" : "border-muted bg-transparent"
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
                  className="h-12 w-12 border-line bg-ink/[0.025] p-0 text-muted hover:border-ember/50 hover:bg-ember/15 hover:text-ember active:bg-ember/20"
                  title="Delete task"
                >
                  <Trash2 size={26} strokeWidth={2.7} />
                </Button>
              </form>
            </div>
          ))
        )}
      </div>

      <div className="mt-4">
        <form id="add-task" ref={addFormRef} action={addAction} className="flex gap-2">
          <input type="hidden" name="date" value={date} />
          <Input name="title" placeholder="Add a task" aria-label="Add a task" disabled={addPending} />
          <Button className="w-12 px-0" title={addPending ? "Adding task" : "Add task"} disabled={addPending}>
            <Plus size={18} />
          </Button>
        </form>
        {addState.message ? <p className={`mt-2 text-sm ${addState.status === "error" ? "text-ember" : "text-muted"}`} role="status">{addState.message}</p> : null}
      </div>
    </Card>
  );
}
