-- =============================================
-- COMPREHENSIVE SEED DATA FOR ALL AFFILIATE SYSTEMS
-- Run this in Supabase SQL Editor as a single block
-- =============================================

-- Temporarily disable FK checks
SET session_replication_role = 'replica';

-- Test affiliate UUID
-- kitt2002@proton.me = 85281033-9998-4d3c-bcbc-d2053ad39eae

-- 1. CONTESTS (3)
INSERT INTO affiliate_contests (name, description, metric, start_date, end_date, prize_description, prize_amount_cents, status) VALUES
('Summer Referral Sprint', 'Get the most referrals this month and win a cash bonus!', 'referrals', NOW() - INTERVAL '5 days', NOW() + INTERVAL '25 days', '$500 cash prize to the top performer', 50000, 'active'),
('Conversion King Challenge', 'Highest conversion rate wins! Quality over quantity.', 'conversions', NOW() - INTERVAL '3 days', NOW() + INTERVAL '27 days', '$300 bonus + Gold badge', 30000, 'active'),
('Content Creator Blitz', 'Share the most promotional content across platforms.', 'referrals', NOW() + INTERVAL '5 days', NOW() + INTERVAL '35 days', '$200 bonus + featured spotlight', 20000, 'upcoming');

-- 2. CHALLENGE PROGRESS
INSERT INTO challenge_progress (challenge_id, affiliate_id, progress_count, target_count)
SELECT id, '85281033-9998-4d3c-bcbc-d2053ad39eae',
  CASE WHEN name = 'Summer Referral Sprint' THEN 4 ELSE 2 END,
  CASE WHEN name = 'Summer Referral Sprint' THEN 10 ELSE 5 END
FROM affiliate_contests WHERE status = 'active';

-- 3. KNOWLEDGE BASE ARTICLES (10)
INSERT INTO knowledge_base_articles (title, slug, body, category, search_keywords, is_published, sort_order) VALUES
('Getting Started as an Affiliate', 'getting-started', 'Welcome to the PassivePost affiliate program! This guide walks you through setting up your profile, generating referral links, and making your first share.', 'getting-started', ARRAY['start', 'begin', 'onboarding'], true, 1),
('How Referral Tracking Works', 'referral-tracking', 'When someone clicks your referral link, a 30-day cookie is placed. If they sign up within that window, you get credit automatically.', 'getting-started', ARRAY['tracking', 'cookie', 'referral'], true, 2),
('Understanding Commission Rates', 'commission-rates', 'Your commission rate is locked in when you activate. Higher tiers earn higher rates. Your rate never decreases.', 'getting-started', ARRAY['commission', 'rate', 'tier'], true, 3),
('Using the Deep Link Generator', 'deep-links', 'Deep links let you send traffic to any specific page with UTM parameters for campaign tracking.', 'tools', ARRAY['link', 'utm', 'campaign'], true, 4),
('Creating Effective Social Posts', 'social-posting-tips', 'The best affiliate posts are authentic recommendations. Share your genuine experience and include a clear call-to-action.', 'tips', ARRAY['social', 'content', 'tips'], true, 5),
('How Payouts Work', 'payout-process', 'Commissions move through Pending, Approved, Paid stages. Meet the $50 minimum threshold to receive a payout.', 'getting-started', ARRAY['payout', 'payment', 'earnings'], true, 6),
('Maximizing Conversion Rate', 'conversion-tips', 'Target audiences who need content scheduling tools. Use discount codes. Follow up with email templates from the swipe file library.', 'tips', ARRAY['conversion', 'optimize', 'strategy'], true, 7),
('Using Discount Codes', 'discount-codes-guide', 'Your personalized discount codes give your audience an exclusive deal. Use them in email signatures and social bios.', 'tools', ARRAY['discount', 'coupon', 'promo'], true, 8),
('Reading Your Analytics', 'analytics-guide', 'Your analytics shows clicks, conversions, earnings trends, and traffic sources. Use the heatmap to find best posting times.', 'tools', ARRAY['analytics', 'charts', 'reports'], true, 9),
('Tax and 1099 Reporting', 'tax-info', 'Earn over $600? You get a 1099-NEC. Submit your W-9 in the Account tab. The Tax Center shows year-to-date earnings.', 'getting-started', ARRAY['tax', '1099', 'w9'], true, 10);

