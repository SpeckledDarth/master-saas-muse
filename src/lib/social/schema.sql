-- Social accounts table for PassivePost
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
