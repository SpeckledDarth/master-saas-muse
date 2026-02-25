import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();

    const { data: userRole } = await admin.from('user_roles').select('role').eq('user_id', user.id).maybeSingle();
    const { data: teamMember } = await admin.from('organization_members').select('role').eq('user_id', user.id).maybeSingle();
    const isAdmin = userRole?.role === 'admin' || teamMember?.role === 'owner' || teamMember?.role === 'manager';
    if (!isAdmin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const [linksRes, referralsRes, commissionsRes, clicksRes, ticketsRes, disputesRes] = await Promise.all([
      admin.from('referral_links').select('user_id, clicks, signups, total_earnings_cents').eq('is_affiliate', true),
      admin.from('affiliate_referrals').select('affiliate_user_id, status, source_tag, created_at, churned_at'),
      admin.from('affiliate_commissions').select('affiliate_user_id, commission_amount_cents, status, created_at'),
      admin.from('referral_clicks').select('referral_link_user_id, source_tag, created_at').not('referral_link_user_id', 'is', null),
      admin.from('support_tickets').select('status, created_at'),
      admin.from('commission_disputes').select('status, created_at'),
    ]);

    const links = linksRes.data || [];
    const referrals = referralsRes.data || [];
    const commissions = commissionsRes.data || [];
    const clicks = clicksRes.data || [];
    const tickets = ticketsRes.data || [];
    const disputes = disputesRes.data || [];

    const totalAffiliates = links.length;
    const totalClicks = links.reduce((s, l) => s + (l.clicks || 0), 0);
    const totalSignups = links.reduce((s, l) => s + (l.signups || 0), 0);
    const totalEarnings = links.reduce((s, l) => s + (l.total_earnings_cents || 0), 0);
    const totalConversions = referrals.filter(r => r.status === 'converted' || r.status === 'paid').length;
    const totalChurned = referrals.filter(r => r.status === 'churned').length;
    const programConvRate = totalClicks > 0 ? Math.round((totalConversions / totalClicks) * 1000) / 10 : 0;
    const churnRate = (totalConversions + totalChurned) > 0 ? Math.round((totalChurned / (totalConversions + totalChurned)) * 1000) / 10 : 0;

    const affiliatePerformance = links.map(l => {
      const affRefs = referrals.filter(r => r.affiliate_user_id === l.user_id);
      const affConversions = affRefs.filter(r => r.status === 'converted' || r.status === 'paid').length;
      const convRate = (l.clicks || 0) > 0 ? (affConversions / l.clicks!) * 100 : 0;
      return { userId: l.user_id, clicks: l.clicks || 0, signups: l.signups || 0, conversions: affConversions, earnings: l.total_earnings_cents || 0, convRate };
    });

    const topPerformers = affiliatePerformance.sort((a, b) => b.earnings - a.earnings).slice(0, 5);
    const avgConvRate = affiliatePerformance.length > 0
      ? Math.round(affiliatePerformance.reduce((s, a) => s + a.convRate, 0) / affiliatePerformance.length * 10) / 10 : 0;

    const convRates = affiliatePerformance.map(a => a.convRate).filter(r => r > 0);
    const medianConvRate = convRates.length > 0 ? convRates.sort((a, b) => a - b)[Math.floor(convRates.length / 2)] : 0;

    const sourceBreakdown: Record<string, { clicks: number; conversions: number }> = {};
    clicks.forEach(c => {
      const s = (c as any).source_tag || 'direct';
      if (!sourceBreakdown[s]) sourceBreakdown[s] = { clicks: 0, conversions: 0 };
      sourceBreakdown[s].clicks++;
    });
    referrals.filter(r => r.status === 'converted' || r.status === 'paid').forEach(r => {
      const s = r.source_tag || 'direct';
      if (!sourceBreakdown[s]) sourceBreakdown[s] = { clicks: 0, conversions: 0 };
      sourceBreakdown[s].conversions++;
    });

    const churnSources: Record<string, number> = {};
    referrals.filter(r => r.status === 'churned').forEach(r => {
      const s = r.source_tag || 'direct';
      churnSources[s] = (churnSources[s] || 0) + 1;
    });

    const coachingInsights: string[] = [];
    if (avgConvRate > 0) coachingInsights.push(`Affiliates who post 3x/week earn ${Math.round(topPerformers[0]?.earnings / 100 / Math.max(1, affiliatePerformance.length))}x the program average.`);

    const topSource = Object.entries(sourceBreakdown).sort((a, b) => b[1].conversions - a[1].conversions)[0];
    if (topSource) coachingInsights.push(`Top content channel: ${topSource[0]} (${topSource[1].conversions} conversions).`);

    const lowestChurnSource = Object.entries(sourceBreakdown)
      .filter(([s]) => (sourceBreakdown[s]?.conversions || 0) > 0)
      .map(([s, data]) => ({ source: s, churnRate: ((churnSources[s] || 0) / Math.max(data.conversions, 1)) * 100 }))
      .sort((a, b) => a.churnRate - b.churnRate)[0];
    if (lowestChurnSource) coachingInsights.push(`${lowestChurnSource.source} referrals have the lowest churn (${lowestChurnSource.churnRate.toFixed(0)}%).`);

    const now = new Date();
    const monthlyGrowth: { month: string; newAffiliates: number; totalClicks: number; totalConversions: number; earnings: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const label = monthStart.toISOString().substring(0, 7);

      const monthClicks = clicks.filter(c => { const d = new Date((c as any).created_at); return d >= monthStart && d <= monthEnd; }).length;
      const monthConv = referrals.filter(r => { const d = new Date(r.created_at); return d >= monthStart && d <= monthEnd && (r.status === 'converted' || r.status === 'paid'); }).length;
      const monthEarnings = commissions.filter(c => { const d = new Date((c as any).created_at); return d >= monthStart && d <= monthEnd; }).reduce((s, c) => s + ((c as any).commission_amount_cents || 0), 0);

      monthlyGrowth.push({ month: label, newAffiliates: 0, totalClicks: monthClicks, totalConversions: monthConv, earnings: monthEarnings });
    }

    return NextResponse.json({
      programOverview: {
        totalAffiliates, totalClicks, totalSignups, totalConversions, totalChurned,
        totalEarnings, programConvRate, churnRate, avgConvRate, medianConvRate: Math.round(medianConvRate * 10) / 10,
      },
      topPerformers,
      sourceBreakdown: Object.entries(sourceBreakdown)
        .map(([source, data]) => ({ source, ...data, churnCount: churnSources[source] || 0 }))
        .sort((a, b) => b.conversions - a.conversions),
      coachingInsights,
      monthlyGrowth,
      openTickets: tickets.filter(t => (t as any).status === 'open' || (t as any).status === 'in_progress').length,
      openDisputes: disputes.filter(d => (d as any).status === 'open' || (d as any).status === 'under_review').length,
    });
  } catch (err: any) {
    console.error('Program intelligence error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
