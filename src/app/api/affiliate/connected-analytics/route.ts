import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();
    const { data: connections } = await admin
      .from('connected_platforms')
      .select('*')
      .eq('user_id', user.id);

    const connectedPlatforms = (connections || []).map((c: any) => ({
      platform: c.platform,
      connected: true,
      connected_at: c.created_at,
      last_synced: c.last_synced_at,
      account_name: c.account_name
    }));

    const availablePlatforms = ['google_analytics', 'youtube', 'twitter', 'instagram', 'linkedin', 'tiktok'];
    const connectedNames = connectedPlatforms.map((p: any) => p.platform);
    const disconnected = availablePlatforms.filter(p => !connectedNames.includes(p)).map(p => ({
      platform: p,
      connected: false
    }));

    const period = req.nextUrl.searchParams.get('period') || '30d';
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const since = new Date(Date.now() - days * 86400000).toISOString();

    const [clicksRes, referralsRes, commissionsRes] = await Promise.all([
      supabase.from('referral_clicks').select('created_at, source_tag, landing_page').eq('referral_link_user_id', user.id).gte('created_at', since),
      supabase.from('affiliate_referrals').select('created_at, status, source').eq('affiliate_user_id', user.id).gte('created_at', since),
      supabase.from('affiliate_commissions').select('amount_cents, created_at').eq('affiliate_user_id', user.id).gte('created_at', since)
    ]);

    const internalMetrics = {
      clicks: (clicksRes.data || []).length,
      signups: (referralsRes.data || []).length,
      conversions: (referralsRes.data || []).filter((r: any) => r.status === 'converted' || r.status === 'paid').length,
      earnings_cents: (commissionsRes.data || []).reduce((s: number, c: any) => s + (c.amount_cents || 0), 0)
    };

    const { data: externalData } = await admin
      .from('connected_platform_metrics')
      .select('platform, metric_name, metric_value, date')
      .eq('user_id', user.id)
      .gte('date', since.substring(0, 10));

    const externalByPlatform: Record<string, Record<string, number>> = {};
    for (const d of (externalData || [])) {
      if (!externalByPlatform[d.platform]) externalByPlatform[d.platform] = {};
      externalByPlatform[d.platform][d.metric_name] = (externalByPlatform[d.platform][d.metric_name] || 0) + (d.metric_value || 0);
    }

    const crossPlatform = Object.entries(externalByPlatform).map(([platform, metrics]) => {
      const impressions = metrics['impressions'] || 0;
      const engagement = metrics['engagement'] || 0;
      const clickThrough = impressions > 0 ? ((metrics['clicks'] || 0) / impressions * 100) : 0;
      return {
        platform,
        impressions,
        engagement,
        clicks: metrics['clicks'] || 0,
        click_through_rate: Math.round(clickThrough * 1000) / 1000,
        recommendation: clickThrough > 2 ? 'High performing — increase investment' : clickThrough > 0.5 ? 'Average — optimize content' : 'Low performing — test new approach'
      };
    });

    const sourceBreakdown: Record<string, { clicks: number; signups: number; revenue_cents: number }> = {};
    for (const click of (clicksRes.data || [])) {
      const src = click.source_tag || click.landing_page || 'direct';
      if (!sourceBreakdown[src]) sourceBreakdown[src] = { clicks: 0, signups: 0, revenue_cents: 0 };
      sourceBreakdown[src].clicks++;
    }
    for (const ref of (referralsRes.data || [])) {
      const src = ref.source || 'direct';
      if (!sourceBreakdown[src]) sourceBreakdown[src] = { clicks: 0, signups: 0, revenue_cents: 0 };
      sourceBreakdown[src].signups++;
    }

    const contentRevenue = Object.entries(sourceBreakdown)
      .map(([source, data]) => ({ source, ...data }))
      .sort((a, b) => b.revenue_cents - a.revenue_cents)
      .slice(0, 10);

    return NextResponse.json({
      platforms: [...connectedPlatforms, ...disconnected],
      internalMetrics,
      crossPlatform,
      contentRevenue,
      mergedDashboard: {
        total_reach: crossPlatform.reduce((s, p) => s + p.impressions, 0),
        total_engagement: crossPlatform.reduce((s, p) => s + p.engagement, 0),
        affiliate_clicks: internalMetrics.clicks,
        affiliate_conversions: internalMetrics.conversions,
        affiliate_revenue_cents: internalMetrics.earnings_cents,
        overall_conversion_rate: crossPlatform.reduce((s, p) => s + p.impressions, 0) > 0
          ? (internalMetrics.conversions / crossPlatform.reduce((s, p) => s + p.impressions, 0) * 100).toFixed(4)
          : '0'
      }
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
    const { platform, action } = body;

    if (action === 'disconnect') {
      const admin = createAdminClient();
      await admin.from('connected_platforms').delete().eq('user_id', user.id).eq('platform', platform);
      return NextResponse.json({ success: true, message: `${platform} disconnected` });
    }

    return NextResponse.json({
      connect_url: `/api/auth/${platform}/connect`,
      message: `Redirect to ${platform} OAuth to connect. Once connected, metrics will sync automatically.`
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
