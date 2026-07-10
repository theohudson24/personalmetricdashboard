import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";

loadEnvConfig(process.cwd());
const prisma = new PrismaClient();

async function main() {
  const todos = await prisma.todoItem.findMany({ orderBy: { createdAt: "asc" } });
  const seen = new Set<string>();
  const duplicateIds: string[] = [];
  for (const todo of todos) {
    const key = `${todo.profileId}:${todo.date.toISOString()}:${todo.title}`;
    if (seen.has(key)) duplicateIds.push(todo.id); else seen.add(key);
  }
  if (duplicateIds.length) await prisma.todoItem.deleteMany({ where: { id: { in: duplicateIds } } });
  console.log(`Removed ${duplicateIds.length} duplicate todo records.`);
}

main().finally(() => prisma.$disconnect());
