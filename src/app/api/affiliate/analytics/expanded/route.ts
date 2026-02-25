import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const period = req.nextUrl.searchParams.get('period') || '30d';
    const days = period === '7d' ? 7 : period === '90d' ? 90 : period === '1y' ? 365 : 30;
    const since = new Date(Date.now() - days * 86400000).toISOString();

    const [clicksRes, referralsRes, commissionsRes, allCommissionsRes] = await Promise.all([
      supabase.from('referral_clicks').select('created_at, source_tag, landing_page').eq('referral_link_user_id', user.id).gte('created_at', since),
      supabase.from('affiliate_referrals').select('created_at, status, source').eq('affiliate_user_id', user.id).gte('created_at', since),
      supabase.from('affiliate_commissions').select('amount_cents, created_at, status').eq('affiliate_user_id', user.id).gte('created_at', since),
      supabase.from('affiliate_commissions').select('amount_cents, created_at').eq('affiliate_user_id', user.id)
    ]);

    const clicks = clicksRes.data || [];
    const referrals = referralsRes.data || [];
    const commissions = commissionsRes.data || [];
    const allCommissions = allCommissionsRes.data || [];

    const clicksByDayHour: Record<string, number> = {};
    clicks.forEach((c: any) => {
      const d = new Date(c.created_at);
      const key = `${d.getDay()}-${d.getHours()}`;
      clicksByDayHour[key] = (clicksByDayHour[key] || 0) + 1;
    });

    const clicksByChannel: Record<string, { clicks: number; signups: number; conversions: number }> = {};
    clicks.forEach((c: any) => {
      const ch = c.source_tag || c.landing_page || 'direct';
      if (!clicksByChannel[ch]) clicksByChannel[ch] = { clicks: 0, signups: 0, conversions: 0 };
      clicksByChannel[ch].clicks++;
    });
    referrals.forEach((r: any) => {
      const ch = r.source || 'direct';
      if (!clicksByChannel[ch]) clicksByChannel[ch] = { clicks: 0, signups: 0, conversions: 0 };
      clicksByChannel[ch].signups++;
      if (r.status === 'converted' || r.status === 'paid') clicksByChannel[ch].conversions++;
    });

    const prevSince = new Date(Date.now() - days * 2 * 86400000).toISOString();
    const { data: prevClicks } = await supabase.from('referral_clicks').select('id').eq('referral_link_user_id', user.id).gte('created_at', prevSince).lt('created_at', since);
    const { data: prevReferrals } = await supabase.from('affiliate_referrals').select('id').eq('affiliate_user_id', user.id).gte('created_at', prevSince).lt('created_at', since);
    const { data: prevCommissions } = await supabase.from('affiliate_commissions').select('amount_cents').eq('affiliate_user_id', user.id).gte('created_at', prevSince).lt('created_at', since);

    const currentEarnings = commissions.reduce((s: number, c: any) => s + (c.amount_cents || 0), 0);
    const prevEarnings = (prevCommissions || []).reduce((s: number, c: any) => s + (c.amount_cents || 0), 0);

    const scorecard = {
      clicks: { current: clicks.length, previous: (prevClicks || []).length },
      signups: { current: referrals.length, previous: (prevReferrals || []).length },
      conversions: { current: referrals.filter((r: any) => r.status === 'converted' || r.status === 'paid').length, previous: 0 },
      earnings: { current: currentEarnings, previous: prevEarnings }
    };
    Object.keys(scorecard).forEach(k => {
      const s = scorecard[k as keyof typeof scorecard];
      (s as any).change = s.previous > 0 ? Math.round(((s.current - s.previous) / s.previous) * 100) : s.current > 0 ? 100 : 0;
    });

    const monthlyTotals: Record<string, number> = {};
    allCommissions.forEach((c: any) => {
      const month = c.created_at.substring(0, 7);
      monthlyTotals[month] = (monthlyTotals[month] || 0) + (c.amount_cents || 0);
    });
    const months = Object.keys(monthlyTotals).sort();
    const personalBest = months.length > 0 ? months.reduce((best, m) => monthlyTotals[m] > monthlyTotals[best] ? m : best, months[0]) : null;

    const earningsPerClick = clicks.length > 0 ? currentEarnings / clicks.length : 0;
    const earningsPerSignup = referrals.length > 0 ? currentEarnings / referrals.length : 0;
    const conversionRate = clicks.length > 0 ? (referrals.length / clicks.length * 100) : 0;

    const dailyClicks: Record<string, number> = {};
    const dailyConversions: Record<string, number> = {};
    clicks.forEach((c: any) => {
      const day = c.created_at.substring(0, 10);
      dailyClicks[day] = (dailyClicks[day] || 0) + 1;
    });
    referrals.filter((r: any) => r.status === 'converted' || r.status === 'paid').forEach((r: any) => {
      const day = r.created_at.substring(0, 10);
      dailyConversions[day] = (dailyConversions[day] || 0) + 1;
    });

    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id, name, clicks, signups, conversions, revenue_cents')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    return NextResponse.json({
      clickHeatmap: clicksByDayHour,
      channelBreakdown: clicksByChannel,
      scorecard,
      personalBest: personalBest ? { month: personalBest, amount_cents: monthlyTotals[personalBest] } : null,
      efficiency: { earningsPerClick: Math.round(earningsPerClick), earningsPerSignup: Math.round(earningsPerSignup), conversionRate: Math.round(conversionRate * 10) / 10 },
      dualAxis: { dailyClicks, dailyConversions },
      campaignComparison: campaigns || []
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
