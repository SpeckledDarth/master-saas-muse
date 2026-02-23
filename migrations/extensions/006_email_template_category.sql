-- Add category column to email_templates for grouping by purpose
-- Run this migration in Supabase SQL editor

ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS category text DEFAULT 'general';
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
