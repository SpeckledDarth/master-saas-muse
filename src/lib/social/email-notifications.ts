import { sendEmail } from '@/lib/email/service'
import type { EmailResult } from '@/lib/email/service'

function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  return url.startsWith('http') ? url : `https://${url}`
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

function truncateContent(content: string, maxLength = 100): string {
  if (content.length <= maxLength) return content
  return content.slice(0, maxLength) + '...'
}

export async function sendPostPublishedEmail(
  userEmail: string,
  userName: string,
  platform: string,
  postContent: string,
  postUrl?: string
): Promise<EmailResult> {
  const platformName = capitalize(platform)
  const preview = truncateContent(postContent)
  const dashboardUrl = `${getAppUrl()}/dashboard/social/posts`

  const postLinkHtml = postUrl
    ? `<div style="text-align: center; margin: 24px 0;">
        <a href="${postUrl}" style="background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">View Your Post</a>
      </div>`
    : ''

  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your post on ${platformName} is live!</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #0d9488; margin: 0;">Your post is live!</h1>
    </div>
    <p>Hi ${userName || 'there'},</p>
    <p>Your post on <strong>${platformName}</strong> has been successfully published.</p>
    <div style="background-color: #f0fdfa; border-left: 4px solid #0d9488; border-radius: 0 8px 8px 0; padding: 16px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #374151;">${preview}</p>
    </div>
    ${postLinkHtml}
    <div style="text-align: center; margin: 24px 0;">
      <a href="${dashboardUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">Go to Dashboard</a>
    </div>
    <p>Best regards,<br>The SaaS Muse Team</p>
    <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;">
    <p style="font-size: 12px; color: #666; text-align: center;">You received this email because a scheduled post was published on your behalf.</p>
  </body>
</html>`

  const text = `Your post on ${platformName} is live!\n\nHi ${userName || 'there'},\n\nYour post on ${platformName} has been successfully published.\n\nPost preview: ${preview}\n\n${postUrl ? `View your post: ${postUrl}\n\n` : ''}Dashboard: ${dashboardUrl}\n\nBest regards,\nThe SaaS Muse Team`

  return sendEmail({
    to: userEmail,
    subject: `Your post on ${platformName} is live!`,
    html,
    text,
  })
}

export async function sendPostFailedEmail(
  userEmail: string,
  userName: string,
  platform: string,
  postContent: string,
  errorMessage: string
): Promise<EmailResult> {
  const platformName = capitalize(platform)
  const preview = truncateContent(postContent)
  const postsUrl = `${getAppUrl()}/dashboard/social/posts`
  const isTokenError = /token|expired|reconnect|auth|unauthorized/i.test(errorMessage)

  const reconnectHtml = isTokenError
    ? `<div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 16px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #92400e;"><strong>Account reconnection needed:</strong> This error usually means your ${platformName} connection has expired. Please reconnect your account in the dashboard to resume posting.</p>
      </div>`
    : ''

  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Post to ${platformName} failed</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #dc2626; margin: 0;">Post failed to publish</h1>
    </div>
    <p>Hi ${userName || 'there'},</p>
    <p>Unfortunately, your post to <strong>${platformName}</strong> could not be published.</p>
    <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; border-radius: 0 8px 8px 0; padding: 16px; margin: 20px 0;">
      <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #991b1b;">What went wrong:</p>
      <p style="margin: 0; font-size: 14px; color: #374151;">${errorMessage}</p>
    </div>
    <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280; font-weight: 600;">YOUR POST:</p>
      <p style="margin: 0; font-size: 14px; color: #374151;">${preview}</p>
    </div>
    ${reconnectHtml}
    <div style="text-align: center; margin: 24px 0;">
      <a href="${postsUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">Retry from Dashboard</a>
    </div>
    <p>Best regards,<br>The SaaS Muse Team</p>
    <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;">
    <p style="font-size: 12px; color: #666; text-align: center;">You received this email because a scheduled post failed to publish.</p>
  </body>
</html>`

  const text = `Post to ${platformName} failed\n\nHi ${userName || 'there'},\n\nUnfortunately, your post to ${platformName} could not be published.\n\nWhat went wrong: ${errorMessage}\n\nYour post: ${preview}\n\n${isTokenError ? `Your ${platformName} connection may have expired. Please reconnect your account in the dashboard.\n\n` : ''}Retry from dashboard: ${postsUrl}\n\nBest regards,\nThe SaaS Muse Team`

  return sendEmail({
    to: userEmail,
    subject: `Post to ${platformName} failed`,
    html,
    text,
  })
}
