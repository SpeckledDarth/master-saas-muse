import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { getRedisClient, isRedisConfigured } from '@/lib/redis/client';

export interface RateLimitConfig {
  limit: number;
  windowMs: number;
  identifier?: string;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

let rateLimiters: Map<string, Ratelimit> = new Map();

function getUpstashRateLimiter(config: RateLimitConfig): Ratelimit {
  const key = `${config.limit}:${config.windowMs}`;

  if (!rateLimiters.has(key)) {
    const redis = getRedisClient();
    const windowSec = Math.ceil(config.windowMs / 1000);

    rateLimiters.set(
      key,
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(config.limit, `${windowSec} s`),
        analytics: true,
        prefix: 'musekit:ratelimit',
      })
    );
  }

  return rateLimiters.get(key)!;
}

const inMemoryStore = new Map<string, { count: number; resetTime: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of inMemoryStore.entries()) {
    if (now > entry.resetTime) {
      inMemoryStore.delete(key);
    }
  }
}, 60000);

function checkRateLimitInMemory(
  ip: string,
  config: RateLimitConfig
): RateLimitResult {
  const key = config.identifier || ip;
  const now = Date.now();

  let entry = inMemoryStore.get(key);

  if (!entry || now > entry.resetTime) {
    entry = { count: 0, resetTime: now + config.windowMs };
  }

  entry.count++;
  inMemoryStore.set(key, entry);

  return {
    success: entry.count <= config.limit,
    remaining: Math.max(0, config.limit - entry.count),
    reset: entry.resetTime,
  };
}

export async function checkRateLimit(
  ip: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = config.identifier || ip;

  if (isRedisConfigured()) {
    try {
      const limiter = getUpstashRateLimiter(config);
      const result = await limiter.limit(key);

      return {
        success: result.success,
        remaining: result.remaining,
        reset: result.reset,
      };
    } catch (err) {
      console.warn('[RateLimit] Upstash failed, falling back to in-memory:', (err as Error).message);
      return checkRateLimitInMemory(ip, config);
    }
  }

  return checkRateLimitInMemory(ip, config);
}

export function rateLimit(config: RateLimitConfig = { limit: 60, windowMs: 60000 }) {
  return async function rateLimitMiddleware(
    ip: string | null
  ): Promise<NextResponse | null> {
    if (!ip) {
      return null;
    }

    const result = await checkRateLimit(ip, config);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': config.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.reset.toString(),
            'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    return null;
  };
}

export function getClientIp(request: Request): string | null {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for');
  if (vercelForwardedFor) {
    return vercelForwardedFor.split(',')[0].trim();
  }

  return null;
}

export const rateLimits = {
  standard: { limit: 60, windowMs: 60000 },
  auth: { limit: 10, windowMs: 60000 },
  email: { limit: 5, windowMs: 60000 },
  checkout: { limit: 10, windowMs: 60000 },
  admin: { limit: 30, windowMs: 60000 },
  webhook: { limit: 100, windowMs: 60000 },
};
