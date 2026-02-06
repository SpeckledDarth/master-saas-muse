import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { dispatchWebhook } from '@/lib/webhooks/dispatcher'

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null
  return new Resend(apiKey)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, subject, message, to } = body

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    const recipientEmail = to || process.env.CONTACT_EMAIL || 'support@example.com'

    const resend = getResendClient()
    if (!resend) {
      console.log('Contact form submission (Resend not configured):', {
        from: email,
        name,
        subject,
        message,
        to: recipientEmail,
      })
      dispatchWebhook('contact.submitted', { name, email, subject, message })
      return NextResponse.json({ success: true, message: 'Message logged (email not configured)' })
    }

    await resend.emails.send({
      from: 'Contact Form <onboarding@resend.dev>',
      to: recipientEmail,
      replyTo: email,
      subject: `[Contact Form] ${subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <h3>Message:</h3>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    })

    dispatchWebhook('contact.submitted', { name, email, subject, message })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
