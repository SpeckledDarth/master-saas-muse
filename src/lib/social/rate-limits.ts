import { checkRateLimit } from '@/lib/rate-limit'
import type { RateLimitResult } from '@/lib/rate-limit'
import type { SocialModuleTier, TierLimits } from '@/types/settings'

const DAY_MS = 24 * 60 * 60 * 1000
const MONTH_MS = 30 * DAY_MS

export const DEFAULT_STARTER_LIMITS: TierLimits = {
  dailyAiGenerations: 5,
  dailyPosts: 1,
  monthlyPosts: 15,
  maxPlatforms: 2,
}

export const DEFAULT_BASIC_LIMITS: TierLimits = {
  dailyAiGenerations: 10,
  dailyPosts: 2,
  monthlyPosts: 30,
  maxPlatforms: 3,
}

export const DEFAULT_PREMIUM_LIMITS: TierLimits = {
  dailyAiGenerations: 100,
  dailyPosts: 10000,
  monthlyPosts: 999999,
  maxPlatforms: 10,
}

export const DEFAULT_UNIVERSAL_LIMITS: TierLimits = {
  dailyAiGenerations: 10,
  dailyPosts: 20,
}

export const DEFAULT_POWER_LIMITS: TierLimits = {
  dailyAiGenerations: 100,
  dailyPosts: 10000,
}

export const DEFAULT_TIER_LIMITS: Record<SocialModuleTier, TierLimits> = {
  starter: DEFAULT_STARTER_LIMITS,
  basic: DEFAULT_BASIC_LIMITS,
  premium: DEFAULT_PREMIUM_LIMITS,
  universal: DEFAULT_UNIVERSAL_LIMITS,
  power: DEFAULT_POWER_LIMITS,
}

export async function checkSocialRateLimit(
  userId: string,
  action: 'generate' | 'post',
  tier: SocialModuleTier,
  tierLimits?: Record<SocialModuleTier, TierLimits>
): Promise<RateLimitResult> {
  const limits = tierLimits?.[tier] || DEFAULT_TIER_LIMITS[tier]
  const dailyLimit = action === 'generate' ? limits.dailyAiGenerations : limits.dailyPosts

  const dailyResult = await checkRateLimit(userId, {
    limit: dailyLimit,
    windowMs: DAY_MS,
    identifier: `social:${action}:daily:${userId}`,
  })

  if (!dailyResult.allowed) {
    return dailyResult
  }

  if (action === 'post' && limits.monthlyPosts) {
    const monthlyResult = await checkRateLimit(userId, {
      limit: limits.monthlyPosts,
      windowMs: MONTH_MS,
      identifier: `social:post:monthly:${userId}`,
    })

    if (!monthlyResult.allowed) {
      return monthlyResult
    }
  }

  return dailyResult
}

export function checkPlatformLimit(
  connectedCount: number,
  tier: SocialModuleTier,
  tierLimits?: Record<SocialModuleTier, TierLimits>
): { allowed: boolean; maxPlatforms: number } {
  const limits = tierLimits?.[tier] || DEFAULT_TIER_LIMITS[tier]
  const max = limits.maxPlatforms ?? 10
  return {
    allowed: connectedCount < max,
    maxPlatforms: max,
  }
}

export function getLimitsForTier(
  tier: SocialModuleTier,
  tierLimits?: Record<SocialModuleTier, TierLimits>
): TierLimits {
  return tierLimits?.[tier] || DEFAULT_TIER_LIMITS[tier]
}
