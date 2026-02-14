-- PassivePost Extension: Custom tables for AI social media scheduling
-- Run this migration AFTER core/001_social_tables.sql
-- These tables are specific to PassivePost and would NOT exist in other Muse clones.

-- Enable UUID generation if not already enabled
create extension if not exists "pgcrypto";

------------------------------------------------------------------------
-- 1. Extend social_posts with PassivePost-specific columns
------------------------------------------------------------------------

-- trend_source: where the post idea came from (e.g., 'x_hashtag', 'fb_mention', 'local_query')
alter table social_posts add column if not exists trend_source text;

-- niche_triggered: links to user's niche for gig relevance (e.g., 'magician', 'plumber')
alter table social_posts add column if not exists niche_triggered text;

-- Add 'queued' and 'approved' as valid status values
-- Since status is text (not enum), no migration needed — just document the expanded values:
-- Existing: 'draft', 'scheduled', 'posting', 'posted', 'failed'
-- Added:    'queued' (waiting in BullMQ), 'approved' (user approved AI suggestion), 'ignored' (user rejected)

-- Composite index for fast queue views
create index if not exists idx_social_posts_user_status on social_posts(user_id, status);

------------------------------------------------------------------------
-- 2. Brand Preferences table
------------------------------------------------------------------------

create table if not exists brand_preferences (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  org_id uuid null,
  tone text not null default 'professional',
  niche text not null default 'other',
  location text,
  sample_urls text[] default '{}',
  target_audience text,
  posting_goals text,
  preferred_platforms text[] default '{}',
  post_frequency text default 'daily',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- One brand preference per user
create unique index if not exists idx_brand_preferences_user_id on brand_preferences(user_id);
create index if not exists idx_brand_preferences_org_id on brand_preferences(org_id);

------------------------------------------------------------------------
-- 3. Alert Logs table
------------------------------------------------------------------------

create table if not exists alert_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  org_id uuid null,
  trend_text text not null,
  suggested_post_id uuid references social_posts(id) on delete set null,
  action_taken text,
  platform text not null,
  source_url text,
  created_at timestamptz default now()
);

-- Index for recent alerts feed
create index if not exists idx_alert_logs_user_created on alert_logs(user_id, created_at desc);

------------------------------------------------------------------------
-- 4. Triggers
------------------------------------------------------------------------

-- Reuse the update_updated_at_column() function from core migration
-- Apply to brand_preferences
drop trigger if exists brand_preferences_updated_at on brand_preferences;
create trigger brand_preferences_updated_at
  before update on brand_preferences
  for each row execute function update_updated_at_column();

------------------------------------------------------------------------
-- 5. Row Level Security
------------------------------------------------------------------------

alter table brand_preferences enable row level security;
alter table alert_logs enable row level security;

-- Brand preferences: users see/manage their own
create policy if not exists "Users can view own brand preferences"
  on brand_preferences for select
  using (auth.uid() = user_id);

create policy if not exists "Users can insert own brand preferences"
  on brand_preferences for insert
  with check (auth.uid() = user_id);

create policy if not exists "Users can update own brand preferences"
  on brand_preferences for update
  using (auth.uid() = user_id);

create policy if not exists "Users can delete own brand preferences"
  on brand_preferences for delete
  using (auth.uid() = user_id);

-- Alert logs: users see their own alerts
create policy if not exists "Users can view own alert logs"
  on alert_logs for select
  using (auth.uid() = user_id);

create policy if not exists "Users can insert own alert logs"
  on alert_logs for insert
  with check (auth.uid() = user_id);
