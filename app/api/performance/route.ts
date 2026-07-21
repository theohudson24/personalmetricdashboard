import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getDefaultProfile } from "@/lib/profile";
import { consumeRateLimit, privateRateLimitKey } from "@/lib/rateLimit";

const schema = z.object({ route: z.string().startsWith("/").max(200), name: z.enum(["CLS", "FCP", "INP", "LCP", "TTFB"]), value: z.number().finite().min(0).max(10_000_000), rating: z.enum(["good", "needs-improvement", "poor"]), deviceClass: z.enum(["mobile", "tablet", "desktop"]) });

export async function POST(request: Request) {
  try {
    const profile = await getDefaultProfile();
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ recorded: false }, { status: 400 });
    const rate = await consumeRateLimit(privateRateLimitKey("performance", profile.id), 30, 60 * 60 * 1000);
    if (!rate.allowed) return NextResponse.json({ recorded: false }, { status: 202 });
    await prisma.$transaction([
      prisma.performanceMetric.deleteMany({ where: { profileId: profile.id, createdAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
      prisma.performanceMetric.create({ data: { profileId: profile.id, ...parsed.data, environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown" } }),
    ]);
    return NextResponse.json({ recorded: true });
  } catch { return NextResponse.json({ recorded: false }, { status: 202 }); }
}
