-- =============================================
-- COMPREHENSIVE SEED DATA FOR ALL AFFILIATE SYSTEMS
-- Works on BOTH Replit Postgres and Supabase
-- Run AFTER sync_013_016_plus_missing.sql on Supabase
-- =============================================

SET session_replication_role = 'replica';

-- Test affiliate UUID: kitt2002@proton.me
-- 85281033-9998-4d3c-bcbc-d2053ad39eae

-- =============================================
-- 1. CONTESTS (3)
-- Table: affiliate_contests
-- Columns: id, name, description, metric, start_date, end_date, prize_description, prize_amount_cents, status, winner_user_id, winner_announced_at, created_at, updated_at
-- =============================================
DELETE FROM affiliate_contests WHERE name IN ('Summer Referral Sprint', 'Conversion King Challenge', 'Content Creator Blitz');

INSERT INTO affiliate_contests (name, description, metric, start_date, end_date, prize_description, prize_amount_cents, status) VALUES
('Summer Referral Sprint', 'Get the most referrals this month and win a cash bonus!', 'referrals', NOW() - INTERVAL '5 days', NOW() + INTERVAL '25 days', '$500 cash prize to the top performer', 50000, 'active'),
('Conversion King Challenge', 'Highest conversion rate wins! Quality over quantity.', 'conversions', NOW() - INTERVAL '3 days', NOW() + INTERVAL '27 days', '$300 bonus + Gold badge', 30000, 'active'),
('Content Creator Blitz', 'Share the most promotional content across platforms.', 'referrals', NOW() + INTERVAL '5 days', NOW() + INTERVAL '35 days', '$200 bonus + featured spotlight', 20000, 'upcoming');

-- =============================================
-- 2. CHALLENGE PROGRESS for test affiliate
-- Table: challenge_progress
-- Columns: id, challenge_id, affiliate_id, progress_count, target_count, completed_at, created_at, updated_at
-- =============================================
DELETE FROM challenge_progress WHERE affiliate_id = '85281033-9998-4d3c-bcbc-d2053ad39eae';

INSERT INTO challenge_progress (challenge_id, affiliate_id, progress_count, target_count)
SELECT id, '85281033-9998-4d3c-bcbc-d2053ad39eae',
  CASE WHEN name = 'Summer Referral Sprint' THEN 4 ELSE 2 END,
  CASE WHEN name = 'Summer Referral Sprint' THEN 10 ELSE 5 END
FROM affiliate_contests WHERE status = 'active';

-- =============================================
-- 3. KNOWLEDGE BASE ARTICLES (10)
-- Table: knowledge_base_articles
-- Columns: id, title, slug, body, category, search_keywords, is_published, view_count, sort_order, created_by, created_at, updated_at
-- =============================================
DELETE FROM knowledge_base_articles WHERE slug IN ('getting-started', 'referral-tracking', 'commission-rates', 'deep-links', 'social-posting-tips', 'payout-process', 'conversion-tips', 'discount-codes-guide', 'analytics-guide', 'tax-info');

