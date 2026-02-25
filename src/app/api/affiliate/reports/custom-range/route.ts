import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();
    const startDate = req.nextUrl.searchParams.get('start') || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const endDate = req.nextUrl.searchParams.get('end') || new Date().toISOString().split('T')[0];
    const compareStart = req.nextUrl.searchParams.get('compareStart');
    const compareEnd = req.nextUrl.searchParams.get('compareEnd');

    async function getPeriodData(start: string, end: string) {
      const startISO = new Date(start).toISOString();
      const endISO = new Date(end + 'T23:59:59').toISOString();

      const [clicksRes, referralsRes, commissionsRes] = await Promise.all([
        admin.from('referral_clicks').select('source_tag, created_at, country, device_type').eq('referral_link_user_id', user!.id).gte('created_at', startISO).lte('created_at', endISO),
        admin.from('affiliate_referrals').select('status, source_tag, created_at').eq('affiliate_user_id', user!.id).gte('created_at', startISO).lte('created_at', endISO),
        admin.from('affiliate_commissions').select('commission_amount_cents, status, created_at').eq('affiliate_user_id', user!.id).gte('created_at', startISO).lte('created_at', endISO),
      ]);

      const clicks = clicksRes.data || [];
      const referrals = referralsRes.data || [];
      const commissions = commissionsRes.data || [];

      const totalClicks = clicks.length;
      const totalSignups = referrals.filter(r => ['signed_up', 'converted', 'paid'].includes(r.status)).length;
      const totalConversions = referrals.filter(r => r.status === 'converted' || r.status === 'paid').length;
      const totalEarnings = commissions.reduce((s, c) => s + ((c as any).commission_amount_cents || 0), 0);
      const convRate = totalClicks > 0 ? Math.round((totalConversions / totalClicks) * 1000) / 10 : 0;

      const topSources: Record<string, { clicks: number; conversions: number }> = {};
      clicks.forEach(c => {
        const s = (c as any).source_tag || 'direct';
        if (!topSources[s]) topSources[s] = { clicks: 0, conversions: 0 };
        topSources[s].clicks++;
      });
      referrals.filter(r => r.status === 'converted' || r.status === 'paid').forEach(r => {
        const s = r.source_tag || 'direct';
        if (!topSources[s]) topSources[s] = { clicks: 0, conversions: 0 };
        topSources[s].conversions++;
      });

      const dailyClicks: Record<string, number> = {};
      clicks.forEach(c => {
        const d = (c as any).created_at?.substring(0, 10);
        if (d) dailyClicks[d] = (dailyClicks[d] || 0) + 1;
      });

      return {
        period: { start, end },
        summary: { totalClicks, totalSignups, totalConversions, totalEarnings, convRate },
        topSources: Object.entries(topSources)
          .map(([source, data]) => ({ source, ...data }))
          .sort((a, b) => b.clicks - a.clicks)
          .slice(0, 10),
        dailyClicks: Object.entries(dailyClicks)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date)),
        commissionBreakdown: {
          paid: commissions.filter(c => (c as any).status === 'paid').reduce((s, c) => s + ((c as any).commission_amount_cents || 0), 0),
          approved: commissions.filter(c => (c as any).status === 'approved').reduce((s, c) => s + ((c as any).commission_amount_cents || 0), 0),
          pending: commissions.filter(c => (c as any).status === 'pending').reduce((s, c) => s + ((c as any).commission_amount_cents || 0), 0),
        },
      };
    }

    const primaryData = await getPeriodData(startDate, endDate);

    let comparisonData = null;
    let delta = null;
    if (compareStart && compareEnd) {
      comparisonData = await getPeriodData(compareStart, compareEnd);
      delta = {
        clicks: primaryData.summary.totalClicks - comparisonData.summary.totalClicks,
        clicksPct: comparisonData.summary.totalClicks > 0 ? Math.round(((primaryData.summary.totalClicks - comparisonData.summary.totalClicks) / comparisonData.summary.totalClicks) * 100) : 0,
        conversions: primaryData.summary.totalConversions - comparisonData.summary.totalConversions,
        conversionsPct: comparisonData.summary.totalConversions > 0 ? Math.round(((primaryData.summary.totalConversions - comparisonData.summary.totalConversions) / comparisonData.summary.totalConversions) * 100) : 0,
        earnings: primaryData.summary.totalEarnings - comparisonData.summary.totalEarnings,
        earningsPct: comparisonData.summary.totalEarnings > 0 ? Math.round(((primaryData.summary.totalEarnings - comparisonData.summary.totalEarnings) / comparisonData.summary.totalEarnings) * 100) : 0,
        convRate: Math.round((primaryData.summary.convRate - comparisonData.summary.convRate) * 10) / 10,
      };
    }

    return NextResponse.json({ primary: primaryData, comparison: comparisonData, delta });
  } catch (err: any) {
    console.error('Custom range report error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
