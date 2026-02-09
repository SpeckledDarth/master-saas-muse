import { productRegistry } from './registry'
import { stripeService } from '@/lib/stripe/service'
import { isActiveSubscription } from '@/lib/stripe/feature-gate'
import { getUncachableStripeClient } from '@/lib/stripe/client'
import type { ProductTierDefinition } from './types'

export interface ProductTierResult {
  tier: string
  source: 'subscription' | 'product-registry' | 'default'
  productSlug: string
  limits: Record<string, number | boolean>
}

export async function getUserProductTier(
  userId: string,
  productSlug: string
): Promise<ProductTierResult> {
  const defaultResult: ProductTierResult = {
    tier: 'free',
    source: 'default',
    productSlug,
    limits: {},
  }

  try {
    const product = await productRegistry.getProduct(productSlug)
    if (!product || !product.isActive) {
      return defaultResult
    }

    const firstTier = product.tierDefinitions[0]
    const fallbackTier = firstTier?.id || 'free'
    const fallbackLimits = firstTier?.limits || {}

    const sub = await productRegistry.getUserSubscription(userId, productSlug)

    if (sub && (sub.status === 'active' || sub.status === 'trialing')) {
      const tierDef = product.tierDefinitions.find(t => t.id === sub.tierId)
      return {
        tier: sub.tierId,
        source: 'product-registry',
        productSlug,
        limits: tierDef?.limits || fallbackLimits,
      }
    }

    const stripeSub = await resolveFromStripe(userId, product)
    if (stripeSub) {
      return stripeSub
    }

    return {
      tier: fallbackTier,
      source: 'default',
      productSlug,
      limits: fallbackLimits,
    }
  } catch (error) {
    console.error(`Error resolving tier for product ${productSlug}:`, error)
    return defaultResult
  }
}

async function resolveFromStripe(
  userId: string,
  product: { slug: string; stripeProductId: string | null; metadataKey: string; tierDefinitions: ProductTierDefinition[] }
): Promise<ProductTierResult | null> {
  if (!product.stripeProductId) return null

  try {
    const sub = await stripeService.getSubscriptionForProduct(userId, product.stripeProductId)
    if (!isActiveSubscription(sub.status) || !sub.priceId) return null

    const stripe = await getUncachableStripeClient()
    const price = await stripe.prices.retrieve(sub.priceId, { expand: ['product'] })
    const stripeProduct = price.product

    if (typeof stripeProduct !== 'object' || stripeProduct.deleted) return null

    const metadataValue = stripeProduct.metadata?.[product.metadataKey]
    if (!metadataValue) return null

    const tierDef = product.tierDefinitions.find(
      t => t.stripeMetadataValue === metadataValue
    )
    if (!tierDef) return null

    await productRegistry.upsertSubscription({
      userId,
      productSlug: product.slug,
      stripeSubscriptionId: sub.subscriptionId || undefined,
      stripePriceId: sub.priceId,
      tierId: tierDef.id,
      status: sub.status,
      currentPeriodEnd: sub.currentPeriodEnd || undefined,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    })

    return {
      tier: tierDef.id,
      source: 'subscription',
      productSlug: product.slug,
      limits: tierDef.limits || {},
    }
  } catch (error) {
    console.error(`Error resolving Stripe tier for ${product.slug}:`, error)
    return null
  }
}

export async function getProductLimits(
  userId: string,
  productSlug: string
): Promise<Record<string, number | boolean>> {
  const result = await getUserProductTier(userId, productSlug)
  return result.limits
}
