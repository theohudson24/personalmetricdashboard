import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDefaultProfile } from "@/lib/profile";

export async function GET() {
  const profile = await getDefaultProfile();
  const todos = await prisma.todoItem.findMany({
    where: { profileId: profile.id },
    orderBy: [{ date: "desc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(todos);
}

export async function POST(request: Request) {
  void request;
  return NextResponse.json({ error: "Use the validated application action." }, { status: 405 });
}
