import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function isAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data: role } = await supabase.from('user_roles').select('role').eq('user_id', userId).single();
  if (role?.role === 'admin') return true;
  const { data: member } = await supabase.from('team_members').select('role').eq('user_id', userId).in('role', ['admin', 'owner']).single();
  return !!member;
}

export async function GET(req: NextRequest) {
  try {
    const admin = createAdminClient();
    const { data: announcements } = await admin
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({ announcements: announcements || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(await isAdmin(supabase, user.id))) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json();
    const { title, message, type, target_dashboards } = body;

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message required' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: announcement, error } = await admin
      .from('announcements')
      .insert({
        title,
        message,
        type: type || 'info',
        target_dashboards: target_dashboards || ['all'],
        is_active: true,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ announcement });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(await isAdmin(supabase, user.id))) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json();
    const { id, is_active } = body;

    const admin = createAdminClient();
    const { error } = await admin
      .from('announcements')
      .update({ is_active: is_active ?? false })
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
