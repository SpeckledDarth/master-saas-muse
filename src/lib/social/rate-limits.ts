import { checkRateLimit } from '@/lib/rate-limit'
import type { RateLimitResult } from '@/lib/rate-limit'
import type { SocialModuleTier } from '@/types/settings'

const DAY_MS = 24 * 60 * 60 * 1000

export const UNIVERSAL_LIMITS = {
  generate: 10,
  post: 20,
}

export const POWER_LIMITS = {
  generate: 100,
  post: 10000,
}

const TIER_LIMITS: Record<SocialModuleTier, typeof UNIVERSAL_LIMITS> = {
  universal: UNIVERSAL_LIMITS,
  power: POWER_LIMITS,
}

export async function checkSocialRateLimit(
  userId: string,
  action: 'generate' | 'post',
  tier: SocialModuleTier
): Promise<RateLimitResult> {
  const limits = TIER_LIMITS[tier]
  const limit = limits[action]

  return checkRateLimit(userId, {
    limit,
    windowMs: DAY_MS,
    identifier: `social:${action}:${userId}`,
  })
}