INSERT INTO knowledge_base_articles (title, slug, body, category, search_keywords, is_published, view_count, sort_order) VALUES
('Getting Started as an Affiliate', 'getting-started', 'Welcome to the PassivePost affiliate program! This guide walks you through setting up your profile, generating referral links, and making your first share. Start by visiting the Overview tab to see your unique referral link, then check out the Resources tab for banners and swipe copy you can use right away.', 'getting-started', ARRAY['start', 'begin', 'onboarding', 'setup'], true, 142, 1),
('How Referral Tracking Works', 'referral-tracking', 'When someone clicks your referral link, a 30-day cookie is placed on their browser. If they sign up within that window, you get credit automatically. You can track all clicks and conversions in the Analytics tab. Deep links let you send traffic to specific pages while still getting tracking credit.', 'getting-started', ARRAY['tracking', 'cookie', 'referral', 'clicks'], true, 98, 2),
('Understanding Commission Rates', 'commission-rates', 'Your commission rate is locked in when you activate as an affiliate. Higher tiers earn higher rates — Bronze starts at 20%, Silver at 25%, and Gold at 30%. Your rate never decreases, even if you have a slow month. Commissions are calculated on the net invoice amount after any discounts.', 'getting-started', ARRAY['commission', 'rate', 'tier', 'percentage'], true, 87, 3),
('Using the Deep Link Generator', 'deep-links', 'Deep links let you send traffic to any specific page on PassivePost with UTM parameters for campaign tracking. Go to Tools > Link Generator, enter the destination URL, add optional UTM tags, and get a tracked link. Use link presets to save your favorite configurations.', 'tools', ARRAY['link', 'utm', 'campaign', 'deep link'], true, 63, 4),
('Creating Effective Social Posts', 'social-posting-tips', 'The best affiliate posts are authentic recommendations, not hard sells. Share your genuine experience with PassivePost. Include a clear call-to-action and your referral link. Use the AI Post Writer in the Tools tab to generate platform-specific content. The Swipe File Library has pre-written templates you can customize.', 'tips', ARRAY['social', 'content', 'tips', 'posting'], true, 55, 5),
('How Payouts Work', 'payout-process', 'Commissions move through three stages: Pending (waiting for lock period), Approved (ready for payout), and Paid. Meet the $50 minimum threshold to receive a payout. Payouts are processed monthly. Submit your tax information in the Account tab to avoid delays.', 'getting-started', ARRAY['payout', 'payment', 'earnings', 'withdrawal'], true, 76, 6),
('Maximizing Your Conversion Rate', 'conversion-tips', 'Target audiences who already need content scheduling and social media management tools. Use your personalized discount codes to sweeten the deal. Follow up with email templates from the Swipe File Library. The AI Conversion Coach in the Tools tab can analyze your traffic and suggest improvements.', 'tips', ARRAY['conversion', 'optimize', 'strategy', 'improve'], true, 44, 7),
('Using Discount Codes', 'discount-codes-guide', 'Your personalized discount codes give your audience an exclusive deal while earning you commission credit. Find your codes in the Tools tab under Promo Codes. Use them in email signatures, social bios, and content. Each code tracks redemptions so you can see which promotions perform best.', 'tools', ARRAY['discount', 'coupon', 'promo', 'code'], true, 39, 8),
('Reading Your Analytics Dashboard', 'analytics-guide', 'Your Analytics tab shows clicks, conversions, earnings trends, and traffic sources. The click heatmap reveals your best posting times. Revenue charts show monthly trends. Use the Cohort Analysis to understand long-term subscriber retention. The AI Insights panel generates personalized recommendations based on your data.', 'tools', ARRAY['analytics', 'charts', 'reports', 'data'], true, 52, 9),
('Tax Information and 1099 Reporting', 'tax-info', 'If you earn over $600 in a calendar year, you will receive a 1099-NEC form. Submit your W-9 information in the Account > Tax Center section. The Tax Summary shows your year-to-date earnings broken down by quarter. Download your tax documents directly from the Tax Center.', 'getting-started', ARRAY['tax', '1099', 'w9', 'reporting'], true, 31, 10);

-- =============================================
-- 4. ANNOUNCEMENTS (5)
-- Table: announcements
-- Columns: id, title, message, type, target_dashboards, is_active, created_by, created_at
-- =============================================
DELETE FROM announcements WHERE title IN ('New AI Tools Available', 'Summer Contest Now Live', 'Commission Rates Increased', 'Maintenance Complete', 'Holiday Promo Assets Ready');