-- 4. ANNOUNCEMENTS (5)
INSERT INTO announcements (title, message, type, is_active) VALUES
('New AI Tools Available', 'We launched 5 new AI-powered tools for affiliates: Post Writer, Email Drafter, Video Script Generator, Ad Copy Creator, and Audience Analyzer.', 'success', true),
('Summer Contest Now Live', 'The Summer Referral Sprint is underway! Top performer wins $500. Check the Overview tab.', 'promo', true),
('Commission Rates Increased', 'Base commission rates increased from 20% to 25% for new activations. Your locked-in rate is unaffected.', 'info', true),
('Maintenance Complete', 'Platform maintenance on Feb 20 is completed. All systems running normally.', 'info', false),
('Holiday Promo Assets Ready', 'New holiday-themed banners, social cards, and email templates in the Resources tab.', 'promo', true);

-- 5. PROMOTIONAL CALENDAR (3)
INSERT INTO promotional_calendar (title, description, start_date, end_date, campaign_type, content_suggestions, is_published) VALUES
('Spring Launch Campaign', 'Major product update with new features.', CURRENT_DATE + 7, CURRENT_DATE + 21, 'feature_launch', '[{"text": "Write a blog post about new features"}, {"text": "Create a comparison video"}, {"text": "Share on Twitter"}]'::jsonb, true),
('Flash Sale Weekend', '48-hour flash sale with 40% off annual plans.', CURRENT_DATE + 14, CURRENT_DATE + 16, 'flash_sale', '[{"text": "Email your list about the limited-time offer"}, {"text": "Post countdown stories"}, {"text": "Use discount code FLASH40"}]'::jsonb, true),
('Content Creator Month', 'Month-long celebration of content creators.', CURRENT_DATE + 30, CURRENT_DATE + 60, 'seasonal', '[{"text": "Share your PassivePost story"}, {"text": "Interview a fellow creator"}, {"text": "Create a tutorial"}]'::jsonb, true);

-- 6. AFFILIATE ASSETS (8)
INSERT INTO affiliate_assets (title, description, asset_type, content, sort_order) VALUES
('Product Overview Banner', 'Professional banner for blog headers.', 'banner', 'https://passivepost.com/assets/banner-overview.png', 1),
('Social Media Post Pack', '10 pre-designed social media posts.', 'social_post', 'Ready-to-share posts for Twitter, LinkedIn, and Instagram.', 2),
('Email Welcome Sequence', '3-email sequence template for subscribers.', 'email_template', 'Subject: I found the tool I wish I had years ago\nHi {first_name}, I have been using PassivePost...', 3),
('Product Comparison Sheet', 'PassivePost vs Buffer, Hootsuite, Later.', 'document', 'PassivePost advantages: Content Flywheel, AI Grading, Blog-to-Social, Built-in affiliate program.', 4),
('Video Intro Script', '60-second script for YouTube/TikTok/Reels.', 'video', 'HOOK: What if every piece of content became 10?\nPROBLEM: Hours of cross-posting.\nSOLUTION: Content flywheel.\nCTA: Free trial link.', 5),
('Testimonial Card Template', 'Customizable testimonial graphic.', 'banner', 'PassivePost paid for itself in the first week. Customize with your results.', 6),
('ROI Calculator Infographic', 'Time and money savings visual.', 'document', '10 hrs/week saved at $50/hr = $2,000/month. PassivePost Pro: $29/month. ROI: 6,797%.', 7),
('Holiday Promo Kit', 'Seasonal promotional materials bundle.', 'bundle', 'Holiday Bundle: 3 banners, 2 email templates, 5 social posts, Code: HOLIDAY30', 8);

-- 7. ASSET USAGE
INSERT INTO affiliate_asset_usage (asset_id, affiliate_id, action)
SELECT a.id, '85281033-9998-4d3c-bcbc-d2053ad39eae', actions.action
FROM affiliate_assets a
CROSS JOIN (VALUES ('download'), ('copy'), ('view')) AS actions(action)
WHERE a.sort_order <= 4;

