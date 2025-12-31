import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripeService } from '@/lib/stripe/service';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId } = await request.json();

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID required' }, { status: 400 });
    }

    const customerId = await stripeService.getOrCreateCustomer(user.id, user.email!);

    const origin = request.headers.get('origin') || 'http://localhost:3000';
    
    const session = await stripeService.createCheckoutSession(
      customerId,
      priceId,
      `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      `${origin}/pricing?canceled=true`
    );

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
