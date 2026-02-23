-- Audit Log: Tracks all admin CRUD actions across affiliate system
-- Run this migration in Supabase SQL editor

create extension if not exists "pgcrypto";

create table if not exists affiliate_audit_log (
  id uuid default gen_random_uuid() primary key,
  admin_user_id uuid not null,
  admin_email text,
  action text not null check (action in ('create', 'update', 'delete', 'approve', 'reject', 'send', 'soft_delete', 'restore')),
  entity_type text not null,
  entity_id text,
  entity_name text,
  details jsonb default '{}',
  created_at timestamptz default now()
);

create index if not exists idx_audit_log_created on affiliate_audit_log(created_at desc);
create index if not exists idx_audit_log_entity on affiliate_audit_log(entity_type, entity_id);
create index if not exists idx_audit_log_admin on affiliate_audit_log(admin_user_id);

-- Soft-delete support for applications
alter table affiliate_applications add column if not exists deleted_at timestamptz;
alter table affiliate_applications add column if not exists deleted_by uuid;
alter table affiliate_applications add column if not exists delete_reason text;
