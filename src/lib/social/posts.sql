-- Social posts table for SocioScheduler
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
  trend_source text,
  niche_triggered text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
