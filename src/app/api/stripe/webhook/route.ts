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

async function syncInvoiceToLocal(invoice: Stripe.Invoice & Record<string, any>, status: string) {
  const { createAdminClient: createAdmin } = await import('@/lib/supabase/admin');
  const adminDb = createAdmin();

  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;

  // Resolve user_id from subscriptions table
  const { data: sub } = await adminDb
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();

  const userId = sub?.user_id;
  if (!userId) {
    console.log('syncInvoiceToLocal: No user_id found for customer', customerId);
    return;
  }

  // Upsert the invoice record
  const invoiceRecord = {
    user_id: userId,
    stripe_invoice_id: invoice.id,
    stripe_customer_id: customerId,
    invoice_number: invoice.number || null,
    status,
    currency: invoice.currency || 'usd',
    subtotal_cents: invoice.subtotal || 0,
    tax_cents: invoice.tax || 0,
    total_cents: invoice.total || 0,
    amount_paid_cents: invoice.amount_paid || 0,
    amount_due_cents: invoice.amount_due || 0,
    description: invoice.description || null,
    period_start: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
    period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
    due_date: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
    paid_at: status === 'paid' ? new Date().toISOString() : null,
    hosted_invoice_url: invoice.hosted_invoice_url || null,
    invoice_pdf_url: invoice.invoice_pdf || null,
    updated_at: new Date().toISOString(),
  };

  const { data: upsertedInvoice, error: invError } = await adminDb
    .from('invoices')
    .upsert(invoiceRecord, { onConflict: 'stripe_invoice_id' })
    .select('id')
    .single();

  if (invError) {
    if (invError.message?.includes('Could not find') || invError.code === '42P01') {
      console.log('syncInvoiceToLocal: invoices table not found, skipping');
      return;
    }
    throw invError;
  }

  const localInvoiceId = upsertedInvoice.id;

  // Insert invoice line items
  if (invoice.lines?.data?.length) {
    const lineItems = invoice.lines.data.map((line: any) => ({
      invoice_id: localInvoiceId,
      stripe_line_item_id: line.id || null,
      description: line.description || 'Line item',
      quantity: line.quantity || 1,
      unit_amount_cents: line.price?.unit_amount || 0,
      amount_cents: line.amount || 0,
      currency: line.currency || 'usd',
      price_id: typeof line.price === 'object' ? line.price?.id : line.price || null,
      product_id: typeof line.price?.product === 'string' ? line.price.product : null,
      period_start: line.period?.start ? new Date(line.period.start * 1000).toISOString() : null,
      period_end: line.period?.end ? new Date(line.period.end * 1000).toISOString() : null,
    }));

    // Delete existing items for this invoice (idempotent re-sync)
    await adminDb
      .from('invoice_items')
      .delete()
      .eq('invoice_id', localInvoiceId);

    const { error: itemsError } = await adminDb
      .from('invoice_items')
      .insert(lineItems);

    if (itemsError && !itemsError.message?.includes('Could not find') && itemsError.code !== '42P01') {
      console.error('syncInvoiceToLocal: Error inserting invoice items:', itemsError);
    }
  }

  // Create payment record (only for paid invoices)
  if (status === 'paid' && invoice.amount_paid > 0) {
    const paymentIntentId = typeof invoice.payment_intent === 'string'
      ? invoice.payment_intent
      : (invoice.payment_intent as any)?.id || null;

    const chargeId = typeof invoice.charge === 'string'
      ? invoice.charge
      : (invoice.charge as any)?.id || null;

    const paymentRecord = {
      user_id: userId,
      invoice_id: localInvoiceId,
      stripe_payment_intent_id: paymentIntentId,
      stripe_charge_id: chargeId,
      amount_cents: invoice.amount_paid || 0,
      currency: invoice.currency || 'usd',
      status: 'succeeded',
    };

    if (paymentIntentId) {
      const { error: payError } = await adminDb
        .from('payments')
        .upsert(paymentRecord, { onConflict: 'stripe_payment_intent_id' });

      if (payError && !payError.message?.includes('Could not find') && payError.code !== '42P01') {
        console.error('syncInvoiceToLocal: Error upserting payment:', payError);
      }
    } else {
      const { error: payError } = await adminDb
        .from('payments')
        .insert(paymentRecord);

      if (payError && !payError.message?.includes('Could not find') && payError.code !== '42P01') {
        console.error('syncInvoiceToLocal: Error inserting payment:', payError);
      }
    }
  }

  console.log(`syncInvoiceToLocal: Synced invoice ${invoice.id} as ${status} for user ${userId}`);
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

          const { data: newCommission } = await adminDb
            .from('affiliate_commissions')
            .select('id')
            .eq('stripe_invoice_id', invoice.id)
            .eq('affiliate_user_id', referralRecord.affiliate_user_id)
            .maybeSingle();

          await createNotification(
            referralRecord.affiliate_user_id,
            'Commission Earned!',
            `You earned $${(commissionCents / 100).toFixed(2)} from a referral payment.`,
            'success',
            '/dashboard/social/affiliate'
          );

          console.log(`Affiliate commission created: $${(commissionCents / 100).toFixed(2)} for user ${referralRecord.affiliate_user_id}`);

          try {
            const { data: programSettings } = await adminDb
              .from('affiliate_program_settings')
              .select('two_tier_enabled, second_tier_commission_rate')
              .limit(1)
              .maybeSingle();

            if (programSettings?.two_tier_enabled) {
              const { data: tier2Link } = await adminDb
                .from('referral_links')
                .select('recruited_by_affiliate_id')
                .eq('user_id', referralRecord.affiliate_user_id)
                .maybeSingle();

              if (tier2Link?.recruited_by_affiliate_id) {
                const tier2Rate = programSettings.second_tier_commission_rate || 5;
                const tier2Cents = Math.round(invoiceAmountCents * (tier2Rate / 100));

                if (tier2Cents > 0) {
                  await adminDb
                    .from('affiliate_second_tier_commissions')
                    .insert({
                      tier1_affiliate_id: tier2Link.recruited_by_affiliate_id,
                      tier2_affiliate_id: referralRecord.affiliate_user_id,
                      original_commission_id: newCommission?.id || null,
                      commission_rate: tier2Rate,
                      commission_amount_cents: tier2Cents,
                    });

                  const { data: recruiterLink } = await adminDb
                    .from('referral_links')
                    .select('total_earnings_cents, pending_earnings_cents')
                    .eq('user_id', tier2Link.recruited_by_affiliate_id)
                    .maybeSingle();

                  if (recruiterLink) {
                    await adminDb
                      .from('referral_links')
                      .update({
                        total_earnings_cents: (recruiterLink.total_earnings_cents || 0) + tier2Cents,
                        pending_earnings_cents: (recruiterLink.pending_earnings_cents || 0) + tier2Cents,
                        updated_at: new Date().toISOString(),
                      })
                      .eq('user_id', tier2Link.recruited_by_affiliate_id);
                  }

                  await createNotification(
                    tier2Link.recruited_by_affiliate_id,
                    'Second-Tier Commission!',
                    `You earned $${(tier2Cents / 100).toFixed(2)} from a recruit's referral.`,
                    'success',
                    '/affiliate/dashboard?section=earnings'
                  );

                  console.log(`Second-tier commission: $${(tier2Cents / 100).toFixed(2)} for recruiter ${tier2Link.recruited_by_affiliate_id}`);
                }
              }
            }
          } catch (tier2Err) {
            console.error('Second-tier commission error (non-critical):', tier2Err);
          }
        } catch (affErr) {
          console.error('Affiliate commission processing error:', affErr);
        }

        // Sync invoice/payment to local tables (Phase 5 CRM)
        try {
          await syncInvoiceToLocal(invoice, 'paid');
        } catch (syncErr) {
          console.error('Invoice sync error (non-critical):', syncErr);
        }
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Invoice payment failed:', invoice.id);

        try {
          await syncInvoiceToLocal(invoice, 'failed');
        } catch (syncErr) {
          console.error('Invoice sync error (non-critical):', syncErr);
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
