import { NextRequest, NextResponse } from 'next/server';
import { getUncachableStripeClient } from '@/lib/stripe/client';
import { stripeService } from '@/lib/stripe/service';
import { queueSubscriptionEmail, sendSubscriptionCancelledEmail } from '@/lib/email';
import { dispatchWebhook } from '@/lib/webhooks/dispatcher';
import Stripe from 'stripe';

export const runtime = 'nodejs';

async function getCustomerEmail(stripe: Stripe, customerId: string): Promise<{ email: string; name: string } | null> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return null;
    return {
      email: customer.email || '',
      name: customer.name || customer.email?.split('@')[0] || 'there',
    };
  } catch {
    return null;
  }
}

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

          if (session.customer && session.mode === 'subscription') {
            const customerData = await getCustomerEmail(stripe, session.customer as string);
            if (customerData?.email) {
              const product = subscription.items.data[0]?.price.product;
              
              let planName = 'Pro';
              let amount = 2900;
              
              if (typeof product === 'string') {
                const productData = await stripe.products.retrieve(product);
                planName = productData.name;
              }
              
              if (subscription.items.data[0]?.price.unit_amount) {
                amount = subscription.items.data[0].price.unit_amount;
              }

              await queueSubscriptionEmail(
                customerData.email,
                customerData.name,
                planName,
                amount
              );
              console.log('Subscription confirmation email queued for:', customerData.email);
            }
          }

          dispatchWebhook('subscription.created', {
            subscriptionId: subscription.id,
            customerId: session.customer,
            status: subscription.status,
          });
        }
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription updated:', subscription.id);
        await stripeService.syncSubscriptionToDatabase(subscription);

        if ((subscription as any).cancel_at_period_end && subscription.customer) {
          const customerData = await getCustomerEmail(stripe, subscription.customer as string);
          if (customerData?.email) {
            const product = subscription.items.data[0]?.price.product;
            let planName = 'Pro';
            
            if (typeof product === 'string') {
              const productData = await stripe.products.retrieve(product);
              planName = productData.name;
            }

            const endDate = new Date((subscription as any).current_period_end * 1000);
            
            await sendSubscriptionCancelledEmail(
              customerData.email,
              customerData.name,
              planName,
              endDate
            );
            console.log('Subscription cancellation email sent to:', customerData.email);
          }
        }

        dispatchWebhook('subscription.updated', {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          status: subscription.status,
          cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
        });
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription deleted:', subscription.id);
        const customerId = typeof subscription.customer === 'string' 
          ? subscription.customer 
          : subscription.customer.id;
        await stripeService.clearSubscriptionFromDatabase(customerId);

        dispatchWebhook('subscription.cancelled', {
          subscriptionId: subscription.id,
          customerId,
        });
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
