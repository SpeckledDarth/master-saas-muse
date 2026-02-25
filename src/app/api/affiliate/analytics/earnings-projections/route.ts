import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();

    const { data: link } = await admin
      .from('referral_links')
      .select('is_affiliate, total_earnings_cents, signups, clicks, pending_earnings_cents')
      .eq('user_id', user.id)
      .eq('is_affiliate', true)
      .maybeSingle();

    if (!link?.is_affiliate) {
      return NextResponse.json({ error: 'Not an affiliate' }, { status: 403 });
    }

    const [
      commissionsRes,
      referralsRes,
      tiersRes,
      milestonesRes,
      awardsRes,
      goalsRes,
    ] = await Promise.all([
      admin.from('affiliate_commissions').select('commission_amount_cents, created_at, status').eq('affiliate_user_id', user.id),
      admin.from('affiliate_referrals').select('id, status, created_at').eq('affiliate_user_id', user.id),
      admin.from('affiliate_tiers').select('*').order('min_referrals', { ascending: true }),
      admin.from('affiliate_milestones').select('id, name, referral_threshold, bonus_cents').eq('is_active', true).order('referral_threshold', { ascending: true }),
      admin.from('affiliate_milestone_awards').select('milestone_id').eq('affiliate_user_id', user.id),
      admin.from('affiliate_goals').select('*').eq('user_id', user.id).eq('is_active', true).maybeSingle(),
    ]);

    const commissions = commissionsRes.data || [];
    const referrals = referralsRes.data || [];
    const tiers = tiersRes.data || [];
    const milestones = milestonesRes.data || [];
    const earnedMilestoneIds = new Set((awardsRes.data || []).map((a: any) => a.milestone_id));
    const activeGoal = goalsRes.data;

    const activeReferrals = referrals.filter(r => r.status === 'converted' || r.status === 'paid').length;
    const totalEarnings = link.total_earnings_cents || commissions.reduce((s, c: any) => s + (c.commission_amount_cents || 0), 0);

    const now = new Date();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000);

    const recentCommissions = commissions.filter(c => new Date((c as any).created_at) >= fourteenDaysAgo);

    const dailyTotals: Record<string, number> = {};
    recentCommissions.forEach((c: any) => {
      const day = new Date(c.created_at).toISOString().split('T')[0];
      dailyTotals[day] = (dailyTotals[day] || 0) + (c.commission_amount_cents || 0);
    });

    const dayValues = Object.values(dailyTotals);
    const dailyAvg = dayValues.length > 0
      ? dayValues.reduce((s, v) => s + v, 0) / 14
      : 0;

    let variance = 0;
    if (dayValues.length > 1) {
      const mean = dayValues.reduce((s, v) => s + v, 0) / dayValues.length;
      variance = Math.sqrt(
        dayValues.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / dayValues.length
      );
    }

    const monthlyEarnings: Record<string, number> = {};
    commissions.forEach((c: any) => {
      const m = c.created_at?.substring(0, 7);
      if (m) monthlyEarnings[m] = (monthlyEarnings[m] || 0) + (c.commission_amount_cents || 0);
    });

    const sortedMonths = Object.entries(monthlyEarnings).sort((a, b) => a[0].localeCompare(b[0]));
    const recentMonths = sortedMonths.slice(-6);
    const avgMonthlyEarnings = recentMonths.length > 0
      ? Math.round(recentMonths.reduce((s, [, v]) => s + v, 0) / recentMonths.length)
      : 0;

    let monthlyGrowthRate = 0;
    if (recentMonths.length >= 2) {
      const rates: number[] = [];
      for (let i = 1; i < recentMonths.length; i++) {
        const prev = recentMonths[i - 1][1];
        const curr = recentMonths[i][1];
        if (prev > 0) {
          rates.push((curr - prev) / prev);
        }
      }
      if (rates.length > 0) {
        monthlyGrowthRate = rates.reduce((s, r) => s + r, 0) / rates.length;
      }
    }

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    const daysRemaining = daysInMonth - dayOfMonth;

    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthSoFar = monthlyEarnings[currentMonthKey] || 0;
    const projectedCurrentMonth = Math.round(monthSoFar + (dailyAvg * daysRemaining));

    const multiMonthProjections = [3, 6, 12].map(months => {
      const baseMonthly = avgMonthlyEarnings;
      let totalProjected = 0;
      let monthlyBreakdown: { month: string; projected: number; optimistic: number; pessimistic: number }[] = [];

      for (let i = 1; i <= months; i++) {
        const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const monthKey = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}`;

        const growthFactor = Math.pow(1 + monthlyGrowthRate, i);
        const projected = Math.round(baseMonthly * growthFactor);
        const monthVariance = Math.round(variance * 30 * Math.sqrt(i) * 0.3);
        const optimistic = projected + monthVariance;
        const pessimistic = Math.max(0, projected - monthVariance);

        totalProjected += projected;
        monthlyBreakdown.push({ month: monthKey, projected, optimistic, pessimistic });
      }

      return {
        months,
        totalProjected,
        avgMonthlyProjected: Math.round(totalProjected / months),
        monthlyBreakdown,
      };
    });

    const annualProjection = (() => {
      const currentYear = now.getFullYear();
      const yearCommissions = commissions.filter((c: any) => c.created_at?.startsWith(String(currentYear)));
      const earnedThisYear = yearCommissions.reduce((s, c: any) => s + (c.commission_amount_cents || 0), 0);

      const monthsElapsed = now.getMonth() + (dayOfMonth / daysInMonth);
      const projectedAnnual = monthsElapsed > 0
        ? Math.round(earnedThisYear / monthsElapsed * 12)
        : 0;

      const growthAdjusted = avgMonthlyEarnings > 0
        ? Math.round(multiMonthProjections[2].totalProjected + earnedThisYear)
        : projectedAnnual;

      return {
        earnedThisYear,
        projectedAnnual,
        growthAdjustedAnnual: growthAdjusted,
        monthsElapsed: Math.round(monthsElapsed * 10) / 10,
      };
    })();

    let currentTierIdx = 0;
    for (let i = tiers.length - 1; i >= 0; i--) {
      if (activeReferrals >= tiers[i].min_referrals) {
        currentTierIdx = i;
        break;
      }
    }

    const tierProjections = (() => {
      const nextTier = tiers[currentTierIdx + 1] || null;
      if (!nextTier) return null;

      const referralsNeeded = Math.max(0, nextTier.min_referrals - activeReferrals);

      const recentReferralMonths: Record<string, number> = {};
      referrals.forEach((r: any) => {
        const m = r.created_at?.substring(0, 7);
        if (m) recentReferralMonths[m] = (recentReferralMonths[m] || 0) + 1;
      });
      const refMonthValues = Object.values(recentReferralMonths);
      const avgMonthlyReferrals = refMonthValues.length > 0
        ? refMonthValues.reduce((s, v) => s + v, 0) / refMonthValues.length
        : 0;

      const monthsToNextTier = avgMonthlyReferrals > 0
        ? Math.ceil(referralsNeeded / avgMonthlyReferrals)
        : null;

      const estimatedDate = monthsToNextTier
        ? new Date(now.getFullYear(), now.getMonth() + monthsToNextTier, now.getDate()).toISOString().split('T')[0]
        : null;

      const rateIncrease = nextTier.commission_rate - (tiers[currentTierIdx]?.commission_rate || 0);
      const additionalMonthlyEarnings = avgMonthlyEarnings > 0 && (tiers[currentTierIdx]?.commission_rate || 0) > 0
        ? Math.round(avgMonthlyEarnings * (rateIncrease / (tiers[currentTierIdx]?.commission_rate || 1)))
        : 0;

      return {
        currentTier: tiers[currentTierIdx]?.name || 'Starter',
        currentRate: tiers[currentTierIdx]?.commission_rate || 0,
        nextTier: nextTier.name,
        nextRate: nextTier.commission_rate,
        referralsNeeded,
        avgMonthlyReferrals: Math.round(avgMonthlyReferrals * 10) / 10,
        estimatedMonths: monthsToNextTier,
        estimatedDate,
        additionalMonthlyEarnings,
      };
    })();

    const milestoneProjections = (() => {
      const unearnedMilestones = milestones.filter((m: any) => !earnedMilestoneIds.has(m.id));
      if (unearnedMilestones.length === 0) return { upcoming: [], totalPotentialBonus: 0 };

      const refMonthValues: Record<string, number> = {};
      referrals.forEach((r: any) => {
        const m = r.created_at?.substring(0, 7);
        if (m) refMonthValues[m] = (refMonthValues[m] || 0) + 1;
      });
      const monthVals = Object.values(refMonthValues);
      const avgMonthlyRefs = monthVals.length > 0
        ? monthVals.reduce((s, v) => s + v, 0) / monthVals.length
        : 0;

      const upcoming = unearnedMilestones.slice(0, 5).map((m: any) => {
        const referralsNeeded = Math.max(0, m.referral_threshold - activeReferrals);
        const monthsToReach = avgMonthlyRefs > 0 ? Math.ceil(referralsNeeded / avgMonthlyRefs) : null;
        const estimatedDate = monthsToReach
          ? new Date(now.getFullYear(), now.getMonth() + monthsToReach, now.getDate()).toISOString().split('T')[0]
          : null;

        return {
          name: m.name,
          threshold: m.referral_threshold,
          bonusCents: m.bonus_cents || 0,
          referralsNeeded,
          currentReferrals: activeReferrals,
          progress: m.referral_threshold > 0 ? Math.min(1, activeReferrals / m.referral_threshold) : 1,
          estimatedMonths: monthsToReach,
          estimatedDate,
        };
      });

      const totalPotentialBonus = unearnedMilestones.reduce((s, m: any) => s + (m.bonus_cents || 0), 0);

      return { upcoming, totalPotentialBonus };
    })();

    const goalProjection = (() => {
      if (!activeGoal) return null;

      const goalEarnings = commissions
        .filter((c: any) => c.created_at >= activeGoal.period_start && c.created_at <= activeGoal.period_end)
        .reduce((s, c: any) => s + (c.commission_amount_cents || 0), 0);

      const totalDays = Math.max(1, (new Date(activeGoal.period_end).getTime() - new Date(activeGoal.period_start).getTime()) / 86400000);
      const daysElapsed = Math.max(1, (now.getTime() - new Date(activeGoal.period_start).getTime()) / 86400000);
      const daysLeft = Math.max(0, Math.ceil((new Date(activeGoal.period_end).getTime() - now.getTime()) / 86400000));

      const dailyRate = goalEarnings / daysElapsed;
      const projectedTotal = Math.round(goalEarnings + (dailyRate * daysLeft));
      const progress = activeGoal.target_cents > 0 ? Math.min(100, Math.round((goalEarnings / activeGoal.target_cents) * 100)) : 0;

      const onTrack = projectedTotal >= activeGoal.target_cents;
      const remaining = Math.max(0, activeGoal.target_cents - goalEarnings);
      const dailyNeeded = daysLeft > 0 ? Math.round(remaining / daysLeft) : remaining;

      let estimatedCompletionDate: string | null = null;
      if (dailyRate > 0 && remaining > 0) {
        const daysToComplete = Math.ceil(remaining / dailyRate);
        const completionDate = new Date(now.getTime() + daysToComplete * 86400000);
        estimatedCompletionDate = completionDate.toISOString().split('T')[0];
      } else if (remaining <= 0) {
        estimatedCompletionDate = 'achieved';
      }

      return {
        goalId: activeGoal.id,
        targetCents: activeGoal.target_cents,
        period: activeGoal.period,
        earnedCents: goalEarnings,
        progress,
        projectedTotal,
        onTrack,
        remainingCents: remaining,
        dailyNeededCents: dailyNeeded,
        daysLeft,
        estimatedCompletionDate,
      };
    })();

    const historicalTrend = sortedMonths.slice(-12).map(([month, amount]) => ({
      month,
      amount,
    }));

    return NextResponse.json({
      currentMonth: {
        monthSoFar,
        projectedTotal: projectedCurrentMonth,
        optimistic: Math.round(projectedCurrentMonth + variance * Math.sqrt(daysRemaining) * 0.5),
        pessimistic: Math.max(0, Math.round(projectedCurrentMonth - variance * Math.sqrt(daysRemaining) * 0.5)),
        dailyAvg: Math.round(dailyAvg),
        daysRemaining,
      },
      multiMonthProjections,
      annualProjection,
      tierProjections,
      milestoneProjections,
      goalProjection,
      historicalTrend,
      summary: {
        totalEarnings,
        activeReferrals,
        avgMonthlyEarnings,
        monthlyGrowthRate: Math.round(monthlyGrowthRate * 1000) / 10,
        currentTier: tiers[currentTierIdx]?.name || 'Starter',
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Earnings projections error:', err);
    return NextResponse.json({ error: err.message || 'Failed to load earnings projections' }, { status: 500 });
  }
}
