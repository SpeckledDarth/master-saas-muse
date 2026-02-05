interface EmailBranding {
  appName: string
  appLogo?: string
  primaryColor: string
  supportEmail?: string
  companyName?: string
  websiteUrl?: string
}

export function wrapEmailInTemplate(
  content: string,
  subject: string,
  branding: EmailBranding
): string {
  const {
    appName,
    appLogo,
    primaryColor = '#6366f1',
    supportEmail = 'support@example.com',
    companyName,
    websiteUrl = '#'
  } = branding

  const contentHtml = content
    .replace(/\n\n/g, '</p><p style="margin: 0 0 16px 0; line-height: 1.6;">')
    .replace(/\n/g, '<br>')

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              ${appLogo 
                ? `<img src="${appLogo}" alt="${appName}" style="max-height: 48px; max-width: 200px;">`
                : `<h1 style="margin: 0; font-size: 28px; font-weight: 700; color: ${primaryColor};">${appName}</h1>`
              }
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
              <p style="margin: 0 0 16px 0; line-height: 1.6; color: #374151; font-size: 16px;">
                ${contentHtml}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 32px;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">
                ${companyName || appName}
              </p>
              <p style="margin: 0 0 16px 0; font-size: 12px; color: #9ca3af;">
                This email was sent by ${appName}. 
                <a href="${websiteUrl}" style="color: ${primaryColor}; text-decoration: none;">Visit our website</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                Questions? Contact us at 
                <a href="mailto:${supportEmail}" style="color: ${primaryColor}; text-decoration: none;">${supportEmail}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

export function getStandardVariables(data: {
  appName: string
  appLogo?: string
  supportEmail?: string
  websiteUrl?: string
  userName?: string
  userEmail?: string
}) {
  return {
    '{{appName}}': data.appName || 'Our App',
    '{{appLogo}}': data.appLogo || '',
    '{{supportEmail}}': data.supportEmail || 'support@example.com',
    '{{websiteUrl}}': data.websiteUrl || '#',
    '{{name}}': data.userName || 'there',
    '{{firstName}}': data.userName?.split(' ')[0] || 'there',
    '{{email}}': data.userEmail || '',
    '{{year}}': new Date().getFullYear().toString(),
  }
}

export function replaceVariables(
  text: string, 
  variables: Record<string, string>
): string {
  let result = text
  for (const [variable, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value)
  }
  return result
}
