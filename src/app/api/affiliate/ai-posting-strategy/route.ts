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

    const [clicksRes, referralsRes, commissionsRes, profileRes] = await Promise.all([
      admin.from('referral_clicks').select('source_tag, created_at').eq('referral_link_user_id', user.id),
      admin.from('affiliate_referrals').select('source_tag, status, created_at').eq('affiliate_user_id', user.id),
      admin.from('affiliate_commissions').select('commission_amount_cents, created_at').eq('affiliate_user_id', user.id),
      admin.from('affiliate_profiles').select('niche, promotion_methods').eq('user_id', user.id).maybeSingle(),
    ]);

    const clicks = clicksRes.data || [];
    const referrals = referralsRes.data || [];
    const commissions = commissionsRes.data || [];
    const profile = profileRes.data;

    const clicksByHour: Record<number, number> = {};
    const clicksByDay: Record<number, number> = {};
    clicks.forEach(c => {
      const d = new Date((c as any).created_at);
      clicksByHour[d.getHours()] = (clicksByHour[d.getHours()] || 0) + 1;
      clicksByDay[d.getDay()] = (clicksByDay[d.getDay()] || 0) + 1;
    });

    const convBySource: Record<string, number> = {};
    referrals.filter(r => r.status === 'converted' || r.status === 'paid').forEach(r => {
      const s = r.source_tag || 'direct';
      convBySource[s] = (convBySource[s] || 0) + 1;
    });

    const monthlyEarnings: Record<string, number> = {};
    commissions.forEach(c => {
      const m = (c as any).created_at?.substring(0, 7);
      if (m) monthlyEarnings[m] = (monthlyEarnings[m] || 0) + ((c as any).commission_amount_cents || 0);
    });

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const settings: AISettings = {
      provider: 'xai',
      model: 'grok-3-mini-fast',
      maxTokens: 1000,
      temperature: 0.7,
      systemPrompt: 'You are an affiliate marketing strategist. Create actionable promotional calendars. Output in a structured format with dates, platforms, content types, and talking points.',
    };

    let calendar = '';
    try {
      const result = await chatCompletion(settings, [
        { role: 'system', content: 'You are an affiliate marketing strategist. Create actionable promotional calendars. Output in a structured format with dates, platforms, content types, and talking points.' },
        { role: 'user', content: `Create a 4-week promotional calendar for this affiliate:
  
PERFORMANCE DATA:
- Best performing sources: ${JSON.stringify(convBySource)}
- Click patterns by day: ${JSON.stringify(Object.fromEntries(Object.entries(clicksByDay).map(([k, v]) => [dayNames[parseInt(k)], v])))}
- Click patterns by hour: ${JSON.stringify(clicksByHour)}
- Monthly earnings trend: ${JSON.stringify(monthlyEarnings)}
- Niche: ${profile?.niche || 'general'}
- Promotion methods: ${profile?.promotion_methods || 'social media, blog'}

Create a week-by-week plan with:
- Week theme
- 3-4 specific posts per week
- Platform for each post
- Content type (tutorial, discount push, testimonial, how-to, comparison)
- Best day/time to post based on their click data
- Key talking point or angle

Format as JSON array: [{ week: 1, theme: "...", posts: [{ day: "Monday", time: "9am", platform: "...", type: "...", angle: "..." }] }]` },
      ]);
      calendar = result.content;
    } catch {
      calendar = '[]';
    }

    const sortedHours = Object.entries(clicksByHour).sort((a, b) => b[1] - a[1]);
    const sortedDays = Object.entries(clicksByDay).sort((a, b) => b[1] - a[1]);
    const topHours = sortedHours.slice(0, 3).map(([h, c]) => ({ hour: parseInt(h), clicks: c }));
    const topDays = sortedDays.slice(0, 3).map(([d, c]) => ({ day: dayNames[parseInt(d)], clicks: c }));

    return NextResponse.json({
      bestTimes: {
        topHours,
        topDays,
        recommendation: topHours.length > 0 && topDays.length > 0
          ? `Post on ${topDays[0]?.day}s around ${topHours[0]?.hour}:00 for maximum engagement`
          : 'Keep posting consistently to build enough data for recommendations',
      },
      calendar,
      topSources: Object.entries(convBySource).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([source, count]) => ({ source, conversions: count })),
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Posting strategy error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
