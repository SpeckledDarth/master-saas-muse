import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [linkRes, profileRes, commissionsRes, badgeRes] = await Promise.all([
      supabase.from('referral_links').select('code, referral_url, locked_commission_rate').eq('user_id', user.id).single(),
      supabase.from('affiliate_profiles').select('display_name, avatar_url, bio').eq('user_id', user.id).single(),
      supabase.from('affiliate_commissions').select('amount_cents').eq('affiliate_user_id', user.id),
      supabase.from('affiliate_badge_tiers').select('name, min_earnings_cents').order('min_earnings_cents', { ascending: true })
    ]);

    const link = linkRes.data;
    const profile = profileRes.data;
    const totalEarned = (commissionsRes.data || []).reduce((s: number, c: any) => s + (c.amount_cents || 0), 0);
    const earnedBadges = (badgeRes.data || []).filter((b: any) => totalEarned >= b.min_earnings_cents);
    const currentBadge = earnedBadges.length > 0 ? earnedBadges[earnedBadges.length - 1] : null;
    const name = profile?.display_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Partner';

    const cards = [
      {
        id: 'social-basic',
        type: 'social',
        platform: 'universal',
        title: `${name} — PassivePost Partner`,
        subtitle: currentBadge ? `${currentBadge.name} Partner` : 'Official Partner',
        cta: `Use code ${link?.code || 'PARTNER'} for a discount!`,
        referral_url: link?.referral_url || '',
        referral_code: link?.code || '',
        svg: generateCardSVG(name, link?.code || '', currentBadge?.name || 'Partner', 'social')
      },
      {
        id: 'story-vertical',
        type: 'story',
        platform: 'instagram',
        title: 'Save Hours on Content',
        subtitle: `Partner code: ${link?.code || 'PARTNER'}`,
        cta: 'Link in bio',
        referral_url: link?.referral_url || '',
        referral_code: link?.code || '',
        svg: generateCardSVG(name, link?.code || '', currentBadge?.name || 'Partner', 'story')
      },
      {
        id: 'banner-wide',
        type: 'banner',
        platform: 'youtube',
        title: 'I use PassivePost',
        subtitle: `${link?.code || 'PARTNER'} for a discount`,
        cta: link?.referral_url || '',
        referral_url: link?.referral_url || '',
        referral_code: link?.code || '',
        svg: generateCardSVG(name, link?.code || '', currentBadge?.name || 'Partner', 'banner')
      }
    ];

    return NextResponse.json({ cards });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function generateCardSVG(name: string, code: string, badge: string, type: string): string {
  if (type === 'story') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="540" height="960" viewBox="0 0 540 960">
      <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#4F46E5"/><stop offset="100%" stop-color="#7C3AED"/></linearGradient></defs>
      <rect width="540" height="960" fill="url(#bg)" rx="20"/>
      <text x="270" y="360" text-anchor="middle" fill="white" font-size="36" font-weight="bold" font-family="sans-serif">PassivePost</text>
      <text x="270" y="420" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-size="20" font-family="sans-serif">Schedule your content on autopilot</text>
      <rect x="120" y="500" width="300" height="60" rx="12" fill="rgba(255,255,255,0.2)"/>
      <text x="270" y="538" text-anchor="middle" fill="white" font-size="24" font-weight="bold" font-family="sans-serif">Code: ${code}</text>
      <text x="270" y="620" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-size="16" font-family="sans-serif">Recommended by ${name}</text>
      <text x="270" y="650" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-size="14" font-family="sans-serif">${badge}</text>
    </svg>`;
  }
  if (type === 'banner') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="300" viewBox="0 0 1200 300">
      <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#4F46E5"/><stop offset="100%" stop-color="#7C3AED"/></linearGradient></defs>
      <rect width="1200" height="300" fill="url(#bg)" rx="12"/>
      <text x="60" y="130" fill="white" font-size="40" font-weight="bold" font-family="sans-serif">I use PassivePost ✨</text>
      <text x="60" y="180" fill="rgba(255,255,255,0.8)" font-size="22" font-family="sans-serif">Schedule content across all platforms — on autopilot</text>
      <rect x="60" y="210" width="280" height="50" rx="8" fill="rgba(255,255,255,0.2)"/>
      <text x="200" y="243" text-anchor="middle" fill="white" font-size="22" font-weight="bold" font-family="sans-serif">Code: ${code}</text>
      <text x="1140" y="280" text-anchor="end" fill="rgba(255,255,255,0.5)" font-size="14" font-family="sans-serif">Partner: ${name}</text>
    </svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="315" viewBox="0 0 600 315">
    <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#4F46E5"/><stop offset="100%" stop-color="#7C3AED"/></linearGradient></defs>
    <rect width="600" height="315" fill="url(#bg)" rx="16"/>
    <text x="300" y="100" text-anchor="middle" fill="white" font-size="32" font-weight="bold" font-family="sans-serif">PassivePost</text>
    <text x="300" y="140" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-size="16" font-family="sans-serif">Schedule your content on autopilot</text>
    <rect x="150" y="170" width="300" height="50" rx="10" fill="rgba(255,255,255,0.2)"/>
    <text x="300" y="203" text-anchor="middle" fill="white" font-size="22" font-weight="bold" font-family="sans-serif">Code: ${code}</text>
    <text x="300" y="260" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-size="14" font-family="sans-serif">Recommended by ${name} • ${badge}</text>
  </svg>`;
}
