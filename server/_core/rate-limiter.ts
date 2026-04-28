import { kv } from '@vercel/kv';

/**
 * Enterprise Rate Limiter (Vercel KV)
 * Prevents API abuse and controls costs for expensive agentic operations.
 */
export class RateLimiter {
  private static LIMIT = 10; // 10 productions per hour per Org
  private static WINDOW = 3600; // 1 hour window

  /**
   * Checks if an organization has exceeded its production quota
   */
  static async checkLimit(orgId: string): Promise<{ allowed: boolean; remaining: number }> {
    const key = `rate_limit:studio:${orgId}`;
    const count = await kv.incr(key);

    if (count === 1) {
      await kv.expire(key, this.WINDOW);
    }

    if (count > this.LIMIT) {
      return { allowed: false, remaining: 0 };
    }

    return { allowed: true, remaining: this.LIMIT - count };
  }

  /**
   * Global IP-based rate limiting for public endpoints
   */
  static async checkIpLimit(ip: string): Promise<boolean> {
    const key = `rate_limit:ip:${ip}`;
    const count = await kv.incr(key);
    if (count === 1) await kv.expire(key, 60); // 60s window
    return count <= 100; // 100 req/min
  }
}
