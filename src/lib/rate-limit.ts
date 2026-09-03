import type { NextRequest } from "next/server";

/**
 * Fixed-window rate limiter, in process memory.
 *
 * Good enough for a single Node server (the MVP deployment) — it stops
 * online password guessing, which is the point. It is NOT shared across
 * serverless instances or replicas; when the app scales out, swap the Map
 * for Redis/Upstash behind the same three functions.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

function prune(now: number) {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [key, b] of buckets) if (b.resetAt <= now) buckets.delete(key);
}

export type LimitStatus = {
  limited: boolean;
  remaining: number;
  retryAfterSec: number;
};

/** How many attempts are left for this key without recording one. */
export function checkLimit(key: string, limit: number): LimitStatus {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) return { limited: false, remaining: limit, retryAfterSec: 0 };
  const remaining = Math.max(0, limit - b.count);
  return {
    limited: remaining === 0,
    remaining,
    retryAfterSec: Math.ceil((b.resetAt - now) / 1000),
  };
}

/** Record one attempt against the key. */
export function recordAttempt(key: string, windowMs: number): void {
  const now = Date.now();
  prune(now);
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
  } else {
    b.count += 1;
  }
}

/** Forget the key (e.g. after a successful sign-in). */
export function resetLimit(key: string): void {
  buckets.delete(key);
}

/** Best-effort client address for keying limits. */
export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export function retryMessage(seconds: number): string {
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}
