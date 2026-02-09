import { createClient } from '@supabase/supabase-js'
import { stripeService } from '@/lib/stripe/service'
import { isActiveSubscription } from '@/lib/stripe/feature-gate'
import type { TierDefinition } from '@/lib/social/types'
import { DEFAULT_TIER_DEFINITIONS } from '@/lib/social/types'

function buildStripeMetadataMap(tierDefinitions: TierDefinition[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const tier of tierDefinitions) {
    map[tier.stripeMetadataValue] = tier.id
  }
  return map
}

async function loadTierDefinitions(): Promise<TierDefinition[]> {
  try {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data } = await admin
      .from('organization_settings')
      .select('settings')
      .eq('app_id', 'default')
      .single()

    const defs = data?.settings?.socialModule?.tierDefinitions
    if (Array.isArray(defs) && defs.length > 0) {
      return defs
    }
  } catch {
  }
  return DEFAULT_TIER_DEFINITIONS
}

export async function getUserSocialTier(
  userId: string,
  fallbackTier: string = 'tier_1'
): Promise<{ tier: string; source: 'subscription' | 'admin' }> {
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
        if (typeof product === 'object' && !product.deleted && product.metadata?.muse_tier) {
          const tierDefinitions = await loadTierDefinitions()
          const metadataMap = buildStripeMetadataMap(tierDefinitions)
          const mappedTierId = metadataMap[product.metadata.muse_tier]
          if (mappedTierId) {
            return { tier: mappedTierId, source: 'subscription' }
          }
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
