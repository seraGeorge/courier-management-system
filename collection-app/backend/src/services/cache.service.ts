import redis from "@/config/redis";

class CacheService {
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);

      if (!value) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Cache GET failed for key "${key}":`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      await redis.set(key, JSON.stringify(value), {
        EX: ttlSeconds,
      });
    } catch (error) {
      console.error(`Cache SET failed for key "${key}":`, error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      console.error(`Cache DELETE failed for key "${key}":`, error);
    }
  }
}

export const cacheService = new CacheService();
