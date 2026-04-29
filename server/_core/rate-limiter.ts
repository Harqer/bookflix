import { Redis } from '@upstash/redis/cloudflare';

/**
 * Edge-Native Rate Limiter (Mobile-Edge Edition)
 * Optimized for Cloudflare Workers / Vercel Edge.
 * Uses the REST-based Upstash driver for global low-latency state.
 */
export class RateLimiter {
  // 2026 Pattern: Redis over HTTP for Edge Compatibility
  private static redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  /**
   * Task: Distributed Rate Limit Check (Atomic)
   */
  static async checkLimit(orgId: string, action: string = "default", limit: number = 100): Promise<{ allowed: boolean; remaining: number }> {
    const key = `limit:${orgId}:${action}`;
    
    try {
      const current = await this.redis.incr(key);
      if (current === 1) {
        await this.redis.expire(key, 3600); // 1 hour window
      }

      return {
        allowed: current <= limit,
        remaining: Math.max(0, limit - current)
      };
    } catch (error) {
      console.error("[Edge Limit] Rate check failed:", error);
      return { allowed: true, remaining: limit }; // Fail open
    }
  }

  /**
   * Task: IP-level Security Check
   */
  static async checkIpLimit(ip: string): Promise<boolean> {
    const key = `ip_limit:${ip}`;
    try {
      const current = await this.redis.incr(key);
      if (current === 1) {
        await this.redis.expire(key, 60); // 1 minute burst protection
      }
      return current <= 60; // 60 requests per minute
    } catch (error) {
      return true;
    }
  }
}
