import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getEmailClient } from '@/lib/email/client'
import { wrapEmailInTemplate, replaceVariables } from '@/lib/email/template'
import { getTeamPermissions, type TeamRole } from '@/lib/team-permissions'

async function checkUserPermissions(userId: string, adminClient: any) {
  const { data: userRole } = await adminClient
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle()

  if (userRole?.role === 'admin') {
    return { permissions: getTeamPermissions('owner') }
  }

  const { data: teamMember } = await adminClient
    .from('organization_members')
    .select('role')
    .eq('user_id', userId)
    .eq('organization_id', 1)
    .maybeSingle()

  if (teamMember?.role) {
    return { permissions: getTeamPermissions(teamMember.role as TeamRole) }
  }

  return { permissions: null }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()
    const { permissions } = await checkUserPermissions(user.id, adminClient)
    
    if (!permissions?.canEditContent) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { templateId } = body

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 })
    }

    const { data: template, error: templateError } = await adminClient
      .from('email_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (templateError || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Get branding settings
    const { data: settingsData } = await adminClient
      .from('organization_settings')
      .select('settings')
      .eq('app_id', 'default')
      .single()

    const branding = settingsData?.settings?.branding || {}
    const appName = branding.appName || 'Your App'
    const appLogo = branding.logoUrl || ''
    const primaryColor = branding.primaryColor || '#6366f1'
    const supportEmail = branding.supportEmail || 'support@example.com'
    const websiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'

    const sampleData: Record<string, string> = {
      '{{appName}}': appName,
      '{{appLogo}}': appLogo,
      '{{name}}': user.user_metadata?.full_name || 'Test User',
      '{{firstName}}': (user.user_metadata?.full_name || 'Test').split(' ')[0],
      '{{email}}': user.email || '',
      '{{planName}}': 'Pro Plan',
      '{{endDate}}': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      '{{orgName}}': 'Test Organization',
      '{{inviteLink}}': 'https://example.com/invite/test123',
      '{{resetLink}}': 'https://example.com/reset/test123',
      '{{supportEmail}}': supportEmail,
      '{{websiteUrl}}': websiteUrl,
      '{{year}}': new Date().getFullYear().toString(),
    }

    const subject = `[TEST] ${replaceVariables(template.subject, sampleData)}`
    const emailBody = replaceVariables(template.body, sampleData)

    // Wrap in branded HTML template
    const htmlEmail = wrapEmailInTemplate(emailBody, subject, {
      appName,
      appLogo: appLogo || undefined,
      primaryColor,
      supportEmail,
      websiteUrl,
    })

    const { client, fromEmail } = await getEmailClient()
    
    // Allow override via request body for testing
    const recipientEmail = body.recipientEmail || user.email!
    
    const { error: sendError } = await client.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject,
      text: emailBody,
      html: htmlEmail,
    })

    if (sendError) {
      console.error('Email send error:', sendError)
      return NextResponse.json({ 
        error: `Failed to send email: ${sendError.message || JSON.stringify(sendError)}` 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Test email sent to ${recipientEmail}` 
    })
  } catch (error) {
    console.error('Test email error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ 
      error: `Failed to send test email: ${errorMessage}` 
    }, { status: 500 })
  }
}
