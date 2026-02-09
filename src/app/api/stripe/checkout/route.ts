import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripeService } from '@/lib/stripe/service';
import { getUncachableStripeClient } from '@/lib/stripe/client';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId, productSlug } = await request.json();

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID required' }, { status: 400 });
    }

    const customerId = await stripeService.getOrCreateCustomer(user.id, user.email!);
    const origin = request.headers.get('origin') || 'http://localhost:3000';

    const sessionOptions: any = {
      customer: customerId,
      payment_method_types: ['card'] as const,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription' as const,
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?canceled=true`,
    };

    if (productSlug) {
      sessionOptions.subscription_data = {
        metadata: {
          muse_product: productSlug,
          muse_user_id: user.id,
        },
      };
    }

    const stripe = await getUncachableStripeClient();
    const session = await stripe.checkout.sessions.create(sessionOptions);

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
