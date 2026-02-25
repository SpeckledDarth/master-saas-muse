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

    const type = req.nextUrl.searchParams.get('type') || 'all';
    const admin = createAdminClient();

    const [clicksRes, referralsRes, commissionsRes, metricsRes] = await Promise.all([
      admin.from('referral_clicks').select('source_tag, landing_page, created_at, country, device_type').eq('referral_link_user_id', user.id),
      admin.from('affiliate_referrals').select('status, source_tag, created_at, converted_at, churned_at, churn_reason').eq('affiliate_user_id', user.id),
      admin.from('affiliate_commissions').select('commission_amount_cents, created_at, status').eq('affiliate_user_id', user.id),
      admin.from('connected_platform_metrics').select('platform, metric_name, metric_value, date').eq('user_id', user.id).order('date', { ascending: false }).limit(500),
    ]);

    const clicks = clicksRes.data || [];
    const referrals = referralsRes.data || [];
    const commissions = commissionsRes.data || [];
    const platformMetrics = metricsRes.data || [];

    const clicksBySource: Record<string, number> = {};
    clicks.forEach(c => { const s = (c as any).source_tag || 'direct'; clicksBySource[s] = (clicksBySource[s] || 0) + 1; });

    const convBySource: Record<string, number> = {};
    referrals.filter(r => r.status === 'converted' || r.status === 'paid').forEach(r => {
      const s = r.source_tag || 'direct'; convBySource[s] = (convBySource[s] || 0) + 1;
    });

    const monthlyEarnings: Record<string, number> = {};
    commissions.forEach(c => {
      const m = (c as any).created_at?.substring(0, 7);
      if (m) monthlyEarnings[m] = (monthlyEarnings[m] || 0) + ((c as any).commission_amount_cents || 0);
    });

    const clicksByHour: Record<number, number> = {};
    const clicksByDay: Record<number, number> = {};
    clicks.forEach(c => {
      const d = new Date((c as any).created_at);
      clicksByHour[d.getHours()] = (clicksByHour[d.getHours()] || 0) + 1;
      clicksByDay[d.getDay()] = (clicksByDay[d.getDay()] || 0) + 1;
    });

    const churnedRefs = referrals.filter(r => r.status === 'churned');
    const churnReasons: Record<string, number> = {};
    churnedRefs.forEach(r => { const reason = r.churn_reason || 'unknown'; churnReasons[reason] = (churnReasons[reason] || 0) + 1; });

    const trialRefs = referrals.filter(r => r.status === 'signed_up');
    const convertedRefs = referrals.filter(r => r.status === 'converted' || r.status === 'paid');

    const platformSummary: Record<string, Record<string, number>> = {};
    platformMetrics.forEach((m: any) => {
      if (!platformSummary[m.platform]) platformSummary[m.platform] = {};
      platformSummary[m.platform][m.metric_name] = (platformSummary[m.platform][m.metric_name] || 0) + Number(m.metric_value);
    });

    const dataContext = `
AFFILIATE PERFORMANCE DATA:
- Total clicks: ${clicks.length}
- Clicks by source: ${JSON.stringify(clicksBySource)}
- Total referrals: ${referrals.length} (${convertedRefs.length} converted, ${trialRefs.length} in trial, ${churnedRefs.length} churned)
- Conversions by source: ${JSON.stringify(convBySource)}
- Monthly earnings (last 12mo): ${JSON.stringify(monthlyEarnings)}
- Overall conversion rate: ${clicks.length > 0 ? ((convertedRefs.length / clicks.length) * 100).toFixed(1) : 0}%
- Clicks by hour of day: ${JSON.stringify(clicksByHour)}
- Clicks by day of week (0=Sun): ${JSON.stringify(clicksByDay)}
- Churn reasons: ${JSON.stringify(churnReasons)}
- Trials not yet converted: ${trialRefs.length}
- Connected platform data: ${JSON.stringify(platformSummary)}
`;

    const prompts: Record<string, string> = {
      conversion_drop: `Based on this affiliate's data, analyze why their conversion rate might be lower than expected. Look at source mix, timing patterns, and any trends. Give 3 specific, actionable insights. Be direct and specific to their data.`,
      content_recommendations: `Based on this affiliate's conversion data by source and platform metrics, recommend what types of content work best for them. Cite specific numbers from their data. Give 3 recommendations.`,
      channel_optimization: `Analyze which channels this affiliate should focus on vs. deprioritize. Use their actual click and conversion data by source. Suggest specific action items. Give 3 channel-specific recommendations.`,
      audience_fit: `Score this affiliate's audience-product fit (1-10) based on their conversion rate, churn patterns, and engagement. Explain the score with specific data points. Suggest improvements.`,
      seasonal_trends: `Analyze this affiliate's monthly earnings pattern. Identify seasonal trends or growth patterns. Predict the best months to push promotions. Be specific about which months and why.`,
      competitor_tips: `Based on the churn reasons, suggest how this affiliate can address objections and prevent referrals from switching to competitors. Give 3 specific talking points with data backing.`,
    };

    const types = type === 'all' ? Object.keys(prompts) : [type];
    const insights: Record<string, string> = {};

    const settings: AISettings = {
      provider: 'xai',
      model: 'grok-3-mini-fast',
      maxTokens: 500,
      temperature: 0.7,
      systemPrompt: 'You are an affiliate marketing analytics advisor. Analyze data and provide specific, actionable insights. Use numbers from the data. Be concise — 3-5 bullet points max. No filler.',
    };

    for (const t of types) {
      if (!prompts[t]) continue;
      try {
        const result = await chatCompletion(settings, [
          { role: 'system', content: 'You are an affiliate marketing analytics advisor. Analyze data and provide specific, actionable insights. Use numbers from the data. Be concise — 3-5 bullet points max. No filler.' },
          { role: 'user', content: `${dataContext}\n\n${prompts[t]}` },
        ]);
        insights[t] = result.content;
      } catch (aiErr) {
        insights[t] = 'AI analysis temporarily unavailable. Check back later.';
      }
    }

    const bestHour = Object.entries(clicksByHour).sort((a, b) => b[1] - a[1])[0];
    const bestDay = Object.entries(clicksByDay).sort((a, b) => b[1] - a[1])[0];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return NextResponse.json({
      insights,
      bestTimeToPost: {
        bestHour: bestHour ? parseInt(bestHour[0]) : null,
        bestDay: bestDay ? dayNames[parseInt(bestDay[0])] : null,
        clicksByHour,
        clicksByDay: Object.fromEntries(Object.entries(clicksByDay).map(([k, v]) => [dayNames[parseInt(k)], v])),
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('AI analytics error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
