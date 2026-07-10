import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDefaultProfile } from "@/lib/profile";

export async function GET() {
  const profile = await getDefaultProfile();
  const settings =
    (await prisma.userSettings.findUnique({ where: { profileId: profile.id } })) ??
    (await prisma.userSettings.create({ data: { profileId: profile.id } }));

  return NextResponse.json(settings);
}

export async function POST(request: Request) {
  void request;
  return NextResponse.json({ error: "Use the validated application action." }, { status: 405 });
}
