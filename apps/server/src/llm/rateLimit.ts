/**
 * In-memory sliding-window limiter for translate requests (5.8), same
 * shape as the magic-link limiter — good enough for a single-instance MVP.
 */
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_USER = 30;

interface Bucket {
  count: number;
  resetAt: number;
}

const userBuckets = new Map<string, Bucket>();

export function checkTranslateRateLimit(userId: string): boolean {
  const now = Date.now();
  const bucket = userBuckets.get(userId);

  if (!bucket || bucket.resetAt < now) {
    userBuckets.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (bucket.count >= MAX_PER_USER) return false;

  bucket.count += 1;
  return true;
}
