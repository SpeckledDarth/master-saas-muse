import { z } from 'zod';

// ============================================
// Common validation patterns
// ============================================

export const emailSchema = z.string().email('Invalid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters');

export const uuidSchema = z.string().uuid('Invalid ID format');

// ============================================
// Auth schemas
// ============================================

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long').optional(),
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// ============================================
// Profile schemas
// ============================================

export const updateProfileSchema = z.object({
  full_name: z.string().max(100, 'Name is too long').optional(),
  avatar_url: z.string().url('Invalid URL').optional().nullable(),
});

// ============================================
// Admin schemas
// ============================================

export const updateUserRoleSchema = z.object({
  userId: uuidSchema,
  role: z.enum(['admin', 'member'], {
    errorMap: () => ({ message: 'Role must be admin or member' }),
  }),
});

export const updateOrgSettingsSchema = z.object({
  organization_name: z.string().max(100, 'Name is too long').optional(),
  support_email: emailSchema.optional(),
  allow_signups: z.boolean().optional(),
  maintenance_mode: z.boolean().optional(),
  require_email_verification: z.boolean().optional(),
  enable_google_signin: z.boolean().optional(),
});

// ============================================
// Email schemas
// ============================================

export const sendEmailSchema = z.object({
  to: z.union([emailSchema, z.array(emailSchema)]),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject is too long'),
  html: z.string().min(1, 'HTML content is required'),
  text: z.string().optional(),
});

// ============================================
// Stripe schemas
// ============================================

export const createCheckoutSchema = z.object({
  priceId: z.string().min(1, 'Price ID is required'),
  successUrl: z.string().url('Invalid success URL').optional(),
  cancelUrl: z.string().url('Invalid cancel URL').optional(),
});

// ============================================
// Validation helper
// ============================================

export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const firstError = result.error.errors[0];
  return {
    success: false,
    error: firstError?.message || 'Validation failed',
  };
}

// ============================================
// Type exports
// ============================================

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type UpdateOrgSettingsInput = z.infer<typeof updateOrgSettingsSchema>;
export type SendEmailInput = z.infer<typeof sendEmailSchema>;
export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