-- 8. AFFILIATE SPOTLIGHT
INSERT INTO affiliate_spotlight (affiliate_user_id, month, affiliate_name, story, stats_summary, is_active) VALUES
('85281033-9998-4d3c-bcbc-d2053ad39eae', TO_CHAR(CURRENT_DATE, 'YYYY-MM'), 'Kitt', 'Kitt joined 6 weeks ago and already reached Silver tier through authentic content promotion and honest reviews.', '8 referrals - $780 earned - 34% conversion rate', true);

-- 9. DISCOUNT CODES (5)
INSERT INTO discount_codes (code, description, discount_type, discount_value, duration, max_uses, affiliate_user_id, status, total_uses) VALUES
('KITT30', '30% off first month', 'percentage', 30, 'once', 100, '85281033-9998-4d3c-bcbc-d2053ad39eae', 'active', 12),
('KITT50', '50% off first month', 'percentage', 50, 'once', 50, '85281033-9998-4d3c-bcbc-d2053ad39eae', 'active', 3),
('KITTTRIAL', 'Extended free trial', 'percentage', 0, 'once', 200, '85281033-9998-4d3c-bcbc-d2053ad39eae', 'active', 7),
('KITTBUNDLE', '40% off annual plan', 'percentage', 40, 'repeating', 25, '85281033-9998-4d3c-bcbc-d2053ad39eae', 'active', 1),
('KITT20', '20% off evergreen', 'percentage', 20, 'forever', NULL, '85281033-9998-4d3c-bcbc-d2053ad39eae', 'active', 22);

-- 10. BADGE TIERS (3)
INSERT INTO affiliate_badge_tiers (name, threshold_cents, sort_order) VALUES
('Rising Star', 10000, 1),
('Power Partner', 50000, 2),
('Elite Affiliate', 200000, 3);

-- 11. BADGES earned
INSERT INTO affiliate_badges (affiliate_user_id, badge_type, threshold_cents) VALUES
('85281033-9998-4d3c-bcbc-d2053ad39eae', 'Rising Star', 10000),
('85281033-9998-4d3c-bcbc-d2053ad39eae', 'Power Partner', 50000);

-- 12. MILESTONES (3)
INSERT INTO affiliate_milestones (name, referral_threshold, bonus_amount_cents, description, sort_order) VALUES
('First Five', 5, 2500, 'Earn a $25 bonus for your first 5 referrals', 1),
('Double Digits', 10, 7500, 'Hit 10 referrals for a $75 bonus', 2),
('Quarter Century', 25, 25000, 'Reach 25 referrals for a $250 bonus', 3);

-- 13. MILESTONE AWARDS
INSERT INTO affiliate_milestone_awards (affiliate_user_id, milestone_id, bonus_amount_cents)
SELECT '85281033-9998-4d3c-bcbc-d2053ad39eae', id, bonus_amount_cents
FROM affiliate_milestones WHERE referral_threshold = 5;

-- 14. CASE STUDIES (3)
INSERT INTO case_studies (headline, summary, key_metric, key_metric_label, customer_quote, customer_name, customer_role, tags, status, source) VALUES
('From Side Hustle to $2,000/Month', 'Sarah promoted PassivePost to her 5,000-subscriber newsletter. Within 3 months, she built steady recurring commissions.', '$2,000/mo', 'Monthly Recurring', 'PassivePost practically sells itself when you use it daily.', 'Sarah Chen', 'Newsletter Creator', ARRAY['email', 'newsletter'], 'published', 'admin'),
('YouTube Channel Generated 200+ Referrals', 'Marcus created tutorial videos showing his PassivePost workflow. Videos continue generating referrals months later.', '200+', 'Total Referrals', 'One video from 6 months ago still brings 3-4 signups per week.', 'Marcus Johnson', 'YouTuber', ARRAY['youtube', 'video'], 'published', 'admin'),
('Agency Owner Saves 20 Hours/Week', 'Priya manages social media for 8 clients using PassivePost and earns commissions onboarding new clients.', '20 hrs/week', 'Time Saved', 'My clients love the content flywheel. I earn commissions on tools I recommend anyway.', 'Priya Patel', 'Agency Owner', ARRAY['agency', 'workflow'], 'published', 'admin');

-- 15. (SKIP notifications table — Replit-only, does not exist in Supabase)

