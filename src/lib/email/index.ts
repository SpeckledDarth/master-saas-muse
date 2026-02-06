export { getEmailClient } from './client';
export {
  sendEmail,
  sendWelcomeEmail,
  sendSubscriptionConfirmationEmail,
  sendSubscriptionCancelledEmail,
  type SendEmailOptions,
  type EmailResult,
} from './service';
export {
  queueEmail,
  queueWelcomeEmail,
  queueSubscriptionEmail,
} from './queue-helpers';
