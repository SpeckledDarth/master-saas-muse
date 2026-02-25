import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { chatCompletion } from '@/lib/ai/provider';
import type { AISettings } from '@/types/settings';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();

    const [referralsRes, clicksRes, commissionsRes, metricsRes] = await Promise.all([
      admin.from('affiliate_referrals').select('id, status, source_tag, created_at, converted_at, churned_at, churn_reason, last_active_at, referred_user_id').eq('affiliate_user_id', user.id),
      admin.from('referral_clicks').select('source_tag, created_at, landing_page').eq('referral_link_user_id', user.id),
      admin.from('affiliate_commissions').select('commission_amount_cents, created_at, referral_id').eq('affiliate_user_id', user.id),
      admin.from('connected_platform_metrics').select('platform, metric_name, metric_value, date').eq('user_id', user.id).order('date', { ascending: false }).limit(300),
    ]);

    const referrals = referralsRes.data || [];
    const clicks = clicksRes.data || [];
    const commissions = commissionsRes.data || [];
    const metrics = metricsRes.data || [];

    const trialNotConverted = referrals.filter(r => r.status === 'signed_up');
    const trialDetails = trialNotConverted.map(r => {
      const daysSinceSignup = Math.floor((Date.now() - new Date(r.created_at).getTime()) / 86400000);
      const daysInactive = r.last_active_at
        ? Math.floor((Date.now() - new Date(r.last_active_at).getTime()) / 86400000)
        : daysSinceSignup;
      return {
        referral_id: r.id,
        source: r.source_tag || 'direct',
        days_since_signup: daysSinceSignup,
        days_inactive: daysInactive,
        risk_level: daysInactive > 7 ? 'high' : daysInactive > 3 ? 'medium' : 'low',
      };
    });

    const revenueBySource: Record<string, number> = {};
    const convBySource: Record<string, number> = {};
    referrals.filter(r => r.status === 'converted' || r.status === 'paid').forEach(r => {
      const src = r.source_tag || 'direct';
      convBySource[src] = (convBySource[src] || 0) + 1;
    });
    commissions.forEach(c => {
      const ref = referrals.find(r => r.id === (c as any).referral_id);
      const src = ref?.source_tag || 'direct';
      revenueBySource[src] = (revenueBySource[src] || 0) + ((c as any).commission_amount_cents || 0);
    });
    const topRevenueSources = Object.entries(revenueBySource)
      .map(([source, revenue]) => ({ source, revenue_cents: revenue, conversions: convBySource[source] || 0 }))
      .sort((a, b) => b.revenue_cents - a.revenue_cents)
      .slice(0, 5);

    const metricsByPlatformDate: Record<string, Record<string, number>> = {};
    metrics.forEach((m: any) => {
      const key = `${m.platform}_${m.date}`;
      if (!metricsByPlatformDate[key]) metricsByPlatformDate[key] = {};
      metricsByPlatformDate[key][m.metric_name] = Number(m.metric_value);
    });

    const clickDates = clicks.map(c => new Date((c as any).created_at).toISOString().split('T')[0]);
    const clickDateSet = new Set(clickDates);

    const platformActivityNearClicks: Record<string, number> = {};
    metrics.forEach((m: any) => {
      const metricDate = new Date(m.date);
      const nextDay = new Date(metricDate); nextDay.setDate(nextDay.getDate() + 1);
      const nextNext = new Date(metricDate); nextNext.setDate(nextNext.getDate() + 2);
      if (clickDateSet.has(metricDate.toISOString().split('T')[0]) ||
          clickDateSet.has(nextDay.toISOString().split('T')[0]) ||
          clickDateSet.has(nextNext.toISOString().split('T')[0])) {
        platformActivityNearClicks[m.platform] = (platformActivityNearClicks[m.platform] || 0) + 1;
      }
    });

    let aiInsights = '';
    try {
      const settings: AISettings = { provider: 'xai', model: 'grok-3-mini-fast', maxTokens: 600, temperature: 0.7 };
      const result = await chatCompletion(settings, [
        { role: 'system', content: 'You are an affiliate conversion optimization advisor. Analyze trial users who haven\'t converted and provide specific follow-up strategies. Be concise and actionable.' },
        { role: 'user', content: `Analyze these unconverted trial referrals and suggest follow-up strategies:

TRIAL USERS NOT CONVERTED: ${JSON.stringify(trialDetails.slice(0, 10))}
TOP REVENUE SOURCES: ${JSON.stringify(topRevenueSources)}
PLATFORM ACTIVITY NEAR CLICKS: ${JSON.stringify(platformActivityNearClicks)}
TOTAL CONVERTED: ${referrals.filter(r => r.status === 'converted' || r.status === 'paid').length}
TOTAL CHURNED: ${referrals.filter(r => r.status === 'churned').length}

For each risk level (high/medium/low), suggest:
1. Why they might not have converted
2. A specific follow-up message template
3. Best channel to reach out

Also note any patterns (e.g., "most high-risk came from twitter — maybe that audience isn't the best fit")` },
      ]);
      aiInsights = result.content;
    } catch {
      aiInsights = 'AI insights temporarily unavailable.';
    }

    return NextResponse.json({
      unconvertedTrials: trialDetails.sort((a, b) => b.days_inactive - a.days_inactive),
      topRevenueSources,
      platformCorrelation: Object.entries(platformActivityNearClicks)
        .map(([platform, count]) => ({ platform, correlatedClicks: count }))
        .sort((a, b) => b.correlatedClicks - a.correlatedClicks),
      aiInsights,
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Conversion insights error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
