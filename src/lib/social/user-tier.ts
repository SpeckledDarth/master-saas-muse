import { createClient } from '@supabase/supabase-js'
import { getUserProductTier } from '@/lib/products'
import { DEFAULT_TIER_DEFINITIONS } from './types'
import type { TierDefinition } from './types'

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
    const result = await getUserProductTier(userId, 'socio-scheduler')
    if (result.source !== 'default') {
      return {
        tier: result.tier,
        source: result.source === 'subscription' ? 'subscription' : 'admin',
      }
    }
  } catch {
  }

  try {
    const { stripeService } = await import('@/lib/stripe/service')
    const { isActiveSubscription } = await import('@/lib/stripe/feature-gate')

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
          const mappedTier = metadataMap[product.metadata.muse_tier]
          if (mappedTier) {
            return { tier: mappedTier, source: 'subscription' }
          }
        }
      } catch {
      }
    }
  } catch {
  }

  return { tier: fallbackTier, source: 'admin' }
}
