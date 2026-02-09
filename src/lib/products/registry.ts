import { createClient } from '@supabase/supabase-js'
import type { MuseProduct, ProductSubscription, ProductTierDefinition } from './types'

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export class ProductRegistry {
  async listProducts(activeOnly = true): Promise<MuseProduct[]> {
    const admin = getAdmin()
    let query = admin.from('muse_products').select('*').order('created_at', { ascending: true })
    if (activeOnly) {
      query = query.eq('is_active', true)
    }
    const { data, error } = await query
    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return []
      }
      throw error
    }
    return (data || []).map(this.mapProduct)
  }

  async getProduct(slug: string): Promise<MuseProduct | null> {
    const admin = getAdmin()
    const { data, error } = await admin
      .from('muse_products')
      .select('*')
      .eq('slug', slug)
      .single()
    if (error) {
      if (error.code === 'PGRST116' || error.code === '42P01') return null
      throw error
    }
    return data ? this.mapProduct(data) : null
  }

  async getProductByStripeId(stripeProductId: string): Promise<MuseProduct | null> {
    const admin = getAdmin()
    const { data, error } = await admin
      .from('muse_products')
      .select('*')
      .eq('stripe_product_id', stripeProductId)
      .single()
    if (error) {
      if (error.code === 'PGRST116' || error.code === '42P01') return null
      throw error
    }
    return data ? this.mapProduct(data) : null
  }

  async registerProduct(entry: {
    slug: string
    name: string
    description?: string
    stripeProductId?: string
    metadataKey: string
    tierDefinitions: ProductTierDefinition[]
    featureLimits?: Record<string, Record<string, number | boolean>>
  }): Promise<MuseProduct> {
    const admin = getAdmin()
    const { data, error } = await admin
      .from('muse_products')
      .upsert({
        slug: entry.slug,
        name: entry.name,
        description: entry.description || '',
        stripe_product_id: entry.stripeProductId || null,
        metadata_key: entry.metadataKey,
        tier_definitions: entry.tierDefinitions,
        feature_limits: entry.featureLimits || {},
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'slug' })
      .select()
      .single()
    if (error) throw error
    return this.mapProduct(data)
  }

  async updateProduct(slug: string, updates: Partial<{
    name: string
    description: string
    stripeProductId: string | null
    metadataKey: string
    tierDefinitions: ProductTierDefinition[]
    featureLimits: Record<string, Record<string, number | boolean>>
    isActive: boolean
  }>): Promise<MuseProduct | null> {
    const admin = getAdmin()
    const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.stripeProductId !== undefined) dbUpdates.stripe_product_id = updates.stripeProductId
    if (updates.metadataKey !== undefined) dbUpdates.metadata_key = updates.metadataKey
    if (updates.tierDefinitions !== undefined) dbUpdates.tier_definitions = updates.tierDefinitions
    if (updates.featureLimits !== undefined) dbUpdates.feature_limits = updates.featureLimits
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive

    const { data, error } = await admin
      .from('muse_products')
      .update(dbUpdates)
      .eq('slug', slug)
      .select()
      .single()
    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data ? this.mapProduct(data) : null
  }

  async deleteProduct(slug: string): Promise<boolean> {
    const admin = getAdmin()
    const { error } = await admin
      .from('muse_products')
      .delete()
      .eq('slug', slug)
    if (error) throw error
    return true
  }

  async getUserSubscription(userId: string, productSlug: string): Promise<ProductSubscription | null> {
    const admin = getAdmin()
    const { data, error } = await admin
      .from('muse_product_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('product_slug', productSlug)
      .single()
    if (error) {
      if (error.code === 'PGRST116' || error.code === '42P01') return null
      throw error
    }
    return data ? this.mapSubscription(data) : null
  }

  async getUserSubscriptions(userId: string): Promise<ProductSubscription[]> {
    const admin = getAdmin()
    const { data, error } = await admin
      .from('muse_product_subscriptions')
      .select('*')
      .eq('user_id', userId)
    if (error) {
      if (error.code === '42P01') return []
      throw error
    }
    return (data || []).map(this.mapSubscription)
  }

  async upsertSubscription(params: {
    userId: string
    productSlug: string
    stripeSubscriptionId?: string
    stripePriceId?: string
    tierId: string
    status: string
    currentPeriodEnd?: string
    cancelAtPeriodEnd?: boolean
  }): Promise<ProductSubscription> {
    const admin = getAdmin()
    const { data, error } = await admin
      .from('muse_product_subscriptions')
      .upsert({
        user_id: params.userId,
        product_slug: params.productSlug,
        stripe_subscription_id: params.stripeSubscriptionId || null,
        stripe_price_id: params.stripePriceId || null,
        tier_id: params.tierId,
        status: params.status,
        current_period_end: params.currentPeriodEnd || null,
        cancel_at_period_end: params.cancelAtPeriodEnd || false,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,product_slug' })
      .select()
      .single()
    if (error) throw error
    return this.mapSubscription(data)
  }

  async clearSubscription(userId: string, productSlug: string): Promise<void> {
    const admin = getAdmin()
    await admin
      .from('muse_product_subscriptions')
      .update({
        stripe_subscription_id: null,
        stripe_price_id: null,
        tier_id: 'free',
        status: 'free',
        current_period_end: null,
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('product_slug', productSlug)
  }

  async clearSubscriptionByStripeId(stripeSubscriptionId: string): Promise<void> {
    const admin = getAdmin()
    await admin
      .from('muse_product_subscriptions')
      .update({
        stripe_subscription_id: null,
        stripe_price_id: null,
        tier_id: 'free',
        status: 'free',
        current_period_end: null,
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', stripeSubscriptionId)
  }

  private mapProduct(row: Record<string, unknown>): MuseProduct {
    return {
      id: row.id as string,
      slug: row.slug as string,
      name: row.name as string,
      description: (row.description as string) || '',
      stripeProductId: row.stripe_product_id as string | null,
      metadataKey: row.metadata_key as string,
      tierDefinitions: (row.tier_definitions as ProductTierDefinition[]) || [],
      featureLimits: (row.feature_limits as Record<string, Record<string, number | boolean>>) || {},
      isActive: row.is_active as boolean,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    }
  }

  private mapSubscription(row: Record<string, unknown>): ProductSubscription {
    return {
      id: row.id as string,
      userId: row.user_id as string,
      productSlug: row.product_slug as string,
      stripeSubscriptionId: row.stripe_subscription_id as string | null,
      stripePriceId: row.stripe_price_id as string | null,
      tierId: row.tier_id as string,
      status: row.status as ProductSubscription['status'],
      currentPeriodEnd: row.current_period_end as string | null,
      cancelAtPeriodEnd: row.cancel_at_period_end as boolean,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    }
  }
}

export const productRegistry = new ProductRegistry()
