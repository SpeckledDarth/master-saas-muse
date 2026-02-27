# PassivePost — Complete Feature Inventory

> **Last Updated:** February 27, 2026

PassivePost is a closed-loop business intelligence platform for content creators. This document is a complete inventory of every feature that has been built, organized by system. Each feature includes a plain-English description and the value it provides to users, administrators, or the business.

For context on the product vision, see [PRODUCT_IDENTITY.md](./PRODUCT_IDENTITY.md).

---

## Table of Contents

1. [Authentication & User Management](#system-1-authentication--user-management)
2. [Billing & Subscriptions](#system-2-billing--subscriptions-stripe)
3. [Affiliate Program (Core)](#system-3-affiliate-program-core)
4. [Tiers, Gamification & Challenges](#system-4-tiers-gamification--challenges)
5. [Marketing Toolkit & Resource Center](#system-5-marketing-toolkit--resource-center)
6. [Communication & Engagement](#system-6-communication--engagement)
7. [Payouts & Financial Tools](#system-7-payouts--financial-tools)
8. [Analytics & Intelligence](#system-8-analytics--intelligence)
9. [AI-Powered Tools](#system-9-ai-powered-tools)
10. [CRM & Support](#system-10-crm--support)
11. [Content Scheduling (PassivePost Product)](#system-11-content-scheduling-passivepost-product)
12. [Email & Notifications](#system-12-email--notifications)
13. [Admin Dashboard & Reporting](#system-13-admin-dashboard--reporting)
14. [User Dashboard](#system-14-user-dashboard)
15. [Social Proof & Directory](#system-15-social-proof--directory)
16. [Polish & Responsiveness](#system-16-polish--responsiveness)
17. [Design System Configuration](#system-17-design-system-configuration)
18. [Database Migration History](#database-migration-history)

---

## System 1: Authentication & User Management

The authentication system handles how users sign in, how their roles are managed, and how administrators can oversee user accounts.

| Feature | What It Does | Value |
|---------|-------------|-------|
| **Email/Password Auth** | Users create accounts and sign in with email and password, powered by Supabase Auth. | Standard, reliable authentication that works for all users. |
| **OAuth Social Login** | Users can sign in with Twitter/X, LinkedIn, Facebook, or Instagram instead of creating a password. | Reduces signup friction — users can join with one click using accounts they already have. |
| **SSO/SAML Support** | Enterprise customers can sign in using their company's single sign-on system. | Opens the door to enterprise sales where SSO is a non-negotiable requirement. |
| **Protected Routes & Middleware** | Pages that require authentication automatically redirect unauthenticated users to the login page. | Prevents unauthorized access to dashboards and sensitive data. |
| **User Impersonation** | Admins can temporarily view the platform as any user to debug issues or provide support. | Dramatically reduces support time — admins can see exactly what a user sees without asking for screenshots. |
| **Role-Based Access Control** | Users are assigned roles (user, affiliate, admin) that determine what they can see and do. Organizations have owner, manager, and member roles. | Ensures people only see what's relevant to them and can't access features they shouldn't. |

**Key Files:** `src/lib/supabase/` (auth helpers), `src/middleware.ts` (route protection), `src/app/api/admin/users/` (user management), `src/app/api/admin/impersonate/` (impersonation)

**Database Tables:** `auth.users` (Supabase managed), `user_roles`, `organizations`, `team_members`, `organization_members`

---

## System 2: Billing & Subscriptions (Stripe)

The billing system handles all payment processing, subscription management, and financial record-keeping through Stripe.

| Feature | What It Does | Value |
|---------|-------------|-------|
| **Stripe Checkout** | Users select a plan and complete payment through Stripe's hosted checkout page. | Secure, PCI-compliant payment processing without handling credit card data directly. |
| **Subscription Management** | Users can upgrade, downgrade, or cancel their subscription. Changes take effect at the next billing cycle. | Gives users control over their plan without needing to contact support. |
| **Customer Portal** | A Stripe-hosted page where users manage payment methods, view invoices, and update billing details. | Self-service billing reduces support tickets about payment issues. |
| **Feature Gating by Plan** | Different subscription tiers unlock different features. Free plans see upgrade prompts on premium features. | Drives revenue by giving users a reason to upgrade as their needs grow. |
| **Webhook Processing** | Stripe sends real-time notifications when payments succeed, fail, or subscriptions change. The system processes these automatically. | Keeps subscription status and financial records accurate without manual intervention. |
| **Local Invoice Records** | Every Stripe invoice is mirrored to the local database with line items and payment status. | Enables financial reporting, affiliate commission calculations, and audit trails without depending on Stripe API calls. |
| **Branded Payment Receipts** | Customized receipt emails sent to customers after successful payments. | Professional touch that reinforces brand identity on every transaction. |

**Key Files:** `src/app/api/stripe/` (checkout, portal, products, subscription, webhook), `src/app/api/user/invoices/`, `src/app/api/admin/invoices/`, `src/app/api/user/payments/`, `src/app/api/email/branded-receipt/`

**Database Tables:** `invoices`, `invoice_items`, `payments`, `stripe_customers`

**Integration Points:** Invoice data feeds into affiliate commission calculations, ROI reports, and the financial overview dashboard.

---

## System 3: Affiliate Program (Core)

The affiliate program is the backbone of PassivePost's growth engine. Content creators sign up as affiliates, promote the product using tracked links, and earn commissions on every sale they generate.

| Feature | What It Does | Value |
|---------|-------------|-------|
| **Public Signup & Application** | Anyone can apply to become an affiliate through a public form at `/affiliate/join`. No existing account needed. | Opens the affiliate program to bloggers, YouTubers, and influencers who aren't current users. |
| **Admin Review Workflow** | Administrators review applications and approve or reject them with notes. Approval auto-creates the affiliate's account and referral link. | Quality control — ensures only legitimate promoters join the program. |
| **Standalone Affiliate Dashboard** | Affiliates get their own dedicated dashboard at `/affiliate/dashboard` with 11 navigation tabs, completely separate from the main product. | Affiliates see only what's relevant to them — no confusion with product features they don't use. |
| **Referral Link Generation** | Each affiliate gets a unique referral code. Links use `?ref=CODE` format and can point to any page on the site. | Simple, trackable attribution — every click and sale is tied to the right affiliate. |
| **Cookie-Based Attribution** | When someone clicks an affiliate's link, a cookie is set (30-day default, configurable). If they sign up within that window, the affiliate gets credit. | Fair attribution that doesn't require signup on the same visit — gives affiliates credit for awareness they create. |
| **Commission Tracking** | When a referred customer pays, the system automatically calculates the affiliate's commission based on their locked-in rate. | Accurate, automated commission tracking eliminates manual calculations and disputes. |
| **Rate Lock-In (Grandfathering)** | When an affiliate activates, their commission rate and duration are permanently locked in, even if program rates change later. | Builds trust — affiliates know their terms won't change, encouraging long-term commitment. |
| **Fraud Detection** | Automated scoring system checks for suspicious patterns: same email domains, high-volume IP addresses, self-referrals. Flags are visible to admins. | Protects program integrity without requiring manual review of every referral. |
| **External Network Support** | Integration infrastructure for ShareASale, Impact, and PartnerStack with tracking IDs and postback URLs. | Allows the affiliate program to work alongside established affiliate networks for broader reach. |

**Key Files:** `src/lib/affiliate/index.ts` (core logic), `src/app/affiliate/dashboard/page.tsx` (~7000 lines, 11 tabs), `src/app/admin/setup/affiliate/page.tsx` (15+ tabs), `src/app/api/affiliate/` (all affiliate routes)

**Database Tables:** `affiliate_profiles`, `affiliate_links`, `referral_clicks`, `affiliate_referrals`, `affiliate_commissions`, `affiliate_payouts`, `affiliate_payout_items`, `affiliate_settings`

---

## System 4: Tiers, Gamification & Challenges

Gamification keeps affiliates engaged and motivated beyond just earning commissions. Tiers reward sustained performance, milestones celebrate achievements, contests drive short-term pushes, and challenges encourage daily habits.

| Feature | What It Does | Value |
|---------|-------------|-------|
| **Performance Tiers** | Affiliates progress through Bronze, Silver, Gold, and Platinum tiers based on referral count. Higher tiers earn higher commission rates and unlock perks. | Creates a career ladder that rewards loyalty — top performers earn more, which keeps them promoting longer. |
| **Milestone Bonuses** | One-time cash bonuses awarded when affiliates hit referral count thresholds (e.g., $50 at 10 referrals, $200 at 50 referrals). | Provides exciting "surprise and delight" moments that affiliates share with their audiences, creating organic promotion. |
| **Contests** | Time-bound competitions (e.g., "Most referrals in June wins $500") with prizes, leaderboards, and countdown timers. | Drives bursts of promotional activity during key business periods like launches or seasonal pushes. |
| **Leaderboards** | Ranked lists showing top affiliates by referrals, earnings, or conversion rate. Filterable by time period. Privacy modes available. | Taps into competitive motivation — affiliates work harder when they can see how they compare to peers. |
| **Badges & Achievements** | Visual badges earned for accomplishments ("First Sale", "Top 10%", "100 Referrals"). Displayed on the affiliate's profile. | Recognition that affiliates can show off — these become bragging rights in their communities. |
| **Earnings Goals** | Affiliates set their own monthly earning targets and track progress with visual indicators. | Self-directed motivation — affiliates who set goals are more likely to actively promote. |
| **"Fastest to $X" Recognition** | Speed-based awards for affiliates who reach earnings milestones fastest. | Creates urgency for new affiliates — "can you beat the record?" drives early promotional effort. |
| **Weekly Challenges** | Micro-challenges with specific tasks (e.g., "Share 3 posts this week"), progress bars, badge rewards, and countdown timers. | Builds daily habits — small, achievable tasks keep affiliates engaged between bigger contests. |

**Key Files:** `src/app/api/affiliate/contests/`, `src/app/api/affiliate/challenges/`, `src/app/api/affiliate/milestones/`, `src/app/api/affiliate/leaderboard/`, `src/app/api/affiliate/tiers/`, `src/app/api/affiliate/badges/`, `src/app/api/affiliate/goals/`, `src/components/affiliate/delight-features.tsx`

**Database Tables:** `affiliate_tiers`, `affiliate_milestones`, `affiliate_milestone_awards`, `affiliate_contests`, `affiliate_contest_entries`, `challenge_progress`

**Integration Points:** Contest data feeds into AI coaching recommendations. Milestone proximity appears in predictive intelligence. Leaderboard rank is referenced by AI analytics. Weekly digest emails include contest standings and milestone progress.

---

## System 5: Marketing Toolkit & Resource Center

These tools give affiliates everything they need to promote effectively — from ready-made content to tracking-enabled links to educational materials.

| Feature | What It Does | Value |
|---------|-------------|-------|
| **Deep Link Generator** | Affiliates create referral-tracked links to any specific page (pricing, features, blog posts) with source tags and UTM parameters. | Enables targeted promotion — affiliates can link to the most relevant page for their audience, not just the homepage. |
| **QR Code Generator** | Creates downloadable, branded QR codes that contain the affiliate's referral link. | Perfect for offline promotion — print materials, conference booths, product packaging. |
| **Link Shortener** | Converts long referral URLs into clean, memorable short links (e.g., `ppost.co/steele`). | Professional-looking links get more clicks — nobody wants to share an ugly URL. |
| **Media Kit Page** | A one-click professional partner page showcasing the affiliate's brand, stats, and promotional materials. | Gives affiliates a professional "storefront" they can show to potential brand partners. |
| **Copy-Paste Captions** | Pre-written social media posts with the affiliate's referral link automatically inserted. | Removes the hardest part of promotion — affiliates can share quality content in seconds. |
| **Sharing Cards** | Pre-designed social media images with the affiliate's referral code embedded. | Visual content gets 2-3x more engagement than text — these give affiliates instant visual assets. |
| **Co-Branded Landing Pages** | Customizable partner pages at `/partner/[slug]` featuring the affiliate's branding alongside the product. | Personalized landing pages convert better than generic ones — visitors feel the personal recommendation. |
| **Discount Codes** | Branded coupon codes (e.g., "STEELE40") synced with Stripe. Support 6 discount types including percentage, fixed, free trial, and bundle. | Gives affiliates a tangible offer to promote — "use my code for 40% off" is a powerful conversion tool. |
| **Email Templates** | Pre-written email sequences affiliates can send to their audience with merge tags for personalization. | Professional email marketing without requiring writing skills — just fill in the blanks. |
| **Swipe Files** | Pre-written promotional emails with merge tags ({affiliate_name}, {referral_link}, {discount_code}) that auto-fill with the affiliate's info. | Turn-key email marketing — affiliates can launch email campaigns in minutes instead of hours. |
| **Starter Kit** | A curated bundle of essential materials for new affiliates: best links, top-performing content, quick-start guide. | Eliminates the "where do I start?" problem — new affiliates can begin promoting immediately. |
| **Knowledge Base** | Searchable help articles organized by category with view tracking. Admin creates and manages content. | Self-service support reduces tickets — affiliates find answers without waiting for help. |
| **Promotional Calendar** | Admin-set upcoming campaigns with countdown timers, content suggestions, and linked assets. | Affiliates can plan their content around product launches and promotions for maximum impact. |
| **Asset Usage Analytics** | Tracks downloads, copies, and views for every marketing asset. Shows which assets perform best. | Data-driven asset management — admins know what affiliates actually use and can create more of what works. |
| **Top Performer Badges** | Visual badges on assets that have driven the most conversions. | Social proof within the toolkit — affiliates gravitate toward proven materials. |

**Key Files:** `src/components/affiliate/marketing-toolkit.tsx`, `src/components/affiliate/resource-center.tsx`, `src/app/api/affiliate/link-presets/`, `src/app/api/affiliate/link-shortener/`, `src/app/api/affiliate/swipe-files/`, `src/app/api/affiliate/knowledge-base/`, `src/app/api/admin/knowledge-base/`, `src/app/api/affiliate/promotional-calendar/`, `src/app/api/affiliate/asset-analytics/`

**Database Tables:** `affiliate_short_links`, `affiliate_landing_pages`, `discount_codes`, `discount_code_redemptions`, `affiliate_assets`, `affiliate_asset_usage`, `knowledge_base_articles`, `promotional_calendar`

**Integration Points:** Asset analytics connect to commission data to show ROI per asset. Promotional calendar links to contests and announcements. Knowledge base deflects support tickets. AI coach references available marketing tools.

---

## System 6: Communication & Engagement

These features keep the relationship between program administrators and affiliates active and personal.

| Feature | What It Does | Value |
|---------|-------------|-------|
| **Broadcasts** | Admin sends email announcements to all affiliates (or segments like top performers or dormant affiliates) with open/click tracking. | One-to-many communication for program updates, promotions, and tips without needing a separate email tool. |
| **In-App Messaging** | Two-way message threads between admin and individual affiliates, with unread indicators. | Private, contextual communication — conversations live alongside the affiliate's data, not in a disconnected inbox. |
| **Drip Sequences** | Automated 3-email onboarding series: Welcome (immediate), Tips (24 hours), Strategy (72 hours). | Guides new affiliates through their critical first week when they're most likely to engage or drop off. |
| **Announcements** | Admin-created news items that appear on the affiliate dashboard. | Persistent updates visible to all affiliates, even those who don't read emails. |
| **Affiliate Spotlight** | Monthly featured affiliate recognition displayed on the dashboard. | Public recognition motivates the spotlighted affiliate and inspires others to earn the same recognition. |
| **What's New Digest** | Feature update notifications for affiliates when new tools or improvements are released. | Keeps affiliates informed about platform improvements without requiring them to check a changelog. |
| **Surveys** | Satisfaction surveys with star ratings and open feedback. Configurable frequency. Positive reviews can auto-convert to testimonials. | Direct feedback loop — understand affiliate satisfaction and catch problems before they cause churn. |
| **Testimonials** | Success story submissions from affiliates, manageable by admin. Displayed on the affiliate landing page. | Social proof from real affiliates is the most powerful recruitment tool for new ones. |

**Key Files:** `src/app/api/admin/affiliate/broadcasts/`, `src/app/api/affiliate/messages/`, `src/app/api/admin/affiliate/messages/`, `src/app/api/affiliate/drip/`, `src/app/api/admin/announcements/`, `src/app/api/admin/spotlight/`, `src/app/api/affiliate/surveys/`, `src/app/api/affiliate/testimonials/`

**Database Tables:** `affiliate_broadcasts`, `affiliate_broadcast_receipts`, `affiliate_messages`, `affiliate_surveys`, `affiliate_survey_responses`

---

## System 7: Payouts & Financial Tools

The financial system manages the entire money flow from commission earning to payout, along with tools that help affiliates understand and manage their earnings.

| Feature | What It Does | Value |
|---------|-------------|-------|
| **Payout Lifecycle** | Commissions move through a clear workflow: Pending → Approved → Paid. Each stage has visibility for both admin and affiliate. | Transparent payment process builds trust — affiliates always know where their money is and when to expect it. |
| **Batch Processing** | Admin processes multiple payouts at once with a single click. Auto-sends receipt emails to each affiliate. | Scales the payout process — managing 500 affiliates takes the same effort as managing 5. |
| **Payout Schedule Widget** | Shows the next payout date, minimum threshold progress, and pending balance. | Eliminates the #1 affiliate question: "When do I get paid?" |
| **Tax Info Collection** | Affiliates submit W-9 (US) or W-8BEN (international) tax forms. Admin can verify and flag incomplete submissions. | Legal compliance — required for 1099 reporting and ensures payouts aren't blocked at tax time. |
| **Tax Summary** | Annual tax summary showing total earnings, estimated withholding (self-employment + federal), monthly breakdown, and 1099 threshold status. | Helps affiliates plan for taxes — no surprises when April comes. |
| **Admin 1099 Tax Export** | Year-end CSV export of all affiliates earning over $600, with tax info status, legal name, address, and gross earnings. | One-click 1099-NEC preparation — saves hours of manual data gathering at year-end. |
| **Earnings Statements** | PDF-style downloadable statements with period selection (current month, last month, custom range). | Professional documentation affiliates can use for loan applications, business records, or tax filing. |
| **Commission Lifecycle Tracker** | Visual 7-step journey showing each referral's progress: Click → Signup → Trial → Paid → Commission Created → Approved → Paid Out. | Complete transparency — affiliates understand exactly what needs to happen before they earn money. |
| **Second-Tier Commissions** | Affiliates earn a percentage when someone they recruited as an affiliate generates sales. | Creates a recruitment incentive — top affiliates become program evangelists, growing the affiliate base organically. |
| **Commission Renewals** | Extends the commission window when referred customers check in or renew. Bulk renewal support (up to 50 at once). | Rewards ongoing customer relationships — affiliates who nurture their referrals earn longer. |
| **Earnings Forecast** | Projected monthly earnings based on 14-day rolling average with optimistic/pessimistic range. Includes tier upgrade proximity alerts. | Forward-looking motivation — "at this pace, you'll hit Gold tier in 6 weeks" keeps affiliates pushing. |
| **Earnings Projections** | Multi-month forward projections (3, 6, 12 months), annual forecast, and goal progress tracking with daily pace indicators. | Long-term planning tool — affiliates can see the business potential and set realistic targets. |
| **Commission Split Estimator** | Calculator showing how earnings are split across tiers, products, and time periods. | Helps affiliates understand their earning structure and optimize which products to promote. |
| **Enhanced Payout History** | Filterable, paginated payout history with CSV export, receipt data, and summary statistics. | Complete financial records — affiliates can reconcile payments and track their earning history. |
| **Bulk Commission Renewals** | Renew multiple expiring referrals in one request with performance stats (success rate, average extension, revenue saved). | Efficiency tool for active affiliates managing many referrals — one click instead of 50. |
| **Tax Center Panel** | Year selector, estimated withholding calculator, monthly breakdown, and downloadable tax report. | All-in-one tax preparation — everything an affiliate needs for tax season in one panel. |

**Key Files:** `src/app/api/affiliate/payouts/`, `src/app/api/affiliate/payout-history/`, `src/app/api/affiliate/tax-info/`, `src/app/api/affiliate/tax-summary/`, `src/app/api/affiliate/earnings/`, `src/app/api/affiliate/earnings-statement/`, `src/app/api/affiliate/analytics/earnings-projections/`, `src/app/api/affiliate/financial-tools/`, `src/app/api/affiliate/forecast/`, `src/app/api/affiliate/renewals/`, `src/app/api/admin/renewals/`, `src/components/affiliate/retention-tools.tsx`

**Database Tables:** `affiliate_payouts`, `affiliate_payout_items`, `affiliate_tax_info`, `commission_renewals`

**Integration Points:** Financial data feeds into ROI calculations, predictive intelligence, AI coaching, and weekly digest emails. Tax data is used for 1099 compliance.

---

## System 8: Analytics & Intelligence

The analytics system is where PassivePost's closed-loop architecture comes alive. It merges data from content creation, affiliate performance, connected platforms, and financial records to generate insights no standalone affiliate platform can provide.

| Feature | What It Does | Value |
|---------|-------------|-------|
| **Churn Intelligence** | Tracks churn rate, reasons, timing patterns, and at-risk referrals. Shows net growth (new signups minus churned). | Early warning system — intervene before referrals leave by understanding why and when they churn. |
| **Cohort Analysis** | Groups referrals by signup month and tracks retention over time. Shows conversion trends and trial benchmarks. | Reveals whether your promotion quality is improving — are newer referrals sticking around longer? |
| **Revenue Analytics** | Revenue breakdown by source (direct vs affiliate), cumulative earnings over time, and conversion dropoff funnel. | See exactly where money comes from and where potential revenue is lost in the conversion process. |
| **Traffic Insights** | Geographic breakdown (country-level), device type breakdown (desktop/mobile/tablet), and repeat visitor analysis. | Know your audience — which countries and devices drive the most valuable traffic. |
| **AI Analytics Intelligence** | Six AI-generated insight types: conversion drops, content recommendations, channel optimization, audience fit, seasonal trends, and competitive tips. | Actionable AI advice based on real data — not generic tips, but specific recommendations tied to your numbers. |
| **AI Posting Strategy** | AI recommends the best times to post on each platform based on engagement patterns and promotional calendar events. | Maximizes content impact by posting when your audience is most active and when promotions are running. |
| **AI Conversion Insights** | Analyzes unconverted trials to identify patterns, revenue attribution by platform, and cross-platform correlation. | Turns missed opportunities into learning — understand why some referrals convert and others don't. |
| **Connected Analytics Dashboard** | Merges data from connected platforms (YouTube, social media) with affiliate performance data in a unified view. | The "aha moment" — see how content performance directly correlates with affiliate earnings. |
| **Content Intelligence** | Analyzes promotion frequency, content type performance, and platform-by-platform correlation with sales. | Know which content drives revenue — stop guessing and double down on what works. |
| **Financial Overview** | Unified view of earnings vs costs, ROI calculations, break-even analysis, and forward projections. | Business intelligence — is your affiliate work profitable? What's your actual return on time invested? |
| **Predictive Intelligence** | Tier trajectory forecasting, churn window predictions, and seasonal pattern detection. | See the future — know when you'll hit the next tier, which referrals might churn, and which seasons are strongest. |
| **Custom Range Reports** | Any date range analysis with period-over-period comparison (this month vs last month, this quarter vs last). | Flexible reporting — answer any "how did I do compared to..." question. |
| **Admin Program Intelligence** | Program-wide statistics, aggregate coaching insights, and health metrics across all affiliates. | Bird's-eye view — admins see program health, identify struggling affiliates, and spot growth opportunities. |
| **Earnings Heatmap** | GitHub-style contribution heatmap showing 52 weeks of daily earnings activity. | Visual pattern recognition — instantly see productive streaks, seasonal dips, and overall consistency. |
| **Percentile Benchmarks** | Shows where an affiliate ranks compared to all other affiliates in the program. | Motivational context — "you're in the top 20%" is more powerful than a raw earnings number. |
| **Metric Tooltips** | Hover explanations on every metric describing what it measures and how it's calculated. | Reduces confusion — every number in the dashboard is self-documenting. |
| **Sparklines** | Mini trend charts embedded in referral rows showing recent performance direction. | Instant trend visibility without leaving the referral list. |
| **Export Buttons** | CSV download available for any data table in the dashboard. | Data portability — affiliates can use their data in spreadsheets, reports, or tax software. |

**Key Files:** `src/components/affiliate/flywheel-analytics.tsx`, `src/components/affiliate/flywheel-reports.tsx`, `src/components/affiliate/analytics-expanded.tsx`, `src/app/api/affiliate/analytics/` (churn, cohort, sources, connected-overview, content-intelligence, financial-overview, predictions, charts, expanded, youtube), `src/app/api/affiliate/reports/custom-range/`, `src/app/api/admin/affiliate/program-intelligence/`

---

## System 9: AI-Powered Tools

Every AI feature in PassivePost pulls real data from the affiliate's actual performance, connected platforms, and program context. These are not generic advice generators — they're personalized business intelligence copilots.

| Feature | What It Does | Value |
|---------|-------------|-------|
| **AI Post Writer** | Generates platform-specific social media posts (7 platforms, 5 tones) with the affiliate's referral link automatically embedded. | Professional promotional content in seconds — removes the "I don't know what to write" barrier. |
| **AI Email Drafter** | Creates professional email sequences for promoting the product to the affiliate's audience. | Done-for-you email marketing — even affiliates who hate writing can send effective campaigns. |
| **AI Blog Outline Generator** | Creates structured blog post outlines for affiliate content with SEO-friendly headings and talking points. | Turns affiliates into content marketers — structured outlines make writing 10x faster. |
| **AI Video Script Generator** | Produces video talking points and scripts for promotional videos, tailored to the platform (YouTube, TikTok, Instagram Reels). | Lowers the barrier to video content — affiliates get a script they can read or adapt. |
| **AI Objection Handler** | Generates responses to common objections like "it's too expensive" or "I already use X competitor." | Sales enablement — helps affiliates close more sales by addressing hesitations confidently. |
| **AI Coach** | Personalized performance tips based on actual data: recent commissions, tier progress, active contests, connected platform metrics, and leaderboard position. | The signature feature — an AI that knows your business and gives specific, actionable advice like "double down on Tuesday tutorials." |
| **AI Ad Copy Generator** | Creates promotional ad text for paid advertising campaigns. | Enables paid promotion — affiliates running ads get professionally-written copy without hiring a copywriter. |
| **AI Pitch Customizer** | Generates tailored pitches for different audience types (developers, marketers, small business owners, etc.). | Precision marketing — the right message for the right audience converts better than one-size-fits-all. |
| **AI Audience Content** | Suggests content ideas matched to the affiliate's specific audience demographics and interests. | Content ideation — never run out of things to post, with ideas tailored to what your audience actually wants. |
| **AI Promo Ideas Generator** | Creative promotion suggestions based on current trends, upcoming holidays, and seasonal opportunities. | Keeps promotion fresh — affiliates avoid the "same post every week" trap. |
| **AI Onboarding Advisor** | Getting-started guidance specifically for new affiliates, covering first steps, quick wins, and common mistakes to avoid. | Accelerates time-to-first-sale — new affiliates get productive faster with personalized guidance. |
| **AI Conversion Optimizer** | Analyzes the affiliate's conversion funnel and suggests specific improvements to increase their conversion rate. | Targeted improvement — instead of "promote more," it says "your pricing page links convert 3x better than homepage links." |
| **Promotion Strategy Quiz** | An interactive 6-question quiz that generates a personalized 30-day promotional playbook using AI. Results are saved for future AI coaching context. | Turns strategy from overwhelming to actionable — 6 questions in, 30-day plan out. |
| **Audience Analyzer** | Analyzes the affiliate's audience demographics (geography, device types, traffic sources) and generates an AI-powered audience persona. | Know your audience — the persona helps affiliates create content that resonates with the people actually clicking their links. |

**Key Files:** `src/app/api/affiliate/ai-*/` (all AI routes), `src/lib/ai/provider.ts` (chatCompletion function), `src/app/api/affiliate/promotion-quiz/`, `src/app/api/affiliate/analyze-audience/`, `src/components/affiliate/delight-features.tsx`

**AI Provider:** xAI (Grok) via `grok-3-mini-fast` model, using the `XAI_API_KEY` environment variable.

**Integration Points:** AI Coach pulls from commissions, tiers, contests, milestones, leaderboard rank, and connected platform data. Quiz results are saved to `affiliate_profiles.quiz_results` for future AI reference. Audience Analyzer uses `referral_clicks` and `connected_platform_metrics`.

---

## System 10: CRM & Support

Customer Relationship Management tools that help admins track interactions, manage support requests, and maintain relationships with affiliates and users.

| Feature | What It Does | Value |
|---------|-------------|-------|
| **Universal User Profiles** | A unified profile for every user (customer, affiliate, or both) with contact info, preferences, and activity history. | Single source of truth — admins see the complete picture of any user, not fragmented data across systems. |
| **Support Tickets** | Full ticket system with Open → In Progress → Resolved → Closed workflow. Users submit tickets; admins manage, comment, and resolve. | Organized support — nothing falls through the cracks, and both parties can track progress. |
| **CRM Activity Log** | Records calls, notes, tasks, and meetings associated with any user account. | Institutional memory — any team member can see the full history of interactions with a user. |
| **Marketing Campaigns** | Campaign tracking with UTM attribution and performance counters (clicks, signups, conversions). | Measure marketing effectiveness — know which campaigns actually drive results. |
| **Contracts & Agreements** | Contract creation with a signing workflow (affiliate signs → admin countersigns) and version history. | Legal documentation — clear, signed agreements protect both the business and the affiliate. |
| **Admin CRM Card** | Click any affiliate name to see a full profile drawer with earnings, payouts, tickets, activities, and notes. | 360-degree affiliate view — admins make better decisions when they can see everything in one place. |
| **Admin Quick Notes** | Internal notes on any account, visible only to administrators. | Private context — admins can leave notes about conversations, concerns, or opportunities. |
| **Affiliate Health Scores** | Auto-calculated green/yellow/red indicators based on activity recency, conversion rate, and fraud score. | At-a-glance health monitoring — instantly identify which affiliates need attention and which are thriving. |

**Key Files:** `src/app/api/tickets/`, `src/app/api/activities/`, `src/app/api/campaigns/`, `src/app/api/contracts/`, `src/app/api/admin/tickets/`, `src/app/api/admin/notes/`, `src/app/api/user/profile/`

**Database Tables:** `user_profiles`, `tickets`, `ticket_comments`, `activities`, `campaigns`, `contracts`, `contract_versions`

---

## System 11: Content Scheduling (PassivePost Product)

The content scheduling system is the product that affiliates actually use and promote. It's a full-featured social media management tool with a unique 7-phase content flywheel.

| Feature | What It Does | Value |
|---------|-------------|-------|
| **7-Phase Content Flywheel** | A structured content creation workflow: Ideate → Create → Schedule → Publish → Engage → Analyze → Optimize. 38 core features plus 4 bonus features. | Transforms content creation from chaotic to systematic — users follow a proven workflow instead of winging it. |
| **Cross-Platform Scheduling** | Schedule posts across Twitter/X, LinkedIn, Facebook, Instagram, Reddit, Discord, YouTube, and Pinterest from a single calendar. | One place to manage all platforms — saves hours of switching between apps. |
| **Blog-to-Social Repurposing** | Automatically converts blog posts into platform-optimized social media posts across 5 blog platforms (WordPress, Ghost, and more). | Multiplies content output — one blog post becomes 5+ social posts without extra writing. |
| **AI Content Grader** | Scores content quality and suggests improvements before publishing. | Quality assurance — catch weak posts before they go live and damage engagement metrics. |
| **Topic Fatigue Detection** | Warns when content topics are becoming repetitive to the audience. | Audience retention — keeps content fresh by flagging when you're overusing the same themes. |
| **Content DNA Analysis** | Identifies patterns in your best-performing content: tone, length, format, topic, posting time. | Data-driven content strategy — replicate what works instead of guessing. |
| **Calendar Autopilot** | Automatically fills content calendar gaps with AI-suggested posts. | Never miss a posting slot — the system keeps your content pipeline flowing. |
| **Content Recycling** | Resurfaces high-performing old content for re-sharing at optimal times. | More value from existing work — your best content keeps working for you. |
| **Streak System** | Gamified consistency tracking — maintain your posting streak and earn recognition. | Behavioral motivation — streaks drive daily engagement with the platform. |
| **Client Approval Portal** | External stakeholders can review and approve scheduled content before it goes live. | Agency-ready — freelancers and agencies can manage client approvals without sharing login credentials. |
| **Content ROI Calculator** | Tracks cost per post and correlates content effort with business results. | Financial clarity — know exactly what your content creation is worth in dollars. |
| **Connected Platform Integrations** | Real OAuth connections to Twitter/X, LinkedIn, Facebook, Instagram, Reddit, Discord, YouTube, and Pinterest with token refresh and error handling. | Real platform connections (not simulated) — actual posting, real engagement metrics, genuine analytics. |

**Key Files:** `src/app/dashboard/social/` (social dashboard), `src/app/api/social/` (50+ routes), `src/lib/social/blog-clients.ts` (WordPress, Ghost clients)

**Database Tables:** `social_accounts`, `social_posts`, `social_engagement_metrics`, `connected_platform_metrics`, `blog_posts`, `blog_connections`

---

## System 12: Email & Notifications

The email and notification system keeps users, affiliates, and admins informed through automated emails, scheduled reports, and in-app notifications.

| Feature | What It Does | Value |
|---------|-------------|-------|
| **Transactional Emails** | Powered by Resend. Sends confirmation emails, password resets, and system notifications. | Reliable email delivery for critical communications without managing email infrastructure. |
| **Editable Email Templates** | Admin can customize email templates with category tagging for organized management. | Brand consistency — every email matches your voice and visual identity. |
| **Drip Sequences** | Multi-step automated email sequences triggered by events (signup, affiliate activation). | Automated nurturing — turns signups into engaged users on autopilot. |
| **Weekly Performance Emails** | Automated weekly email to affiliates summarizing their clicks, signups, and earnings. | Regular engagement touchpoint — reminds affiliates of their progress and keeps the program top-of-mind. |
| **Monthly Earnings Statements** | Automated monthly email with a formatted earnings summary. | Professional financial communication — builds trust through transparent reporting. |
| **Weekly Affiliate Digest** | Comprehensive weekly email including contest standings, milestone proximity, program updates, and tips. | The "must-read" weekly email — aggregates everything an affiliate needs to know in one message. |
| **Trial Expiry Alerts** | Automated alerts when free trials are about to end. | Conversion recovery — catches users before they forget and let their trial lapse. |
| **In-App Notification Bell** | Real-time notification system with unread badges visible on every page. | Instant awareness — users see important updates without checking email. |
| **Email Preferences Center** | Users control which emails they receive, organized by category. | Respect for user preferences — reduces unsubscribes by letting users customize instead of opting out entirely. |

**Key Files:** `src/app/api/email/` (send, drip, branded-receipt), `src/app/api/cron/` (weekly-performance, monthly-earnings, weekly-affiliate-digest, trial-alerts, scheduled-reports, weekly-coach, weekly-stats), `src/app/api/admin/email-templates/`, `src/app/api/user/email-preferences/`

---

## System 13: Admin Dashboard & Reporting

The admin dashboard provides platform owners with the tools to manage the business, monitor health metrics, and make data-driven decisions.

| Feature | What It Does | Value |
|---------|-------------|-------|
| **Setup Wizard** | Task-based onboarding that guides admins through initial configuration: branding, billing, affiliate program, email templates. | Gets new deployments running fast — clear steps instead of a blank admin panel. |
| **User Management** | View all users, assign roles, search, filter, and manage account status. | Complete control over who has access to what. |
| **Revenue Attribution Report** | Shows how much revenue came from affiliate referrals vs direct signups, with visual charts. | ROI clarity — know exactly how much the affiliate program contributes to the bottom line. |
| **Revenue Waterfall** | Visual waterfall chart showing revenue flow from gross to net after commissions, refunds, and fees. | Financial transparency — see where money goes at every step. |
| **Scheduled Email Reports** | Automated weekly revenue and activity digest emails sent to admins. | Stay informed without logging in — key metrics delivered to your inbox. |
| **Metrics Alerts & KPI Dashboard** | Configurable alerts when key metrics cross thresholds (e.g., churn rate exceeds 5%). | Proactive monitoring — catch problems early instead of discovering them in monthly reviews. |
| **Audit Logging** | Records every admin action (approvals, rejections, setting changes) with timestamps and details. | Accountability and compliance — complete record of who did what and when. |
| **Onboarding Funnel Tracking** | Tracks user drop-off at each step of the onboarding wizard. | Conversion optimization — identify and fix the step where most users abandon setup. |
| **Queue Management UI** | View and manage background job queues (email sending, metric pulling, etc.). | Operational visibility — ensure automated processes are running smoothly. |
| **Product Registry** | Multi-product support — manage multiple SaaS products from a single admin interface. | Scalability — one deployment can serve multiple product lines (the MuseKit vision). |

| **Admin Relational Dashboard** | Four-layer drill-down dashboard: Dashboard Home → List → Detail → Cross-linked Detail. Includes CRM, Revenue, Subscriptions sections with full cross-linking between all entities. | CEO-grade visibility — every record is a doorway to every related record. No more isolated data. |
| **Dashboard Command Center** | Admin home page with 6 clickable KPI cards (MRR, Active Subscribers, New Users, Open Tickets, Churn Rate, Failed Payments), actionable alerts, recent activity timeline, and 7-day revenue sparkline. | At-a-glance health — one screen to know if anything needs attention. |
| **CRM (People)** | Admin CRM list + detail with search, filters, health scores, tags, 6 tabs (Profile, Transactions, Activity, Support, Notes, Contracts), EntityNotes. | Unified customer view — every person's full history in one place. |
| **Revenue Management** | Revenue list (invoices, payments, commissions, payouts) with filters, summary stats. Detail pages for all 4 types with affiliate attribution, line items, subscription links. | Complete financial visibility across all transaction types. |
| **Subscription Management** | Subscriptions list with churn risk indicators/filters, MRR by tier. Detail with churn risk section, invoice history, Stripe links. | Churn prevention — identify at-risk subscribers before they cancel. |
| **Command Palette (Cmd+K)** | Global search across users, invoices, subscriptions, and tickets. Recent searches in localStorage. Accessible from any admin page. | Power-user navigation — find any entity in seconds without clicking through menus. |
| **Related Records Sidebar** | Auto-populated sidebar on detail pages showing related entities from other types (other invoices, subscriptions, tickets by same customer). | Context without navigation — see the full picture without leaving the page. |
| **Admin Print Styles** | Print-friendly CSS that hides sidebar, navigation, action buttons. Clean typography for detail page printing. | Printable invoices and records for offline use or client communication. |

**Key Files:** `src/app/admin/` (admin pages), `src/app/api/admin/stats/`, `src/app/api/admin/revenue-attribution/`, `src/app/api/admin/revenue-waterfall/`, `src/app/api/admin/metrics/`, `src/app/api/admin/audit-logs/`, `src/app/api/admin/dashboard/`, `src/app/api/admin/crm/`, `src/app/api/admin/revenue/`, `src/app/api/admin/subscriptions/`, `src/app/api/admin/search/`, `src/app/api/admin/related/`, `src/components/admin/sidebar.tsx`, `src/components/admin/breadcrumbs.tsx`, `src/components/admin/timeline.tsx`, `src/components/admin/entity-notes.tsx`, `src/components/admin/related-records.tsx`, `src/components/admin/command-palette.tsx`, `src/lib/admin-auth.ts`

---

## System 14: User Dashboard

The user dashboard is the self-service hub for customers who subscribe to the product. It's also the gateway to becoming an affiliate.

| Feature | What It Does | Value |
|---------|-------------|-------|
| **Invoice History** | List of all invoices with status filters, pagination, detail view, and PDF download. | Financial transparency — users can access their payment records anytime without contacting support. |
| **Subscription Management** | Shows current plan, billing cycle, and status with a one-click link to Stripe's customer portal for changes. | Self-service plan management — reduces support tickets about billing changes to near zero. |
| **Support Tickets** | Submit and track support requests with a comments thread for back-and-forth communication. | Organized support — users see the status of their requests and can add details as needed. |
| **Account Security** | Password change, active session management, and 2FA preparation. | User confidence — people trust platforms that take security seriously and give them control. |
| **Usage Insights** | Shows activity metrics like "You published 12 posts this month" with trends. | Engagement reinforcement — seeing their activity stats makes users feel productive and invested. |
| **Affiliate Invitation** | "Earn 30% commission" card on the billing page linking to the affiliate application. | Growth engine — every happy customer sees the opportunity to become a paid promoter. |
| **Email Preferences** | Control which notification emails they receive. | User autonomy — reducing unwanted emails improves satisfaction and reduces unsubscribes. |

**Key Files:** `src/app/api/user/invoices/`, `src/app/api/user/payments/`, `src/app/api/user/membership/`, `src/app/api/user/usage-insights/`, `src/app/api/user/profile/`

---

## System 15: Social Proof & Directory

Social proof features that showcase affiliate success and build program credibility.

| Feature | What It Does | Value |
|---------|-------------|-------|
| **Case Study Library** | Rich case study cards featuring headline, key metric, customer quote, and share button. Admin creates studies; affiliates can submit their own success stories. AI can auto-generate drafts from real affiliate performance data. | Social proof at scale — real success stories convince new affiliates to join and current ones to promote harder. |
| **Public Affiliate Directory** | An opt-in public page at `/partners` where affiliates showcase their profiles with tier badges, bio, social links, and landing page links. Searchable and filterable by tier. | Visibility for affiliates — being listed in a public directory is a perk that motivates opt-in and creates a sense of community. |
| **AI Case Study Drafting** | Admin can generate case study drafts using AI that pulls from real affiliate metrics (referrals, commissions, conversion rates). | Content creation at scale — turn raw performance data into compelling stories without manual writing. |

**Key Files:** `src/app/api/affiliate/case-studies/`, `src/app/api/admin/case-studies/`, `src/app/api/public/affiliate-directory/`, `src/app/partners/page.tsx`

**Database Tables:** `case_studies`, `affiliate_profiles.show_in_directory`, `affiliate_profiles.quiz_results`

**Integration Points:** Case studies reference the `testimonials` table and pull metrics from `affiliate_commissions` and `affiliate_referrals`. Directory uses `affiliate_profiles`, `affiliate_tiers`, and `affiliate_landing_pages`.

---

## System 16: Polish & Responsiveness

Cross-cutting quality improvements that ensure the platform works well on all devices and meets modern web standards.

| Feature | What It Does | Value |
|---------|-------------|-------|
| **Dashboard Mobile Responsive** | All 14 grid layouts in the affiliate dashboard adapt to phone screens. Fixed-width elements become fluid on small viewports. | Affiliates can check their stats, respond to messages, and manage their business from their phone. |
| **Public Pages Mobile** | Partners directory, affiliate application, and marketing pages all work cleanly on mobile devices. | First impressions matter — potential affiliates visiting on mobile see a polished, professional experience. |
| **SEO Meta Tags** | Complete Open Graph tags (og:title, og:description, og:type, og:url) and canonical URLs on all 21 public pages. | Social sharing and search visibility — links shared on social media show rich previews, and search engines index pages correctly. |
| **Loading & Error States** | All 9 dashboard panels have consistent skeleton loaders, error states with retry buttons, and descriptive empty state messages. | Professional polish — users see helpful feedback instead of blank screens or cryptic errors. |
| **Accessibility** | ARIA labels on all interactive elements, role attributes (progressbar, list, radiogroup, switch), aria-expanded on toggles, and screen-reader-only labels. | Inclusive design — the platform is usable by people with disabilities and assistive technologies. |

**Key Files Modified:** `src/app/affiliate/dashboard/page.tsx`, `src/components/affiliate/delight-features.tsx`, `src/components/affiliate/resource-center.tsx`, `src/components/affiliate/retention-tools.tsx`, `src/app/partners/page.tsx`, `src/app/affiliate/join/page.tsx`, 21 marketing pages

---

## System 17: Design System Configuration

A comprehensive, admin-configurable design system that controls all visual styling across the entire application from a single palette page. No code changes needed — every visual property is a CSS variable or data attribute.

| Feature | What It Does | Value |
|---------|-------------|-------|
| **76 Design Properties** | Typography (h1-h3 size/weight/spacing/transform, body size/line-height, heading color mode), component styling (card padding/radius/shadow/border, button radius/size/weight/transform, badge shape, input style match), layout (content density, section spacing, sidebar width, container max width, page header style), interactive states (hover effect, animation speed, focus ring, click feedback, page transition), dark mode (option, card depth, accent brightness), data visualization (bar thickness/radius, line width/curve, dots, grid, trend line, area fill/opacity, color strategy, tooltip match), tables (style, row borders, header style), semantic colors (success/warning/danger), scroll (smooth scroll, scroll-to-top), loading states (skeleton style, empty state style), notifications (toast position), forms (label position, required indicator, error style), accessibility (contrast enforcement, reduced motion), print styles, dividers. | Admins can fully customize the look and feel of any MuseKit-cloned SaaS app without touching code. Every clone can look completely different. |
| **4 Built-in Presets** | Clean & Airy (spacious, rounded), Compact & Dense (tight, square), Bold & Modern (large headings, strong shadows), Minimal (thin borders, no shadows). One-click apply from the palette page. | Quick starting points — admins can apply a preset and then fine-tune individual settings. |
| **JSON Export/Import** | Export current design config as JSON file, import a previously exported config to restore settings. | Backup/restore configurations, share design settings between MuseKit clones, or version-control design changes. |
| **FOUC Prevention** | Body starts at opacity 0, dark mode class set before first paint via inline script, body fades in after 150ms once ready class is applied. | No flash of unstyled content or wrong theme — users see the correct design from the first frame. |
| **CSS Variable Pipeline** | All 76 settings are injected as CSS variables or data attributes by `useThemeFromSettings`. Components read these variables and update in real-time when settings change. | Live preview — admins see changes instantly in the palette page without page refresh. |
| **Component Integration** | Card (5 vars), Button (4 vars), Badge (1 var), Input (1 var), Table (2 vars), Toast (position + radius) all consume CSS variables. | Every shared UI component across all dashboards automatically updates when design settings change. |
| **Chart Configuration Hook** | `useChartConfig()` returns Recharts-compatible props (barSize, barRadius, lineWidth, colors, etc.) derived from design settings. | All data visualizations stay consistent with the design system and update when settings change. |
| **Semantic Color Tokens** | `--success`, `--warning`, `--danger`, `--info` configurable from palette page. All status indicators, badges, alerts, and info cards use these tokens instead of hardcoded colors. | Changing one semantic color updates every status indicator across all dashboards (32+ admin files, 9 affiliate files audited). |
| **Palette-Aware Color Audit** | Zero hardcoded Tailwind color classes (`text-red-600`, `bg-blue-500`, etc.) across all 32+ admin pages. All replaced with CSS variable equivalents. Zero hardcoded spacing classes (`p-6`, `gap-4`, `rounded-lg`, `shadow-sm`) — all use CSS variables with fallbacks. | Admin color and spacing changes propagate everywhere — no orphaned hardcoded values that ignore the palette. |
| **DS Wrapper Components** | `DSCard`, `DSCardHeader`, `DSCardContent` (auto-apply card padding/radius/shadow/border), `DSGrid` (auto-apply content density gap with responsive column props), `DSSection` (auto-apply section spacing). | Developers use these instead of thinking about CSS variable names — the wrappers handle it automatically. |
| **Dark Mode Control** | Three options: user-choice (shows toggle), force-light, force-dark. Theme toggle auto-hides when forced. Dark card depth and accent brightness configurable. | Admins decide whether users can toggle dark mode or if the brand enforces a specific mode. |
| **Scroll-to-Top Button** | Floating button appears after 400px scroll, respects `scrollToTopButton` setting. Smooth scroll configurable. | Toggleable UX enhancement for long pages. |
| **Reduced Motion Support** | Respects `prefers-reduced-motion` media query and admin toggle. Disables transitions and animations for users who need it. | Accessibility compliance — users with motion sensitivity get a comfortable experience. |
| **Print Styles** | `@media print` rules in globals.css hide nav/sidebar/buttons, optimize layout for paper output. | Affiliates can print earnings reports, tax summaries, and other pages cleanly. |
| **Admin Design System UI** | 16 collapsible accordion sections in the palette page covering every design property. Live previews for typography and skeleton animations. Visual toast position picker. | Admin-friendly interface — no technical knowledge needed to customize the design. |

**Key Files:**
- `src/types/settings.ts` — BrandingSettings type with 76 properties
- `src/hooks/use-settings.ts` — CSS variable injection pipeline
- `src/hooks/use-chart-config.ts` — Chart configuration hook
- `src/lib/design-presets.ts` — 4 presets + export/import utilities
- `src/app/globals.css` — CSS variable defaults, typography, print styles, animations
- `src/components/admin/palette/design-system-sections.tsx` — Admin UI (16 sections)
- `src/components/ui/ds-card.tsx` — DSCard wrapper component
- `src/components/ui/ds-grid.tsx` — DSGrid wrapper component
- `src/components/ui/ds-section.tsx` — DSSection wrapper component
- `src/components/scroll-to-top.tsx` — Scroll-to-top component
- `src/components/theme-toggle.tsx` — Dark mode toggle (respects darkModeOption)
- `src/app/layout.tsx` — FOUC prevention inline script
- `docs/DESIGN_SYSTEM_RULES.md` — Mandatory styling reference (CSS variable mapping, Never/Always rules)

**No database changes.** All settings stored in the existing `site_settings.branding` JSON column.

---

## Database Migration History

All migrations have been run on both the development database (Replit Postgres) and the production database (Supabase). As of Feb 26, 2026, both databases are fully in sync.

| # | File | What It Creates | Supabase Status |
|---|------|-----------------|-----------------|
| 001 | `migrations/core/001_social_tables.sql` | Social platform account connections | Applied |
| 002 | `migrations/core/002_product_registry.sql` | Multi-product support tables | Applied |
| 003 | `migrations/core/003_testimonials.sql` | Testimonial management system | Applied |
| 004 | `migrations/core/004_launch_kit.sql` | Launch features (drip campaigns, referral tracking, onboarding funnel) | Applied |
| 005 | `migrations/core/005_affiliate_system.sql` | Core affiliate program tables | Applied |
| 006 | `migrations/core/006_affiliate_applications.sql` | Affiliate application workflow | Applied |
| 007 | `migrations/core/007_affiliate_enhancements_p1.sql` | Milestones, discount codes, broadcasts | Applied |
| 008 | `migrations/core/008_affiliate_enhancements_p2.sql` | Tiers, payouts, contests, source tags | Applied |
| 009 | `migrations/core/009_affiliate_enhancements_p3.sql` | Co-branded pages, tax info, fraud scoring, API keys, webhooks, messaging | Applied |
| 010 | `migrations/core/010_affiliate_sprint4.sql` | Sprint 4 features (badges, surveys, testimonials) | Applied |
| 011 | `migrations/core/011_crm_foundation.sql` | CRM tables (profiles, invoices, tickets, activities, campaigns, contracts) | Applied |
| 012 | `migrations/core/012_commission_renewals.sql` | Commission renewal system | Applied |
| 013 | `migrations/core/013_delight_features.sql` | Partner experience, marketing toolkit expansion, analytics tables | Applied (via sync script) |
| 014 | `migrations/core/014_analytics_columns.sql` | Analytics columns (geo/device on clicks, churn fields on referrals) | Applied (via sync script) |
| 015 | `migrations/core/015_session_d_tables.sql` | Asset usage tracking, knowledge base, promotional calendar | Applied (via sync script) |
| 016 | `migrations/core/016_session_e_tables.sql` | Challenge progress, case studies, directory and quiz columns | Applied (via sync script) |
| — | `migrations/supabase/sync_013_016_plus_missing.sql` | Combined 013-016 + notifications + affiliate_link_presets columns | Applied |

**Seed Data:** `migrations/seed/comprehensive-seed-data.sql` populates 21 tables with demo content (contests, KB articles, announcements, assets, discount codes, badges, milestones, testimonials, etc.). Applied to both databases on Feb 26, 2026.

---

*This document is the single source of truth for "what exists in PassivePost." Update it whenever new features are added.*
