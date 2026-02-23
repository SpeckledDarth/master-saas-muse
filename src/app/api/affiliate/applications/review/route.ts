import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'
import { getEmailClient } from '@/lib/email/client'

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

    const { data: existingLink } = await admin
      .from('referral_links')
      .select('id')
      .eq('user_id', affiliateUserId)
      .maybeSingle()

    if (existingLink) {
      await admin
        .from('referral_links')
        .update({ is_affiliate: true, affiliate_role: 'affiliate' })
        .eq('user_id', affiliateUserId)
    } else {
      const { error: linkError } = await admin
        .from('referral_links')
        .insert({
          user_id: affiliateUserId,
          ref_code: referralCode,
          is_affiliate: true,
          affiliate_role: 'affiliate',
        })

      if (linkError) {
        console.error('Failed to create referral link:', linkError)
      }
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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://passivepost.io'
    try {
      const { client: emailClient, fromEmail } = await getEmailClient()
      await emailClient.emails.send({
        from: fromEmail,
        to: application.email,
        subject: 'Your Affiliate Application Has Been Approved!',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Welcome to the Affiliate Program!</h2>
            <p>Hi ${application.name},</p>
            <p>Great news — your affiliate application has been approved! You now have access to your personal affiliate dashboard where you can find your unique referral link, marketing materials, and track your earnings.</p>
            <p><strong>To get started:</strong></p>
            <ol>
              <li>Go to <a href="${baseUrl}/affiliate/login">${baseUrl}/affiliate/login</a></li>
              <li>Enter your email: <strong>${application.email}</strong></li>
              <li>Click <strong>"Send Login Link"</strong> — you'll receive a one-time login link in your inbox</li>
              <li>Once logged in, you can <a href="${baseUrl}/affiliate/set-password">set a password</a> so you can log in directly next time</li>
            </ol>
            <p style="margin: 24px 0;">
              <a href="${baseUrl}/affiliate/login" style="background-color: #2563eb; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">Go to Affiliate Login</a>
            </p>
            <p>Once logged in, you'll find your referral link, marketing assets, and real-time performance stats on your dashboard. We recommend setting a password so you can log in easily in the future.</p>
            <p>Thanks for joining,<br/>The Team</p>
          </div>
        `,
      })
    } catch (emailErr) {
      console.error('Failed to send affiliate welcome email:', emailErr)
    }

    return NextResponse.json({ success: true, action: 'approve' })
  } catch (err) {
    console.error('Affiliate application review error:', err)
    return NextResponse.json({ error: 'Failed to process review' }, { status: 500 })
  }
}
