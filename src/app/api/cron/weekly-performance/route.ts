import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

    const { data: affiliates } = await admin
      .from('affiliate_profiles')
      .select('user_id, display_name');

    if (!affiliates || affiliates.length === 0) {
      return NextResponse.json({ sent: 0 });
    }

    let sentCount = 0;

    for (const affiliate of affiliates) {
      try {
        const [clicksRes, referralsRes, commissionsRes] = await Promise.all([
          admin.from('referral_clicks').select('id').eq('referral_link_user_id', affiliate.user_id).gte('created_at', weekAgo),
          admin.from('affiliate_referrals').select('id, status').eq('affiliate_user_id', affiliate.user_id).gte('created_at', weekAgo),
          admin.from('affiliate_commissions').select('amount_cents').eq('affiliate_user_id', affiliate.user_id).gte('created_at', weekAgo)
        ]);

        const clicks = (clicksRes.data || []).length;
        const signups = (referralsRes.data || []).length;
        const conversions = (referralsRes.data || []).filter((r: any) => r.status === 'converted' || r.status === 'paid').length;
        const earnings = (commissionsRes.data || []).reduce((s: number, c: any) => s + (c.amount_cents || 0), 0);

        if (clicks === 0 && signups === 0 && earnings === 0) continue;

        const { data: prefs } = await admin
          .from('email_preferences')
          .select('weekly_digest')
          .eq('user_id', affiliate.user_id)
          .single();

        if (prefs && prefs.weekly_digest === false) continue;

        await admin.from('notifications').insert({
          user_id: affiliate.user_id,
          type: 'weekly_performance',
          title: '📊 Weekly Performance Summary',
          message: `This week: ${clicks} clicks, ${signups} signups, ${conversions} conversions, $${(earnings / 100).toFixed(2)} earned`,
          is_read: false
        });

        sentCount++;
      } catch {}
    }

    return NextResponse.json({ sent: sentCount, total_affiliates: affiliates.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
