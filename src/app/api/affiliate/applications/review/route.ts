import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'
import { getEmailClient } from '@/lib/email/client'
import { sendEmail } from '@/lib/email/service'
import { logAuditEvent } from '@/lib/affiliate/audit'

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

    if (!application || application.deleted_at) {
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

      try {
        const reasonText = reviewer_notes
          ? `<p><strong>Reason:</strong> ${reviewer_notes}</p>`
          : '<p>Unfortunately, your application did not meet our current requirements.</p>'

        await sendEmail({
          to: application.email,
          subject: 'Affiliate Application Update',
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333;">Affiliate Application Update</h2>
              <p>Hi ${application.name},</p>
              <p>Thank you for your interest in our affiliate program. After reviewing your application, we're unable to approve it at this time.</p>
              ${reasonText}
              <p>You're welcome to re-apply in the future if your circumstances change. We appreciate your interest and wish you the best.</p>
              <p>— The Team</p>
            </div>
          `,
        })
      } catch (emailErr) {
        console.error('Failed to send rejection email:', emailErr)
      }

      logAuditEvent({ admin_user_id: user.id, admin_email: user.email!, action: 'reject', entity_type: 'application', entity_id: application_id, entity_name: application.name, details: { email: application.email, reviewer_notes } })

      return NextResponse.json({ success: true, action: 'reject' })
    }

    let affiliateUserId: string | null = null
    let isNewUser = false

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

        try {
          await admin.auth.admin.updateUserById(affiliateUserId, {
            user_metadata: { full_name: application.name, role: 'affiliate' },
          })
        } catch (metaErr) {
          console.error('Failed to update user metadata:', metaErr)
        }
      } else {
        console.error('Failed to create affiliate user:', createError)
        return NextResponse.json({ 
          error: 'Failed to create affiliate account. Application remains pending — please try again.',
        }, { status: 500 })
      }
    } else {
      affiliateUserId = newUser.user.id
      isNewUser = true
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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://master-saas-muse-u7ga.vercel.app'

    let emailActionUrl = `${baseUrl}/affiliate/login`

    try {
      const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email: application.email,
        options: {
          redirectTo: `${baseUrl}/affiliate/set-password`,
        },
      })

      if (linkError) {
        console.error('generateLink error:', linkError)
      }

      if (linkData?.properties?.hashed_token) {
        const token = linkData.properties.hashed_token
        emailActionUrl = `${baseUrl}/auth/callback?token_hash=${token}&type=magiclink&next=/affiliate/set-password`
      } else if (linkData?.properties?.action_link) {
        emailActionUrl = linkData.properties.action_link
      }
    } catch (linkErr) {
      console.error('Failed to generate password setup link:', linkErr)
    }

    try {
      const { client: emailClient, fromEmail } = await getEmailClient()

      await emailClient.emails.send({
        from: fromEmail,
        to: application.email,
        subject: "You're In! Set Your Password to Get Started",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Welcome to the Affiliate Program!</h2>
            <p>Hi ${application.name},</p>
            <p>Great news — your affiliate application has been approved! You now have access to your personal affiliate dashboard where you can track your referrals, earnings, and access marketing materials.</p>
            <p><strong>Click below to set your password and access your dashboard:</strong></p>
            <p style="margin: 24px 0;">
              <a href="${emailActionUrl}" style="background-color: #2563eb; color: #fff; padding: 14px 28px; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: 600;">Set Your Password &amp; Get Started</a>
            </p>
            <p style="color: #666; font-size: 14px;">Your login email: <strong>${application.email}</strong></p>
            <p style="color: #666; font-size: 14px;">After setting your password, you can always log in at: <a href="${baseUrl}/affiliate/login" style="color: #2563eb;">${baseUrl}/affiliate/login</a></p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
            <p style="color: #999; font-size: 12px;">This link expires in 24 hours. If it has expired, visit <a href="${baseUrl}/affiliate/forgot-password" style="color: #2563eb;">the password reset page</a> to get a new one.</p>
          </div>
        `,
      })
    } catch (emailErr) {
      console.error('Failed to send affiliate welcome email:', emailErr)
    }

    logAuditEvent({ admin_user_id: user.id, admin_email: user.email!, action: 'approve', entity_type: 'application', entity_id: application_id, entity_name: application.name, details: { email: application.email, affiliate_user_id: affiliateUserId, reviewer_notes } })

    return NextResponse.json({ success: true, action: 'approve' })
  } catch (err) {
    console.error('Affiliate application review error:', err)
    return NextResponse.json({ error: 'Failed to process review' }, { status: 500 })
  }
}
