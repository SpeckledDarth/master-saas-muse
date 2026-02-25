import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

    const [announcementsRes, assetsRes, termsRes] = await Promise.all([
      supabase.from('announcements').select('id, title, message, type, created_at').eq('is_active', true).gte('created_at', thirtyDaysAgo).order('created_at', { ascending: false }).limit(10),
      supabase.from('affiliate_marketing_assets').select('id, title, asset_type, created_at').gte('created_at', thirtyDaysAgo).order('created_at', { ascending: false }).limit(10),
      supabase.from('affiliate_terms_changelog').select('id, change_summary, effective_date, created_at').gte('created_at', thirtyDaysAgo).order('created_at', { ascending: false }).limit(5)
    ]);

    const items: { id: string; type: string; title: string; description: string; date: string }[] = [];

    for (const a of (announcementsRes.data || [])) {
      items.push({ id: a.id, type: 'announcement', title: a.title, description: a.message?.substring(0, 120) || '', date: a.created_at });
    }
    for (const a of (assetsRes.data || [])) {
      items.push({ id: a.id, type: 'asset', title: `New ${a.asset_type}: ${a.title}`, description: `New marketing asset available`, date: a.created_at });
    }
    for (const t of (termsRes.data || [])) {
      items.push({ id: t.id, type: 'terms', title: 'Program Terms Updated', description: t.change_summary?.substring(0, 120) || '', date: t.created_at });
    }

    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ items: items.slice(0, 15), total: items.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
