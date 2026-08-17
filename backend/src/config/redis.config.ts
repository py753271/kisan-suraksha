import Redis from 'ioredis';
import { env } from './env.config';
import { logger } from './logger.config';

let redis: Redis | null = null;
let isConnected = false;

try {
  redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 100, 3000);
      return delay;
    },
  });

  redis.on('connect', () => {
    logger.info('Connected to Redis Cache Server successfully.');
    isConnected = true;
  });

  redis.on('error', (error) => {
    logger.error('Redis Cache Server Connection Error:', error);
    isConnected = false;
  });

  redis.on('close', () => {
    logger.warn('Redis Cache Server Connection Closed.');
    isConnected = false;
  });
} catch (error) {
  logger.error('Failed to initialize Redis client:', error);
}

export const getCache = async <T>(key: string): Promise<T | null> => {
  if (!redis || !isConnected) return null;
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error(`Error reading cache key: ${key}`, error);
    return null;
  }
};

export const setCache = async (key: string, value: any, ttlSeconds: number): Promise<boolean> => {
  if (!redis || !isConnected) return false;
  try {
    const serialized = JSON.stringify(value);
    await redis.set(key, serialized, 'EX', ttlSeconds);
    return true;
  } catch (error) {
    logger.error(`Error writing cache key: ${key}`, error);
    return false;
  }
};

export const delCache = async (key: string): Promise<boolean> => {
  if (!redis || !isConnected) return false;
  try {
    await redis.del(key);
    return true;
  } catch (error) {
    logger.error(`Error deleting cache key: ${key}`, error);
    return false;
  }
};

// Invalidation by scan pattern (highly optimal for clustered Redis environments)
export const invalidateByPattern = async (pattern: string): Promise<boolean> => {
  if (!redis || !isConnected) return false;
  try {
    let cursor = '0';
    let keysToDelete: string[] = [];
    
    do {
      const reply = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = reply[0];
      keysToDelete = keysToDelete.concat(reply[1]);
    } while (cursor !== '0');

    if (keysToDelete.length > 0) {
      await redis.del(...keysToDelete);
      logger.info(`Invalidated cache pattern: ${pattern} - Deleted keys:`, keysToDelete);
    }
    return true;
  } catch (error) {
    logger.error(`Error invalidating cache pattern: ${pattern}`, error);
    return false;
  }
};

export const checkRedisHealth = async (): Promise<{ status: string; latency?: string }> => {
  if (!redis || !isConnected) {
    return { status: 'DOWN', latency: 'N/A' };
  }
  try {
    const start = Date.now();
    const ping = await redis.ping();
    if (ping === 'PONG') {
      return { status: 'UP', latency: `${Date.now() - start}ms` };
    }
    return { status: 'UNHEALTHY', latency: 'N/A' };
  } catch (error) {
    logger.error('Redis health check command failed:', error);
    return { status: 'DOWN', latency: 'N/A' };
  }
};

export { redis };
