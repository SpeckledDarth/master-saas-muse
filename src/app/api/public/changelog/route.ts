import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const adminClient = createAdminClient()

    const { data: entries, error } = await adminClient
      .from('changelog_entries')
      .select('id, title, content, version, category, published_at')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(50)

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        const { data: posts } = await adminClient
          .from('posts')
          .select('id, title, content, published_at')
          .eq('type', 'changelog')
          .eq('published', true)
          .order('published_at', { ascending: false })
          .limit(50)

        return NextResponse.json({
          entries: (posts || []).map(p => ({ ...p, category: 'improvement', version: null })),
        })
      }
      return NextResponse.json({ entries: [] })
    }

    return NextResponse.json(
      { entries: entries || [] },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
    )
  } catch (error) {
    console.error('Public changelog error:', error)
    return NextResponse.json({ entries: [] })
  }
}
