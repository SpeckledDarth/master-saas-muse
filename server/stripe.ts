import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey)
  : null;

export interface StripeSubscriptionInfo {
  status: 'free' | 'active' | 'canceled' | 'past_due' | 'trialing';
  tier: 'free' | 'pro' | 'team';
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export async function getStripeSubscription(subscriptionId: string): Promise<StripeSubscriptionInfo> {
  const defaultFree: StripeSubscriptionInfo = {
    status: 'free',
    tier: 'free',
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  };

  if (!stripe || !subscriptionId) {
    return defaultFree;
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price.product'],
    });

    const stripeStatus = subscription.status;
    let status: StripeSubscriptionInfo['status'] = 'free';
    
    if (stripeStatus === 'active') {
      status = 'active';
    } else if (stripeStatus === 'trialing') {
      status = 'trialing';
    } else if (stripeStatus === 'canceled') {
      status = 'canceled';
    } else if (stripeStatus === 'past_due') {
      status = 'past_due';
    }

    let tier: StripeSubscriptionInfo['tier'] = 'pro';
    const priceItem = subscription.items.data[0];
    if (priceItem?.price?.product) {
      const product = priceItem.price.product as Stripe.Product;
      const productName = product.name?.toLowerCase() || '';
      if (productName.includes('team')) {
        tier = 'team';
      } else if (productName.includes('pro')) {
        tier = 'pro';
      }
    }

    // Access subscription data - use item-level period for newer API versions
    const periodEnd = subscription.items?.data[0]?.current_period_end 
      ?? (subscription as unknown as { current_period_end?: number }).current_period_end;
    const cancelAtEnd = subscription.cancel_at_period_end ?? false;
    
    return {
      status,
      tier,
      currentPeriodEnd: periodEnd
        ? new Date(periodEnd * 1000).toISOString()
        : null,
      cancelAtPeriodEnd: cancelAtEnd,
    };
  } catch (error) {
    console.error('Error fetching Stripe subscription:', error);
    return defaultFree;
  }
}
