import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: disputes } = await supabase
      .from('commission_disputes')
      .select('*')
      .eq('affiliate_user_id', user.id)
      .order('created_at', { ascending: false });

    return NextResponse.json({ disputes: disputes || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { referral_id, commission_id, reason, details } = body;

    if (!reason) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: dispute, error } = await admin
      .from('commission_disputes')
      .insert({
        affiliate_user_id: user.id,
        referral_id: referral_id || null,
        commission_id: commission_id || null,
        reason,
        details: details || '',
        status: 'open'
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ dispute });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