INSERT INTO announcements (title, message, type, is_active) VALUES
('New AI Tools Available', 'We launched 5 new AI-powered tools for affiliates: Post Writer, Email Drafter, Video Script Generator, Ad Copy Creator, and Audience Analyzer. Find them in the Tools tab.', 'success', true),
('Summer Contest Now Live', 'The Summer Referral Sprint is underway! Top performer wins $500. Check the Overview tab for your progress.', 'promo', true),
('Commission Rates Increased', 'Base commission rates increased from 20% to 25% for new activations. Your locked-in rate is unaffected if higher.', 'info', true),
('Maintenance Complete', 'Platform maintenance on Feb 20 is completed. All systems running normally.', 'info', false),
('Holiday Promo Assets Ready', 'New holiday-themed banners, social cards, and email templates are now in the Resources tab. Grab them before the season ends!', 'promo', true);

-- =============================================
-- 5. PROMOTIONAL CALENDAR (3)
-- Table: promotional_calendar
-- Columns: id, title, description, start_date, end_date, campaign_type, content_suggestions, linked_asset_ids, linked_contest_id, is_published, created_by, created_at, updated_at
-- =============================================
DELETE FROM promotional_calendar WHERE title IN ('Spring Launch Campaign', 'Flash Sale Weekend', 'Content Creator Month');

INSERT INTO promotional_calendar (title, description, start_date, end_date, campaign_type, content_suggestions, is_published) VALUES
('Spring Launch Campaign', 'Major product update with new features. Push hard on social and email.', CURRENT_DATE + 7, CURRENT_DATE + 21, 'feature_launch', '[{"text": "Write a blog post about new features"}, {"text": "Create a comparison video vs competitors"}, {"text": "Share launch thread on Twitter/X"}]'::jsonb, true),
('Flash Sale Weekend', '48-hour flash sale with 40% off annual plans. High-conversion window.', CURRENT_DATE + 14, CURRENT_DATE + 16, 'flash_sale', '[{"text": "Email your list about the limited-time offer"}, {"text": "Post countdown stories on Instagram"}, {"text": "Use discount code FLASH40 in all posts"}]'::jsonb, true),
('Content Creator Month', 'Month-long celebration of content creators with special bonuses.', CURRENT_DATE + 30, CURRENT_DATE + 60, 'seasonal', '[{"text": "Share your PassivePost story"}, {"text": "Interview a fellow creator using PassivePost"}, {"text": "Create a PassivePost tutorial video"}]'::jsonb, true);

-- =============================================
-- 6. CASE STUDIES (3)
-- Table: case_studies
-- Columns: id, headline, summary, key_metric, key_metric_label, customer_quote, customer_name, customer_role, affiliate_user_id, testimonial_id, featured_image_url, tags, status, source, org_id, created_by, created_at, updated_at
-- =============================================
DELETE FROM case_studies WHERE headline IN ('How Sarah Earned $2,400/mo in Passive Income', 'From Side Hustle to Full-Time: Marcus Journey', 'Agency Owner Adds $8K/mo Revenue Stream');

INSERT INTO case_studies (headline, summary, key_metric, key_metric_label, customer_quote, customer_name, customer_role, tags, status, source) VALUES
('How Sarah Earned $2,400/mo in Passive Income', 'Sarah started sharing PassivePost with her YouTube audience of 15K subscribers. Within 3 months, she had 48 active referrals generating recurring commissions.', '$2,400', 'Monthly Recurring', 'I just mention PassivePost naturally in my videos. The recurring commissions mean I earn while I sleep.', 'Sarah Chen', 'YouTuber & Content Creator', ARRAY['youtube', 'content-creator', 'passive-income'], 'published', 'admin'),
('From Side Hustle to Full-Time: Marcus Journey', 'Marcus built a niche blog reviewing social media tools. His detailed PassivePost review ranks #1 on Google, driving 200+ clicks per month with a 12% conversion rate.', '12%', 'Conversion Rate', 'The affiliate program practically runs itself once you have good content ranking. PassivePost makes it easy.', 'Marcus Johnson', 'Blogger & SEO Specialist', ARRAY['blog', 'seo', 'reviews'], 'published', 'admin'),
('Agency Owner Adds $8K/mo Revenue Stream', 'Digital agency owner recommends PassivePost to all clients. With 160+ referrals across the agency portfolio, commissions now cover office rent.', '$8,000', 'Monthly Earnings', 'Every client I onboard to PassivePost is another recurring commission. It aligns perfectly with our services.', 'Alex Rivera', 'Digital Agency Owner', ARRAY['agency', 'b2b', 'high-volume'], 'published', 'admin');

