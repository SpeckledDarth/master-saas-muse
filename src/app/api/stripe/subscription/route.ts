import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripeService } from '@/lib/stripe/service';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscriptionInfo = await stripeService.getSubscriptionInfo(user.id);

    return NextResponse.json(subscriptionInfo);
  } catch (error: any) {
    console.error('Subscription info error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
