import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();
    const period = req.nextUrl.searchParams.get('period') || '90d';
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '1y' ? 365 : 90;
    const since = new Date(Date.now() - days * 86400000).toISOString();

    const { data: allReferrals } = await admin
      .from('affiliate_referrals')
      .select('id, status, created_at, converted_at, churned_at, churn_reason, last_active_at, referred_user_id')
      .eq('affiliate_user_id', user.id);

    const referrals = allReferrals || [];

    const active = referrals.filter(r => r.status === 'converted' || r.status === 'paid');
    const churned = referrals.filter(r => r.status === 'churned');
    const churnedInPeriod = churned.filter(r => r.churned_at && r.churned_at >= since);
    const totalConverted = active.length + churned.length;
    const churnRate = totalConverted > 0 ? Math.round((churnedInPeriod.length / totalConverted) * 1000) / 10 : 0;

    const churnReasons: Record<string, number> = {};
    churned.forEach(r => {
      const reason = r.churn_reason || 'unknown';
      churnReasons[reason] = (churnReasons[reason] || 0) + 1;
    });

    const churnTiming: Record<string, number> = {};
    churned.forEach(r => {
      if (r.converted_at && r.churned_at) {
        const monthsActive = Math.max(1, Math.round((new Date(r.churned_at).getTime() - new Date(r.converted_at).getTime()) / (30 * 86400000)));
        const bucket = `month_${monthsActive}`;
        churnTiming[bucket] = (churnTiming[bucket] || 0) + 1;
      }
    });

    const now = new Date();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000);
    const atRisk = active
      .filter(r => {
        if (!r.last_active_at) return true;
        return new Date(r.last_active_at) < fourteenDaysAgo;
      })
      .map(r => ({
        referral_id: r.id,
        referred_user_id: r.referred_user_id,
        last_active: r.last_active_at,
        days_inactive: r.last_active_at
          ? Math.floor((now.getTime() - new Date(r.last_active_at).getTime()) / 86400000)
          : 999,
        status: r.status,
      }))
      .sort((a, b) => b.days_inactive - a.days_inactive)
      .slice(0, 10);

    const prevSince = new Date(Date.now() - days * 2 * 86400000).toISOString();
    const newInPeriod = referrals.filter(r => r.created_at >= since && (r.status === 'converted' || r.status === 'paid' || r.status === 'signed_up')).length;
    const churnedInPeriodCount = churnedInPeriod.length;
    const netGrowth = newInPeriod - churnedInPeriodCount;

    const prevNew = referrals.filter(r => r.created_at >= prevSince && r.created_at < since && (r.status === 'converted' || r.status === 'paid' || r.status === 'signed_up')).length;
    const prevChurned = churned.filter(r => r.churned_at && r.churned_at >= prevSince && r.churned_at < since).length;
    const prevNetGrowth = prevNew - prevChurned;

    return NextResponse.json({
      churnRate: {
        rate: churnRate,
        churnedCount: churnedInPeriodCount,
        totalActive: active.length,
        totalChurned: churned.length,
      },
      churnReasons: Object.entries(churnReasons)
        .map(([reason, count]) => ({ reason, count, percentage: Math.round((count / Math.max(churned.length, 1)) * 100) }))
        .sort((a, b) => b.count - a.count),
      churnTiming: Object.entries(churnTiming)
        .map(([bucket, count]) => ({ month: parseInt(bucket.split('_')[1]), count }))
        .sort((a, b) => a.month - b.month),
      atRisk,
      netGrowth: {
        new: newInPeriod,
        churned: churnedInPeriodCount,
        net: netGrowth,
        previousNet: prevNetGrowth,
        trend: netGrowth > prevNetGrowth ? 'up' : netGrowth < prevNetGrowth ? 'down' : 'flat',
      },
    });
  } catch (err: any) {
    console.error('Churn analytics error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
