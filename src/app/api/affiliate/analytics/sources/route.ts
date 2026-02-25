import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();

    const [clicksRes, commissionsRes, referralsRes] = await Promise.all([
      admin.from('referral_clicks').select('source_tag, country, device_type, created_at, ref_code').eq('referral_link_user_id', user.id),
      admin.from('affiliate_commissions').select('commission_amount_cents, created_at').eq('affiliate_user_id', user.id),
      admin.from('affiliate_referrals').select('source_tag, created_at, status').eq('affiliate_user_id', user.id),
    ]);

    const clicks = clicksRes.data || [];
    const commissions = commissionsRes.data || [];
    const referrals = referralsRes.data || [];

    const revenueBySource: Record<string, number> = {};
    referrals.forEach(r => {
      const source = r.source_tag || 'direct';
      if (!revenueBySource[source]) revenueBySource[source] = 0;
    });
    const convBySource: Record<string, number> = {};
    referrals.filter(r => r.status === 'converted' || r.status === 'paid').forEach(r => {
      const source = r.source_tag || 'direct';
      convBySource[source] = (convBySource[source] || 0) + 1;
    });
    const clicksBySource: Record<string, number> = {};
    clicks.forEach(c => {
      const source = (c as any).source_tag || 'direct';
      clicksBySource[source] = (clicksBySource[source] || 0) + 1;
    });

    const totalEarnings = commissions.reduce((s, c) => s + ((c as any).commission_amount_cents || 0), 0);
    const sources = [...new Set([...Object.keys(clicksBySource), ...Object.keys(convBySource)])];
    const sourceRevenue = sources.map(source => {
      const sourceConv = convBySource[source] || 0;
      const totalConv = Object.values(convBySource).reduce((s, v) => s + v, 0) || 1;
      const estimatedRevenue = Math.round((sourceConv / totalConv) * totalEarnings);
      return { source, clicks: clicksBySource[source] || 0, conversions: sourceConv, revenue_cents: estimatedRevenue };
    }).sort((a, b) => b.revenue_cents - a.revenue_cents);

    const geoBreakdown: Record<string, number> = {};
    clicks.forEach(c => {
      const country = (c as any).country || 'Unknown';
      geoBreakdown[country] = (geoBreakdown[country] || 0) + 1;
    });
    const totalGeoClicks = Object.values(geoBreakdown).reduce((s, v) => s + v, 0) || 1;
    const geo = Object.entries(geoBreakdown)
      .map(([country, count]) => ({ country, count, percentage: Math.round((count / totalGeoClicks) * 100) }))
      .sort((a, b) => b.count - a.count);

    const deviceBreakdown: Record<string, number> = {};
    clicks.forEach(c => {
      const device = (c as any).device_type || 'unknown';
      deviceBreakdown[device] = (deviceBreakdown[device] || 0) + 1;
    });
    const totalDevClicks = Object.values(deviceBreakdown).reduce((s, v) => s + v, 0) || 1;
    const devices = Object.entries(deviceBreakdown)
      .map(([device, count]) => ({ device, count, percentage: Math.round((count / totalDevClicks) * 100) }))
      .sort((a, b) => b.count - a.count);

    const clicksByRefCode: Record<string, number> = {};
    clicks.forEach(c => {
      const key = (c as any).ref_code;
      clicksByRefCode[key] = (clicksByRefCode[key] || 0) + 1;
    });
    const repeatVisitors = Object.values(clicksByRefCode).filter(v => v > 1).length;
    const multiClickCount = Object.values(clicksByRefCode).filter(v => v > 2).reduce((s, v) => s + v, 0);

    const cumulativeEarnings: { month: string; cumulative_cents: number }[] = [];
    const monthlyEarnings: Record<string, number> = {};
    commissions.forEach(c => {
      const m = (c as any).created_at?.substring(0, 7);
      if (m) monthlyEarnings[m] = (monthlyEarnings[m] || 0) + ((c as any).commission_amount_cents || 0);
    });
    let cumulative = 0;
    Object.keys(monthlyEarnings).sort().forEach(m => {
      cumulative += monthlyEarnings[m];
      cumulativeEarnings.push({ month: m, cumulative_cents: cumulative });
    });

    const clicksByMonth: Record<string, number> = {};
    const convsByMonth: Record<string, number> = {};
    clicks.forEach(c => {
      const m = (c as any).created_at?.substring(0, 7);
      if (m) clicksByMonth[m] = (clicksByMonth[m] || 0) + 1;
    });
    referrals.filter(r => r.status === 'converted' || r.status === 'paid').forEach(r => {
      const m = r.created_at?.substring(0, 7);
      if (m) convsByMonth[m] = (convsByMonth[m] || 0) + 1;
    });
    const allMonths = [...new Set([...Object.keys(clicksByMonth)])].sort().slice(-12);
    const dropoff = allMonths.map(m => ({
      month: m,
      clicks: clicksByMonth[m] || 0,
      signups: referrals.filter(r => r.created_at?.substring(0, 7) === m).length,
      conversions: convsByMonth[m] || 0,
    }));

    return NextResponse.json({
      revenueBySource: sourceRevenue,
      cumulativeEarnings,
      dropoff,
      geo,
      devices,
      repeatVisitors: {
        total: repeatVisitors,
        multiClickCount,
        totalUniqueVisitors: Object.keys(clicksByRefCode).length,
      },
    });
  } catch (err: any) {
    console.error('Sources analytics error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
