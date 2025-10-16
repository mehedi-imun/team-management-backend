import { getRedisClient } from '../config/redis';
import { Redis } from 'ioredis';

class CacheService {
  private redis: Redis | null = null;

  private async getClient(): Promise<Redis | null> {
    if (!this.redis) {
      this.redis = getRedisClient();
    }
    return this.redis;
  }

  /**
   * Get cached data by key
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const client = await this.getClient();
      if (!client) return null;

      const data = await client.get(key);
      if (!data) return null;

      return JSON.parse(data) as T;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cached data with TTL (in seconds)
   */
  async set(key: string, value: any, ttl: number = 300): Promise<boolean> {
    try {
      const client = await this.getClient();
      if (!client) return false;

      await client.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete single cache key
   */
  async delete(key: string): Promise<boolean> {
    try {
      const client = await this.getClient();
      if (!client) return false;

      await client.del(key);
      return true;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async invalidatePattern(pattern: string): Promise<boolean> {
    try {
      const client = await this.getClient();
      if (!client) return false;

      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(...keys);
      }
      return true;
    } catch (error) {
      console.error(`Cache invalidate pattern error for ${pattern}:`, error);
      return false;
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<boolean> {
    try {
      const client = await this.getClient();
      if (!client) return false;

      await client.flushdb();
      return true;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const client = await this.getClient();
      if (!client) return false;

      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get remaining TTL for a key
   */
  async ttl(key: string): Promise<number> {
    try {
      const client = await this.getClient();
      if (!client) return -1;

      return await client.ttl(key);
    } catch (error) {
      console.error(`Cache TTL error for key ${key}:`, error);
      return -1;
    }
  }
}

export const cacheService = new CacheService();
