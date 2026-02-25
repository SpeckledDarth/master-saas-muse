import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();
    const days = parseInt(req.nextUrl.searchParams.get('days') || '30');
    const since = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

    const [platformsRes, metricsRes, clicksRes, referralsRes, commissionsRes] = await Promise.all([
      admin.from('connected_platforms').select('*').eq('user_id', user.id),
      admin.from('connected_platform_metrics').select('platform, metric_name, metric_value, date').eq('user_id', user.id).gte('date', since).order('date', { ascending: true }),
      admin.from('referral_clicks').select('source_tag, created_at').eq('referral_link_user_id', user.id).gte('created_at', new Date(Date.now() - days * 86400000).toISOString()),
      admin.from('affiliate_referrals').select('source_tag, status, created_at').eq('affiliate_user_id', user.id).gte('created_at', new Date(Date.now() - days * 86400000).toISOString()),
      admin.from('affiliate_commissions').select('commission_amount_cents, created_at').eq('affiliate_user_id', user.id).gte('created_at', new Date(Date.now() - days * 86400000).toISOString()),
    ]);

    const platforms = platformsRes.data || [];
    const metrics = metricsRes.data || [];
    const clicks = clicksRes.data || [];
    const referrals = referralsRes.data || [];
    const commissions = commissionsRes.data || [];

    const totalClicks = clicks.length;
    const totalSignups = referrals.filter(r => ['signed_up', 'converted', 'paid'].includes(r.status)).length;
    const totalConversions = referrals.filter(r => r.status === 'converted' || r.status === 'paid').length;
    const totalEarnings = commissions.reduce((s, c) => s + ((c as any).commission_amount_cents || 0), 0);

    const platformSummaries: Record<string, { reach: number; engagement: number; clicks: number; signups: number; conversions: number; earnings_cents: number; efficiency: number }> = {};

    const platformMap: Record<string, string> = {
      youtube: 'youtube', instagram: 'instagram', linkedin: 'linkedin', google_analytics: 'blog',
      twitter: 'twitter', tiktok: 'tiktok', facebook: 'facebook',
    };

    const clicksBySource: Record<string, number> = {};
    clicks.forEach(c => { const s = (c as any).source_tag || 'direct'; clicksBySource[s] = (clicksBySource[s] || 0) + 1; });
    const convBySource: Record<string, number> = {};
    referrals.filter(r => r.status === 'converted' || r.status === 'paid').forEach(r => {
      const s = r.source_tag || 'direct'; convBySource[s] = (convBySource[s] || 0) + 1;
    });

    for (const platform of platforms) {
      const pMetrics = metrics.filter((m: any) => m.platform === platform.platform);
      const reachMetrics = ['views', 'impressions', 'pageviews', 'reach', 'downloads'];
      const engageMetrics = ['engagement', 'watch_time_minutes', 'clicks', 'subscribers_gained'];

      const totalReach = pMetrics.filter((m: any) => reachMetrics.includes(m.metric_name)).reduce((s: number, m: any) => s + Number(m.metric_value), 0);
      const totalEngage = pMetrics.filter((m: any) => engageMetrics.includes(m.metric_name)).reduce((s: number, m: any) => s + Number(m.metric_value), 0);

      const sourceKey = platformMap[platform.platform] || platform.platform;
      const pClicks = clicksBySource[sourceKey] || 0;
      const pConversions = convBySource[sourceKey] || 0;
      const pSignups = referrals.filter(r => r.source_tag === sourceKey).length;
      const pEarnings = totalConversions > 0 ? Math.round((pConversions / totalConversions) * totalEarnings) : 0;

      platformSummaries[platform.platform] = {
        reach: totalReach,
        engagement: totalEngage,
        clicks: pClicks,
        signups: pSignups,
        conversions: pConversions,
        earnings_cents: pEarnings,
        efficiency: totalReach > 0 ? Math.round((pConversions / totalReach) * 100000) / 1000 : 0,
      };
    }

    const platformComparison = Object.entries(platformSummaries)
      .map(([platform, data]) => ({ platform, ...data }))
      .sort((a, b) => b.efficiency - a.efficiency);

    const mergedTimeline: { date: string; platform_reach: number; affiliate_clicks: number; conversions: number }[] = [];
    const dateSet = new Set<string>();
    metrics.forEach((m: any) => dateSet.add(m.date));
    clicks.forEach(c => dateSet.add((c as any).created_at?.substring(0, 10)));

    const sortedDates = [...dateSet].sort().slice(-30);
    for (const date of sortedDates) {
      const dayReach = metrics.filter((m: any) => m.date === date && ['views', 'impressions', 'pageviews', 'reach'].includes(m.metric_name)).reduce((s: number, m: any) => s + Number(m.metric_value), 0);
      const dayClicks = clicks.filter(c => (c as any).created_at?.startsWith(date)).length;
      const dayConv = referrals.filter(r => r.created_at?.startsWith(date) && (r.status === 'converted' || r.status === 'paid')).length;
      mergedTimeline.push({ date, platform_reach: dayReach, affiliate_clicks: dayClicks, conversions: dayConv });
    }

    return NextResponse.json({
      connectedPlatforms: platforms.map(p => ({ platform: p.platform, account_name: (p as any).account_name, last_synced: (p as any).last_synced_at })),
      affiliateOverview: { totalClicks, totalSignups, totalConversions, totalEarnings },
      platformComparison,
      mergedTimeline,
    });
  } catch (err: any) {
    console.error('Connected overview error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
