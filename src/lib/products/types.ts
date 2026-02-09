export interface ProductTierDefinition {
  id: string
  displayName: string
  stripeMetadataValue: string
  stripePriceId?: string
  limits: Record<string, number | boolean>
}

export interface MuseProduct {
  id: string
  slug: string
  name: string
  description: string
  stripeProductId: string | null
  metadataKey: string
  tierDefinitions: ProductTierDefinition[]
  featureLimits: Record<string, Record<string, number | boolean>>
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ProductSubscription {
  id: string
  userId: string
  productSlug: string
  stripeSubscriptionId: string | null
  stripePriceId: string | null
  tierId: string
  status: 'free' | 'active' | 'canceled' | 'past_due' | 'trialing'
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  createdAt: string
  updatedAt: string
}

export interface ProductRegistryEntry {
  slug: string
  name: string
  description?: string
  stripeProductId?: string
  metadataKey: string
  tierDefinitions: ProductTierDefinition[]
  featureLimits?: Record<string, Record<string, number | boolean>>
}
