import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const settings =
    (await prisma.userSettings.findFirst()) ??
    (await prisma.userSettings.create({ data: {} }));

  return NextResponse.json(settings);
}

export async function POST(request: Request) {
  const body = await request.json();
  const existing = await prisma.userSettings.findFirst();

  const settings = existing
    ? await prisma.userSettings.update({ where: { id: existing.id }, data: body })
    : await prisma.userSettings.create({ data: body });

  return NextResponse.json(settings);
}
