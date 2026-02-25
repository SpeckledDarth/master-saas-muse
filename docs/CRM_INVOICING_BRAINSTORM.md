# PassivePost — Strategic Feature Pipeline

> **What is this document?** This is the strategic feature pipeline for PassivePost, a closed-loop business intelligence platform for content creators. It contains 217 features across three dashboards (Admin, Affiliate, User) covering CRM, invoicing, analytics, AI tools, and the platform's unique dogfooding architecture. Features are organized by category with status markers showing what has been built, what is in progress, and what remains planned for future development.
>
> **How to read status markers:**
> - **BUILT** = Feature is live and functional in the current platform
> - **IN PROGRESS** = Feature is partially built or under active development
> - **PLANNED** = Feature has been designed but not yet built
>
> **Related Documents:**
> - [FEATURE_INVENTORY.md](./FEATURE_INVENTORY.md) — Complete inventory of everything built, with files, tables, and APIs
> - [PRODUCT_IDENTITY.md](./PRODUCT_IDENTITY.md) — Defines what PassivePost is and why feature richness is the competitive moat
> - [TESTING_PLAN.md](./TESTING_PLAN.md) — QA testing reference organized by dashboard area

---

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [What Has Been Built](#what-has-been-built)
3. [Feature Pipeline by Category](#feature-pipeline-by-category)
   - [Original Ideas (1-41)](#original-ideas-1-41)
   - [Affiliate Delight & Relationship (42-64)](#affiliate-delight--relationship-42-64)
   - [Marketing Resource Center (65-80)](#marketing-resource-center-65-80)
   - [AI-Powered Tools (81-98)](#ai-powered-tools-81-98)
   - [Surfacing Existing Admin Features (99-108)](#surfacing-existing-admin-features-99-108)
   - [Invoicing & Financial Tools (109-130)](#invoicing--financial-tools-109-130)
   - [Partnership-Level Features (131-142)](#partnership-level-features-131-142)
   - [Commission Renewal & Customer Success (143-150)](#commission-renewal--customer-success-143-150)
   - [Business Intelligence & Analytics (151-210)](#business-intelligence--analytics-151-210)
   - [Unified BI Vision (211-217)](#unified-bi-vision-211-217)
4. [Dogfooding Architecture](#the-dogfooding-architecture)
5. [Feature Count Summary](#feature-count-summary)

---

## Platform Overview

PassivePost is a content scheduling SaaS built on MuseKit, a reusable SaaS template. The platform has three user-facing dashboards:

- **Admin Dashboard** — Platform management, affiliate program administration, reporting, CRM
- **Affiliate Dashboard** — Standalone dashboard for affiliate partners with 11+ navigation tabs
- **User Dashboard** — Customer self-service for billing, support, security, and usage insights

The relationship between MuseKit and PassivePost:
- **MuseKit** = the reusable SaaS template/framework (auth, billing, admin, affiliate, teams, CRM, invoicing)
- **PassivePost** = a specific product built ON MuseKit (content scheduling/flywheel SaaS)
- Every new SaaS product gets its own MuseKit deployment with clean P&L and independent scaling

---

## What Has Been Built

The following major systems are fully built and operational. See [FEATURE_INVENTORY.md](./FEATURE_INVENTORY.md) for detailed file paths, database tables, and API routes.

| System | Status | Key Capabilities |
|--------|--------|-----------------|
| Authentication & User Management | **BUILT** | Email/password, OAuth social login, SSO/SAML, role-based access, user impersonation |
| Billing & Subscriptions | **BUILT** | Stripe checkout, subscription management, feature gating, local invoice records, branded receipts |
| Affiliate Program (Core) | **BUILT** | Public signup, admin review, standalone dashboard, referral links, cookie attribution, commission tracking, rate lock-in, fraud detection |
| Tiers, Gamification & Challenges | **BUILT** | Performance tiers, milestone bonuses, contests, leaderboards, badges, earnings goals, weekly challenges |
| Marketing Toolkit | **BUILT** | Deep links, QR codes, link shortener, media kit, sharing cards, co-branded pages, discount codes, email templates, swipe files, knowledge base, promotional calendar |
| Communication & Engagement | **BUILT** | Broadcasts, in-app messaging, drip sequences, announcements, spotlight, what's new digest, surveys, testimonials |
| Payouts & Financial Tools | **BUILT** | Payout lifecycle, batch processing, tax info collection, tax summary, 1099 export, earnings statements, commission renewals, earnings forecast |
| Analytics & Intelligence | **BUILT** | Churn, cohort, revenue, traffic, AI analytics, connected analytics, content intelligence, predictions, custom reports, heatmap, sparklines |
| AI-Powered Tools (14 features) | **BUILT** | Post writer, email drafter, blog outline, video script, objection handler, coach, ad copy, pitch customizer, audience content, promo ideas, onboarding advisor, conversion optimizer, promotion quiz, audience analyzer |
| CRM & Support | **BUILT** | Universal profiles, tickets, activity log, campaigns, contracts, admin CRM card, quick notes, health scores |
| Content Scheduling | **BUILT** | 7-phase flywheel, 8 social + 2 blog platforms, AI grader, topic fatigue, content DNA, calendar autopilot, recycling, streaks, approval portal, ROI calculator |
| Email & Notifications | **BUILT** | Transactional emails, editable templates, drip sequences, weekly digests, trial alerts, notification bell, preferences center |
| Admin Dashboard | **BUILT** | Setup wizard, user management, revenue attribution, revenue waterfall, scheduled reports, metrics alerts, audit logging, queue management |
| User Dashboard | **BUILT** | Invoice history, subscription management, support tickets, account security, usage insights, affiliate invitation, email preferences |
| Social Proof | **BUILT** | Case study library, public affiliate directory, AI case study drafting |

---

## Feature Pipeline by Category

### Original Ideas (1-41)

#### For Everyone (All User Types)

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 1 | Unified profile with completion meter | **BUILT** | "Your profile is 70% complete" with a progress ring. Nudges to add phone, address, avatar. Same component across all dashboards. |
| 2 | Activity timeline | **BUILT** | Chronological feed of all account events. "Commission earned," "Payout processed," "Invoice paid," "Password changed." One component, filtered by role. |
| 3 | Email preferences center | **BUILT** | Users choose what emails they get (weekly digest, payout notifications, announcements). |
| 4 | Export anything to CSV | **BUILT** | One shared export utility. Any table view (commissions, payments, referrals, invoices) gets a download button. |
| 5 | Dark mode | **BUILT** | Works across all dashboards. |

#### For Affiliates

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 6 | Downloadable tax summary (1099-ready PDF) | **BUILT** | Year filter, totals, payout history. Tax center panel with estimated withholding and monthly breakdown. |
| 7 | Monthly earnings statement (emailed) | **BUILT** | Automated email on 1st of each month with formatted earnings summary. |
| 8 | Payout receipt emails with line items | **BUILT** | When admin processes payout, affiliate gets email receipt showing which commissions were included. |
| 9 | "My Links" performance dashboard | **BUILT** | Deep link generator with UTM parameters and source-level tracking. Click-through rates per link over time. |
| 10 | Commission calculator widget | **BUILT** | Commission split estimator showing how earnings are split across tiers, products, and time periods. |
| 11 | Referral sharing cards | **BUILT** | Pre-designed social media images with referral code baked in. Uses existing assets system. |
| 12 | Pending payout tracker | **BUILT** | Payout schedule widget with next payout date, minimum threshold progress, and pending balance. |
| 13 | Contract/agreement system | **BUILT** | Affiliates view their locked-in terms. Contract creation with signing workflow and version history. |
| 14 | Branded discount codes | **BUILT** | 6 discount types including percentage, fixed, free trial, and bundle. Synced with Stripe. Affiliate can customize code name. |
| 15 | Real-time notifications when code used | **BUILT** | In-app notification bell with unread badges visible on every page. |
| 16 | Shareable earnings milestone badges | **BUILT** | Visual badges earned for accomplishments ("First Sale", "Top 10%", "100 Referrals"). Displayed on profile. |
| 17 | Performance comparison | **BUILT** | Leaderboards ranked by referrals, earnings, or conversion rate. Percentile benchmarks showing where affiliate ranks. |
| 18 | Seasonal/promo code boosts | **BUILT** | Contests with time-bound competitions, prizes, and countdown timers. Promotional calendar with linked assets. |
| 19 | Branded landing page | **BUILT** | Co-branded landing pages at `/partner/[slug]` featuring affiliate branding alongside the product. |
| 20 | Affiliate onboarding checklist | **BUILT** | Drip sequences with 3-email onboarding series plus AI onboarding advisor for first-week guidance. |

#### For Product Users (Customers)

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 21 | Invoice history page | **BUILT** | List of all invoices with status filters, pagination, detail view, and PDF download. |
| 22 | Subscription management self-service | **BUILT** | Shows current plan, billing cycle, and status with one-click link to Stripe customer portal. |
| 23 | Usage/feature access summary | **BUILT** | Feature gating by plan with upgrade prompts on premium features. |
| 24 | Support ticket submission | **BUILT** | Full ticket system with Open, In Progress, Resolved, Closed workflow. Comments thread for back-and-forth. |
| 25 | Account security page | **BUILT** | Password change, active session management, and 2FA preparation. |
| 26 | Referral program invitation | **BUILT** | "Earn 30% commission" card on the billing page linking to the affiliate application. |
| 27 | Payment receipt emails with branding | **BUILT** | Branded receipt emails sent after successful payments through Stripe webhooks. |
| 28 | Upcoming billing reminder | **BUILT** | Trial expiry alerts when free trials are about to end. |
| 29 | Usage insights | **BUILT** | Activity metrics like "You published 12 posts this month" with trends. |

#### For Admins

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 30 | Affiliate "at a glance" CRM card | **BUILT** | Click affiliate name, see full profile drawer with earnings, payouts, tickets, activities, and notes. |
| 31 | Bulk payout processing with receipts | **BUILT** | Batch processing with auto receipt emails when batch is processed. |
| 32 | Revenue attribution report | **BUILT** | Shows how much revenue came from affiliate referrals vs direct signups with visual charts. |
| 33 | Scheduled email reports | **BUILT** | Automated weekly revenue and activity digest emails sent to admins. |
| 34 | Quick notes on any account | **BUILT** | Internal notes on any account, visible only to administrators. |
| 35 | Affiliate health score | **BUILT** | Auto-calculated green/yellow/red indicators based on activity recency, conversion rate, and fraud score. |
| 36 | Revenue waterfall | **BUILT** | Visual waterfall chart showing revenue flow from gross to net after commissions, refunds, and fees. |
| 37 | One-click impersonation from CRM | **BUILT** | User impersonation allowing admins to view the platform as any user. |
| 38 | Automated fraud flags with context | **BUILT** | Fraud detection with automated scoring for suspicious patterns. Flags visible to admins. |

#### Cross-Dashboard

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 39 | In-app messaging | **BUILT** | Two-way message threads between admin and individual affiliates with unread indicators. |
| 40 | Announcement banner system | **BUILT** | Admin-created news items that appear on the affiliate dashboard. |
| 41 | Knowledge base / FAQ | **BUILT** | Searchable help articles organized by category with view tracking. Admin creates and manages content. |

---

### Affiliate Delight & Relationship (42-64)

#### Earnings & Money Features

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 42 | Earnings milestones with real rewards | **BUILT** | Tier system with automatic rate increases. Milestone bonuses as one-time cash awards at referral thresholds. |
| 43 | Earnings goal setter | **BUILT** | Affiliates set personal monthly targets with visual progress bars and pace indicators. |
| 44 | Commission split estimator | **BUILT** | Calculator showing long-term value of each referral and how earnings split across tiers and products. |
| 45 | "Fastest to $X" recognition | **BUILT** | Speed-based awards for affiliates who reach earnings milestones fastest. |

#### Relationship & Communication

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 46 | Dedicated affiliate manager contact | PLANNED | Show a face and name on dashboard. "Your affiliate manager: Sarah." Makes it personal, not automated. |
| 47 | Quarterly performance review email | **BUILT** | Weekly and monthly performance emails already deliver detailed summaries. Quarterly is covered by the monthly system. |
| 48 | Feedback/suggestion box | **BUILT** | Satisfaction surveys with star ratings and open feedback. Configurable frequency. |
| 49 | Birthday/anniversary recognition | **BUILT** | Anniversary recognition system with automated emails. |

#### Tools That Save Them Time

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 50 | Link shortener built in | **BUILT** | Clean short links. Professional-looking URLs that get more clicks. |
| 51 | QR code with branding | **BUILT** | Branded QR codes containing the affiliate's referral link. Downloadable for print materials. |
| 52 | Auto-generated "media kit" page | **BUILT** | One-click professional partner page showcasing brand, stats, and promotional materials. |
| 53 | UTM builder with presets | **BUILT** | Deep link generator with source tags and UTM parameters for targeted promotion. |

#### Education & Enablement

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 54 | "How top affiliates promote" guide | **BUILT** | Program intelligence with anonymized aggregate data pushed as coaching tips. |
| 55 | Video tutorials library | PLANNED | Short walkthroughs for common promotion tasks. Admin uploads, affiliates watch. |
| 56 | Promotion idea generator | **BUILT** | AI promo ideas generator based on trends, holidays, and seasonal opportunities. |
| 57 | Monthly "what's new" digest | **BUILT** | Feature update notifications for affiliates when new tools or improvements are released. |

#### Social & Community

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 58 | Affiliate directory (opt-in) | **BUILT** | Public page at `/partners` listing affiliates with tier badges, bio, and social links. Searchable and filterable. |
| 59 | Referral of the month spotlight | **BUILT** | Monthly featured affiliate recognition displayed on the dashboard. |
| 60 | Affiliate-to-affiliate referrals | **BUILT** | Second-tier commissions — affiliates earn a percentage when recruited affiliates generate sales. |

#### Smart Notifications That Drive Action

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 61 | "You're close" nudges | **BUILT** | Predictive intelligence with tier trajectory forecasting and milestone proximity alerts. |
| 62 | Dormancy re-engagement with carrot | **BUILT** | Re-engagement system with configurable dormancy thresholds. |
| 63 | Trial expiry alerts | **BUILT** | Automated alerts when free trials are about to end. |
| 64 | Weekly performance snapshot | **BUILT** | Automated weekly email summarizing clicks, signups, and earnings. |

---

### Marketing Resource Center (65-80)

#### Make the Assets Library a Toolkit

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 65 | "What's working" badges on assets | **BUILT** | Top performer badges on assets that have driven the most conversions. |
| 66 | Asset usage tracking | **BUILT** | Tracks downloads, copies, and views for every marketing asset. Shows which assets perform best. |
| 67 | Categorized asset library with filters | **BUILT** | 9 asset types organized by purpose with the marketing toolkit. |
| 68 | Copy-paste social captions | **BUILT** | Pre-written social media posts with affiliate's referral link auto-inserted. One-click copy. |
| 69 | Customizable templates | **BUILT** | Email templates with merge tags for personalization ({affiliate_name}, {referral_link}, {discount_code}). |

#### Case Studies & Social Proof

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 70 | Case study library as rich cards | **BUILT** | Rich case study cards with headline, key metric, customer quote, and share button. AI can auto-generate drafts. |
| 71 | Success story submissions | **BUILT** | Affiliates submit their own success stories. Admin approves and publishes as testimonials. |
| 72 | Testimonial clips | **BUILT** | Testimonial management system with admin moderation and display on landing pages. |

#### Email & Content Tools

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 73 | Email swipe file library | **BUILT** | Pre-written email sequences with merge tags that auto-fill with affiliate info. |
| 74 | Content calendar suggestions | **BUILT** | Promotional calendar with admin-set upcoming campaigns, countdown timers, and linked assets. |

#### Gamified Engagement

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 75 | Weekly challenges | **BUILT** | Micro-challenges with specific tasks, progress bars, badge rewards, and countdown timers. |
| 76 | New asset notifications | **BUILT** | Notification system alerts when new content is available. |
| 77 | "Starter Kit" for new affiliates | **BUILT** | Curated bundle of essential materials for new affiliates with quick-start guide. |
| 78 | Promotional calendar with countdown timers | **BUILT** | Admin-set upcoming campaigns with countdowns, content suggestions, and linked assets. |

#### Analytics on Assets

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 79 | "Which asset drove my conversions?" | **BUILT** | Asset analytics connecting to commission data to show ROI per asset. |
| 80 | A/B guidance | **BUILT** | Content intelligence analyzing promotion frequency and content type performance correlation with sales. |

---

### AI-Powered Tools (81-98)

#### Content Generation

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 81 | AI Social Post Writer | **BUILT** | Generates platform-specific posts (7 platforms, 5 tones) with referral link automatically embedded. |
| 82 | AI Email Draft Generator | **BUILT** | Creates professional email sequences for promoting the product to the affiliate's audience. |
| 83 | AI Blog Post Outline | **BUILT** | Creates structured blog post outlines with SEO-friendly headings and talking points. |
| 84 | AI Video Script Generator | **BUILT** | Produces video scripts tailored to the platform (YouTube, TikTok, Instagram Reels). |
| 85 | AI Ad Copy Generator | **BUILT** | Creates promotional ad text for paid advertising campaigns. |

#### Personalization & Audience Targeting

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 86 | Audience-aware content | **BUILT** | AI audience content suggests ideas matched to affiliate's specific audience demographics and interests. |
| 87 | AI pitch customizer | **BUILT** | Generates tailored pitches for different audience types (developers, marketers, small business owners). |
| 88 | Objection handler | **BUILT** | Generates responses to common objections using PassivePost's pricing and features. |

#### Performance Intelligence

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 89 | AI Weekly Coach | **BUILT** | Personalized performance tips based on actual data: commissions, tier progress, contests, connected platform metrics, leaderboard position. |
| 90 | AI-suggested best time to post | **BUILT** | AI posting strategy recommends best times based on engagement patterns and promotional calendar events. |
| 91 | AI conversion optimizer | **BUILT** | Analyzes conversion funnel and suggests specific improvements to increase conversion rate. |
| 92 | AI-powered analytics dashboard | **BUILT** | Six AI-generated insight types: conversion drops, content recommendations, channel optimization, audience fit, seasonal trends, competitive tips. |

#### Smart Automation

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 93 | Auto-generated promotional calendar | **BUILT** | Calendar autopilot and promotional calendar system with content suggestions. |
| 94 | AI hashtag suggestions | **BUILT** | Hashtag suggestions integrated into content intelligence and social posting features. |
| 95 | Smart notification copywriting | PLANNED | System notifications are AI-polished to feel warm and motivating, not robotic. |

#### Affiliate Onboarding AI

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 96 | AI onboarding advisor | **BUILT** | Getting-started guidance for new affiliates covering first steps, quick wins, and common mistakes to avoid. |
| 97 | "Analyze my audience" tool | **BUILT** | Audience analyzer using referral clicks and connected platform metrics to generate AI-powered audience persona. |
| 98 | Promotion strategy quiz | **BUILT** | Interactive 6-question quiz generating personalized 30-day promotional playbook. Results saved for future AI coaching. |

---

### Surfacing Existing Admin Features (99-108)

These features wire up existing systems to create new value with minimal new code.

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 99 | Broadcasts also create in-app notification | **BUILT** | In-app notification bell system alongside email broadcasts. |
| 100 | New asset upload triggers affiliate notification | **BUILT** | Notification system supports asset update alerts. |
| 101 | Auto-insert affiliate code/link into text assets | **BUILT** | Swipe files and email templates use merge tags that auto-fill with affiliate's specific code and link. |
| 102 | Tier promotion celebration | **BUILT** | Milestone bonuses and tier system with automated notifications on tier changes. |
| 103 | Live contest leaderboard | **BUILT** | Leaderboard API shows real-time ranking during active contests. |
| 104 | "My Terms" formal contract view | **BUILT** | Contract system with locked-in agreement display: commission rate, duration, cookie days, minimum payout. |
| 105 | Terms changelog | **BUILT** | Terms changelog endpoint showing program changes and how locked rates are unaffected. |
| 106 | Payout schedule display | **BUILT** | Payout schedule widget showing next batch date and pending balance. |
| 107 | Payout in-progress notifications | **BUILT** | Payout lifecycle with status visibility at each stage (Pending, Approved, Paid). |
| 108 | Milestone countdown as persistent banner | **BUILT** | Predictive intelligence includes milestone proximity alerts and tier trajectory. |

---

### Invoicing & Financial Tools (109-130)

#### Professional Earnings & Statements

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 109 | Professional earnings statements | **BUILT** | PDF-style downloadable statements with period selection (current month, last month, custom range). |
| 110 | Real-time earnings dashboard "business mode" | **BUILT** | Financial overview with earnings vs costs, ROI calculations, break-even analysis, and forward projections. |
| 111 | Automatic invoice generation for payouts | **BUILT** | Payout receipt emails with line items when admin processes batch. |
| 112 | Expense offset visibility | **BUILT** | Financial overview shows unified view including subscription costs vs. affiliate earnings. |

#### Tax Time Made Easy

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 113 | 1099-ready annual summary | **BUILT** | Tax center panel with year selector, estimated withholding calculator, and downloadable tax report. |
| 114 | Quarterly estimated tax helper | **BUILT** | Tax summary with estimated withholding (self-employment + federal) and monthly breakdown. |
| 115 | W-9 collection and storage | **BUILT** | Tax info collection for W-9 (US) and W-8BEN (international) with admin verification. |
| 116 | Tax document download center | **BUILT** | Tax center panel with all tax documents accessible from one place. |

#### Financial Transparency

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 117 | Commission lifecycle tracker | **BUILT** | Visual 7-step journey: Click, Signup, Trial, Paid, Commission Created, Approved, Paid Out. |
| 118 | Projected future earnings | **BUILT** | Multi-month forward projections (3, 6, 12 months), annual forecast, and goal progress tracking. |
| 119 | Earnings by referral | **BUILT** | Revenue analytics with per-referral earnings data and cohort analysis. |
| 120 | Churn impact alerts | **BUILT** | Churn intelligence tracking churn rate, reasons, timing patterns, and at-risk referrals. |

#### Business Tools

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 121 | Earnings export for bookkeeping | **BUILT** | CSV export available for any data table in the dashboard. |
| 122 | Multi-year financial history | **BUILT** | Enhanced payout history with filterable, paginated records and summary statistics. |
| 123 | Payment method verification | PLANNED | Before payouts: confirmation prompt showing destination account. |
| 124 | Currency display preference | PLANNED | International affiliates see earnings in local currency with conversion. |
| 125 | Affiliate branded invoice for clients | PLANNED | Professional handoff document for affiliates selling PassivePost as part of a service. |
| 126 | ROI report for their clients | **BUILT** | Content ROI calculator tracking cost per post and correlating effort with results. |

#### Notifications That Build Trust

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 127 | Payout confirmation with receipt | **BUILT** | Batch processing with auto receipt emails when batch is processed. |
| 128 | Commission approval notifications | **BUILT** | Payout lifecycle with visibility at each stage (Pending, Approved, Paid). |
| 129 | Annual earnings milestone emails | **BUILT** | Milestone bonuses with automated recognition at earnings thresholds. |
| 130 | Upcoming payout preview | **BUILT** | Payout schedule widget showing next payout date and estimated amount. |

---

### Partnership-Level Features (131-142)

#### Give Them Ownership

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 131 | Affiliate revenue share dashboard | **BUILT** | Financial overview showing revenue breakdown with earnings vs costs and ROI calculations. |
| 132 | Lifetime value counter per referral | **BUILT** | Cohort analysis tracking per-referral retention and lifetime value over time. |
| 133 | "My Portfolio" view | **BUILT** | Referral tracking showing active, churned, in-trial status with net growth metrics. |

#### Make Them Look Professional

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 134 | Affiliate certification badge | **BUILT** | Verified earnings badges that are shareable and verifiable. Displayed on profile and directory. |
| 135 | Custom referral landing page analytics | **BUILT** | Co-branded landing pages with traffic tracking and performance data. |
| 136 | Co-branded case study | **BUILT** | Case study library with AI-generated drafts from real affiliate performance data. Admin and affiliate collaboration. |

#### Protect the Relationship

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 137 | Commission dispute system | **BUILT** | Dispute system for flagging missed or incorrect commissions. |
| 138 | Grace period on churn | **BUILT** | Commission renewals extending the commission window when referred customers check in or renew. |
| 139 | Rate lock guarantee visibility | **BUILT** | Rate lock-in (grandfathering) system with visible locked terms in contracts. |

#### Passive Income Visibility

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 140 | Earnings while you sleep counter | PLANNED | Live ticker showing earnings since last login. |
| 141 | Annual projection | **BUILT** | Earnings projections with multi-month forward projections and annual forecast. |
| 142 | Compound growth visualization | **BUILT** | Earnings heatmap (GitHub-style contribution graph) and trend charts showing growth over time. |

---

### Commission Renewal & Customer Success (143-150)

This section covers the system where affiliates can extend their commission window by actively helping retain referred customers.

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 143 | Commission renewal system | **BUILT** | Commission renewals extending the window. Bulk renewal support for up to 50 at once. |
| 144 | Customer health indicators for referrals | **BUILT** | Churn intelligence with at-risk referral alerts and usage pattern tracking. |
| 145 | Pre-written check-in templates | **BUILT** | Swipe files and email templates with merge tags for personalized outreach. |
| 146 | Issue flagging on behalf of referrals | **BUILT** | Support ticket system allows affiliates to submit issues on behalf of referrals. |
| 147 | Renewal activity log | **BUILT** | CRM activity log records calls, notes, tasks, and meetings associated with any account. |
| 148 | Renewal dashboard | **BUILT** | Commission renewal interface with eligibility tracking and bulk renewal capabilities. |
| 149 | Post-renewal confirmation | **BUILT** | Renewal system with performance stats (success rate, average extension, revenue saved). |
| 150 | Renewal earnings projection | **BUILT** | Earnings projections incorporating renewal scenarios into forward projections. |

---

### Business Intelligence & Analytics (151-210)

#### Charts & Graphs

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 151 | Earnings line chart | **BUILT** | Revenue analytics with cumulative earnings over time charts. |
| 152 | Clicks & conversions dual-axis chart | **BUILT** | Analytics charts with click and conversion tracking. |
| 153 | Conversion funnel visualization | **BUILT** | Revenue analytics with conversion dropoff funnel. |
| 154 | Revenue pie chart by source | **BUILT** | Revenue breakdown by source (direct vs affiliate) with visual charts. |
| 155 | Earnings heatmap calendar | **BUILT** | GitHub-style contribution heatmap showing 52 weeks of daily earnings activity. |
| 156 | Referral retention curve | **BUILT** | Cohort analysis grouping referrals by signup month and tracking retention over time. |
| 157 | Month-over-month comparison bars | **BUILT** | Custom range reports with period-over-period comparison. |
| 158 | Cumulative earnings area chart | **BUILT** | Revenue analytics with cumulative earnings visualization. |

#### Conversion Funnel Intelligence

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 159 | Conversion rate by channel | **BUILT** | Traffic insights with source-level attribution and conversion rates. |
| 160 | Conversion rate over time | **BUILT** | Analytics tracking conversion trends over configurable time periods. |
| 161 | Drop-off analysis | **BUILT** | Revenue analytics with conversion dropoff funnel showing where potential revenue is lost. |
| 162 | Trial-to-paid benchmarks | **BUILT** | Cohort analysis with trial benchmarks and conversion trends. |

#### Audience & Traffic Insights

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 163 | Click heatmap by day/hour | **BUILT** | Earnings heatmap showing activity patterns by time period. |
| 164 | Geographic breakdown | **BUILT** | Traffic insights with country-level geographic breakdown. |
| 165 | Device breakdown | **BUILT** | Traffic insights with device type breakdown (desktop/mobile/tablet). |
| 166 | Repeat visitor tracking | **BUILT** | Traffic insights with repeat visitor analysis. |
| 167 | Referral source attribution | **BUILT** | Connected analytics merging data from multiple platforms with affiliate performance data. |

#### Churn Intelligence

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 168 | Churn rate for their referrals | **BUILT** | Churn intelligence tracking churn rate with net growth calculation. |
| 169 | Churn reasons | **BUILT** | Churn intelligence tracking reasons and patterns. |
| 170 | Churn timing patterns | **BUILT** | Churn intelligence with timing pattern analysis. |
| 171 | At-risk referral alerts | **BUILT** | Churn intelligence with at-risk referral identification. |
| 172 | Net referral growth | **BUILT** | Churn intelligence showing net growth (new signups minus churned). |

#### Performance Benchmarks

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 173 | Percentile ranking | **BUILT** | Percentile benchmarks showing where affiliate ranks compared to all others. |
| 174 | Month-over-month scorecard | **BUILT** | Custom range reports with period-over-period comparison metrics. |
| 175 | Personal best tracking | PLANNED | Track and display personal best records for key metrics. |
| 176 | Efficiency metrics | **BUILT** | Analytics tracking earnings per click, earnings per signup, and other efficiency ratios. |

#### AI-Powered Analytics Suggestions

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 177 | "Why conversions dropped" analysis | **BUILT** | AI analytics intelligence with conversion drop analysis. |
| 178 | Content type recommendations | **BUILT** | Content intelligence analyzing content type performance correlation with sales. |
| 179 | Channel optimization | **BUILT** | AI analytics with channel optimization recommendations. |
| 180 | Audience fit score | **BUILT** | AI analytics with audience fit assessment. |
| 181 | Seasonal trend predictions | **BUILT** | Predictive intelligence with seasonal pattern detection. |
| 182 | Competitor displacement tips | **BUILT** | AI analytics with competitive tips. |

#### Campaign-Level Tracking

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 183 | Campaign creator | **BUILT** | Marketing campaigns with UTM attribution and unique tracking links. |
| 184 | Campaign dashboard | **BUILT** | Campaign tracking with performance counters (clicks, signups, conversions). |
| 185 | Campaign comparison table | **BUILT** | Custom range reports with comparison capabilities. |
| 186 | Campaign ROI calculator | **BUILT** | Content ROI calculator correlating effort with business results. |
| 187 | Campaign timeline | PLANNED | Visual timeline showing launch dates and click/conversion activity over time. |
| 188 | Campaign tagging on existing links | **BUILT** | Deep link generator with UTM parameters and source tags for any link. |

#### Connected Analytics (External Platform Integration)

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 189 | YouTube Analytics integration | **BUILT** | Connected analytics with YouTube data merged into affiliate performance. |
| 190 | Google Analytics integration | PLANNED | Connect GA for blog traffic correlation with affiliate performance. |
| 191 | Podcast analytics | PLANNED | Connect Spotify/Apple Podcasts download data with affiliate click-through rates. |
| 192 | Social media analytics | **BUILT** | Connected analytics for 8 social platforms with real OAuth connections. |
| 193 | Merged analytics dashboard | **BUILT** | Connected analytics dashboard merging external platform data with affiliate metrics in unified view. |
| 194 | Cross-platform performance comparison | **BUILT** | Content intelligence with platform-by-platform correlation analysis. |

#### Smart Insights From Connected Data

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 195 | Content-to-revenue attribution | **BUILT** | Content intelligence analyzing promotion frequency and content type performance correlation with sales. |
| 196 | Audience overlap detection | **BUILT** | AI conversion insights analyzing cross-platform correlation. |
| 197 | Optimal promotion frequency | **BUILT** | Content intelligence analyzing promotion frequency impact on sales. |
| 198 | Content format recommendations | **BUILT** | AI analytics with content recommendations based on real performance data. |

#### Reporting & Exports

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 199 | Weekly performance email | **BUILT** | Automated weekly email summarizing clicks, signups, and earnings. |
| 200 | Monthly business report PDF | **BUILT** | Monthly earnings statements with formatted earnings summary. |
| 201 | Custom date range reports | **BUILT** | Any date range analysis with period-over-period comparison. |
| 202 | Comparison reports | **BUILT** | Custom range reports with side-by-side period comparison. |
| 203 | Scheduled report delivery | **BUILT** | Scheduled reports via cron system with configurable delivery. |

#### Analytics UX/UI Principles

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 204 | Dashboard customization | PLANNED | Drag/drop widgets for personalized dashboard layout. |
| 205 | Global date range picker | **BUILT** | Analytics with configurable time period filters (7/30/90 days, year, custom). |
| 206 | Real-time updates | **BUILT** | Dashboard data refreshes with latest data on each visit. |
| 207 | Mobile-responsive analytics | **BUILT** | All 14 grid layouts in the affiliate dashboard adapt to phone screens. |
| 208 | Sparklines in table rows | **BUILT** | Mini trend charts embedded in referral rows showing recent performance direction. |
| 209 | Tooltips on everything | **BUILT** | Hover explanations on every metric describing what it measures and how it's calculated. |
| 210 | Export any chart | **BUILT** | CSV export available for any data table in the dashboard. |

---

### Unified BI Vision (211-217)

These features represent the strategic long-term vision for PassivePost as a closed-loop business intelligence engine.

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 211 | Affiliate-as-Customer Feedback Loop | **BUILT** | The content scheduling tool IS the affiliate's promotion tool. Connected analytics merge content performance with affiliate earnings. |
| 212 | Admin Intelligence That Flows to Affiliates | **BUILT** | Program intelligence dashboard for admins with aggregate insights pushed to affiliates as coaching tips via AI coach. |
| 213 | Referral Health / Affiliate Coaching / Retention Triangle | **BUILT** | Churn intelligence feeds to affiliates as health indicators. Commission renewal system enables check-ins. Three-way feedback loop. |
| 214 | Content Performance Intelligence | **BUILT** | Content intelligence analyzing what affiliates create and correlating with sales performance. |
| 215 | Unified Financial View | **BUILT** | Financial overview showing subscription costs vs. affiliate earnings with break-even analysis and ROI. |
| 216 | Community Intelligence | **BUILT** | Surveys, testimonials, case studies, and support tickets create feedback loops across all user types. |
| 217 | Predictive Intelligence | **BUILT** | Tier trajectory forecasting, churn window predictions, and seasonal pattern detection. |

---

## The Dogfooding Architecture

PassivePost has a unique three-layer dogfooding system that creates a competitive moat no standalone affiliate platform can replicate.

### Three Layers

**Layer 1: PassivePost the company uses PassivePost.**
PassivePost uses its own product to schedule and publish marketing content. Every feature is tested internally. Every bug is found as a real user.

**Layer 2: Affiliates use PassivePost to promote PassivePost.**
Affiliates are content creators who use PassivePost to grow their own business. Promoting it to their audience is an authentic recommendation because they actually use the product.

**Layer 3: Customers become affiliates who use PassivePost.**
Product customers become affiliates, use PassivePost to promote PassivePost, their followers sign up, some become affiliates, and the cycle repeats.

### Why This Creates a Moat

- **Authenticity drives conversions** — Affiliates who are power users are the most credible promoters
- **Zero acquisition cost on many affiliates** — They signed up for the product first
- **Dual retention** — Customer-affiliates have TWO reasons to stay: product value AND commission income
- **Every improvement helps twice** — Better scheduling features help the user AND make the affiliate a better promoter
- **Invoicing = business value** — Clean earnings statements, tax summaries, commission receipts are genuine business tools for affiliate-creators

### Cross-Muse Strategy

MuseKit is the reusable engine. Every new SaaS product (called a "Muse") gets the full system:
- **MuseKit Core** — CRM, invoicing, analytics, affiliate dashboard, AI tools. Universal.
- **Product-Specific Synergy** — How each specific product enhances the affiliate experience.
- **Cross-Muse Network** (future vision) — Affiliates across all products form a broader partner ecosystem.

---

## Affiliate Philosophy

The best affiliate programs make affiliates feel three things:
1. **"They actually want me to succeed"** — tools, education, proactive tips
2. **"I know exactly where I stand"** — transparent earnings, clear terms, real-time data
3. **"I'm a partner, not a contractor"** — branded codes, personal pages, recognition, communication

PassivePost and affiliates are business partners. Consistent quality across all three dashboards (Admin, Affiliate, User).

---

## Feature Count Summary

| Section | Features | Range | Built | Planned |
|---------|----------|-------|-------|---------|
| Original Ideas (All User Types) | 41 | #1-41 | 41 | 0 |
| Affiliate Delight & Relationship | 23 | #42-64 | 22 | 1 |
| Marketing Resource Center | 16 | #65-80 | 16 | 0 |
| AI-Powered Tools | 18 | #81-98 | 17 | 1 |
| Surfacing Existing Admin Features | 10 | #99-108 | 10 | 0 |
| Invoicing & Financial Tools | 22 | #109-130 | 19 | 3 |
| Partnership-Level Features | 12 | #131-142 | 11 | 1 |
| Commission Renewal & Customer Success | 8 | #143-150 | 8 | 0 |
| Business Intelligence & Analytics | 60 | #151-210 | 55 | 5 |
| Unified BI Vision & Big Picture | 7 | #211-217 | 7 | 0 |
| **TOTAL** | **217** | | **206** | **11** |

### Remaining Planned Features

| # | Feature | Category |
|---|---------|----------|
| 46 | Dedicated affiliate manager contact | Relationship |
| 55 | Video tutorials library | Education |
| 95 | Smart notification copywriting | AI Automation |
| 123 | Payment method verification | Financial Tools |
| 124 | Currency display preference | Financial Tools |
| 125 | Affiliate branded invoice for clients | Financial Tools |
| 140 | Earnings while you sleep counter | Passive Income |
| 175 | Personal best tracking | Benchmarks |
| 187 | Campaign timeline | Campaign Tracking |
| 190 | Google Analytics integration | Connected Analytics |
| 191 | Podcast analytics | Connected Analytics |
| 204 | Dashboard customization (drag/drop) | Analytics UX |

---

*This document is the strategic feature pipeline for PassivePost. It serves as the single source of truth for planning, prioritization, and tracking of all CRM, invoicing, analytics, AI, and platform features.*
