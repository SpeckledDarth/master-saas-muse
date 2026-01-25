import { NextResponse } from 'next/server';

// ============================================
// Simple in-memory rate limiter
// For production, consider using Upstash Redis
// ============================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean every minute

export interface RateLimitConfig {
  limit: number;           // Max requests
  windowMs: number;        // Time window in milliseconds
  identifier?: string;     // Custom identifier (defaults to IP)
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

/**
 * Check if a request should be rate limited
 */
export function checkRateLimit(
  ip: string,
  config: RateLimitConfig
): RateLimitResult {
  const { limit, windowMs, identifier } = config;
  const key = identifier || ip;
  const now = Date.now();

  let entry = rateLimitStore.get(key);

  // Create new entry if doesn't exist or expired
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + windowMs,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  const remaining = Math.max(0, limit - entry.count);
  const success = entry.count <= limit;

  return {
    success,
    remaining,
    reset: entry.resetTime,
  };
}

/**
 * Rate limit middleware for API routes
 */
export function rateLimit(config: RateLimitConfig = { limit: 60, windowMs: 60000 }) {
  return function rateLimitMiddleware(
    ip: string | null
  ): NextResponse | null {
    if (!ip) {
      // Can't rate limit without IP, allow request
      return null;
    }

    const result = checkRateLimit(ip, config);

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

/**
 * Get client IP from request headers
 */
export function getClientIp(request: Request): string | null {
  // Check various headers that may contain the real IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Vercel-specific header
  const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for');
  if (vercelForwardedFor) {
    return vercelForwardedFor.split(',')[0].trim();
  }

  return null;
}

// ============================================
// Preset rate limit configurations
// ============================================

export const rateLimits = {
  // Standard API calls: 60 per minute
  standard: { limit: 60, windowMs: 60000 },
  
  // Auth endpoints: 10 per minute (prevent brute force)
  auth: { limit: 10, windowMs: 60000 },
  
  // Email sending: 5 per minute
  email: { limit: 5, windowMs: 60000 },
  
  // Stripe checkout: 10 per minute
  checkout: { limit: 10, windowMs: 60000 },
  
  // Admin actions: 30 per minute
  admin: { limit: 30, windowMs: 60000 },
  
  // Webhook endpoints: 100 per minute (higher for Stripe)
  webhook: { limit: 100, windowMs: 60000 },
};
