import { getEmailClient } from './client';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  try {
    const { client, fromEmail } = await getEmailClient();

    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Email service error:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<EmailResult> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to SaaS Muse</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #0070f3; margin: 0;">Welcome to SaaS Muse!</h1>
        </div>
        
        <p>Hi ${name || 'there'},</p>
        
        <p>Thanks for signing up! We're excited to have you on board.</p>
        
        <p>With SaaS Muse, you can:</p>
        <ul>
          <li>Build your SaaS faster with our production-ready template</li>
          <li>Access authentication, payments, and admin features out of the box</li>
          <li>Scale your business with our flexible pricing plans</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://master-saas-muse-u7ga.vercel.app'}/profile" 
             style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Go to Your Profile
          </a>
        </div>
        
        <p>If you have any questions, just reply to this email. We're here to help!</p>
        
        <p>Best regards,<br>The SaaS Muse Team</p>
        
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #666; text-align: center;">
          You received this email because you signed up for SaaS Muse.
        </p>
      </body>
    </html>
  `;

  const text = `
Welcome to SaaS Muse!

Hi ${name || 'there'},

Thanks for signing up! We're excited to have you on board.

With SaaS Muse, you can:
- Build your SaaS faster with our production-ready template
- Access authentication, payments, and admin features out of the box
- Scale your business with our flexible pricing plans

Go to your profile: ${process.env.NEXT_PUBLIC_APP_URL || 'https://master-saas-muse-u7ga.vercel.app'}/profile

If you have any questions, just reply to this email. We're here to help!

Best regards,
The SaaS Muse Team
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to SaaS Muse!',
    html,
    text,
  });
}

export async function sendSubscriptionConfirmationEmail(
  email: string,
  name: string,
  planName: string,
  amount: number
): Promise<EmailResult> {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount / 100);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Subscription Confirmed</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #0070f3; margin: 0;">Subscription Confirmed!</h1>
        </div>
        
        <p>Hi ${name || 'there'},</p>
        
        <p>Your subscription to the <strong>${planName}</strong> plan has been confirmed.</p>
        
        <div style="background-color: #f5f5f5; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">Order Summary</h3>
          <p style="margin: 5px 0;"><strong>Plan:</strong> ${planName}</p>
          <p style="margin: 5px 0;"><strong>Amount:</strong> ${formattedAmount}/month</p>
        </div>
        
        <p>You now have access to all ${planName} features. Explore your new capabilities in your dashboard!</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://master-saas-muse-u7ga.vercel.app'}/billing" 
             style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Manage Your Subscription
          </a>
        </div>
        
        <p>Thank you for choosing SaaS Muse!</p>
        
        <p>Best regards,<br>The SaaS Muse Team</p>
        
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #666; text-align: center;">
          You received this email because you subscribed to SaaS Muse.
          <br>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://master-saas-muse-u7ga.vercel.app'}/billing" style="color: #666;">Manage subscription</a>
        </p>
      </body>
    </html>
  `;

  const text = `
Subscription Confirmed!

Hi ${name || 'there'},

Your subscription to the ${planName} plan has been confirmed.

Order Summary:
- Plan: ${planName}
- Amount: ${formattedAmount}/month

You now have access to all ${planName} features. Explore your new capabilities in your dashboard!

Manage your subscription: ${process.env.NEXT_PUBLIC_APP_URL || 'https://master-saas-muse-u7ga.vercel.app'}/billing

Thank you for choosing SaaS Muse!

Best regards,
The SaaS Muse Team
  `;

  return sendEmail({
    to: email,
    subject: `Your ${planName} subscription is confirmed!`,
    html,
    text,
  });
}

export async function sendSubscriptionCancelledEmail(
  email: string,
  name: string,
  planName: string,
  endDate: Date
): Promise<EmailResult> {
  const formattedDate = endDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Subscription Cancelled</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin: 0;">Subscription Cancelled</h1>
        </div>
        
        <p>Hi ${name || 'there'},</p>
        
        <p>We're sorry to see you go. Your <strong>${planName}</strong> subscription has been cancelled.</p>
        
        <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Important:</strong> You'll continue to have access to ${planName} features until <strong>${formattedDate}</strong>.</p>
        </div>
        
        <p>After this date, your account will be downgraded to the Free plan.</p>
        
        <p>Changed your mind? You can resubscribe anytime from your billing page.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://master-saas-muse-u7ga.vercel.app'}/pricing" 
             style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Plans
          </a>
        </div>
        
        <p>We'd love to hear your feedback on how we can improve. Just reply to this email!</p>
        
        <p>Best regards,<br>The SaaS Muse Team</p>
        
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #666; text-align: center;">
          You received this email because your SaaS Muse subscription was cancelled.
        </p>
      </body>
    </html>
  `;

  const text = `
Subscription Cancelled

Hi ${name || 'there'},

We're sorry to see you go. Your ${planName} subscription has been cancelled.

Important: You'll continue to have access to ${planName} features until ${formattedDate}.

After this date, your account will be downgraded to the Free plan.

Changed your mind? You can resubscribe anytime: ${process.env.NEXT_PUBLIC_APP_URL || 'https://master-saas-muse-u7ga.vercel.app'}/pricing

We'd love to hear your feedback on how we can improve. Just reply to this email!

Best regards,
The SaaS Muse Team
  `;

  return sendEmail({
    to: email,
    subject: 'Your subscription has been cancelled',
    html,
    text,
  });
}
