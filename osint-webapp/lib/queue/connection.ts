/**
 * Redis Connection
 * Manages Redis connection for BullMQ
 */

import Redis from 'ioredis';

let connection: Redis | null = null;

export function getRedisConnection(): Redis {
  if (!connection) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    connection = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    connection.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    connection.on('connect', () => {
      console.log('Redis connected successfully');
    });
  }

  return connection;
}

export function closeRedisConnection(): Promise<void> {
  if (connection) {
    return connection.quit().then(() => {
      connection = null;
    });
  }
  return Promise.resolve();
}

// For testing purposes
export function getConnectionStatus(): boolean {
  return connection?.status === 'ready';
}