-- =============================================
-- 7. MARKETING ASSETS (8)
-- Table: affiliate_assets
-- Columns: id, title, description, asset_type, content, file_url, file_name, sort_order, active, created_at, updated_at
-- =============================================
DELETE FROM affiliate_assets WHERE title IN ('PassivePost Banner 728x90', 'PassivePost Banner 300x250', 'Social Media Card - Instagram', 'Social Media Card - Twitter/X', 'Email Template - Introduction', 'Email Template - Follow-Up', 'Product Screenshot - Dashboard', 'Video Thumbnail Template');

INSERT INTO affiliate_assets (title, description, asset_type, content, sort_order, active) VALUES
('PassivePost Banner 728x90', 'Leaderboard banner for website headers and blog posts. Professional blue gradient design.', 'banner', '<div style="width:728px;height:90px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);border-radius:8px;display:flex;align-items:center;justify-content:center;color:white;font-family:sans-serif"><strong>PassivePost</strong> — Schedule smarter. Grow faster. Try free →</div>', 1, true),
('PassivePost Banner 300x250', 'Medium rectangle banner for sidebars and in-content placement.', 'banner', '<div style="width:300px;height:250px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;font-family:sans-serif;padding:20px;text-align:center"><h3 style="margin:0">PassivePost</h3><p style="margin:8px 0;font-size:14px">The all-in-one content scheduling platform</p><span style="background:white;color:#3b82f6;padding:8px 16px;border-radius:6px;font-weight:bold">Start Free Trial →</span></div>', 2, true),
('Social Media Card - Instagram', 'Square format social card optimized for Instagram feed posts. Eye-catching gradient with key benefits.', 'social', 'Download this Instagram-ready card showcasing PassivePost benefits. 1080x1080px. Use with caption templates from the Swipe File Library.', 3, true),
('Social Media Card - Twitter/X', 'Landscape card optimized for Twitter/X posts. Summary card format with product screenshot.', 'social', 'Twitter/X optimized card (1200x628px). Pair with one of the pre-written tweets from the Swipe File Library for maximum engagement.', 4, true),
('Email Template - Introduction', 'First-touch email template for introducing PassivePost to your audience. Includes merge tags for personalization.', 'email', E'Subject: The tool that changed my content workflow\n\nHey {{first_name}},\n\nI have been using PassivePost for {{months}} months now, and it has completely transformed how I manage content across platforms.\n\nHere is what I love most:\n- Schedule posts across all platforms in one place\n- AI-powered content suggestions\n- Analytics that actually make sense\n\nI got you an exclusive deal: {{discount_code}} for {{discount_percent}}% off.\n\nTry it free: {{referral_link}}\n\nBest,\n{{your_name}}', 5, true),
('Email Template - Follow-Up', 'Follow-up email for leads who clicked but did not sign up. Addresses common objections.', 'email', E'Subject: Quick question about content scheduling\n\nHey {{first_name}},\n\nI noticed you checked out PassivePost — any questions I can answer?\n\nMost people wonder about:\n1. Does it work with {{platform}}? Yes, all major platforms.\n2. Is it hard to set up? Takes 5 minutes.\n3. What if I dont like it? 14-day free trial, cancel anytime.\n\nHere is your link again: {{referral_link}}\n\nCheers,\n{{your_name}}', 6, true),
('Product Screenshot - Dashboard', 'High-resolution screenshot of the PassivePost dashboard. Use in blog posts and reviews.', 'image', 'Professional screenshot of the PassivePost main dashboard showing the content calendar, analytics widgets, and social platform connections. 1920x1080px PNG.', 7, true),
('Video Thumbnail Template', 'Customizable video thumbnail template for YouTube and social media video reviews.', 'image', 'Photoshop/Canva template for creating video thumbnails. Includes PassivePost logo, gradient background, and text overlay areas. 1280x720px.', 8, true);

