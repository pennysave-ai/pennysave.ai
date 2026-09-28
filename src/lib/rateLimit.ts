import { client } from "@/lib/redis";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}

/**
 * Fixed-window counter in Redis. Records one attempt against `key` and says
 * whether the caller is still under `limit` for the current window.
 *
 * Fixed windows can allow up to 2x the limit across a window boundary. That is
 * fine for the use here - guessing a 6-digit invite code - where the budget is
 * orders of magnitude below what an attacker would need.
 */
export async function consumeAttempt(
  key: string,
  limit: number,
  windowSec: number,
): Promise<RateLimitResult> {
  const count = await client.incr(key);

  // Only the attempt that creates the key sets its expiry, so the window runs
  // from the first attempt rather than sliding forward on every call.
  if (count === 1) {
    await client.expire(key, windowSec);
  }

  const ttl = await client.ttl(key);

  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    retryAfterSec: ttl > 0 ? ttl : windowSec,
  };
}
