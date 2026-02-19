-- Seed script for PassivePost social module test data
-- Run after creating tables via src/lib/social/posts.sql and src/lib/social/schema.sql
-- Replace the user_id below with the actual user's UUID from your Supabase auth.users table

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS social_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  platform text NOT NULL,
  content text NOT NULL,
  media_urls text[],
  status text DEFAULT 'draft',
  scheduled_at timestamptz,
  posted_at timestamptz,
  platform_post_id text,
  engagement_data jsonb DEFAULT '{}'::jsonb,
  error_message text,
  ai_generated boolean DEFAULT false,
  brand_voice text,
  trend_source text,
  niche_triggered text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS social_accounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  platform text NOT NULL,
  platform_user_id text,
  platform_username text,
  display_name text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  scopes text[],
  is_valid boolean DEFAULT true,
  last_validated_at timestamptz,
  last_error text,
  connected_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, platform)
);

-- =============================================================================
-- SEED DATA — Update this variable to match your user ID
-- =============================================================================
DO $$
DECLARE
  seed_user_id uuid;
BEGIN
  -- Attempt to find the first user from organization_members
  SELECT user_id INTO seed_user_id FROM organization_members LIMIT 1;

  IF seed_user_id IS NULL THEN
    RAISE NOTICE 'No user found in organization_members. Set seed_user_id manually.';
    RETURN;
  END IF;

  -- Connected accounts
  INSERT INTO social_accounts (user_id, platform, platform_user_id, platform_username, display_name, is_valid, scopes, connected_at)
  VALUES
    (seed_user_id, 'facebook', 'fb_123456', 'acmehomeservices', 'Acme Home Services', true, ARRAY['pages_manage_posts', 'pages_read_engagement'], NOW() - INTERVAL '45 days'),
    (seed_user_id, 'twitter', 'tw_789012', '@AcmeHomeSvc', 'Acme Home Services', true, ARRAY['tweet.read', 'tweet.write', 'users.read'], NOW() - INTERVAL '30 days'),
    (seed_user_id, 'linkedin', 'li_345678', 'acme-home-services', 'Acme Home Services LLC', true, ARRAY['w_member_social', 'r_liteprofile'], NOW() - INTERVAL '20 days')
  ON CONFLICT (user_id, platform) DO NOTHING;

  -- Social posts with realistic engagement data
  INSERT INTO social_posts (user_id, platform, content, status, ai_generated, engagement_data, created_at, posted_at, scheduled_at)
  VALUES
  -- Facebook posts
  (seed_user_id, 'facebook', 'Spring is the perfect time to refresh your home! Whether it''s a fresh coat of paint, deep cleaning, or tackling that project you''ve been putting off — we''re here to help.

Drop a comment or send us a message for a free estimate. Your neighbors already trust us!

#SpringCleaning #HomeImprovement #LocalBusiness', 'posted', false, '{"likes": 47, "comments": 12, "shares": 8, "reach": 1240}', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NULL),

  (seed_user_id, 'facebook', 'Happy Monday! This week we''re offering 15% off all first-time services. Whether you need plumbing, electrical, or general maintenance — we''ve got you covered.

Book now before spots fill up!

#MondayMotivation #SmallBusiness #LocalDeals', 'posted', true, '{"likes": 32, "comments": 5, "shares": 14, "reach": 980}', NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days', NULL),

  (seed_user_id, 'facebook', 'Another happy customer! Thank you for trusting us with your kitchen renovation. Swipe to see the before & after.

Want results like these? Let''s chat!

#BeforeAndAfter #CustomerLove #QualityWork', 'posted', false, '{"likes": 89, "comments": 23, "shares": 31, "reach": 2450}', NOW() - INTERVAL '16 days', NOW() - INTERVAL '16 days', NULL),

  (seed_user_id, 'facebook', 'Did you know? Regular HVAC maintenance can save you up to 30% on energy bills. Book your spring checkup today!

#EnergyEfficiency #HVACTips #SaveMoney', 'posted', true, '{"likes": 21, "comments": 3, "shares": 7, "reach": 630}', NOW() - INTERVAL '23 days', NOW() - INTERVAL '23 days', NULL),

  (seed_user_id, 'facebook', 'We''re hiring! Looking for an experienced electrician to join our growing team. Competitive pay, great benefits, and a supportive work environment.

DM us or apply at acmehomeservices.com/careers', 'posted', false, '{"likes": 56, "comments": 18, "shares": 42, "reach": 3100}', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days', NULL),

  (seed_user_id, 'facebook', 'Summer is almost here! Get your deck ready with our refinishing service. Free estimates for our local followers.

#DeckSeason #SummerReady #OutdoorLiving', 'scheduled', true, '{}', NOW() - INTERVAL '1 day', NULL, NOW() + INTERVAL '3 days'),

  (seed_user_id, 'facebook', 'Looking to add value to your home? Here are 5 affordable upgrades that make a BIG difference...', 'draft', true, '{}', NOW() - INTERVAL '4 hours', NULL, NULL),

  (seed_user_id, 'facebook', 'Happy New Year from Acme Home Services! We''re kicking off 2026 with a special offer: 20% off kitchen remodels booked in January.

#NewYear #KitchenRemodel', 'posted', false, '{"likes": 38, "comments": 9, "shares": 11, "reach": 1560}', NOW() - INTERVAL '50 days', NOW() - INTERVAL '50 days', NULL),

  (seed_user_id, 'facebook', 'Holiday gift idea: Gift certificates for home services! Give the gift of a clean house, fixed faucet, or fresh paint.

#HolidayGifts #PracticalPresents', 'posted', false, '{"likes": 44, "comments": 7, "shares": 19, "reach": 1800}', NOW() - INTERVAL '70 days', NOW() - INTERVAL '70 days', NULL),

  (seed_user_id, 'facebook', 'Throwback to one of our favorite bathroom renovations from last month. Classic subway tile never goes out of style!

#BathroomReno #SubwayTile #BeforeAndAfter', 'posted', false, '{"likes": 73, "comments": 16, "shares": 24, "reach": 2100}', NOW() - INTERVAL '40 days', NOW() - INTERVAL '40 days', NULL),

  (seed_user_id, 'facebook', 'Behind the scenes: Our team prepping for a full kitchen demo. Safety first, always!

#BehindTheScenes #ConstructionLife', 'posted', false, '{"likes": 35, "comments": 8, "shares": 5, "reach": 890}', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', NULL),

  (seed_user_id, 'facebook', 'Customer review of the week: "Acme fixed our plumbing issue in under an hour. Professional, clean, and affordable. Highly recommend!" — Thanks Maria!

#5Stars #CustomerReviews', 'posted', true, '{"likes": 41, "comments": 6, "shares": 10, "reach": 1150}', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', NULL),

  -- Twitter posts
  (seed_user_id, 'twitter', 'Quick tip: Check your smoke detector batteries this weekend. It takes 2 minutes and could save lives.

Need a full home safety check? We''re just a DM away.

#HomeSafety #ProTip', 'posted', false, '{"likes": 18, "retweets": 9, "replies": 4, "impressions": 820}', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NULL),

  (seed_user_id, 'twitter', 'We just wrapped up a beautiful deck build in the neighborhood. Nothing beats that new wood smell!

Who''s ready for summer cookouts? Let''s build yours next.

#DeckSeason #OutdoorLiving', 'posted', false, '{"likes": 34, "retweets": 11, "replies": 7, "impressions": 1450}', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NULL),

  (seed_user_id, 'twitter', 'Before you DIY that electrical work... please don''t. Some things are worth calling a professional for.

Stay safe out there! We''re always available for emergencies.

#ElectricalSafety #CallAPro', 'posted', true, '{"likes": 67, "retweets": 28, "replies": 15, "impressions": 3200}', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days', NULL),

  (seed_user_id, 'twitter', 'Just helped a first-time homeowner fix a leaky faucet and showed them basic maintenance tips. Teaching moments are the best part of this job.

#Plumbing #FirstTimeHomeowner', 'posted', false, '{"likes": 42, "retweets": 6, "replies": 11, "impressions": 1890}', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days', NULL),

  (seed_user_id, 'twitter', 'PSA: If your water heater is more than 10 years old, it''s time to start planning a replacement. Don''t wait for it to fail!

#HomeMaintenanceTips', 'posted', true, '{"likes": 25, "retweets": 14, "replies": 3, "impressions": 1100}', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days', NULL),

  (seed_user_id, 'twitter', 'Thread: 5 things every new homeowner should check in their first week', 'scheduled', true, '{}', NOW(), NULL, NOW() + INTERVAL '2 days'),

  (seed_user_id, 'twitter', 'Cold weather tip: Keep your faucets dripping when temps drop below freezing. Frozen pipes are no joke!

#WinterTips #HomeMaintenance', 'posted', false, '{"likes": 51, "retweets": 22, "replies": 6, "impressions": 2100}', NOW() - INTERVAL '55 days', NOW() - INTERVAL '55 days', NULL),

  (seed_user_id, 'twitter', 'Pro tip: Your garbage disposal needs ice and lemon occasionally to stay fresh and sharp. Try it this weekend!

#KitchenHacks', 'posted', true, '{"likes": 29, "retweets": 15, "replies": 8, "impressions": 1350}', NOW() - INTERVAL '75 days', NOW() - INTERVAL '75 days', NULL),

  (seed_user_id, 'twitter', 'Remodeling season is here! What project has been on your to-do list the longest? Drop it below and we''ll give you a time estimate.

#Remodeling #HomeProjects', 'posted', false, '{"likes": 38, "retweets": 5, "replies": 22, "impressions": 1680}', NOW() - INTERVAL '35 days', NOW() - INTERVAL '35 days', NULL),

  (seed_user_id, 'twitter', 'Proud to sponsor the local little league team this season! Community matters.

#CommunityFirst #LocalBusiness', 'posted', false, '{"likes": 52, "retweets": 18, "replies": 9, "impressions": 2200}', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days', NULL),

  -- LinkedIn posts
  (seed_user_id, 'linkedin', 'As a small business owner, I''ve learned that consistency beats perfection.

Posting regularly, showing up for customers, delivering on promises — that''s what builds a reputation.

3 years in and we''re growing faster than ever. Grateful for every client who took a chance on us.

What''s the best business lesson you''ve learned?

#SmallBusiness #Entrepreneurship #Growth', 'posted', false, '{"likes": 124, "comments": 28, "shares": 15, "impressions": 4500}', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', NULL),

  (seed_user_id, 'linkedin', 'Excited to announce we''re expanding our service area! Starting next month, we''ll be covering the entire metro region.

If you know anyone who needs reliable home services, send them our way. Referrals are the best compliment!

#BusinessGrowth #Expansion #HomeServices', 'posted', false, '{"likes": 89, "comments": 14, "shares": 22, "impressions": 3800}', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', NULL),

  (seed_user_id, 'linkedin', 'Big milestone: We just completed our 500th project! From fixing a leaky faucet to full kitchen renovations, every job matters.

Thank you to our incredible team and our loyal customers.

#Milestone #SmallBusinessSuccess #500Projects', 'posted', true, '{"likes": 156, "comments": 34, "shares": 28, "impressions": 5600}', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days', NULL),

  (seed_user_id, 'linkedin', 'Investing in our team: We just sent three of our technicians to a week-long advanced certification program.

Better trained team = better results for our clients. Simple as that.

#TeamDevelopment #ContinuousImprovement', 'posted', false, '{"likes": 78, "comments": 11, "shares": 9, "impressions": 2900}', NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days', NULL),

  (seed_user_id, 'linkedin', 'Thought leadership piece: Why property managers should vet their maintenance partners carefully — and what questions to ask.', 'draft', true, '{}', NOW() - INTERVAL '6 hours', NULL, NULL),

  (seed_user_id, 'linkedin', 'End-of-year reflection: In 2025 we served over 800 families. Here''s to even more in 2026.

#YearInReview #Goals2026', 'posted', true, '{"likes": 112, "comments": 19, "shares": 16, "impressions": 4200}', NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days', NULL),

  (seed_user_id, 'linkedin', 'Just wrapped up a commercial project: full HVAC install for a 10,000 sq ft office. Delivered on time, on budget.

#CommercialHVAC #ProjectManagement', 'posted', false, '{"likes": 95, "comments": 8, "shares": 12, "impressions": 3400}', NOW() - INTERVAL '45 days', NOW() - INTERVAL '45 days', NULL),

  (seed_user_id, 'linkedin', 'Looking for reliable subcontractors in the metro area. If you or someone you know does quality tile work, flooring, or painting — reach out!

#Hiring #Subcontractors #Trades', 'posted', true, '{"likes": 67, "comments": 22, "shares": 18, "impressions": 3100}', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days', NULL);

  RAISE NOTICE 'Seeded % social posts and 3 social accounts for user %', 30, seed_user_id;
END $$;

-- Enable social module in organization settings
UPDATE organization_settings
SET settings = jsonb_set(settings::jsonb, '{features,socialModuleEnabled}', 'true')
WHERE app_id = 'default'
  AND NOT (settings::jsonb->'features'->>'socialModuleEnabled')::boolean;