-- =============================================
-- 8. AFFILIATE SPOTLIGHT (1)
-- Table: affiliate_spotlight
-- Columns: id, affiliate_user_id, month, affiliate_name, affiliate_avatar, story, stats_summary, is_active, created_by, created_at
-- =============================================
DELETE FROM affiliate_spotlight WHERE affiliate_user_id = '85281033-9998-4d3c-bcbc-d2053ad39eae';

INSERT INTO affiliate_spotlight (affiliate_user_id, month, affiliate_name, story, stats_summary, is_active) VALUES
('85281033-9998-4d3c-bcbc-d2053ad39eae', TO_CHAR(NOW(), 'YYYY-MM'), 'Kitt', 'Kitt joined the affiliate program 3 months ago and quickly rose to Silver tier by consistently sharing authentic content about PassivePost. Their strategy focuses on detailed platform comparisons and real workflow demonstrations.', '15 referrals | $450 earned | 8% conversion rate', true);

-- =============================================
-- 9. DISCOUNT CODES (5)
-- Table: discount_codes
-- Columns: id, code, description, discount_type, discount_value, duration, duration_months, max_uses, max_uses_per_user, min_plan, stackable, expires_at, affiliate_user_id, stripe_coupon_id, stripe_promotion_code_id, status, total_uses, total_discount_cents, created_by, created_at, updated_at
-- =============================================
DELETE FROM discount_codes WHERE code IN ('KITT20', 'WELCOME15', 'FLASH40', 'ANNUAL25', 'FRIEND10');

INSERT INTO discount_codes (code, description, discount_type, discount_value, duration, max_uses, affiliate_user_id, status) VALUES
('KITT20', 'Kitt exclusive 20% off first month', 'percentage', 20, 'once', 100, '85281033-9998-4d3c-bcbc-d2053ad39eae', 'active'),
('WELCOME15', 'Welcome discount for new users - 15% off', 'percentage', 15, 'once', 500, NULL, 'active'),
('FLASH40', 'Flash sale weekend - 40% off annual plan', 'percentage', 40, 'once', 200, NULL, 'active'),
('ANNUAL25', '25% off annual plan upgrade', 'percentage', 25, 'once', 300, NULL, 'active'),
('FRIEND10', 'Refer a friend - both get 10% off', 'percentage', 10, 'repeating', 1000, NULL, 'active');

-- =============================================
-- 10. BADGE TIERS (already seeded by migration 010, ensure they exist)
-- Table: affiliate_badge_tiers
-- Columns: id, name, threshold_cents, badge_image_url, embed_html, sort_order, created_at
-- =============================================
INSERT INTO affiliate_badge_tiers (name, threshold_cents, sort_order)
SELECT 'Rising Star', 10000, 0 WHERE NOT EXISTS (SELECT 1 FROM affiliate_badge_tiers WHERE name = 'Rising Star');

INSERT INTO affiliate_badge_tiers (name, threshold_cents, sort_order)
SELECT 'Verified Partner', 50000, 1 WHERE NOT EXISTS (SELECT 1 FROM affiliate_badge_tiers WHERE name = 'Verified Partner');

INSERT INTO affiliate_badge_tiers (name, threshold_cents, sort_order)
SELECT 'Top Partner', 250000, 2 WHERE NOT EXISTS (SELECT 1 FROM affiliate_badge_tiers WHERE name = 'Top Partner');

INSERT INTO affiliate_badge_tiers (name, threshold_cents, sort_order)
SELECT 'Elite Partner', 1000000, 3 WHERE NOT EXISTS (SELECT 1 FROM affiliate_badge_tiers WHERE name = 'Elite Partner');

