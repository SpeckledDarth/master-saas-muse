import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('[Supabase] URL configured:', !!supabaseUrl);
console.log('[Supabase] Service key configured:', !!supabaseServiceKey);

if (!supabaseUrl) {
  console.warn('VITE_SUPABASE_URL not configured');
}

export const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

export async function getProfileSubscriptionData(userId: string): Promise<{
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
} | null> {
  if (!supabaseAdmin) {
    return null;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      stripeCustomerId: data.stripe_customer_id,
      stripeSubscriptionId: data.stripe_subscription_id,
    };
  } catch (err) {
    console.error('Error fetching profile subscription data:', err);
    return null;
  }
}
