import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { application_id, action, reviewer_notes } = body

    if (!application_id || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Valid application_id and action (approve/reject) required' }, { status: 400 })
    }

    const { data: application } = await admin
      .from('affiliate_applications')
      .select('*')
      .eq('id', application_id)
      .single()

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    if (application.status !== 'pending') {
      return NextResponse.json({ error: `Application already ${application.status}` }, { status: 400 })
    }

    if (action === 'reject') {
      const { error: updateError } = await admin
        .from('affiliate_applications')
        .update({
          status: 'rejected',
          reviewer_notes: reviewer_notes || null,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', application_id)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, action: 'reject' })
    }

    let affiliateUserId: string | null = null

    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
      email: application.email,
      email_confirm: true,
      user_metadata: {
        full_name: application.name,
        role: 'affiliate',
      },
    })

    if (createError) {
      if (createError.message?.includes('already been registered') || 
          createError.message?.includes('already exists') ||
          createError.status === 422) {
        let page = 1
        let found = false
        while (!found && page <= 100) {
          const { data: pageData } = await admin.auth.admin.listUsers({ page, perPage: 100 })
          if (!pageData?.users?.length) break
          const match = pageData.users.find(
            u => u.email?.toLowerCase() === application.email.toLowerCase()
          )
          if (match) {
            affiliateUserId = match.id
            found = true
          }
          if (pageData.users.length < 100) break
          page++
        }
        if (!affiliateUserId) {
          console.error('User exists but could not be found:', application.email)
          return NextResponse.json({ 
            error: 'Account exists but lookup failed. Please try again.',
          }, { status: 500 })
        }
      } else {
        console.error('Failed to create affiliate user:', createError)
        return NextResponse.json({ 
          error: 'Failed to create affiliate account. Application remains pending — please try again.',
        }, { status: 500 })
      }
    } else {
      affiliateUserId = newUser.user.id
    }

    if (!affiliateUserId) {
      return NextResponse.json({ error: 'Failed to provision affiliate account.' }, { status: 500 })
    }

    const referralCode = crypto.randomBytes(6).toString('hex')

    const { error: linkError } = await admin
      .from('referral_links')
      .insert({
        user_id: affiliateUserId,
        referral_code: referralCode,
        affiliate_role: 'affiliate',
      })

    if (linkError && linkError.code !== '23505') {
      console.error('Failed to create referral link:', linkError)
    }

    const { data: existingRole } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', affiliateUserId)
      .maybeSingle()

    if (!existingRole) {
      await admin.from('user_roles').insert({
        user_id: affiliateUserId,
        role: 'affiliate',
      })
    }

    const { error: approveError } = await admin
      .from('affiliate_applications')
      .update({
        status: 'approved',
        reviewer_notes: reviewer_notes || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', application_id)

    if (approveError) {
      console.error('Failed to update application status:', approveError)
    }

    try {
      await admin.from('notifications').insert({
        user_id: affiliateUserId,
        title: 'Welcome to the Affiliate Program!',
        message: 'Your affiliate application has been approved. Log in to access your dashboard, referral link, and marketing materials.',
        type: 'success',
        link: '/affiliate/dashboard',
      })
    } catch {}

    return NextResponse.json({ success: true, action: 'approve' })
  } catch (err) {
    console.error('Affiliate application review error:', err)
    return NextResponse.json({ error: 'Failed to process review' }, { status: 500 })
  }
}
