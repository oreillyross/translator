/**
 * In-memory sliding-window limiter for magic-link requests (3.10). Good
 * enough for a single-instance MVP; a multi-instance deploy would need a
 * shared store, which is out of scope for v1.
 */
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_EMAIL = 5;
const MAX_PER_IP = 20;

interface Bucket {
  count: number;
  resetAt: number;
}

const emailBuckets = new Map<string, Bucket>();
const ipBuckets = new Map<string, Bucket>();

function consume(buckets: Map<string, Bucket>, key: string, max: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (bucket.count >= max) return false;

  bucket.count += 1;
  return true;
}

/**
 * Must be evaluated with `&&` short-circuiting disabled (i.e. both sides
 * always run) so a request that would exceed only one bucket still counts
 * against the other — otherwise an attacker could probe the IP limit for
 * free by using an email already at its cap.
 */
export function checkLinkRequestRateLimit(email: string, ip: string): boolean {
  const emailOk = consume(emailBuckets, email.toLowerCase(), MAX_PER_EMAIL);
  const ipOk = consume(ipBuckets, ip, MAX_PER_IP);
  return emailOk && ipOk;
}
