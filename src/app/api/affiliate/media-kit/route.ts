import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [linkRes, profileRes, statsRes, badgeRes] = await Promise.all([
      supabase.from('referral_links').select('code, referral_url, locked_commission_rate').eq('user_id', user.id).single(),
      supabase.from('affiliate_profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('affiliate_referrals').select('id').eq('affiliate_user_id', user.id),
      supabase.from('affiliate_badge_tiers').select('name, min_earnings_cents').order('min_earnings_cents', { ascending: true })
    ]);

    const link = linkRes.data;
    const profile = profileRes.data;
    const totalReferrals = (statsRes.data || []).length;

    const { data: commissions } = await supabase
      .from('affiliate_commissions')
      .select('amount_cents, status')
      .eq('affiliate_user_id', user.id);

    const totalEarned = (commissions || []).reduce((s: number, c: any) => s + (c.amount_cents || 0), 0);

    const earnedBadges = (badgeRes.data || []).filter((b: any) => totalEarned >= b.min_earnings_cents);
    const currentBadge = earnedBadges.length > 0 ? earnedBadges[earnedBadges.length - 1] : null;

    return NextResponse.json({
      mediaKit: {
        name: profile?.display_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Partner',
        bio: profile?.bio || '',
        avatar: profile?.avatar_url || '',
        referralCode: link?.code || '',
        referralUrl: link?.referral_url || '',
        commissionRate: link?.locked_commission_rate || 20,
        totalReferrals,
        totalEarnedCents: totalEarned,
        badge: currentBadge?.name || null,
        joinedAt: user.created_at
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
