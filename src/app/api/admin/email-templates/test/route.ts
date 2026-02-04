import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getEmailClient } from '@/lib/email/client'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (userRole?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { templateId } = body

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 })
    }

    const adminClient = createAdminClient()
    const { data: template, error: templateError } = await adminClient
      .from('email_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (templateError || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const { data: settings } = await adminClient
      .from('organization_settings')
      .select('value')
      .eq('key', 'branding')
      .single()

    const appName = settings?.value?.appName || 'Your App'

    const sampleData: Record<string, string> = {
      '{{appName}}': appName,
      '{{name}}': user.user_metadata?.full_name || 'Test User',
      '{{planName}}': 'Pro Plan',
      '{{endDate}}': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      '{{orgName}}': 'Test Organization',
      '{{inviteLink}}': 'https://example.com/invite/test123',
      '{{resetLink}}': 'https://example.com/reset/test123',
    }

    let subject = template.subject
    let emailBody = template.body

    for (const [variable, value] of Object.entries(sampleData)) {
      subject = subject.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value)
      emailBody = emailBody.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value)
    }

    subject = `[TEST] ${subject}`

    const { client, fromEmail } = await getEmailClient()
    
    const { error: sendError } = await client.emails.send({
      from: fromEmail,
      to: user.email!,
      subject,
      text: emailBody,
      html: emailBody.replace(/\n/g, '<br>'),
    })

    if (sendError) {
      console.error('Email send error:', sendError)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Test email sent to ${user.email}` 
    })
  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json({ error: 'Failed to send test email' }, { status: 500 })
  }
}
