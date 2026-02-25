import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();

    const [commissionsRes, payoutsRes, invoicesRes, referralsRes, settingsRes, linkRes] = await Promise.all([
      admin.from('affiliate_commissions').select('commission_amount_cents, status, created_at').eq('affiliate_user_id', user.id),
      admin.from('affiliate_payouts').select('total_amount_cents, status, created_at').eq('affiliate_user_id', user.id),
      admin.from('invoices').select('amount_cents, status, created_at').eq('user_id', user.id),
      admin.from('affiliate_referrals').select('status, created_at').eq('affiliate_user_id', user.id),
      admin.from('affiliate_program_settings').select('payout_schedule_day, min_payout_cents').maybeSingle(),
      admin.from('referral_links').select('pending_earnings_cents').eq('user_id', user.id).eq('is_affiliate', true).maybeSingle(),
    ]);

    const commissions = commissionsRes.data || [];
    const payouts = payoutsRes.data || [];
    const invoices = invoicesRes.data || [];
    const referrals = referralsRes.data || [];

    const scheduleDay = settingsRes.data?.payout_schedule_day || 15;
    const minPayoutCents = settingsRes.data?.min_payout_cents || 5000;

    const totalEarned = commissions.reduce((s, c) => s + ((c as any).commission_amount_cents || 0), 0);
    const totalPaidOut = payouts.filter(p => (p as any).status === 'completed' || (p as any).status === 'paid').reduce((s, p) => s + ((p as any).total_amount_cents || 0), 0);

    const pendingFromCommissions = commissions.filter(c => (c as any).status === 'approved').reduce((s: number, c: any) => s + (c.commission_amount_cents || 0), 0);
    const pendingFromLink = linkRes.data?.pending_earnings_cents || 0;
    const pendingEarnings = Math.max(pendingFromCommissions, pendingFromLink);

    const now = new Date();
    let nextPayoutDate: Date;
    if (now.getDate() < scheduleDay) {
      nextPayoutDate = new Date(now.getFullYear(), now.getMonth(), scheduleDay);
    } else {
      nextPayoutDate = new Date(now.getFullYear(), now.getMonth() + 1, scheduleDay);
    }
    const meetsMinimum = pendingEarnings >= minPayoutCents;
    const thresholdProgress = minPayoutCents > 0 ? Math.min(100, Math.round((pendingEarnings / minPayoutCents) * 100)) : 100;

    const totalSubscriptionCost = invoices.filter(i => (i as any).status === 'paid').reduce((s, i) => s + ((i as any).amount_cents || 0), 0);

    const netIncome = totalEarned - totalSubscriptionCost;
    const roi = totalSubscriptionCost > 0 ? Math.round((totalEarned / totalSubscriptionCost) * 100) : 0;

    const monthlyBreakdown: { month: string; earned: number; spent: number; net: number }[] = [];
    const earningsByMonth: Record<string, number> = {};
    const spendByMonth: Record<string, number> = {};

    commissions.forEach(c => {
      const m = (c as any).created_at?.substring(0, 7);
      if (m) earningsByMonth[m] = (earningsByMonth[m] || 0) + ((c as any).commission_amount_cents || 0);
    });
    invoices.filter(i => (i as any).status === 'paid').forEach(i => {
      const m = (i as any).created_at?.substring(0, 7);
      if (m) spendByMonth[m] = (spendByMonth[m] || 0) + ((i as any).amount_cents || 0);
    });

    const allMonths = [...new Set([...Object.keys(earningsByMonth), ...Object.keys(spendByMonth)])].sort();
    let breakEvenMonth: string | null = null;
    let cumulativeNet = 0;

    allMonths.forEach(m => {
      const earned = earningsByMonth[m] || 0;
      const spent = spendByMonth[m] || 0;
      const net = earned - spent;
      cumulativeNet += net;
      monthlyBreakdown.push({ month: m, earned, spent, net });
      if (!breakEvenMonth && cumulativeNet > 0) breakEvenMonth = m;
    });

    const lastThreeMonths = commissions.filter(c => {
      const d = new Date((c as any).created_at);
      return (now.getTime() - d.getTime()) < 90 * 86400000;
    });
    const avgMonthlyEarnings = lastThreeMonths.length > 0
      ? Math.round(lastThreeMonths.reduce((s, c) => s + ((c as any).commission_amount_cents || 0), 0) / 3)
      : 0;

    const avgMonthlySpend = allMonths.length > 0
      ? Math.round(Object.values(spendByMonth).reduce((s, v) => s + v, 0) / Math.max(allMonths.length, 1))
      : 0;

    const projectedAnnualNet = (avgMonthlyEarnings - avgMonthlySpend) * 12;

    return NextResponse.json({
      overview: {
        totalEarned,
        totalPaidOut,
        pendingEarnings,
        totalSubscriptionCost,
        netIncome,
        roi,
        breakEvenMonth,
      },
      projections: {
        avgMonthlyEarnings,
        avgMonthlySpend,
        monthlyNet: avgMonthlyEarnings - avgMonthlySpend,
        projectedAnnualNet,
        subscriptionPaysForItself: avgMonthlyEarnings >= avgMonthlySpend,
      },
      monthlyBreakdown: monthlyBreakdown.slice(-12),
      activeReferrals: referrals.filter(r => r.status === 'converted' || r.status === 'paid').length,
      totalReferrals: referrals.length,
      payoutSchedule: {
        nextPayoutDate: nextPayoutDate.toISOString(),
        minimumThresholdCents: minPayoutCents,
        pendingAmountCents: pendingEarnings,
        meetsMinimum,
        thresholdProgress,
        scheduleDay,
      },
    });
  } catch (err: any) {
    console.error('Financial overview error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
