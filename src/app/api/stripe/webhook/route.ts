import { NextRequest, NextResponse } from 'next/server';
import { getUncachableStripeClient } from '@/lib/stripe/client';
import { stripeService } from '@/lib/stripe/service';
import { queueSubscriptionEmail, sendSubscriptionCancelledEmail } from '@/lib/email';
import { dispatchWebhook } from '@/lib/webhooks/dispatcher';
import { productRegistry } from '@/lib/products/registry';
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

async function resolveProductFromSubscription(
  stripe: Stripe,
  subscription: Stripe.Subscription
): Promise<{ productSlug: string; tierId: string } | null> {
  const metaProductSlug = (subscription as any).metadata?.muse_product;
  
  const item = subscription.items.data[0];
  if (!item?.price) return null;
  
  let stripeProductId: string | null = null;
  const product = item.price.product;
  if (typeof product === 'string') {
    stripeProductId = product;
  } else if (typeof product === 'object' && product && !product.deleted) {
    stripeProductId = product.id;
  }
  
  if (!stripeProductId) return null;
  
  const museProduct = await productRegistry.getProductByStripeId(stripeProductId);
  if (!museProduct) {
    if (metaProductSlug) {
      const productBySlug = await productRegistry.getProduct(metaProductSlug);
      if (productBySlug) {
        const fullProduct = await stripe.products.retrieve(stripeProductId);
        const metadataValue = fullProduct.metadata?.[productBySlug.metadataKey];
        const tierDef = productBySlug.tierDefinitions.find(t => t.stripeMetadataValue === metadataValue);
        return { productSlug: metaProductSlug, tierId: tierDef?.id || productBySlug.tierDefinitions[0]?.id || 'free' };
      }
    }
    return null;
  }
  
  const fullProduct = await stripe.products.retrieve(stripeProductId);
  const metadataValue = fullProduct.metadata?.[museProduct.metadataKey];
  const tierDef = museProduct.tierDefinitions.find(t => t.stripeMetadataValue === metadataValue);
  const tierId = tierDef?.id || museProduct.tierDefinitions[0]?.id || 'free';
  
  return { productSlug: museProduct.slug, tierId };
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

          const productInfo = await resolveProductFromSubscription(stripe, subscription);
          if (productInfo) {
            const userId = (subscription as any).metadata?.muse_user_id || session.client_reference_id;
            if (userId) {
              await productRegistry.upsertSubscription({
                userId,
                productSlug: productInfo.productSlug,
                stripeSubscriptionId: subscription.id,
                stripePriceId: subscription.items.data[0]?.price?.id,
                tierId: productInfo.tierId,
                status: 'active',
                currentPeriodEnd: new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000).toISOString(),
                cancelAtPeriodEnd: false,
              });
              console.log(`Product subscription synced: ${productInfo.productSlug} tier=${productInfo.tierId}`);
            }
          }

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

        const productInfo = await resolveProductFromSubscription(stripe, subscription);
        if (productInfo) {
          const userId = (subscription as any).metadata?.muse_user_id;
          if (userId) {
            await productRegistry.upsertSubscription({
              userId,
              productSlug: productInfo.productSlug,
              stripeSubscriptionId: subscription.id,
              stripePriceId: subscription.items.data[0]?.price?.id,
              tierId: productInfo.tierId,
              status: stripeService.mapStripeStatus(subscription.status),
              currentPeriodEnd: new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000).toISOString(),
              cancelAtPeriodEnd: (subscription as any).cancel_at_period_end || false,
            });
          }
        }

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

        await productRegistry.clearSubscriptionByStripeId(subscription.id);
        console.log(`Product subscription cleared for stripe sub: ${subscription.id}`);

        dispatchWebhook('subscription.cancelled', {
          subscriptionId: subscription.id,
          customerId,
        });
        break;
      }
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Invoice paid:', invoice.id);

        try {
          const { createAdminClient: createAdmin } = await import('@/lib/supabase/admin');
          const { getAffiliateLink, getAffiliateTiers, getCommissionRate, createNotification } = await import('@/lib/affiliate');
          const adminDb = createAdmin();

          const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
          if (!customerId) break;

          const { data: sub } = await adminDb
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_customer_id', customerId)
            .maybeSingle();

          if (!sub?.user_id) break;

          const { data: referral } = await adminDb
            .from('affiliate_referrals')
            .select('*')
            .eq('referred_user_id', sub.user_id)
            .eq('status', 'converted')
            .maybeSingle() as any;

          let referralRecord = referral;

          if (!referralRecord) {
            const { data: signedUpRef } = await adminDb
              .from('affiliate_referrals')
              .select('*')
              .eq('referred_user_id', sub.user_id)
              .eq('status', 'signed_up')
              .maybeSingle() as any;

            if (!signedUpRef) break;

            await adminDb
              .from('affiliate_referrals')
              .update({ status: 'converted', converted_at: new Date().toISOString() })
              .eq('id', signedUpRef.id);

            referralRecord = { ...signedUpRef, status: 'converted' };
          }

          if (!referralRecord) break;

          const { data: existingCommission } = await adminDb
            .from('affiliate_commissions')
            .select('id')
            .eq('stripe_invoice_id', invoice.id)
            .maybeSingle();

          if (existingCommission) break;

          const affiliateLink = await getAffiliateLink(referralRecord.affiliate_user_id);
          if (!affiliateLink) break;

          if (affiliateLink.locked_at) {
            const lockedDate = new Date(affiliateLink.locked_at);
            const durationMs = (affiliateLink.locked_duration_months || 12) * 30 * 86400000;
            if (Date.now() > lockedDate.getTime() + durationMs) {
              console.log(`Commission window expired for affiliate ${referralRecord.affiliate_user_id}`);
              break;
            }
          }

          const tiers = await getAffiliateTiers();
          const rate = getCommissionRate(affiliateLink, tiers);
          const invoiceAmountCents = invoice.amount_paid || 0;
          const commissionCents = Math.round(invoiceAmountCents * (rate / 100));

          if (commissionCents <= 0) break;

          await adminDb
            .from('affiliate_commissions')
            .insert({
              affiliate_user_id: referralRecord.affiliate_user_id,
              referral_id: referralRecord.id,
              stripe_invoice_id: invoice.id,
              invoice_amount_cents: invoiceAmountCents,
              commission_rate: rate,
              commission_amount_cents: commissionCents,
              status: 'pending',
            });

          await adminDb
            .from('referral_links')
            .update({
              total_earnings_cents: (affiliateLink.total_earnings_cents || 0) + commissionCents,
              pending_earnings_cents: (affiliateLink.pending_earnings_cents || 0) + commissionCents,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', referralRecord.affiliate_user_id);

          await createNotification(
            referralRecord.affiliate_user_id,
            'Commission Earned!',
            `You earned $${(commissionCents / 100).toFixed(2)} from a referral payment.`,
            'success',
            '/dashboard/social/affiliate'
          );

          console.log(`Affiliate commission created: $${(commissionCents / 100).toFixed(2)} for user ${referralRecord.affiliate_user_id}`);
        } catch (affErr) {
          console.error('Affiliate commission processing error:', affErr);
        }
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
