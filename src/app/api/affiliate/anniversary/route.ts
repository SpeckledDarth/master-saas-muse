import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const joinDate = new Date(user.created_at);
    const now = new Date();
    const diffMs = now.getTime() - joinDate.getTime();
    const daysSinceJoin = Math.floor(diffMs / 86400000);
    const yearsSinceJoin = Math.floor(daysSinceJoin / 365);
    const monthsSinceJoin = Math.floor(daysSinceJoin / 30);

    const nextAnniversaryDate = new Date(joinDate);
    nextAnniversaryDate.setFullYear(now.getFullYear());
    if (nextAnniversaryDate < now) {
      nextAnniversaryDate.setFullYear(now.getFullYear() + 1);
    }
    const daysUntilAnniversary = Math.ceil((nextAnniversaryDate.getTime() - now.getTime()) / 86400000);

    const milestones: { type: string; label: string; reached: boolean; date?: string }[] = [];

    if (daysSinceJoin >= 30) milestones.push({ type: '1month', label: '1 Month Partner', reached: true });
    if (daysSinceJoin >= 90) milestones.push({ type: '3month', label: '3 Month Partner', reached: true });
    if (daysSinceJoin >= 180) milestones.push({ type: '6month', label: '6 Month Partner', reached: true });
    if (daysSinceJoin >= 365) milestones.push({ type: '1year', label: '1 Year Partner', reached: true });
    if (daysSinceJoin >= 730) milestones.push({ type: '2year', label: '2 Year Partner', reached: true });

    const nextMilestone = daysSinceJoin < 30 ? { type: '1month', label: '1 Month Partner', days_away: 30 - daysSinceJoin }
      : daysSinceJoin < 90 ? { type: '3month', label: '3 Month Partner', days_away: 90 - daysSinceJoin }
      : daysSinceJoin < 180 ? { type: '6month', label: '6 Month Partner', days_away: 180 - daysSinceJoin }
      : daysSinceJoin < 365 ? { type: '1year', label: '1 Year Partner', days_away: 365 - daysSinceJoin }
      : daysSinceJoin < 730 ? { type: '2year', label: '2 Year Partner', days_away: 730 - daysSinceJoin }
      : null;

    const isAnniversaryWeek = daysUntilAnniversary <= 7 || daysUntilAnniversary >= 358;

    return NextResponse.json({
      anniversary: {
        join_date: joinDate.toISOString(),
        days_as_partner: daysSinceJoin,
        months_as_partner: monthsSinceJoin,
        years_as_partner: yearsSinceJoin,
        days_until_anniversary: daysUntilAnniversary,
        is_anniversary_week: isAnniversaryWeek,
        milestones,
        next_milestone: nextMilestone
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