-- =============================================
-- 11. BADGES for test affiliate
-- Table: affiliate_badges
-- Columns: id, affiliate_user_id, badge_type, threshold_cents, awarded_at, verification_code, is_active
-- =============================================
DELETE FROM affiliate_badges WHERE affiliate_user_id = '85281033-9998-4d3c-bcbc-d2053ad39eae';

INSERT INTO affiliate_badges (affiliate_user_id, badge_type, threshold_cents, is_active) VALUES
('85281033-9998-4d3c-bcbc-d2053ad39eae', 'Rising Star', 10000, true);

-- =============================================
-- 12. MILESTONE BONUSES (3)
-- Table: affiliate_milestones
-- Columns: id, name, referral_threshold, bonus_amount_cents, description, is_active, sort_order, created_at, updated_at
-- =============================================
INSERT INTO affiliate_milestones (name, referral_threshold, bonus_amount_cents, description, is_active, sort_order)
SELECT 'First 5 Referrals', 5, 2500, 'Earn a $25 bonus when you reach your first 5 referrals!', true, 1
WHERE NOT EXISTS (SELECT 1 FROM affiliate_milestones WHERE name = 'First 5 Referrals');

INSERT INTO affiliate_milestones (name, referral_threshold, bonus_amount_cents, description, is_active, sort_order)
SELECT '25 Club', 25, 10000, 'Welcome to the 25 Club! $100 bonus for hitting 25 referrals.', true, 2
WHERE NOT EXISTS (SELECT 1 FROM affiliate_milestones WHERE name = '25 Club');

INSERT INTO affiliate_milestones (name, referral_threshold, bonus_amount_cents, description, is_active, sort_order)
SELECT 'Century Mark', 100, 50000, 'Incredible! $500 bonus for reaching 100 referrals. You are a legend.', true, 3
WHERE NOT EXISTS (SELECT 1 FROM affiliate_milestones WHERE name = 'Century Mark');

-- =============================================
-- 13. AFFILIATE LINK PRESETS for test affiliate
-- Table: affiliate_link_presets
-- Columns: id, affiliate_user_id, name, utm_source, utm_medium, utm_campaign, utm_content, landing_page, created_at
-- =============================================
DELETE FROM affiliate_link_presets WHERE affiliate_user_id = '85281033-9998-4d3c-bcbc-d2053ad39eae';

INSERT INTO affiliate_link_presets (affiliate_user_id, name, utm_source, utm_medium, utm_campaign, landing_page) VALUES
('85281033-9998-4d3c-bcbc-d2053ad39eae', 'Twitter Bio Link', 'twitter', 'social', 'bio_link', '/'),
('85281033-9998-4d3c-bcbc-d2053ad39eae', 'YouTube Description', 'youtube', 'video', 'description', '/pricing'),
('85281033-9998-4d3c-bcbc-d2053ad39eae', 'Email Newsletter', 'newsletter', 'email', 'weekly_digest', '/features');

-- =============================================
-- 14. SHORT LINKS for test affiliate
-- Table: affiliate_short_links
-- Columns: id, affiliate_user_id, slug, destination_url, label, clicks, created_at
-- =============================================
DELETE FROM affiliate_short_links WHERE affiliate_user_id = '85281033-9998-4d3c-bcbc-d2053ad39eae';

INSERT INTO affiliate_short_links (affiliate_user_id, slug, destination_url, label, clicks) VALUES
('85281033-9998-4d3c-bcbc-d2053ad39eae', 'kitt-yt', 'https://passivepost.com/?ref=kitt2002&utm_source=youtube', 'YouTube Link', 47),
('85281033-9998-4d3c-bcbc-d2053ad39eae', 'kitt-tw', 'https://passivepost.com/?ref=kitt2002&utm_source=twitter', 'Twitter Link', 23),
('85281033-9998-4d3c-bcbc-d2053ad39eae', 'kitt-email', 'https://passivepost.com/?ref=kitt2002&utm_source=email', 'Email Link', 31);

