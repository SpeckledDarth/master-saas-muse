import { getUncachableStripeClient } from './client';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

export interface SubscriptionInfo {
  status: 'free' | 'active' | 'canceled' | 'past_due' | 'trialing';
  tier: 'free' | 'pro' | 'team';
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  subscriptionId: string | null;
  priceId: string | null;
}

export class StripeService {
  async createCustomer(email: string, userId: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.customers.create({
      email,
      metadata: { userId },
    });
  }

  async createCheckoutSession(
    customerId: string, 
    priceId: string, 
    successUrl: string, 
    cancelUrl: string,
    mode: 'subscription' | 'payment' = 'subscription'
  ) {
    const stripe = await getUncachableStripeClient();
    return await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode,
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
  }

  async createCustomerPortalSession(customerId: string, returnUrl: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  async getOrCreateCustomer(userId: string, email: string): Promise<string> {
    const supabase = await createClient();
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();
    
    if (profile?.stripe_customer_id) {
      return profile.stripe_customer_id;
    }
    
    const customer = await this.createCustomer(email, userId);
    
    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customer.id })
      .eq('id', userId);
    
    return customer.id;
  }

  async getSubscriptionInfo(userId: string): Promise<SubscriptionInfo> {
    const supabase = await createClient();
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('id', userId)
      .single();
    
    if (!profile?.stripe_customer_id) {
      return {
        status: 'free',
        tier: 'free',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        subscriptionId: null,
        priceId: null,
      };
    }

    const stripe = await getUncachableStripeClient();
    
    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: profile.stripe_customer_id,
        status: 'all',
        limit: 1,
      });

      if (subscriptions.data.length === 0) {
        return {
          status: 'free',
          tier: 'free',
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          subscriptionId: null,
          priceId: null,
        };
      }

      const subscription = subscriptions.data[0];
      const priceId = subscription.items.data[0]?.price?.id || null;
      const tier = this.getTierFromPriceId(priceId, subscription.items.data[0]?.price);

      return {
        status: this.mapStripeStatus(subscription.status),
        tier,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        subscriptionId: subscription.id,
        priceId,
      };
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return {
        status: 'free',
        tier: 'free',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        subscriptionId: null,
        priceId: null,
      };
    }
  }

  private mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionInfo['status'] {
    switch (status) {
      case 'active':
        return 'active';
      case 'canceled':
        return 'canceled';
      case 'past_due':
        return 'past_due';
      case 'trialing':
        return 'trialing';
      default:
        return 'free';
    }
  }

  private getTierFromPriceId(priceId: string | null, price?: Stripe.Price): SubscriptionInfo['tier'] {
    if (!priceId || !price) return 'free';
    
    const amount = price.unit_amount || 0;
    if (amount >= 9900) return 'team';
    if (amount >= 2900) return 'pro';
    return 'free';
  }

  async syncSubscriptionToDatabase(subscription: Stripe.Subscription): Promise<void> {
    const supabase = await createClient();
    const customerId = typeof subscription.customer === 'string' 
      ? subscription.customer 
      : subscription.customer.id;

    await supabase
      .from('profiles')
      .update({ 
        stripe_subscription_id: subscription.id,
      })
      .eq('stripe_customer_id', customerId);
  }

  async clearSubscriptionFromDatabase(customerId: string): Promise<void> {
    const supabase = await createClient();
    
    await supabase
      .from('profiles')
      .update({ stripe_subscription_id: null })
      .eq('stripe_customer_id', customerId);
  }
}

export const stripeService = new StripeService();
