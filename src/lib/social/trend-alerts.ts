import { sendEmail } from '@/lib/email/service'
import type { EmailResult } from '@/lib/email/service'

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  return url.startsWith('http') ? url : `https://${url}`
}

interface TrendAlertEmailParams {
  userEmail: string
  userName: string
  trendTitle: string
  trendDescription: string
  suggestedPost: {
    content: string
    platform: string
    hashtags?: string[]
  }
  alertId: string
}

export async function sendTrendAlertEmail(params: TrendAlertEmailParams): Promise<EmailResult> {
  const { userEmail, userName, trendTitle, trendDescription, suggestedPost, alertId } = params
  const baseUrl = getBaseUrl()

  const approveUrl = `${baseUrl}/dashboard/social/posts?action=approve&alertId=${alertId}`
  const editUrl = `${baseUrl}/dashboard/social/posts?action=edit&alertId=${alertId}`
  const ignoreUrl = `${baseUrl}/dashboard/social/posts?action=ignore&alertId=${alertId}`
  const dashboardUrl = `${baseUrl}/dashboard/social/overview`

  const platformLabel = suggestedPost.platform.charAt(0).toUpperCase() + suggestedPost.platform.slice(1).toLowerCase()

  const hashtagsHtml = suggestedPost.hashtags && suggestedPost.hashtags.length > 0
    ? `<div style="margin-top: 12px;">
        ${suggestedPost.hashtags.map(tag => `<span style="display: inline-block; background-color: #dbeafe; color: #1e40af; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 9999px; margin: 4px 4px 4px 0;">${tag.startsWith('#') ? tag : `#${tag}`}</span>`).join('')}
      </div>`
    : ''

  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trending: ${trendTitle}</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f4f4f5;">
    <div style="background: linear-gradient(135deg, #2563eb 0%, #0d9488 100%); padding: 32px 24px; text-align: center; border-radius: 0 0 0 0;">
      <h1 style="color: #ffffff; margin: 0 0 8px 0; font-size: 22px; font-weight: 700;">Trending Opportunity</h1>
      <p style="color: #e0f2fe; margin: 0; font-size: 14px;">A new trend matches your interests</p>
    </div>
    <div style="padding: 24px;">
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151;">Hi ${userName || 'there'},</p>
      <p style="margin: 0 0 8px 0; font-size: 18px; font-weight: 700; color: #1e293b;">${trendTitle}</p>
      <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563;">${trendDescription}</p>
      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 0 0 24px 0;">
        <div style="display: flex; align-items: center; margin-bottom: 12px;">
          <span style="display: inline-block; background-color: #dbeafe; color: #1e40af; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px;">${platformLabel}</span>
          <span style="font-size: 12px; color: #9ca3af; margin-left: 8px;">Suggested Post</span>
        </div>
        <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.7; white-space: pre-wrap;">${suggestedPost.content}</p>
        ${hashtagsHtml}
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0;">
        <tr>
          <td align="center" style="padding: 0 4px 0 0; width: 33.33%;">
            <a href="${approveUrl}" style="display: block; background-color: #059669; color: #ffffff; padding: 12px 8px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; text-align: center;" data-testid="button-approve-trend">Approve Post</a>
          </td>
          <td align="center" style="padding: 0 4px; width: 33.33%;">
            <a href="${editUrl}" style="display: block; background-color: #2563eb; color: #ffffff; padding: 12px 8px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; text-align: center;" data-testid="button-edit-trend">Edit Draft</a>
          </td>
          <td align="center" style="padding: 0 0 0 4px; width: 33.33%;">
            <a href="${ignoreUrl}" style="display: block; background-color: #6b7280; color: #ffffff; padding: 12px 8px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; text-align: center;" data-testid="button-ignore-trend">Ignore Alert</a>
          </td>
        </tr>
      </table>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
      <div style="text-align: center;">
        <a href="${dashboardUrl}" style="display: inline-block; color: #2563eb; font-size: 14px; text-decoration: none; font-weight: 500;">Go to Dashboard</a>
        <p style="font-size: 12px; color: #9ca3af; margin: 12px 0 0 0;">You received this email because trend alerts are enabled for your account. You can manage notification preferences in your dashboard settings.</p>
      </div>
    </div>
  </body>
</html>`

  const hashtagsText = suggestedPost.hashtags && suggestedPost.hashtags.length > 0
    ? `\nHashtags: ${suggestedPost.hashtags.map(t => t.startsWith('#') ? t : `#${t}`).join(' ')}`
    : ''

  const text = `Trending: ${trendTitle} - Post opportunity for you

Hi ${userName || 'there'},

${trendTitle}
${trendDescription}

--- Suggested Post (${platformLabel}) ---
${suggestedPost.content}${hashtagsText}

Actions:
- Approve Post: ${approveUrl}
- Edit Draft: ${editUrl}
- Ignore Alert: ${ignoreUrl}

Go to Dashboard: ${dashboardUrl}

You received this email because trend alerts are enabled for your account.`

  return sendEmail({
    to: userEmail,
    subject: `Trending: ${trendTitle} - Post opportunity for you`,
    html,
    text,
  })
}
