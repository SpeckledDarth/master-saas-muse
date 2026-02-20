-- Add source_blog_id to social_posts for cross-channel linking (flywheel)
-- This column tracks which blog article a social post was repurposed from
alter table social_posts add column if not exists source_blog_id uuid references blog_posts(id) on delete set null;

-- Index for efficient lookups of snippets by source blog
create index if not exists idx_social_posts_source_blog_id on social_posts(source_blog_id) where source_blog_id is not null;