-- =============================================
-- 15. NOTIFICATIONS for test affiliate
-- Table: notifications
-- Columns: id, user_id, title, message, type, read, link, created_at
-- =============================================
DELETE FROM notifications WHERE user_id = '85281033-9998-4d3c-bcbc-d2053ad39eae';

INSERT INTO notifications (user_id, title, message, type, read, link, created_at) VALUES
('85281033-9998-4d3c-bcbc-d2053ad39eae', 'New Referral!', 'Someone signed up through your link. Check your referrals tab.', 'success', false, '/affiliate/dashboard?tab=referrals', NOW() - INTERVAL '2 hours'),
('85281033-9998-4d3c-bcbc-d2053ad39eae', 'Commission Earned', 'You earned $15.00 commission from a new subscription.', 'success', false, '/affiliate/dashboard?tab=earnings', NOW() - INTERVAL '1 day'),
('85281033-9998-4d3c-bcbc-d2053ad39eae', 'Badge Earned: Rising Star', 'Congratulations! You earned the Rising Star badge for reaching $100 in earnings.', 'info', true, '/affiliate/dashboard?tab=tools', NOW() - INTERVAL '3 days'),
('85281033-9998-4d3c-bcbc-d2053ad39eae', 'Contest Update', 'You are in 3rd place in the Summer Referral Sprint. Keep going!', 'info', false, '/affiliate/dashboard?tab=overview', NOW() - INTERVAL '5 hours'),
('85281033-9998-4d3c-bcbc-d2053ad39eae', 'New Payout Processed', 'Your payout of $50.00 has been processed and sent to your PayPal.', 'success', true, '/affiliate/dashboard?tab=payouts', NOW() - INTERVAL '7 days');

-- =============================================
-- 16. MESSAGES for test affiliate
-- Table: affiliate_messages
-- Columns: id, affiliate_user_id, sender_id, sender_role, body, is_read, read_at, created_at
-- =============================================
DELETE FROM affiliate_messages WHERE affiliate_user_id = '85281033-9998-4d3c-bcbc-d2053ad39eae';

INSERT INTO affiliate_messages (affiliate_user_id, sender_id, sender_role, body, is_read, created_at) VALUES
('85281033-9998-4d3c-bcbc-d2053ad39eae', '85281033-9998-4d3c-bcbc-d2053ad39eae', 'admin', 'Welcome to the PassivePost affiliate program! Your account is all set up. Check out the Resources tab for marketing materials, and the Tools tab for our AI content generators. Reach out anytime if you have questions.', true, NOW() - INTERVAL '30 days'),
('85281033-9998-4d3c-bcbc-d2053ad39eae', '85281033-9998-4d3c-bcbc-d2053ad39eae', 'admin', 'Great job on your first 5 referrals! You have earned the First 5 Referrals milestone bonus of $25. Keep up the momentum — the Summer Contest is a great opportunity to earn even more.', false, NOW() - INTERVAL '5 days'),
('85281033-9998-4d3c-bcbc-d2053ad39eae', '85281033-9998-4d3c-bcbc-d2053ad39eae', 'affiliate', 'Thanks for the welcome! Quick question — do the discount codes work on annual plans too?', true, NOW() - INTERVAL '28 days');

-- =============================================
-- 17. LANDING PAGE for test affiliate
-- Table: affiliate_landing_pages
-- Columns: id, affiliate_user_id, slug, headline, bio, photo_url, custom_cta, theme_color, is_active, views, created_at, updated_at
-- =============================================
DELETE FROM affiliate_landing_pages WHERE affiliate_user_id = '85281033-9998-4d3c-bcbc-d2053ad39eae';

INSERT INTO affiliate_landing_pages (affiliate_user_id, slug, headline, bio, custom_cta, theme_color, is_active, views) VALUES
('85281033-9998-4d3c-bcbc-d2053ad39eae', 'kitt', 'Schedule Smarter with PassivePost', 'Hey! I am Kitt, a content creator who uses PassivePost daily to manage all my social media scheduling. It has saved me hours every week and I think you will love it too.', 'Start Your Free Trial', '#3b82f6', true, 89);

