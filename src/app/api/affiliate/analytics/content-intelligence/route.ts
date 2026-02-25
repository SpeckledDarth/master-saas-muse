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

    const [clicksRes, referralsRes, commissionsRes, metricsRes] = await Promise.all([
      admin.from('referral_clicks').select('source_tag, created_at').eq('referral_link_user_id', user.id),
      admin.from('affiliate_referrals').select('source_tag, status, created_at').eq('affiliate_user_id', user.id),
      admin.from('affiliate_commissions').select('commission_amount_cents, created_at, referral_id').eq('affiliate_user_id', user.id),
      admin.from('connected_platform_metrics').select('platform, metric_name, metric_value, date').eq('user_id', user.id).order('date', { ascending: true }),
    ]);

    const clicks = clicksRes.data || [];
    const referrals = referralsRes.data || [];
    const commissions = commissionsRes.data || [];
    const metrics = metricsRes.data || [];

    const clicksByWeek: Record<string, number> = {};
    const convByWeek: Record<string, number> = {};
    clicks.forEach(c => {
      const d = new Date((c as any).created_at);
      const weekStart = new Date(d); weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().split('T')[0];
      clicksByWeek[key] = (clicksByWeek[key] || 0) + 1;
    });
    referrals.filter(r => r.status === 'converted' || r.status === 'paid').forEach(r => {
      const d = new Date(r.created_at);
      const weekStart = new Date(d); weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().split('T')[0];
      convByWeek[key] = (convByWeek[key] || 0) + 1;
    });

    const weeks = Object.keys(clicksByWeek).sort();
    const weeklyActivity = weeks.map(w => ({
      week: w,
      clicks: clicksByWeek[w] || 0,
      conversions: convByWeek[w] || 0,
      rate: clicksByWeek[w] > 0 ? Math.round(((convByWeek[w] || 0) / clicksByWeek[w]) * 1000) / 10 : 0,
    }));

    const activeWeeks = weeklyActivity.filter(w => w.clicks > 0);
    const highActivityWeeks = activeWeeks.filter(w => w.clicks >= (activeWeeks.length > 0 ? activeWeeks.reduce((s, w2) => s + w2.clicks, 0) / activeWeeks.length : 0));
    const lowActivityWeeks = activeWeeks.filter(w => w.clicks < (activeWeeks.length > 0 ? activeWeeks.reduce((s, w2) => s + w2.clicks, 0) / activeWeeks.length : 0));

    const highActivityConvRate = highActivityWeeks.length > 0 ? highActivityWeeks.reduce((s, w) => s + w.rate, 0) / highActivityWeeks.length : 0;
    const lowActivityConvRate = lowActivityWeeks.length > 0 ? lowActivityWeeks.reduce((s, w) => s + w.rate, 0) / lowActivityWeeks.length : 0;

    const gapDays: number[] = [];
    const clickDates = clicks.map(c => new Date((c as any).created_at).toISOString().split('T')[0]);
    const uniqueDates = [...new Set(clickDates)].sort();
    for (let i = 1; i < uniqueDates.length; i++) {
      const gap = (new Date(uniqueDates[i]).getTime() - new Date(uniqueDates[i - 1]).getTime()) / 86400000;
      gapDays.push(gap);
    }
    const avgGap = gapDays.length > 0 ? Math.round(gapDays.reduce((s, g) => s + g, 0) / gapDays.length * 10) / 10 : 0;

    const platformPostDates: Record<string, string[]> = {};
    metrics.forEach((m: any) => {
      if (['views', 'impressions', 'pageviews'].includes(m.metric_name) && Number(m.metric_value) > 0) {
        if (!platformPostDates[m.platform]) platformPostDates[m.platform] = [];
        if (!platformPostDates[m.platform].includes(m.date)) platformPostDates[m.platform].push(m.date);
      }
    });

    const clickDateSet = new Set(clickDates);
    const platformCorrelation: Record<string, { postsNearClicks: number; totalPosts: number; correlation: number }> = {};
    for (const [platform, dates] of Object.entries(platformPostDates)) {
      let nearClicks = 0;
      for (const date of dates) {
        const d = new Date(date);
        for (let offset = 0; offset <= 2; offset++) {
          const checkDate = new Date(d); checkDate.setDate(checkDate.getDate() + offset);
          if (clickDateSet.has(checkDate.toISOString().split('T')[0])) { nearClicks++; break; }
        }
      }
      platformCorrelation[platform] = {
        postsNearClicks: nearClicks,
        totalPosts: dates.length,
        correlation: dates.length > 0 ? Math.round((nearClicks / dates.length) * 100) : 0,
      };
    }

    let aiRecommendations = '';
    try {
      const settings: AISettings = {
        provider: 'xai', model: 'grok-3-mini-fast', maxTokens: 500, temperature: 0.7,
        systemPrompt: 'You are a content strategy advisor for affiliate marketers. Analyze posting patterns and give specific, data-backed recommendations. When recommending content actions, reference these available tools: AI Post Writer (for generating platform-specific posts), AI Email Drafter (for email campaigns), Deep Link Generator (for tracking links to specific pages), QR Code Generator (for offline-to-online conversion), and Content Calendar (for scheduling and planning).',
      };
      const result = await chatCompletion(settings, [
        { role: 'system', content: settings.systemPrompt },
        { role: 'user', content: `Analyze this affiliate's content patterns and recommend optimal promotion frequency. When giving recommendations, suggest which tools from the platform they should use (AI Post Writer, AI Email Drafter, Deep Link Generator, QR Code Generator, Content Calendar).

WEEKLY ACTIVITY: ${JSON.stringify(weeklyActivity.slice(-12))}
HIGH ACTIVITY WEEKS conversion rate: ${highActivityConvRate.toFixed(1)}%
LOW ACTIVITY WEEKS conversion rate: ${lowActivityConvRate.toFixed(1)}%
AVERAGE GAP BETWEEN POSTS: ${avgGap} days
PLATFORM CORRELATION (posts near affiliate clicks): ${JSON.stringify(platformCorrelation)}

Questions to answer:
1. What's the optimal posting frequency for this affiliate?
2. Which platforms correlate most with affiliate clicks?
3. Is there posting fatigue (too frequent = lower conversion)?
4. Specific recommendations for next month.` },
      ]);
      aiRecommendations = result.content;
    } catch {
      aiRecommendations = 'AI recommendations temporarily unavailable.';
    }

    const suggestedTools = [
      { tool: 'AI Post Writer', route: '/affiliate/dashboard?tab=tools&subtool=post-writer', reason: 'Generate platform-specific promotional posts optimized for your best-performing channels' },
      { tool: 'AI Email Drafter', route: '/affiliate/dashboard?tab=tools&subtool=email-drafter', reason: 'Create email campaigns to re-engage your referral audience' },
      { tool: 'Deep Link Generator', route: '/affiliate/dashboard?tab=tools&subtool=deep-links', reason: 'Create tracked links to specific pages for targeted promotions' },
      { tool: 'QR Code Generator', route: '/affiliate/dashboard?tab=tools&subtool=qr-codes', reason: 'Generate QR codes for offline-to-online referral tracking' },
      { tool: 'Content Calendar', route: '/affiliate/dashboard?tab=tools&subtool=content-calendar', reason: 'Plan and schedule your promotional content for consistent posting' },
    ];

    return NextResponse.json({
      frequencyAnalysis: {
        avgGapDays: avgGap,
        highActivityConvRate: Math.round(highActivityConvRate * 10) / 10,
        lowActivityConvRate: Math.round(lowActivityConvRate * 10) / 10,
        recommendation: highActivityConvRate > lowActivityConvRate
          ? 'More frequent posting correlates with higher conversions for you'
          : 'Less frequent, higher-quality posts seem to convert better for you',
        totalActiveWeeks: activeWeeks.length,
      },
      weeklyActivity: weeklyActivity.slice(-12),
      platformCorrelation: Object.entries(platformCorrelation)
        .map(([platform, data]) => ({ platform, ...data }))
        .sort((a, b) => b.correlation - a.correlation),
      aiRecommendations,
      suggestedTools,
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Content intelligence error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
