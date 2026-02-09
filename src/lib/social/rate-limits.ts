import { checkRateLimit } from '@/lib/rate-limit'
import type { RateLimitResult } from '@/lib/rate-limit'
import type { TierLimits, TierDefinition } from '@/lib/social/types'
import { DEFAULT_TIER_DEFINITIONS } from '@/lib/social/types'

const DAY_MS = 24 * 60 * 60 * 1000
const MONTH_MS = 30 * DAY_MS

function buildDefaultTierLimits(): Record<string, TierLimits> {
  const map: Record<string, TierLimits> = {}
  for (const def of DEFAULT_TIER_DEFINITIONS) {
    map[def.id] = def.limits
  }
  return map
}

const FALLBACK_LIMITS: TierLimits = {
  dailyAiGenerations: 5,
  dailyPosts: 1,
  monthlyPosts: 15,
  maxPlatforms: 2,
}

export const DEFAULT_TIER_LIMITS: Record<string, TierLimits> = buildDefaultTierLimits()

export async function checkSocialRateLimit(
  userId: string,
  action: 'generate' | 'post',
  tier: string,
  tierLimits?: Record<string, TierLimits>
): Promise<RateLimitResult> {
  const limits = tierLimits?.[tier] || DEFAULT_TIER_LIMITS[tier] || FALLBACK_LIMITS
  const dailyLimit = action === 'generate' ? limits.dailyAiGenerations : limits.dailyPosts

  const dailyResult = await checkRateLimit(userId, {
    limit: dailyLimit,
    windowMs: DAY_MS,
    identifier: `social:${action}:daily:${userId}`,
  })

  if (!dailyResult.success) {
    return dailyResult
  }

  if (action === 'post' && limits.monthlyPosts) {
    const monthlyResult = await checkRateLimit(userId, {
      limit: limits.monthlyPosts,
      windowMs: MONTH_MS,
      identifier: `social:post:monthly:${userId}`,
    })

    if (!monthlyResult.success) {
      return monthlyResult
    }
  }

  return dailyResult
}

export function checkPlatformLimit(
  connectedCount: number,
  tier: string,
  tierLimits?: Record<string, TierLimits>
): { allowed: boolean; maxPlatforms: number } {
  const limits = tierLimits?.[tier] || DEFAULT_TIER_LIMITS[tier] || FALLBACK_LIMITS
  const max = limits.maxPlatforms ?? 10
  return {
    allowed: connectedCount < max,
    maxPlatforms: max,
  }
}

export function getLimitsForTier(
  tier: string,
  tierLimits?: Record<string, TierLimits>
): TierLimits {
  return tierLimits?.[tier] || DEFAULT_TIER_LIMITS[tier] || FALLBACK_LIMITS
}
