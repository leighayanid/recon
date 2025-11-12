/**
 * Rate Limiting Middleware
 * Redis-based rate limiting for API routes
 */

import { getRedisConnection } from '@/lib/queue/connection';
import { RateLimitError } from '@/lib/utils/errors';
import type { NextRequest } from 'next/server';

export interface RateLimitConfig {
  max: number; // Maximum requests
  windowMs: number; // Time window in milliseconds
  keyPrefix?: string; // Redis key prefix
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Default rate limit configurations for different user roles
 */
export const RATE_LIMITS = {
  FREE: {
    global: { max: 100, windowMs: 60 * 60 * 1000 }, // 100 requests per hour
    tool: { max: 10, windowMs: 60 * 60 * 1000 }, // 10 tool executions per hour
  },
  PRO: {
    global: { max: 1000, windowMs: 60 * 60 * 1000 }, // 1000 requests per hour
    tool: { max: 100, windowMs: 60 * 60 * 1000 }, // 100 tool executions per hour
  },
  ADMIN: {
    global: { max: 10000, windowMs: 60 * 60 * 1000 }, // 10000 requests per hour
    tool: { max: 1000, windowMs: 60 * 60 * 1000 }, // 1000 tool executions per hour
  },
};

/**
 * Get rate limit key for a user/IP
 */
function getRateLimitKey(identifier: string, config: RateLimitConfig): string {
  const prefix = config.keyPrefix || 'ratelimit';
  return `${prefix}:${identifier}`;
}

/**
 * Check rate limit using Redis
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitInfo> {
  const redis = getRedisConnection();
  const key = getRateLimitKey(identifier, config);
  const now = Date.now();
  const windowStart = now - config.windowMs;

  try {
    // Use Redis sorted set to track requests
    // Remove old entries outside the window
    await redis.zremrangebyscore(key, 0, windowStart);

    // Count requests in current window
    const count = await redis.zcard(key);

    if (count >= config.max) {
      // Get oldest request timestamp to calculate reset time
      const oldestRequest = await redis.zrange(key, 0, 0, 'WITHSCORES');
      const resetTime = oldestRequest[1]
        ? parseInt(oldestRequest[1] as string) + config.windowMs
        : now + config.windowMs;

      throw new RateLimitError(
        'Rate limit exceeded',
        Math.ceil((resetTime - now) / 1000)
      );
    }

    // Add current request
    await redis.zadd(key, now, `${now}:${Math.random()}`);

    // Set expiry on key
    await redis.expire(key, Math.ceil(config.windowMs / 1000));

    return {
      limit: config.max,
      remaining: config.max - count - 1,
      reset: now + config.windowMs,
    };
  } catch (error) {
    if (error instanceof RateLimitError) {
      throw error;
    }

    // If Redis fails, allow the request but log the error
    console.error('Rate limit check failed:', error);
    return {
      limit: config.max,
      remaining: config.max,
      reset: now + config.windowMs,
    };
  }
}

/**
 * Rate limit middleware for Next.js API routes
 */
export function createRateLimiter(config: RateLimitConfig) {
  return async (
    request: NextRequest,
    identifier?: string
  ): Promise<RateLimitInfo> => {
    // Use provided identifier or fall back to IP address
    const key =
      identifier ||
      request.ip ||
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      'unknown';

    return checkRateLimit(key, config);
  };
}

/**
 * Get user rate limit based on role
 */
export function getUserRateLimit(
  role: 'user' | 'pro' | 'admin',
  type: 'global' | 'tool'
): RateLimitConfig {
  const roleKey = role.toUpperCase() as 'FREE' | 'PRO' | 'ADMIN';
  const limits = role === 'admin'
    ? RATE_LIMITS.ADMIN
    : role === 'pro'
    ? RATE_LIMITS.PRO
    : RATE_LIMITS.FREE;

  return {
    ...limits[type],
    keyPrefix: `ratelimit:${role}:${type}`,
  };
}

/**
 * Rate limit by user ID
 */
export async function rateLimitByUser(
  userId: string,
  role: 'user' | 'pro' | 'admin',
  type: 'global' | 'tool'
): Promise<RateLimitInfo> {
  const config = getUserRateLimit(role, type);
  return checkRateLimit(`user:${userId}`, config);
}

/**
 * Rate limit by IP address
 */
export async function rateLimitByIp(
  ip: string,
  config: RateLimitConfig
): Promise<RateLimitInfo> {
  return checkRateLimit(`ip:${ip}`, config);
}

/**
 * Rate limit by API key
 */
export async function rateLimitByApiKey(
  apiKey: string,
  config: RateLimitConfig
): Promise<RateLimitInfo> {
  return checkRateLimit(`apikey:${apiKey}`, config);
}

/**
 * Reset rate limit for a user (admin function)
 */
export async function resetRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<void> {
  const redis = getRedisConnection();
  const key = getRateLimitKey(identifier, config);
  await redis.del(key);
}

/**
 * Get current rate limit status
 */
export async function getRateLimitStatus(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitInfo> {
  const redis = getRedisConnection();
  const key = getRateLimitKey(identifier, config);
  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Remove old entries
  await redis.zremrangebyscore(key, 0, windowStart);

  // Count current requests
  const count = await redis.zcard(key);

  // Get oldest request for reset time
  const oldestRequest = await redis.zrange(key, 0, 0, 'WITHSCORES');
  const resetTime = oldestRequest[1]
    ? parseInt(oldestRequest[1] as string) + config.windowMs
    : now + config.windowMs;

  return {
    limit: config.max,
    remaining: Math.max(0, config.max - count),
    reset: resetTime,
  };
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  headers: Headers,
  info: RateLimitInfo
): Headers {
  headers.set('X-RateLimit-Limit', info.limit.toString());
  headers.set('X-RateLimit-Remaining', info.remaining.toString());
  headers.set('X-RateLimit-Reset', info.reset.toString());
  return headers;
}
