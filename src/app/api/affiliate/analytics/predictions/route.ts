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

    const [commissionsRes, referralsRes, clicksRes, tierRes, linkRes, milestonesRes, awardsRes, contestsRes] = await Promise.all([
      admin.from('affiliate_commissions').select('commission_amount_cents, created_at').eq('affiliate_user_id', user.id),
      admin.from('affiliate_referrals').select('status, created_at, converted_at, churned_at').eq('affiliate_user_id', user.id),
      admin.from('referral_clicks').select('created_at').eq('referral_link_user_id', user.id),
      admin.from('affiliate_tiers').select('name, min_referrals, min_earnings_cents').order('min_referrals', { ascending: true }),
      admin.from('referral_links').select('clicks, signups, total_earnings_cents').eq('user_id', user.id).eq('is_affiliate', true).maybeSingle(),
      admin.from('affiliate_milestones').select('id, name, referral_threshold, bonus_cents').order('referral_threshold', { ascending: true }),
      admin.from('affiliate_milestone_awards').select('milestone_id').eq('affiliate_user_id', user.id),
      admin.from('affiliate_contests').select('id, name, metric, start_date, end_date, prizes').lte('start_date', new Date().toISOString()).gte('end_date', new Date().toISOString()),
    ]);

    const commissions = commissionsRes.data || [];
    const referrals = referralsRes.data || [];
    const clicks = clicksRes.data || [];
    const tiers = tierRes.data || [];
    const link = linkRes.data;

    const totalEarnings = link?.total_earnings_cents || commissions.reduce((s, c) => s + ((c as any).commission_amount_cents || 0), 0);
    const activeReferrals = referrals.filter(r => r.status === 'converted' || r.status === 'paid').length;

    let currentTierIdx = 0;
    for (let i = tiers.length - 1; i >= 0; i--) {
      if (activeReferrals >= tiers[i].min_referrals && totalEarnings >= tiers[i].min_earnings_cents) {
        currentTierIdx = i;
        break;
      }
    }

    const nextTier = tiers[currentTierIdx + 1] || null;
    let tierProjection = null;
    if (nextTier) {
      const monthlyEarnings: Record<string, number> = {};
      commissions.forEach(c => {
        const m = (c as any).created_at?.substring(0, 7);
        if (m) monthlyEarnings[m] = (monthlyEarnings[m] || 0) + ((c as any).commission_amount_cents || 0);
      });
      const recentMonths = Object.entries(monthlyEarnings).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 3);
      const avgMonthlyEarnings = recentMonths.length > 0 ? recentMonths.reduce((s, [, v]) => s + v, 0) / recentMonths.length : 0;

      const earningsNeeded = Math.max(0, nextTier.min_earnings_cents - totalEarnings);
      const referralsNeeded = Math.max(0, nextTier.min_referrals - activeReferrals);

      const monthsToTier = avgMonthlyEarnings > 0 ? Math.ceil(earningsNeeded / avgMonthlyEarnings) : null;
      const targetDate = monthsToTier ? new Date(Date.now() + monthsToTier * 30 * 86400000) : null;

      tierProjection = {
        currentTier: tiers[currentTierIdx]?.name || 'Starter',
        nextTier: nextTier.name,
        earningsNeeded,
        referralsNeeded,
        avgMonthlyEarnings: Math.round(avgMonthlyEarnings),
        estimatedMonths: monthsToTier,
        estimatedDate: targetDate?.toISOString().split('T')[0] || null,
      };
    }

    const churned = referrals.filter(r => r.status === 'churned');
    const converted = referrals.filter(r => r.converted_at && r.churned_at);
    const churnTimings = converted.map(r => {
      const months = (new Date(r.churned_at!).getTime() - new Date(r.converted_at!).getTime()) / (30 * 86400000);
      return Math.round(months);
    });
    const avgChurnMonth = churnTimings.length > 0 ? Math.round(churnTimings.reduce((s, v) => s + v, 0) / churnTimings.length) : null;
    const churnPrediction = avgChurnMonth ? `Your referrals typically churn around month ${avgChurnMonth}. Check in at month ${Math.max(1, avgChurnMonth - 1)} to improve retention.` : null;

    const milestones = milestonesRes.data || [];
    const earnedMilestoneIds = new Set((awardsRes.data || []).map((a: any) => a.milestone_id));
    const unearnedMilestones = milestones.filter((m: any) => !earnedMilestoneIds.has(m.id));
    const nextMilestone = unearnedMilestones.length > 0
      ? {
          name: unearnedMilestones[0].name,
          threshold: unearnedMilestones[0].referral_threshold,
          current: activeReferrals,
          bonusCents: unearnedMilestones[0].bonus_cents || 0,
          referralsNeeded: Math.max(0, unearnedMilestones[0].referral_threshold - activeReferrals),
        }
      : null;

    const contests = contestsRes.data || [];
    const activeContests = contests.map((c: any) => ({
      name: c.name,
      metric: c.metric || 'referrals',
      daysLeft: Math.max(0, Math.ceil((new Date(c.end_date).getTime() - Date.now()) / 86400000)),
      prizes: c.prizes,
    }));

    const monthlyClicks: Record<string, number> = {};
    clicks.forEach(c => {
      const m = (c as any).created_at?.substring(0, 7);
      if (m) monthlyClicks[m] = (monthlyClicks[m] || 0) + 1;
    });
    const clickMonths = Object.entries(monthlyClicks).sort((a, b) => a[0].localeCompare(b[0]));
    const seasonalPattern = clickMonths.length >= 6 ? clickMonths.map(([month, count]) => ({
      month: new Date(month + '-01').toLocaleString('en-US', { month: 'short' }),
      clicks: count,
    })) : null;

    let aiPredictions = '';
    try {
      const settings: AISettings = {
        provider: 'xai', model: 'grok-3-mini-fast', maxTokens: 500, temperature: 0.7,
        systemPrompt: 'You are a predictive analytics advisor for affiliate marketers. Make specific, data-backed predictions. Be concise.',
      };
      const result = await chatCompletion(settings, [
        { role: 'system', content: settings.systemPrompt },
        { role: 'user', content: `Based on this affiliate's data, make 3-4 specific predictions:

TOTAL EARNINGS: $${(totalEarnings / 100).toFixed(2)}
ACTIVE REFERRALS: ${activeReferrals}
CHURNED: ${churned.length}
CURRENT TIER: ${tiers[currentTierIdx]?.name || 'Starter'}
NEXT TIER: ${nextTier?.name || 'Max tier reached'}
AVG CHURN MONTH: ${avgChurnMonth || 'Not enough data'}
MONTHLY CLICK TREND: ${JSON.stringify(clickMonths.slice(-6))}
SEASONAL PATTERN: ${JSON.stringify(seasonalPattern?.slice(-6))}
${nextMilestone ? `NEXT MILESTONE: "${nextMilestone.name}" — ${nextMilestone.referralsNeeded} more referrals needed (at ${nextMilestone.current}/${nextMilestone.threshold}) for $${(nextMilestone.bonusCents / 100).toFixed(2)} bonus` : 'ALL MILESTONES ACHIEVED'}
${activeContests.length > 0 ? `ACTIVE CONTESTS: ${activeContests.map(c => `"${c.name}" (${c.metric}, ${c.daysLeft} days left)`).join(', ')}` : 'NO ACTIVE CONTESTS'}

Predict: tier trajectory, earnings forecast, churn risk windows, best months to push hard.${nextMilestone ? ` Also predict when they'll hit the next milestone.` : ''}${activeContests.length > 0 ? ` Factor in active contests and suggest strategies to maximize contest performance.` : ''}` },
      ]);
      aiPredictions = result.content;
    } catch {
      aiPredictions = 'AI predictions temporarily unavailable.';
    }

    return NextResponse.json({
      tierProjection,
      churnPrediction,
      seasonalPattern,
      aiPredictions,
      nextMilestone,
      activeContests,
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Predictions error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
