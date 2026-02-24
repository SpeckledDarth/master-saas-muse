import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const admin = createAdminClient()

    const { data: testimonials, error } = await admin
      .from('affiliate_testimonials')
      .select('id, name, quote, earnings_display, tier_name, avatar_url, is_featured, sort_order')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('sort_order', { ascending: true })

    if (error) {
      if (error.code === '42P01' || error.message?.includes('affiliate_testimonials')) {
        return NextResponse.json({ testimonials: [] })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ testimonials: testimonials || [] })
  } catch (err) {
    console.error('Testimonials GET error:', err)
    return NextResponse.json({ error: 'Failed to load testimonials' }, { status: 500 })
  }
}
