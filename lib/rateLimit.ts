type Bucket = { count: number; resetAt: number };

const globalBuckets = globalThis as typeof globalThis & { __metricRateLimits?: Map<string, Bucket> };
const buckets = globalBuckets.__metricRateLimits ?? new Map<string, Bucket>();
globalBuckets.__metricRateLimits = buckets;

export function allowRequest(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    prune(now);
    return { allowed: true, retryAfter: 0 };
  }
  if (current.count >= limit) {
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }
  current.count += 1;
  return { allowed: true, retryAfter: 0 };
}

function prune(now: number) {
  if (buckets.size < 1000) return;
  for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
}
