import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const adminClient = createAdminClient()

    const { data: testimonials, error } = await adminClient
      .from('testimonials')
      .select('id, name, role, company, quote, avatar_url, company_logo_url, rating, featured, created_at')
      .eq('status', 'approved')
      .order('featured', { ascending: false })
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Public testimonials error:', error)
      return NextResponse.json({ testimonials: [] })
    }

    return NextResponse.json(
      { testimonials: testimonials || [] },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    )
  } catch (error) {
    console.error('Public testimonials error:', error)
    return NextResponse.json({ testimonials: [] })
  }
}
