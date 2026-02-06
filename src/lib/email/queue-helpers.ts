import { addEmailJob } from '@/lib/queue'
import { sendEmail, type SendEmailOptions, type EmailResult } from './service'

export async function queueEmail(
  options: SendEmailOptions & { emailType?: string }
): Promise<EmailResult> {
  const { emailType = 'generic', ...emailOptions } = options

  try {
    const jobId = await addEmailJob({
      emailType: emailType as 'welcome' | 'subscription-confirmed' | 'subscription-cancelled' | 'team-invite' | 'generic',
      to: emailOptions.to,
      subject: emailOptions.subject,
      html: emailOptions.html,
      text: emailOptions.text,
      replyTo: emailOptions.replyTo,
    })

    if (jobId) {
      console.log(`[Email] Queued ${emailType} email (job ${jobId})`)
      return { success: true, messageId: `queued:${jobId}` }
    }
  } catch (err) {
    console.warn('[Email] Queue failed, sending inline:', (err as Error).message)
  }

  return sendEmail(emailOptions)
}

export async function queueWelcomeEmail(email: string, name: string): Promise<EmailResult> {
  const { sendWelcomeEmail } = await import('./service')

  try {
    const html = buildWelcomeHtml(name)
    const text = buildWelcomeText(name)

    const jobId = await addEmailJob({
      emailType: 'welcome',
      to: email,
      subject: 'Welcome to SaaS Muse!',
      html,
      text,
    })

    if (jobId) {
      console.log(`[Email] Queued welcome email (job ${jobId})`)
      return { success: true, messageId: `queued:${jobId}` }
    }
  } catch (err) {
    console.warn('[Email] Queue failed for welcome, sending inline:', (err as Error).message)
  }

  return sendWelcomeEmail(email, name)
}

export async function queueSubscriptionEmail(
  email: string,
  name: string,
  planName: string,
  amount: number
): Promise<EmailResult> {
  const { sendSubscriptionConfirmationEmail } = await import('./service')

  try {
    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100)

    const html = buildSubscriptionHtml(name, planName, formattedAmount)
    const text = buildSubscriptionText(name, planName, formattedAmount)

    const jobId = await addEmailJob({
      emailType: 'subscription-confirmed',
      to: email,
      subject: `Your ${planName} subscription is confirmed!`,
      html,
      text,
    })

    if (jobId) {
      console.log(`[Email] Queued subscription email (job ${jobId})`)
      return { success: true, messageId: `queued:${jobId}` }
    }
  } catch (err) {
    console.warn('[Email] Queue failed for subscription, sending inline:', (err as Error).message)
  }

  return sendSubscriptionConfirmationEmail(email, name, planName, amount)
}

function buildWelcomeHtml(name: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://master-saas-muse-u7ga.vercel.app'
  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Welcome to SaaS Muse</title></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;"><h1 style="color: #0070f3; margin: 0;">Welcome to SaaS Muse!</h1></div>
        <p>Hi ${name || 'there'},</p>
        <p>Thanks for signing up! We're excited to have you on board.</p>
        <p>With SaaS Muse, you can:</p>
        <ul><li>Build your SaaS faster with our production-ready template</li><li>Access authentication, payments, and admin features out of the box</li><li>Scale your business with our flexible pricing plans</li></ul>
        <div style="text-align: center; margin: 30px 0;"><a href="${appUrl}/profile" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Go to Your Profile</a></div>
        <p>If you have any questions, just reply to this email. We're here to help!</p>
        <p>Best regards,<br>The SaaS Muse Team</p>
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;">
        <p style="font-size: 12px; color: #666; text-align: center;">You received this email because you signed up for SaaS Muse.</p>
      </body>
    </html>`
}

function buildWelcomeText(name: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://master-saas-muse-u7ga.vercel.app'
  return `Welcome to SaaS Muse!\n\nHi ${name || 'there'},\n\nThanks for signing up! We're excited to have you on board.\n\nGo to your profile: ${appUrl}/profile\n\nBest regards,\nThe SaaS Muse Team`
}

function buildSubscriptionHtml(name: string, planName: string, formattedAmount: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://master-saas-muse-u7ga.vercel.app'
  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Subscription Confirmed</title></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;"><h1 style="color: #0070f3; margin: 0;">Subscription Confirmed!</h1></div>
        <p>Hi ${name || 'there'},</p>
        <p>Your subscription to the <strong>${planName}</strong> plan has been confirmed.</p>
        <div style="background-color: #f5f5f5; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">Order Summary</h3>
          <p style="margin: 5px 0;"><strong>Plan:</strong> ${planName}</p>
          <p style="margin: 5px 0;"><strong>Amount:</strong> ${formattedAmount}/month</p>
        </div>
        <div style="text-align: center; margin: 30px 0;"><a href="${appUrl}/billing" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Manage Your Subscription</a></div>
        <p>Thank you for choosing SaaS Muse!</p>
        <p>Best regards,<br>The SaaS Muse Team</p>
      </body>
    </html>`
}

function buildSubscriptionText(name: string, planName: string, formattedAmount: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://master-saas-muse-u7ga.vercel.app'
  return `Subscription Confirmed!\n\nHi ${name || 'there'},\n\nYour subscription to the ${planName} plan has been confirmed.\n\nPlan: ${planName}\nAmount: ${formattedAmount}/month\n\nManage your subscription: ${appUrl}/billing\n\nThank you for choosing SaaS Muse!\n\nBest regards,\nThe SaaS Muse Team`
}