-- =============================================
-- 18. AFFILIATE TESTIMONIALS (3)
-- Table: affiliate_testimonials
-- Columns: id, affiliate_user_id, name, quote, earnings_display, tier_name, avatar_url, is_featured, is_active, source, sort_order, created_at
-- =============================================
DELETE FROM affiliate_testimonials WHERE name IN ('Sarah Chen', 'Marcus Johnson', 'Alex Rivera');

INSERT INTO affiliate_testimonials (name, quote, earnings_display, tier_name, is_featured, is_active, source, sort_order) VALUES
('Sarah Chen', 'PassivePost affiliate program changed my income game. The recurring commissions mean I earn even when I am not actively promoting.', '$2,400/mo', 'Gold', true, true, 'manual', 1),
('Marcus Johnson', 'Best affiliate program I have ever joined. The tracking is transparent, payouts are on time, and the marketing materials are top-notch.', '$1,200/mo', 'Silver', true, true, 'manual', 2),
('Alex Rivera', 'I recommend PassivePost to every client. The affiliate commissions now cover my office rent. Win-win for everyone.', '$8,000/mo', 'Gold', false, true, 'manual', 3);

-- =============================================
-- 19. BROADCASTS (2)
-- Table: affiliate_broadcasts
-- Columns: id, subject, body, audience_filter, sent_count, opened_count, clicked_count, status, sent_at, sent_by, created_at, updated_at
-- =============================================
DELETE FROM affiliate_broadcasts WHERE subject IN ('Welcome to the Summer Contest!', 'New AI Tools Just Dropped');

INSERT INTO affiliate_broadcasts (subject, body, sent_count, opened_count, clicked_count, status, sent_at) VALUES
('Welcome to the Summer Contest!', 'Our biggest contest is live. Most referrals by end of month wins $500!', 45, 32, 18, 'sent', NOW() - INTERVAL '5 days'),
('New AI Tools Just Dropped', 'We added 5 AI-powered tools: Post Writer, Email Drafter, Video Script Generator, Ad Copy Creator, Audience Analyzer.', 45, 28, 22, 'sent', NOW() - INTERVAL '12 days');

-- =============================================
-- 20. AFFILIATE PROFILE for test affiliate (ensure exists)
-- Table: affiliate_profiles
-- Columns: id, user_id, display_name, bio, avatar_url, payout_method, payout_email, tour_completed, created_at, updated_at, show_in_directory, quiz_results
-- =============================================
INSERT INTO affiliate_profiles (user_id, display_name, bio, payout_method, payout_email, tour_completed, show_in_directory)
SELECT '85281033-9998-4d3c-bcbc-d2053ad39eae', 'Kitt', 'Content creator and PassivePost affiliate. Sharing tools that help creators grow.', 'paypal', 'kitt2002@proton.me', true, true
WHERE NOT EXISTS (SELECT 1 FROM affiliate_profiles WHERE user_id = '85281033-9998-4d3c-bcbc-d2053ad39eae');

-- =============================================
-- 21. MILESTONE AWARDS for test affiliate
-- Table: affiliate_milestone_awards
-- Columns: id, affiliate_user_id, milestone_id, awarded_at, bonus_amount_cents
-- =============================================
DELETE FROM affiliate_milestone_awards WHERE affiliate_user_id = '85281033-9998-4d3c-bcbc-d2053ad39eae';

INSERT INTO affiliate_milestone_awards (affiliate_user_id, milestone_id, bonus_amount_cents)
SELECT '85281033-9998-4d3c-bcbc-d2053ad39eae', id, bonus_amount_cents
FROM affiliate_milestones WHERE name = 'First 5 Referrals';

-- =============================================
-- DONE
-- =============================================
SET session_replication_role = 'origin';
