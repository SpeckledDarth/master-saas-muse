import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();

    const { data: referrals } = await admin
      .from('affiliate_referrals')
      .select('id, status, created_at, converted_at, churned_at')
      .eq('affiliate_user_id', user.id)
      .in('status', ['converted', 'paid', 'churned']);

    const allRefs = referrals || [];
    const now = new Date();

    const retentionCurve: { month: number; retained: number; total: number; percentage: number }[] = [];
    for (let m = 1; m <= 12; m++) {
      const eligible = allRefs.filter(r => {
        if (!r.converted_at) return false;
        const monthsSince = (now.getTime() - new Date(r.converted_at).getTime()) / (30 * 86400000);
        return monthsSince >= m;
      });
      const retained = eligible.filter(r => {
        if (r.status !== 'churned') return true;
        if (!r.churned_at || !r.converted_at) return true;
        const monthsActive = (new Date(r.churned_at).getTime() - new Date(r.converted_at).getTime()) / (30 * 86400000);
        return monthsActive >= m;
      });
      retentionCurve.push({
        month: m,
        retained: retained.length,
        total: eligible.length,
        percentage: eligible.length > 0 ? Math.round((retained.length / eligible.length) * 100) : 100,
      });
    }

    const { data: clicks } = await admin
      .from('referral_clicks')
      .select('created_at')
      .eq('referral_link_user_id', user.id);

    const { data: allRefsFull } = await admin
      .from('affiliate_referrals')
      .select('created_at, status')
      .eq('affiliate_user_id', user.id);

    const monthlyConversion: { month: string; clicks: number; conversions: number; rate: number }[] = [];
    const clicksByMonth: Record<string, number> = {};
    const convByMonth: Record<string, number> = {};

    (clicks || []).forEach((c: any) => {
      const m = c.created_at?.substring(0, 7);
      if (m) clicksByMonth[m] = (clicksByMonth[m] || 0) + 1;
    });
    (allRefsFull || []).filter((r: any) => r.status === 'converted' || r.status === 'paid').forEach((r: any) => {
      const m = r.created_at?.substring(0, 7);
      if (m) convByMonth[m] = (convByMonth[m] || 0) + 1;
    });

    const allMonths = [...new Set([...Object.keys(clicksByMonth), ...Object.keys(convByMonth)])].sort().slice(-12);
    allMonths.forEach(m => {
      const c = clicksByMonth[m] || 0;
      const conv = convByMonth[m] || 0;
      monthlyConversion.push({ month: m, clicks: c, conversions: conv, rate: c > 0 ? Math.round((conv / c) * 1000) / 10 : 0 });
    });

    const { data: allAffRefs } = await admin
      .from('affiliate_referrals')
      .select('affiliate_user_id, status')
      .in('status', ['converted', 'paid', 'signed_up']);

    const { data: allAffClicks } = await admin
      .from('referral_clicks')
      .select('referral_link_user_id')
      .not('referral_link_user_id', 'is', null);

    const userClicks = (clicks || []).length;
    const userConversions = (allRefsFull || []).filter((r: any) => r.status === 'converted' || r.status === 'paid').length;
    const userTrialConv = userClicks > 0 ? Math.round((userConversions / userClicks) * 1000) / 10 : 0;

    const affClickCounts: Record<string, number> = {};
    const affConvCounts: Record<string, number> = {};
    (allAffClicks || []).forEach((c: any) => { if (c.referral_link_user_id) affClickCounts[c.referral_link_user_id] = (affClickCounts[c.referral_link_user_id] || 0) + 1; });
    (allAffRefs || []).forEach((r: any) => { if (r.status === 'converted' || r.status === 'paid') affConvCounts[r.affiliate_user_id] = (affConvCounts[r.affiliate_user_id] || 0) + 1; });

    const allAffIds = [...new Set([...Object.keys(affClickCounts), ...Object.keys(affConvCounts)])];
    const convRates = allAffIds.map(id => {
      const cl = affClickCounts[id] || 0;
      const co = affConvCounts[id] || 0;
      return cl > 0 ? (co / cl) * 100 : 0;
    }).filter(r => r > 0);
    const avgConvRate = convRates.length > 0 ? Math.round(convRates.reduce((s, r) => s + r, 0) / convRates.length * 10) / 10 : 0;

    return NextResponse.json({
      retentionCurve,
      conversionTrend: monthlyConversion,
      benchmark: {
        yourRate: userTrialConv,
        averageRate: avgConvRate,
        totalAffiliates: allAffIds.length,
        percentile: convRates.length > 0
          ? Math.round((convRates.filter(r => r <= userTrialConv).length / convRates.length) * 100)
          : 50,
      },
    });
  } catch (err: any) {
    console.error('Cohort analytics error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
