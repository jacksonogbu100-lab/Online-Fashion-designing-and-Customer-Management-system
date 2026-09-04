const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

type Bucket = {
  failures: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

function prune(now: number) {
  if (buckets.size < 200) {
    return;
  }
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export function loginAttemptKey(email: string, ip: string): string {
  return `${ip}|${email}`;
}

export function readLoginLock(
  key: string,
): { locked: false } | { locked: true; retryAfterSec: number } {
  const now = Date.now();
  prune(now);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    if (bucket) {
      buckets.delete(key);
    }
    return { locked: false };
  }
  if (bucket.failures < MAX_FAILURES) {
    return { locked: false };
  }
  return {
    locked: true,
    retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  };
}

export function recordLoginFailure(key: string) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { failures: 1, resetAt: now + WINDOW_MS });
    return;
  }
  bucket.failures += 1;
}

export function clearLoginFailures(key: string) {
  buckets.delete(key);
}
