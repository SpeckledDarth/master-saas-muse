import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();
    const { data: links } = await admin
      .from('affiliate_short_links')
      .select('*')
      .eq('affiliate_user_id', user.id)
      .order('created_at', { ascending: false });

    return NextResponse.json({ links: links || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { destination_url, custom_slug, label } = body;

    if (!destination_url) {
      return NextResponse.json({ error: 'Destination URL required' }, { status: 400 });
    }

    const slug = custom_slug || Math.random().toString(36).substring(2, 8);

    const admin = createAdminClient();

    const { data: existing } = await admin
      .from('affiliate_short_links')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Slug already taken' }, { status: 409 });
    }

    const { data: link } = await admin
      .from('referral_links')
      .select('code')
      .eq('user_id', user.id)
      .single();

    const refCode = link?.code || '';
    const finalUrl = destination_url.includes('?')
      ? `${destination_url}&ref=${refCode}`
      : `${destination_url}?ref=${refCode}`;

    const { data: shortLink, error } = await admin
      .from('affiliate_short_links')
      .insert({
        affiliate_user_id: user.id,
        slug,
        destination_url: finalUrl,
        label: label || '',
        clicks: 0
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ shortLink });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
