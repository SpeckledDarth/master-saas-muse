import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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

    if (!process.env.RESEND_API_KEY) {
      console.log('Contact form submission (Resend not configured):', {
        from: email,
        name,
        subject,
        message,
        to: recipientEmail,
      })
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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
