import { checkRateLimit } from '@/lib/rate-limit'
import type { RateLimitResult } from '@/lib/rate-limit'
import type { SocialModuleTier, TierLimits } from '@/types/settings'

const DAY_MS = 24 * 60 * 60 * 1000

export const DEFAULT_UNIVERSAL_LIMITS: TierLimits = {
  dailyAiGenerations: 10,
  dailyPosts: 20,
}

export const DEFAULT_POWER_LIMITS: TierLimits = {
  dailyAiGenerations: 100,
  dailyPosts: 10000,
}

export const DEFAULT_TIER_LIMITS: Record<SocialModuleTier, TierLimits> = {
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
  const limit = action === 'generate' ? limits.dailyAiGenerations : limits.dailyPosts

  return checkRateLimit(userId, {
    limit,
    windowMs: DAY_MS,
    identifier: `social:${action}:${userId}`,
  })
}

export function getLimitsForTier(
  tier: SocialModuleTier,
  tierLimits?: Record<SocialModuleTier, TierLimits>
): TierLimits {
  return tierLimits?.[tier] || DEFAULT_TIER_LIMITS[tier]
}
