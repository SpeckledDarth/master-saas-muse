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
    const days = parseInt(req.nextUrl.searchParams.get('days') || '90');
    const since = new Date(Date.now() - days * 86400000).toISOString();

    const [clicksRes, referralsRes, commissionsRes, metricsRes] = await Promise.all([
      admin.from('referral_clicks')
        .select('source_tag, landing_page, created_at, country, device_type, browser, referrer_url')
        .eq('referral_link_user_id', user.id)
        .gte('created_at', since),
      admin.from('affiliate_referrals')
        .select('status, source_tag, created_at, converted_at')
        .eq('affiliate_user_id', user.id)
        .gte('created_at', since),
      admin.from('affiliate_commissions')
        .select('commission_amount_cents, created_at, status')
        .eq('affiliate_user_id', user.id)
        .gte('created_at', since),
      admin.from('connected_platform_metrics')
        .select('platform, metric_name, metric_value, date')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(1000),
    ]);

    const clicks = clicksRes.data || [];
    const referrals = referralsRes.data || [];
    const commissions = commissionsRes.data || [];
    const platformMetrics = metricsRes.data || [];

    const geoBreakdown: Record<string, { clicks: number; conversions: number }> = {};
    clicks.forEach((c: any) => {
      const country = c.country || 'Unknown';
      if (!geoBreakdown[country]) geoBreakdown[country] = { clicks: 0, conversions: 0 };
      geoBreakdown[country].clicks++;
    });
    const convertedSources = new Set(
      referrals.filter((r: any) => r.status === 'converted' || r.status === 'paid').map((r: any) => r.source_tag)
    );
    referrals.filter((r: any) => r.status === 'converted' || r.status === 'paid').forEach((r: any) => {
      const matchingClicks = clicks.filter((c: any) => c.source_tag === r.source_tag);
      if (matchingClicks.length > 0) {
        const country = (matchingClicks[0] as any).country || 'Unknown';
        if (geoBreakdown[country]) geoBreakdown[country].conversions++;
      }
    });

    const topGeos = Object.entries(geoBreakdown)
      .map(([country, data]) => ({
        country,
        clicks: data.clicks,
        conversions: data.conversions,
        conversionRate: data.clicks > 0 ? Math.round((data.conversions / data.clicks) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 15);

    const deviceBreakdown: Record<string, { clicks: number; conversions: number }> = {};
    clicks.forEach((c: any) => {
      const device = c.device_type || 'Unknown';
      if (!deviceBreakdown[device]) deviceBreakdown[device] = { clicks: 0, conversions: 0 };
      deviceBreakdown[device].clicks++;
    });

    const deviceSplit = Object.entries(deviceBreakdown)
      .map(([device, data]) => ({
        device,
        clicks: data.clicks,
        percentage: clicks.length > 0 ? Math.round((data.clicks / clicks.length) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.clicks - a.clicks);

    const sourceBreakdown: Record<string, { clicks: number; signups: number; conversions: number; earnings_cents: number }> = {};
    clicks.forEach((c: any) => {
      const source = c.source_tag || 'direct';
      if (!sourceBreakdown[source]) sourceBreakdown[source] = { clicks: 0, signups: 0, conversions: 0, earnings_cents: 0 };
      sourceBreakdown[source].clicks++;
    });
    referrals.forEach((r: any) => {
      const source = r.source_tag || 'direct';
      if (!sourceBreakdown[source]) sourceBreakdown[source] = { clicks: 0, signups: 0, conversions: 0, earnings_cents: 0 };
      if (['signed_up', 'converted', 'paid'].includes(r.status)) sourceBreakdown[source].signups++;
      if (r.status === 'converted' || r.status === 'paid') sourceBreakdown[source].conversions++;
    });

    const totalConversions = referrals.filter((r: any) => r.status === 'converted' || r.status === 'paid').length;
    const totalEarnings = commissions.reduce((s: number, c: any) => s + (c.commission_amount_cents || 0), 0);
    Object.values(sourceBreakdown).forEach(data => {
      if (totalConversions > 0) {
        data.earnings_cents = Math.round((data.conversions / totalConversions) * totalEarnings);
      }
    });

    const bestSources = Object.entries(sourceBreakdown)
      .map(([source, data]) => ({
        source,
        ...data,
        conversionRate: data.clicks > 0 ? Math.round((data.conversions / data.clicks) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.conversions - a.conversions || b.clicks - a.clicks)
      .slice(0, 10);

    const clicksByHour: Record<number, number> = {};
    const clicksByDay: Record<number, number> = {};
    const conversionsByHour: Record<number, number> = {};
    const conversionsByDay: Record<number, number> = {};
    clicks.forEach((c: any) => {
      const d = new Date(c.created_at);
      const hour = d.getUTCHours();
      const day = d.getUTCDay();
      clicksByHour[hour] = (clicksByHour[hour] || 0) + 1;
      clicksByDay[day] = (clicksByDay[day] || 0) + 1;
    });
    referrals.filter((r: any) => r.status === 'converted' || r.status === 'paid').forEach((r: any) => {
      const d = new Date(r.converted_at || r.created_at);
      const hour = d.getUTCHours();
      const day = d.getUTCDay();
      conversionsByHour[hour] = (conversionsByHour[hour] || 0) + 1;
      conversionsByDay[day] = (conversionsByDay[day] || 0) + 1;
    });

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const bestClickHour = Object.entries(clicksByHour).sort((a, b) => b[1] - a[1])[0];
    const bestClickDay = Object.entries(clicksByDay).sort((a, b) => b[1] - a[1])[0];
    const bestConvHour = Object.entries(conversionsByHour).sort((a, b) => b[1] - a[1])[0];
    const bestConvDay = Object.entries(conversionsByDay).sort((a, b) => b[1] - a[1])[0];

    const timingInsights = {
      bestClickHour: bestClickHour ? parseInt(bestClickHour[0]) : null,
      bestClickDay: bestClickDay ? dayNames[parseInt(bestClickDay[0])] : null,
      bestConversionHour: bestConvHour ? parseInt(bestConvHour[0]) : null,
      bestConversionDay: bestConvDay ? dayNames[parseInt(bestConvDay[0])] : null,
      clicksByHour,
      clicksByDay: Object.fromEntries(Object.entries(clicksByDay).map(([k, v]) => [dayNames[parseInt(k)], v])),
      conversionsByHour,
      conversionsByDay: Object.fromEntries(Object.entries(conversionsByDay).map(([k, v]) => [dayNames[parseInt(k)], v])),
    };

    const platformSummary: Record<string, Record<string, number>> = {};
    platformMetrics.forEach((m: any) => {
      if (!platformSummary[m.platform]) platformSummary[m.platform] = {};
      platformSummary[m.platform][m.metric_name] = (platformSummary[m.platform][m.metric_name] || 0) + Number(m.metric_value);
    });

    const browserBreakdown: Record<string, number> = {};
    clicks.forEach((c: any) => {
      const browser = c.browser || 'Unknown';
      browserBreakdown[browser] = (browserBreakdown[browser] || 0) + 1;
    });
    const topBrowsers = Object.entries(browserBreakdown)
      .map(([browser, count]) => ({ browser, count, percentage: clicks.length > 0 ? Math.round((count / clicks.length) * 1000) / 10 : 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const totalSignups = referrals.filter((r: any) => ['signed_up', 'converted', 'paid'].includes(r.status)).length;

    let aiPersona: string | null = null;
    const skipAi = req.nextUrl.searchParams.get('skip_ai') === 'true';

    if (!skipAi && clicks.length > 0) {
      const dataContext = `
AUDIENCE ANALYSIS DATA (last ${days} days):
- Total clicks: ${clicks.length}
- Total signups: ${totalSignups}
- Total conversions: ${totalConversions}
- Total earnings: $${(totalEarnings / 100).toFixed(2)}
- Overall conversion rate: ${clicks.length > 0 ? ((totalConversions / clicks.length) * 100).toFixed(1) : 0}%

TOP GEOGRAPHIC REGIONS:
${topGeos.slice(0, 10).map(g => `  ${g.country}: ${g.clicks} clicks, ${g.conversions} conversions (${g.conversionRate}% rate)`).join('\n')}

DEVICE BREAKDOWN:
${deviceSplit.map(d => `  ${d.device}: ${d.percentage}% of traffic`).join('\n')}

TOP BROWSERS:
${topBrowsers.map(b => `  ${b.browser}: ${b.percentage}%`).join('\n')}

BEST TRAFFIC SOURCES:
${bestSources.slice(0, 5).map(s => `  ${s.source}: ${s.clicks} clicks, ${s.conversions} conversions (${s.conversionRate}% rate)`).join('\n')}

TIMING PATTERNS:
- Best hour for clicks: ${timingInsights.bestClickHour !== null ? `${timingInsights.bestClickHour}:00 UTC` : 'N/A'}
- Best day for clicks: ${timingInsights.bestClickDay || 'N/A'}
- Best hour for conversions: ${timingInsights.bestConversionHour !== null ? `${timingInsights.bestConversionHour}:00 UTC` : 'N/A'}
- Best day for conversions: ${timingInsights.bestConversionDay || 'N/A'}

CONNECTED PLATFORM METRICS:
${Object.entries(platformSummary).map(([p, metrics]) => `  ${p}: ${Object.entries(metrics).map(([k, v]) => `${k}=${v}`).join(', ')}`).join('\n') || '  No connected platforms'}
`.trim();

      const aiSettings: AISettings = {
        provider: 'xai',
        model: 'grok-3-mini-fast',
        maxTokens: 800,
        temperature: 0.7,
        systemPrompt: '',
      };

      const xaiKey = process.env.XAI_API_KEY;
      const openaiKey = process.env.OPENAI_API_KEY;
      if (!xaiKey && openaiKey) {
        aiSettings.provider = 'openai';
        aiSettings.model = 'gpt-4o-mini';
      }

      try {
        const result = await chatCompletion(aiSettings, [
          {
            role: 'system',
            content: 'You are an audience analytics expert for affiliate marketers. You build detailed audience personas based on real behavioral data. Be specific, actionable, and data-driven. Do NOT use emoji.',
          },
          {
            role: 'user',
            content: `${dataContext}

Based on this data, create a detailed audience persona description for this affiliate's audience. Include:
1. WHO they are (demographics inferred from geo, device, timing patterns)
2. WHEN they are most active and most likely to convert
3. WHERE they come from (which sources/platforms drive the best results)
4. WHAT content format likely resonates (based on device mix and platform data)
5. Three specific, actionable recommendations to better reach and convert this audience

Write in a direct, professional tone. Reference specific numbers from the data. Keep it under 300 words.`,
          },
        ]);
        aiPersona = result.content;
      } catch (aiErr) {
        aiPersona = 'AI audience analysis temporarily unavailable. The structured data below still provides actionable insights.';
      }
    }

    return NextResponse.json({
      summary: {
        totalClicks: clicks.length,
        totalSignups,
        totalConversions,
        totalEarningsCents: totalEarnings,
        overallConversionRate: clicks.length > 0 ? Math.round((totalConversions / clicks.length) * 1000) / 10 : 0,
        periodDays: days,
      },
      topGeos,
      deviceSplit,
      topBrowsers,
      bestSources,
      timingInsights,
      platformDemographics: platformSummary,
      aiPersona,
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Audience analyzer error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
