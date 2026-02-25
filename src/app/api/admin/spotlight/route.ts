import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function isAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data: role } = await supabase.from('user_roles').select('role').eq('user_id', userId).single();
  if (role?.role === 'admin') return true;
  const { data: member } = await supabase.from('team_members').select('role').eq('user_id', userId).in('role', ['admin', 'owner']).single();
  return !!member;
}

export async function GET() {
  try {
    const admin = createAdminClient();
    const { data: spotlight } = await admin
      .from('affiliate_spotlight')
      .select('*')
      .eq('is_active', true)
      .order('month', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({ spotlight: spotlight || null });
  } catch (err: any) {
    return NextResponse.json({ spotlight: null });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(await isAdmin(supabase, user.id))) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json();
    const { affiliate_user_id, month, story, stats_summary } = body;

    const admin = createAdminClient();

    await admin.from('affiliate_spotlight').update({ is_active: false }).eq('is_active', true);

    const { data: profile } = await admin
      .from('affiliate_profiles')
      .select('display_name, avatar_url')
      .eq('user_id', affiliate_user_id)
      .single();

    const { data: spotlight, error } = await admin
      .from('affiliate_spotlight')
      .insert({
        affiliate_user_id,
        month: month || new Date().toISOString().substring(0, 7),
        affiliate_name: profile?.display_name || 'Featured Partner',
        affiliate_avatar: profile?.avatar_url || '',
        story: story || '',
        stats_summary: stats_summary || '',
        is_active: true,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ spotlight });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
