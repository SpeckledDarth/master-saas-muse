import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, website_url, promotion_method, message } = body

    if (!name || !email || !promotion_method) {
      return NextResponse.json({ error: 'Name, email, and promotion method are required' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: existing } = await admin
      .from('affiliate_applications')
      .select('id, status')
      .eq('email', email.toLowerCase().trim())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existing) {
      if (existing.status === 'pending') {
        return NextResponse.json({ error: 'You already have a pending application. We\'ll review it shortly.' }, { status: 400 })
      }
      if (existing.status === 'approved') {
        return NextResponse.json({ error: 'You\'re already an approved affiliate! Log in to access your dashboard.' }, { status: 400 })
      }
    }

    const { data, error } = await admin
      .from('affiliate_applications')
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        website_url: website_url?.trim() || null,
        promotion_method,
        message: message?.trim() || null,
        status: 'pending',
      })
      .select('id')
      .single()

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ error: 'Affiliate applications system not yet configured. Please try again later.' }, { status: 503 })
      }
      console.error('Affiliate application insert error:', error)
      return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 })
    }

    try {
      const { data: admins } = await admin
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin')
        .limit(5)

      if (admins?.length) {
        for (const a of admins) {
          await admin.from('notifications').insert({
            user_id: a.user_id,
            title: 'New Affiliate Application',
            message: `${name} (${email}) applied to the affiliate program. Promotion methods: ${promotion_method}.`,
            type: 'info',
            link: '/admin/setup/affiliate',
          })
        }
      }
    } catch {}

    return NextResponse.json({ success: true, id: data.id })
  } catch (err) {
    console.error('Affiliate application error:', err)
    return NextResponse.json({ error: 'Failed to process application' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    const { data: userRole } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (userRole?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const url = new URL(request.url)
    const status = url.searchParams.get('status')

    let query = admin
      .from('affiliate_applications')
      .select('*')
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query.limit(100)

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ applications: [], note: 'Table not created yet' })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ applications: data || [] })
  } catch (err) {
    console.error('Affiliate applications GET error:', err)
    return NextResponse.json({ error: 'Failed to load applications' }, { status: 500 })
  }
}
