import "server-only";

import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

export function privateRateLimitKey(scope: string, identity: string) {
  return `${scope}:${createHash("sha256").update(identity.trim().toLowerCase()).digest("hex")}`;
}

export async function consumeRateLimit(key: string, limit: number, windowMs: number) {
  const now = new Date();
  await prisma.rateLimitBucket.deleteMany({ where: { expiresAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } } });
  const expiresAt = new Date(now.getTime() + windowMs);
  const bucket = await prisma.rateLimitBucket.upsert({
    where: { key },
    create: { key, count: 1, windowStart: now, expiresAt },
    update: { count: { increment: 1 } },
  });
  if (bucket.expiresAt <= now) {
    await prisma.rateLimitBucket.update({ where: { key }, data: { count: 1, windowStart: now, expiresAt } });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  return { allowed: bucket.count <= limit, retryAfterSeconds: Math.max(1, Math.ceil((bucket.expiresAt.getTime() - now.getTime()) / 1000)) };
}
