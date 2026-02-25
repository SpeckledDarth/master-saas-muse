import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: goal } = await supabase
      .from('affiliate_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!goal) return NextResponse.json({ goal: null });

    const { data: earnings } = await supabase
      .from('affiliate_commissions')
      .select('amount_cents')
      .eq('affiliate_user_id', user.id)
      .gte('created_at', goal.period_start)
      .lte('created_at', goal.period_end);

    const earned = (earnings || []).reduce((sum: number, e: any) => sum + (e.amount_cents || 0), 0);
    const progress = goal.target_cents > 0 ? Math.min(100, Math.round((earned / goal.target_cents) * 100)) : 0;
    const daysLeft = Math.max(0, Math.ceil((new Date(goal.period_end).getTime() - Date.now()) / 86400000));

    return NextResponse.json({
      goal: { ...goal, earned_cents: earned, progress, days_left: daysLeft }
    });
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
    const { target_amount, period } = body;

    if (!target_amount || target_amount <= 0) {
      return NextResponse.json({ error: 'Target amount required' }, { status: 400 });
    }

    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    let periodEnd: string;

    if (period === 'quarterly') {
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 3, 0).toISOString();
    } else if (period === 'yearly') {
      periodEnd = new Date(now.getFullYear(), 11, 31).toISOString();
    } else {
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
    }

    await supabase
      .from('affiliate_goals')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('is_active', true);

    const { data: goal, error } = await supabase
      .from('affiliate_goals')
      .insert({
        user_id: user.id,
        target_cents: Math.round(target_amount * 100),
        period: period || 'monthly',
        period_start: periodStart,
        period_end: periodEnd,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ goal });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
