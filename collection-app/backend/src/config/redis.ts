import { createClient } from "redis";

const redis = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redis.on("error", (error) => {
  console.error("Redis client error:", error.message);
});

export async function connectRedis(): Promise<boolean> {
  if (redis.isOpen) {
    return true;
  }

  try {
    await redis.connect();
    console.log("Redis connected");
    return true;
  } catch (error) {
    console.error(
      "Redis connection failed:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

export function isRedisReady(): boolean {
  return redis.isReady;
}

export default redis;
