import { stripeService } from '@/lib/stripe/service'
import { isActiveSubscription } from '@/lib/stripe/feature-gate'
import type { SocialModuleTier } from '@/types/settings'

const SOCIO_TIER_MAP: Record<string, SocialModuleTier> = {
  socio_starter: 'starter',
  socio_basic: 'basic',
  socio_premium: 'premium',
}

const PRICE_AMOUNT_MAP: Record<number, SocialModuleTier> = {
  1900: 'starter',
  3900: 'basic',
  6900: 'premium',
}

export async function getUserSocialTier(
  userId: string,
  fallbackTier: SocialModuleTier = 'starter'
): Promise<{ tier: SocialModuleTier; source: 'subscription' | 'admin' }> {
  try {
    const sub = await stripeService.getSubscriptionInfo(userId)

    if (!isActiveSubscription(sub.status)) {
      return { tier: fallbackTier, source: 'admin' }
    }

    if (sub.priceId) {
      const { getUncachableStripeClient } = await import('@/lib/stripe/client')
      const stripe = await getUncachableStripeClient()

      try {
        const price = await stripe.prices.retrieve(sub.priceId, {
          expand: ['product'],
        })

        const product = price.product
        if (typeof product === 'object' && !product.deleted && product.metadata?.socio_tier) {
          const mapped = SOCIO_TIER_MAP[product.metadata.socio_tier]
          if (mapped) {
            return { tier: mapped, source: 'subscription' }
          }
        }

        const amount = price.unit_amount || 0
        const amountTier = PRICE_AMOUNT_MAP[amount]
        if (amountTier) {
          return { tier: amountTier, source: 'subscription' }
        }
      } catch (err) {
        console.error('Error resolving social tier from price:', err)
      }
    }

    return { tier: fallbackTier, source: 'admin' }
  } catch (err) {
    console.error('Error getting user social tier:', err)
    return { tier: fallbackTier, source: 'admin' }
  }
}
