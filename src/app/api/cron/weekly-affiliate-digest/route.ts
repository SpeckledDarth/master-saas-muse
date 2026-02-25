import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const admin = createAdminClient();

    const { data: affiliateLinks } = await admin
      .from('referral_links')
      .select('user_id, ref_code, clicks, signups, total_earnings_cents')
      .eq('is_affiliate', true);

    if (!affiliateLinks || affiliateLinks.length === 0) {
      return NextResponse.json({ success: true, emailsSent: 0, message: 'No affiliates found' });
    }

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const weekAgoISO = weekAgo.toISOString();

    const [contestsRes, milestonesRes] = await Promise.all([
      admin.from('affiliate_contests').select('id, name, metric, end_date, prizes').lte('start_date', now.toISOString()).gte('end_date', now.toISOString()),
      admin.from('affiliate_milestones').select('id, name, referral_threshold, bonus_cents').order('referral_threshold', { ascending: true }),
    ]);
    const activeContests = contestsRes.data || [];
    const milestones = milestonesRes.data || [];

    let emailsSent = 0;

    for (const link of affiliateLinks) {
      const { data: prefs } = await admin
        .from('email_preferences')
        .select('weekly_digest')
        .eq('user_id', link.user_id)
        .maybeSingle();

      if (prefs && prefs.weekly_digest === false) continue;

      const [clicksRes, referralsRes, commissionsRes, allReferralsRes] = await Promise.all([
        admin.from('referral_clicks').select('id', { count: 'exact', head: true }).eq('referral_link_user_id', link.user_id).gte('created_at', weekAgoISO),
        admin.from('affiliate_referrals').select('status').eq('affiliate_user_id', link.user_id).gte('created_at', weekAgoISO),
        admin.from('affiliate_commissions').select('commission_amount_cents').eq('affiliate_user_id', link.user_id).gte('created_at', weekAgoISO),
        admin.from('affiliate_referrals').select('status').eq('affiliate_user_id', link.user_id),
      ]);

      const weekClicks = (clicksRes as any)?.count || 0;
      const weekSignups = (referralsRes.data || []).filter(r => ['signed_up', 'converted', 'paid'].includes(r.status)).length;
      const weekConversions = (referralsRes.data || []).filter(r => r.status === 'converted' || r.status === 'paid').length;
      const weekEarnings = (commissionsRes.data || []).reduce((s: number, c: any) => s + (c.commission_amount_cents || 0), 0);
      const convRate = weekClicks > 0 ? Math.round((weekConversions / weekClicks) * 1000) / 10 : 0;

      const totalReferrals = (allReferralsRes.data || []).filter(r => ['signed_up', 'converted', 'paid'].includes(r.status)).length;

      let contestHtml = '';
      if (activeContests.length > 0) {
        contestHtml = '<h3 style="margin-top: 20px; color: #f59e0b;">Active Contests</h3>';
        for (const contest of activeContests) {
          const daysLeft = Math.max(0, Math.ceil((new Date(contest.end_date).getTime() - now.getTime()) / 86400000));
          const metric = contest.metric || 'referrals';
          const userValue = metric === 'earnings' ? `$${((link.total_earnings_cents || 0) / 100).toFixed(2)}` : String(totalReferrals);
          contestHtml += `<p style="padding: 8px; background: #fef3c7; border-radius: 6px; margin: 8px 0;"><strong>${contest.name}</strong> — Your ${metric}: ${userValue} | ${daysLeft} days left${contest.prizes ? ` | Prize: ${contest.prizes}` : ''}</p>`;
        }
      }

      let milestoneHtml = '';
      if (milestones.length > 0) {
        const { data: awards } = await admin.from('affiliate_milestone_awards').select('milestone_id').eq('affiliate_user_id', link.user_id);
        const earnedIds = new Set((awards || []).map((a: any) => a.milestone_id));
        const nextMilestone = milestones.find((m: any) => !earnedIds.has(m.id));
        if (nextMilestone) {
          const needed = Math.max(0, nextMilestone.referral_threshold - totalReferrals);
          milestoneHtml = `<p style="padding: 8px; background: #dbeafe; border-radius: 6px; margin: 8px 0;">Next milestone: <strong>${nextMilestone.name}</strong> — ${needed} more referral${needed !== 1 ? 's' : ''} to earn $${((nextMilestone.bonus_cents || 0) / 100).toFixed(2)} bonus</p>`;
        }
      }

      const { data: profile } = await admin.from('profiles').select('email, full_name').eq('id', link.user_id).maybeSingle();
      if (!profile?.email) continue;

      try {
        const { sendEmail } = await import('@/lib/email');
        await sendEmail({
          to: profile.email,
          subject: `Your Weekly Affiliate Report — ${weekClicks} clicks, $${(weekEarnings / 100).toFixed(2)} earned`,
          html: `
            <h2>Hey ${profile.full_name || 'there'}! Here's your weekly snapshot:</h2>
            <table style="border-collapse: collapse; width: 100%; max-width: 400px;">
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Clicks</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${weekClicks}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Signups</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${weekSignups}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Conversions</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${weekConversions}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Earnings</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${(weekEarnings / 100).toFixed(2)}</td></tr>
              <tr><td style="padding: 8px;"><strong>Conversion Rate</strong></td><td style="padding: 8px; text-align: right;">${convRate}%</td></tr>
            </table>
            <p style="margin-top: 16px;">Total lifetime earnings: <strong>$${((link.total_earnings_cents || 0) / 100).toFixed(2)}</strong></p>
            ${contestHtml}
            ${milestoneHtml}
            <p><a href="/affiliate/dashboard?tab=analytics" style="color: #3b82f6;">View full analytics →</a></p>
          `,
        });
        emailsSent++;
      } catch (emailErr) {
        console.error(`Failed to send digest to ${profile.email}:`, emailErr);
      }
    }

    return NextResponse.json({ success: true, emailsSent, totalAffiliates: affiliateLinks.length });
  } catch (err: any) {
    console.error('Weekly affiliate digest error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
