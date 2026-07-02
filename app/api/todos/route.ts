import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay } from "@/lib/dates";

export async function GET() {
  const todos = await prisma.todoItem.findMany({
    orderBy: [{ date: "desc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(todos);
}

export async function POST(request: Request) {
  const body = await request.json();
  const todo = await prisma.todoItem.create({
    data: {
      date: startOfDay(body.date ? new Date(body.date) : new Date()),
      title: body.title,
      completed: Boolean(body.completed),
    },
  });

  return NextResponse.json(todo);
}
