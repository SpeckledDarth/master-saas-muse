import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const slug = searchParams.get('slug');
    const suggest_for_ticket = searchParams.get('suggest_for_ticket');

    const admin = createAdminClient();

    if (slug) {
      const { data: article, error } = await admin
        .from('knowledge_base_articles')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        if (error.code === '42P01' || error.code === 'PGRST205') return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        throw error;
      }

      await admin
        .from('knowledge_base_articles')
        .update({ view_count: (article.view_count || 0) + 1 })
        .eq('id', article.id);

      return NextResponse.json({ article: { ...article, view_count: (article.view_count || 0) + 1 } });
    }

    if (suggest_for_ticket) {
      const searchTerms = suggest_for_ticket.toLowerCase().split(/\s+/).filter((t: string) => t.length > 2);
      if (searchTerms.length === 0) {
        return NextResponse.json({ suggestions: [] });
      }

      const orConditions = searchTerms.map((term: string) =>
        `title.ilike.%${term}%,body.ilike.%${term}%`
      ).join(',');

      const { data, error } = await admin
        .from('knowledge_base_articles')
        .select('id, title, slug, category, body')
        .eq('is_published', true)
        .or(orConditions)
        .limit(5);

      if (error) {
        if (error.code === '42P01' || error.code === 'PGRST205') return NextResponse.json({ suggestions: [] });
        throw error;
      }

      const suggestions = (data || []).map((a: any) => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        category: a.category,
        excerpt: a.body ? a.body.substring(0, 150) + (a.body.length > 150 ? '...' : '') : '',
      }));

      return NextResponse.json({ suggestions });
    }

    let query = admin
      .from('knowledge_base_articles')
      .select('id, title, slug, category, search_keywords, view_count, sort_order, created_at, updated_at')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,body.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') return NextResponse.json({ articles: [], categories: [] });
      throw error;
    }

    const articles = data || [];

    const categorySet = new Set(articles.map((a: any) => a.category));
    const categories = Array.from(categorySet).sort();

    return NextResponse.json({ articles, categories });
  } catch (err: any) {
    console.error('Affiliate KB GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, article_id } = body;

    if (action !== 'view' || !article_id) {
      return NextResponse.json({ error: 'Invalid tracking request' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin.rpc('increment_kb_view_count', { article_uuid: article_id });

    if (error) {
      await admin
        .from('knowledge_base_articles')
        .update({ view_count: 1 })
        .eq('id', article_id);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Affiliate KB POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
