import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function isAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data: role } = await supabase.from('user_roles').select('role').eq('user_id', userId).single();
  if (role?.role === 'admin') return true;
  const { data: member } = await supabase.from('team_members').select('role').eq('user_id', userId).in('role', ['admin', 'owner']).single();
  return !!member;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(await isAdmin(supabase, user.id))) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const includeUnpublished = searchParams.get('include_unpublished') !== 'false';

    const admin = createAdminClient();
    let query = admin
      .from('knowledge_base_articles')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    if (!includeUnpublished) {
      query = query.eq('is_published', true);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,body.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') return NextResponse.json({ articles: [] });
      throw error;
    }

    return NextResponse.json({ articles: data || [] });
  } catch (err: any) {
    console.error('Admin KB GET error:', err);
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
    const { title, body: articleBody, category, search_keywords, is_published, sort_order } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const slug = body.slug || generateSlug(title);

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('knowledge_base_articles')
      .insert({
        title,
        slug,
        body: articleBody || '',
        category: category || 'general',
        search_keywords: search_keywords || [],
        is_published: is_published ?? false,
        sort_order: sort_order ?? 0,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ article: data });
  } catch (err: any) {
    console.error('Admin KB POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(await isAdmin(supabase, user.id))) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'Article ID required' }, { status: 400 });

    if (updates.title && !updates.slug) {
      updates.slug = generateSlug(updates.title);
    }

    if (updates.body !== undefined) {
      const articleBody = updates.body;
      delete updates.body;
      updates.body = articleBody;
    }

    updates.updated_at = new Date().toISOString();

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('knowledge_base_articles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ article: data });
  } catch (err: any) {
    console.error('Admin KB PUT error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(await isAdmin(supabase, user.id))) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Article ID required' }, { status: 400 });

    const admin = createAdminClient();
    const { error } = await admin
      .from('knowledge_base_articles')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Admin KB DELETE error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
