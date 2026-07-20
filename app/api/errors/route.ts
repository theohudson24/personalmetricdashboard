import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDefaultProfile } from "@/lib/profile";
import { prisma } from "@/lib/prisma";

const eventSchema = z.object({
  route: z.string().startsWith("/").max(300),
  category: z.enum(["PAGE_LOAD", "NETWORK", "ACCOUNT", "NUTRITION", "WORKOUT", "UNKNOWN"]),
  digest: z.string().trim().max(100).optional(),
  deviceClass: z.enum(["mobile", "tablet", "desktop", "unknown"]).optional(),
});

export async function POST(request: Request) {
  try {
    const profile = await getDefaultProfile();
    const parsed = eventSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid error event." }, { status: 400 });
    const fingerprint = createHash("sha256").update(`${parsed.data.route}|${parsed.data.category}|${parsed.data.digest ?? "none"}`).digest("hex").slice(0, 32);
    await prisma.errorEvent.upsert({
      where: { profileId_fingerprint: { profileId: profile.id, fingerprint } },
      create: { profileId: profile.id, fingerprint, ...parsed.data, digest: parsed.data.digest || null, deviceClass: parsed.data.deviceClass || "unknown" },
      update: { occurrences: { increment: 1 }, digest: parsed.data.digest || null, deviceClass: parsed.data.deviceClass || "unknown" },
    });
    return NextResponse.json({ recorded: true });
  } catch {
    return NextResponse.json({ recorded: false }, { status: 202 });
  }
}
