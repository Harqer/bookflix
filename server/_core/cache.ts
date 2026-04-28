import { kv } from '@vercel/kv';

/**
 * Enterprise Studio Cache (Vercel KV)
 * Replaces in-memory cache with a global, low-latency Redis instance.
 */
export class StudioCache {
  private static TTL = 3600; // 1 hour default

  /**
   * Sets a value in the global cache
   */
  static async set(key: string, data: any, ttlSeconds: number = this.TTL) {
    console.log(`[Studio Cache] Setting global key: ${key}`);
    await kv.set(key, data, { ex: ttlSeconds });
  }

  /**
   * Retrieves a value from the global cache
   */
  static async get<T>(key: string): Promise<T | null> {
    const data = await kv.get<T>(key);
    if (data) {
      console.log(`[Studio Cache] Global HIT: ${key}`);
    }
    return data;
  }

  /**
   * Atomic increment for production job tracking
   */
  static async incrementJobCounter(orgId: string): Promise<number> {
    return await kv.incr(`jobs_count:${orgId}`);
  }
}
