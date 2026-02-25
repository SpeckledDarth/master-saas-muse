import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const milestones = [1000, 5000, 10000, 25000, 50000, 100000];

    const { data: commissions } = await supabase
      .from('affiliate_commissions')
      .select('amount_cents, created_at')
      .eq('affiliate_user_id', user.id)
      .order('created_at', { ascending: true });

    if (!commissions || commissions.length === 0) {
      return NextResponse.json({ milestones: [], achievements: [] });
    }

    const userStart = new Date(commissions[0].created_at);
    let runningTotal = 0;
    const achievements: { milestone_cents: number; days_to_reach: number; reached_at: string }[] = [];

    for (const c of commissions) {
      runningTotal += c.amount_cents || 0;
      for (const m of milestones) {
        if (runningTotal >= m && !achievements.find(a => a.milestone_cents === m)) {
          const daysToReach = Math.ceil((new Date(c.created_at).getTime() - userStart.getTime()) / 86400000);
          achievements.push({ milestone_cents: m, days_to_reach: daysToReach, reached_at: c.created_at });
        }
      }
    }

    const { data: allAffiliates } = await supabase
      .from('affiliate_commissions')
      .select('affiliate_user_id, amount_cents, created_at')
      .order('created_at', { ascending: true });

    const affiliateEarnings: Record<string, { start: string; total: number; milestoneDays: Record<number, number> }> = {};
    for (const c of (allAffiliates || [])) {
      if (!affiliateEarnings[c.affiliate_user_id]) {
        affiliateEarnings[c.affiliate_user_id] = { start: c.created_at, total: 0, milestoneDays: {} };
      }
      const af = affiliateEarnings[c.affiliate_user_id];
      af.total += c.amount_cents || 0;
      for (const m of milestones) {
        if (af.total >= m && !af.milestoneDays[m]) {
          af.milestoneDays[m] = Math.ceil((new Date(c.created_at).getTime() - new Date(af.start).getTime()) / 86400000);
        }
      }
    }

    const totalAffiliates = Object.keys(affiliateEarnings).length;
    const enrichedAchievements = achievements.map(a => {
      let fasterThanCount = 0;
      for (const af of Object.values(affiliateEarnings)) {
        if (af.milestoneDays[a.milestone_cents] && af.milestoneDays[a.milestone_cents] > a.days_to_reach) {
          fasterThanCount++;
        }
      }
      const percentile = totalAffiliates > 1 ? Math.round((fasterThanCount / (totalAffiliates - 1)) * 100) : 100;
      return { ...a, percentile, faster_than: fasterThanCount, total_affiliates: totalAffiliates };
    });

    return NextResponse.json({ achievements: enrichedAchievements, total_earned_cents: runningTotal });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
