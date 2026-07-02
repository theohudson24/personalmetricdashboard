import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay } from "@/lib/dates";

export async function GET() {
  const logs = await prisma.dailyLog.findMany({ orderBy: { date: "desc" } });
  return NextResponse.json(logs);
}

export async function POST(request: Request) {
  const body = await request.json();
  const date = startOfDay(body.date ? new Date(body.date) : new Date());

  const log = await prisma.dailyLog.upsert({
    where: { date },
    create: { ...body, date },
    update: { ...body, date },
  });

  return NextResponse.json(log);
}
