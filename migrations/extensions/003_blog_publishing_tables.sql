-- PassivePost Extension: Blog Publishing Tables
-- Run this migration AFTER 001_passivepost_tables.sql
-- These tables support the blog cross-posting feature.

-- Enable UUID generation if not already enabled
create extension if not exists "pgcrypto";

------------------------------------------------------------------------
-- 1. Blog Connections table
------------------------------------------------------------------------

create table if not exists blog_connections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null,
  platform_username text,
  display_name text,
  site_url text,
  access_token_encrypted text,
  api_key_encrypted text,
  is_valid boolean default true,
  last_validated_at timestamptz,
  last_error text,
  connected_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists idx_blog_connections_user_platform on blog_connections(user_id, platform);

------------------------------------------------------------------------
-- 2. Blog Posts table
------------------------------------------------------------------------

create table if not exists blog_posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null default '',
  excerpt text,
  slug text,
  cover_image_url text,
  status text default 'draft',
  platforms text[] default '{}',
  published_urls jsonb default '{}'::jsonb,
  seo_title text,
  seo_description text,
  tags text[] default '{}',
  series_name text,
  scheduled_at timestamptz,
  published_at timestamptz,
  repurposed boolean default false,
  repurpose_count integer default 0,
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_blog_posts_user_id on blog_posts(user_id);
create index if not exists idx_blog_posts_user_status on blog_posts(user_id, status);
create index if not exists idx_blog_posts_series on blog_posts(user_id, series_name) where series_name is not null;

------------------------------------------------------------------------
-- 3. Triggers
------------------------------------------------------------------------

drop trigger if exists blog_connections_updated_at on blog_connections;
create trigger blog_connections_updated_at
  before update on blog_connections
  for each row execute function update_updated_at_column();

drop trigger if exists blog_posts_updated_at on blog_posts;
create trigger blog_posts_updated_at
  before update on blog_posts
  for each row execute function update_updated_at_column();

------------------------------------------------------------------------
-- 4. Row Level Security
------------------------------------------------------------------------

alter table blog_connections enable row level security;
alter table blog_posts enable row level security;

create policy if not exists "Users can view own blog connections"
  on blog_connections for select
  using (auth.uid() = user_id);

create policy if not exists "Users can insert own blog connections"
  on blog_connections for insert
  with check (auth.uid() = user_id);

create policy if not exists "Users can update own blog connections"
  on blog_connections for update
  using (auth.uid() = user_id);

create policy if not exists "Users can delete own blog connections"
  on blog_connections for delete
  using (auth.uid() = user_id);

create policy if not exists "Users can view own blog posts"
  on blog_posts for select
  using (auth.uid() = user_id);

create policy if not exists "Users can insert own blog posts"
  on blog_posts for insert
  with check (auth.uid() = user_id);

create policy if not exists "Users can update own blog posts"
  on blog_posts for update
  using (auth.uid() = user_id);

create policy if not exists "Users can delete own blog posts"
  on blog_posts for delete
  using (auth.uid() = user_id);
