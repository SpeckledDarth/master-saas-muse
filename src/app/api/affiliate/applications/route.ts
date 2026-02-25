import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { logAuditEvent } from '@/lib/affiliate/audit'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, website_url, promotion_method, message, agreed_to_terms, terms_version } = body

    if (!name || !email || !promotion_method) {
      return NextResponse.json({ error: 'Name, email, and promotion method are required' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })
    }

    const admin = createAdminClient()
    const normalizedEmail = email.toLowerCase().trim()

    let existing: any = null
    const { data: existCheck, error: existError } = await admin
      .from('affiliate_applications')
      .select('id, status')
      .eq('email', normalizedEmail)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existError && (existError.message?.includes('deleted_at') || existError.code === '42703')) {
      const { data: fallback } = await admin
        .from('affiliate_applications')
        .select('id, status')
        .eq('email', normalizedEmail)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      existing = fallback
    } else {
      existing = existCheck
    }

    if (existing) {
      if (existing.status === 'pending') {
        return NextResponse.json({ error: 'You already have a pending application. We\'ll review it shortly.' }, { status: 400 })
      }
      if (existing.status === 'approved') {
        return NextResponse.json({ error: 'You\'re already an approved affiliate! Log in to access your dashboard.' }, { status: 400 })
      }
    }

    let matchingUserId: string | null = null
    let page = 1
    while (true) {
      const { data: { users } } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
      if (!users?.length) break
      const found = users.find(u => u.email?.toLowerCase() === normalizedEmail)
      if (found) { matchingUserId = found.id; break }
      if (users.length < 1000) break
      page++
    }

    if (matchingUserId) {
      const { data: activeLink } = await admin
        .from('referral_links')
        .select('id')
        .eq('user_id', matchingUserId)
        .eq('is_affiliate', true)
        .maybeSingle()

      if (activeLink) {
        return NextResponse.json({ error: 'You\'re already an approved affiliate! Log in to access your dashboard.' }, { status: 400 })
      }
    }

    const insertRow: Record<string, any> = {
      name: name.trim(),
      email: normalizedEmail,
      website_url: website_url?.trim() || null,
      promotion_method,
      message: message?.trim() || null,
      status: 'pending',
    }
    if (agreed_to_terms !== undefined) insertRow.agreed_to_terms = !!agreed_to_terms
    if (terms_version) insertRow.terms_version = terms_version

    let data: any = null
    let error: any = null

    const firstTry = await admin
      .from('affiliate_applications')
      .insert(insertRow)
      .select('id')
      .single()

    data = firstTry.data
    error = firstTry.error

    if (error && error.code === '42703') {
      const { agreed_to_terms: _a, terms_version: _t, ...fallbackRow } = insertRow
      const retry = await admin
        .from('affiliate_applications')
        .insert(fallbackRow)
        .select('id')
        .single()
      data = retry.data
      error = retry.error
    }

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ error: 'Affiliate applications system not yet configured. Please try again later.' }, { status: 503 })
      }
      if (error.code === '23505') {
        return NextResponse.json({ error: 'An application with this email already exists. Please contact support.' }, { status: 400 })
      }
      console.error('Affiliate application insert error:', error)
      return NextResponse.json({ error: 'Failed to submit application. Please try again.' }, { status: 500 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://master-saas-muse-u7ga.vercel.app'

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
            message: `${name} (${normalizedEmail}) applied to the affiliate program. Promotion methods: ${promotion_method}.`,
            type: 'info',
            link: '/admin/setup/affiliate',
          })
        }
      }
    } catch {}

    try {
      await sendEmail({
        to: normalizedEmail,
        subject: 'Application Received — We\'ll Be in Touch!',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Thanks for Applying, ${name.trim()}!</h2>
            <p>We've received your affiliate application and our team will review it shortly — typically within 24–48 hours.</p>
            <p>Once approved, you'll receive a welcome email with instructions to access your affiliate dashboard, referral link, and marketing materials.</p>
            <p style="color: #666; font-size: 14px;">If you have any questions in the meantime, just reply to this email.</p>
            <p>— The Team</p>
          </div>
        `,
      })
    } catch (emailErr) {
      console.error('Failed to send applicant confirmation email:', emailErr)
    }

    try {
      const { data: admins } = await admin
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin')
        .limit(5)

      if (admins?.length) {
        const adminIds = admins.map(a => a.user_id)
        let allUsers: any[] = []
        let pg = 1
        while (true) {
          const { data: { users: pageUsers } } = await admin.auth.admin.listUsers({ page: pg, perPage: 1000 })
          if (!pageUsers?.length) break
          allUsers = allUsers.concat(pageUsers)
          if (pageUsers.length < 1000) break
          pg++
        }
        const adminEmails = allUsers.filter(u => adminIds.includes(u.id) && u.email).map(u => u.email!)

        if (adminEmails.length > 0) {
          await sendEmail({
            to: adminEmails,
            subject: `New Affiliate Application: ${name}`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2>New Affiliate Application</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${normalizedEmail}</p>
                ${website_url ? `<p><strong>Website:</strong> ${website_url}</p>` : ''}
                <p><strong>Promotion Methods:</strong> ${promotion_method}</p>
                ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
                <p><a href="${baseUrl}/admin/setup/affiliate" style="background: #2563eb; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; display: inline-block;">Review Application</a></p>
              </div>
            `,
          })
        }
      }
    } catch (emailErr) {
      console.error('Failed to send admin notification email:', emailErr)
    }

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
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    let { data, error } = await query.limit(100)

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ applications: [], note: 'Table not created yet' })
      }
      if (error.message?.includes('deleted_at') || error.code === '42703') {
        let retryQuery = admin
          .from('affiliate_applications')
          .select('*')
          .order('created_at', { ascending: false })
        if (status && status !== 'all') {
          retryQuery = retryQuery.eq('status', status)
        }
        const retry = await retryQuery.limit(100)
        data = retry.data
        error = retry.error
      }
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ applications: data || [] })
  } catch (err) {
    console.error('Affiliate applications GET error:', err)
    return NextResponse.json({ error: 'Failed to load applications' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Application id is required' }, { status: 400 })
    }

    const { data: app } = await admin
      .from('affiliate_applications')
      .select('email, name, status')
      .eq('id', id)
      .maybeSingle()

    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    const { error } = await admin
      .from('affiliate_applications')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
      })
      .eq('id', id)

    if (error) {
      if (error.message?.includes('deleted_at') || error.message?.includes('deleted_by') || error.message?.includes('column')) {
        const { error: hardDeleteErr } = await admin
          .from('affiliate_applications')
          .delete()
          .eq('id', id)
        if (hardDeleteErr) {
          console.error('Hard-delete application error:', hardDeleteErr)
          return NextResponse.json({ error: 'Failed to delete application' }, { status: 500 })
        }
      } else {
        console.error('Soft-delete application error:', error)
        return NextResponse.json({ error: 'Failed to delete application' }, { status: 500 })
      }
    }

    logAuditEvent({ admin_user_id: user.id, admin_email: user.email!, action: 'soft_delete', entity_type: 'application', entity_id: id, entity_name: app.name, details: { email: app.email, previous_status: app.status } })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Application DELETE error:', err)
    return NextResponse.json({ error: 'Failed to delete application' }, { status: 500 })
  }
}
