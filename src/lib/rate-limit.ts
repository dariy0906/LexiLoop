type Bucket = { count: number; resetAt: number };
const globalRate = globalThis as unknown as { lexiRateBuckets?: Map<string, Bucket> };

function buckets(): Map<string, Bucket> {
  if (!globalRate.lexiRateBuckets) globalRate.lexiRateBuckets = new Map();
  return globalRate.lexiRateBuckets;
}

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()) {
  const store = buckets();
  if (store.size > 10_000) {
    for (const [storedKey, bucket] of store) if (bucket.resetAt <= now) store.delete(storedKey);
  }
  const current = store.get(key);
  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: Math.max(0, limit - 1), retryAfter: 0 };
  }
  if (current.count >= limit) {
    return { allowed: false, remaining: 0, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }
  current.count += 1;
  return { allowed: true, remaining: Math.max(0, limit - current.count), retryAfter: 0 };
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip')?.trim() || 'unknown';
}
