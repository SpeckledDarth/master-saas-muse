import { NextRequest, NextResponse } from 'next/server';
import { getUncachableStripeClient } from '@/lib/stripe/client';
import { stripeService } from '@/lib/stripe/service';
import Stripe from 'stripe';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  try {
    const stripe = await getUncachableStripeClient();
    const rawBody = await request.text();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout completed:', session.id);
        
        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          await stripeService.syncSubscriptionToDatabase(subscription);
          console.log('Subscription synced to database:', subscription.id);
        }
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription updated:', subscription.id);
        await stripeService.syncSubscriptionToDatabase(subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription deleted:', subscription.id);
        const customerId = typeof subscription.customer === 'string' 
          ? subscription.customer 
          : subscription.customer.id;
        await stripeService.clearSubscriptionFromDatabase(customerId);
        break;
      }
      default:
        console.log('Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error('Webhook error:', error.message);
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 400 });
  }
}