-- 16. TESTIMONIALS (3)
INSERT INTO affiliate_testimonials (affiliate_user_id, name, quote, earnings_display, tier_name, is_featured, is_active, sort_order) VALUES
('85281033-9998-4d3c-bcbc-d2053ad39eae', 'Kitt', 'The affiliate dashboard gives me everything I need — real-time earnings, AI coaching, and marketing tools.', '$780+', 'Silver', true, true, 1),
(NULL, 'Alex Rivera', 'PassivePost is different. The AI tools help me create better content and tracking is transparent.', '$1,200+', 'Gold', false, true, 2),
(NULL, 'Jordan Park', 'I use PassivePost for my business AND earn commissions recommending it. Double win.', '$3,400+', 'Platinum', false, true, 3);

-- 17. MESSAGES (3)
INSERT INTO affiliate_messages (affiliate_user_id, sender_id, sender_role, body, is_read) VALUES
('85281033-9998-4d3c-bcbc-d2053ad39eae', '85281033-9998-4d3c-bcbc-d2053ad39eae', 'affiliate', 'Hi, I had a question about my commission rate. My contract says 20% but announcements mention 25%. Which applies?', true),
('85281033-9998-4d3c-bcbc-d2053ad39eae', '85281033-9998-4d3c-bcbc-d2053ad39eae', 'admin', 'Your locked-in rate of 20% applies to existing referrals. The new 25% is for new activations. Your rate never decreases.', true),
('85281033-9998-4d3c-bcbc-d2053ad39eae', '85281033-9998-4d3c-bcbc-d2053ad39eae', 'affiliate', 'Perfect, thanks for clarifying!', false);

-- 18. LANDING PAGE
INSERT INTO affiliate_landing_pages (affiliate_user_id, slug, headline, bio, custom_cta, theme_color, views) VALUES
('85281033-9998-4d3c-bcbc-d2053ad39eae', 'kitt', 'Schedule Smarter, Not Harder', 'Content creator and PassivePost power user. I manage content across 5 platforms daily. Get 30% off with my link.', 'Start Your Free Trial', '#6366f1', 47);

-- 19. SHORT LINKS
INSERT INTO affiliate_short_links (affiliate_user_id, slug, destination_url, label, clicks) VALUES
('85281033-9998-4d3c-bcbc-d2053ad39eae', 'try', 'https://passivepost.com/?ref=kitt2002', 'Main referral link', 89),
('85281033-9998-4d3c-bcbc-d2053ad39eae', 'pricing', 'https://passivepost.com/pricing?ref=kitt2002', 'Pricing page', 34),
('85281033-9998-4d3c-bcbc-d2053ad39eae', 'demo', 'https://passivepost.com/demo?ref=kitt2002', 'Demo video', 12);

-- 20. LINK PRESETS
INSERT INTO affiliate_link_presets (affiliate_user_id, name, utm_source, utm_medium, utm_campaign, landing_page) VALUES
('85281033-9998-4d3c-bcbc-d2053ad39eae', 'Twitter Bio', 'twitter', 'social', 'bio-link', '/'),
('85281033-9998-4d3c-bcbc-d2053ad39eae', 'Newsletter CTA', 'email', 'newsletter', 'weekly-digest', '/pricing'),
('85281033-9998-4d3c-bcbc-d2053ad39eae', 'YouTube Description', 'youtube', 'video', 'tutorial-series', '/features');

-- 21. EARNINGS GOAL
INSERT INTO affiliate_goals (user_id, target_cents, period, period_start, period_end, is_active) VALUES
('85281033-9998-4d3c-bcbc-d2053ad39eae', 50000, 'monthly', DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 second', true);

-- 22. BROADCASTS (2)
INSERT INTO affiliate_broadcasts (subject, body, sent_count, opened_count, clicked_count, status, sent_at) VALUES
('Welcome to the Summer Contest!', 'Our biggest contest is live. Most referrals by end of month wins $500!', 45, 32, 18, 'sent', NOW() - INTERVAL '5 days'),
('New AI Tools Just Dropped', 'We added 5 AI-powered tools: Post Writer, Email Drafter, Video Script Generator, Ad Copy Creator, Audience Analyzer.', 45, 28, 22, 'sent', NOW() - INTERVAL '12 days');

-- Re-enable FK checks
SET session_replication_role = 'origin';
