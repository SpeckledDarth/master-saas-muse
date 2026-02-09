-- MuseKit Core: Social Tables
-- These tables support social media scheduling features.
-- Run this migration on every fresh MuseKit clone.

-- Enable UUID generation if not already enabled
create extension if not exists "pgcrypto";

-- Social accounts: stores connected platform credentials per user
create table if not exists social_accounts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  platform text not null,
  platform_user_id text,
  platform_username text,
  display_name text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  scopes text[],
  is_valid boolean default true,
  last_validated_at timestamptz,
  last_error text,
  connected_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, platform)
);

-- Social posts: stores all social media posts (drafts, scheduled, posted)
create table if not exists social_posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  platform text not null,
  content text not null,
  media_urls text[],
  status text default 'draft',
  scheduled_at timestamptz,
  posted_at timestamptz,
  platform_post_id text,
  engagement_data jsonb default '{}'::jsonb,
  error_message text,
  ai_generated boolean default false,
  brand_voice text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for common queries
create index if not exists idx_social_accounts_user_id on social_accounts(user_id);
create index if not exists idx_social_posts_user_id on social_posts(user_id);
create index if not exists idx_social_posts_status on social_posts(user_id, status);
create index if not exists idx_social_posts_scheduled on social_posts(scheduled_at) where status = 'scheduled';

-- Auto-update updated_at trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply trigger to social_accounts
drop trigger if exists social_accounts_updated_at on social_accounts;
create trigger social_accounts_updated_at
  before update on social_accounts
  for each row execute function update_updated_at_column();

-- Apply trigger to social_posts
drop trigger if exists social_posts_updated_at on social_posts;
create trigger social_posts_updated_at
  before update on social_posts
  for each row execute function update_updated_at_column();

-- RLS policies
alter table social_accounts enable row level security;
alter table social_posts enable row level security;

-- Users can only see/manage their own accounts
create policy if not exists "Users can view own social accounts"
  on social_accounts for select
  using (auth.uid() = user_id);

create policy if not exists "Users can insert own social accounts"
  on social_accounts for insert
  with check (auth.uid() = user_id);

create policy if not exists "Users can update own social accounts"
  on social_accounts for update
  using (auth.uid() = user_id);

create policy if not exists "Users can delete own social accounts"
  on social_accounts for delete
  using (auth.uid() = user_id);

-- Users can only see/manage their own posts
create policy if not exists "Users can view own social posts"
  on social_posts for select
  using (auth.uid() = user_id);

create policy if not exists "Users can insert own social posts"
  on social_posts for insert
  with check (auth.uid() = user_id);

create policy if not exists "Users can update own social posts"
  on social_posts for update
  using (auth.uid() = user_id);

create policy if not exists "Users can delete own social posts"
  on social_posts for delete
  using (auth.uid() = user_id);
