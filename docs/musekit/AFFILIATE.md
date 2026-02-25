# Affiliate System — Complete Guide

This document explains the entire Affiliate System built into MuseKit. It covers what it is, how it works, the architecture, every route, every database table, and how all the pieces connect.

---

## Table of Contents

1. [What Is the Affiliate System?](#what-is-the-affiliate-system)
2. [Architecture: Separation from Product Users](#architecture-separation-from-product-users)
3. [All Affiliate Routes](#all-affiliate-routes)
4. [How It Works — End to End](#how-it-works--end-to-end)
5. [Feature Breakdown](#feature-breakdown)
6. [Tiers, Gamification & Challenges](#tiers-gamification--challenges)
7. [Marketing Toolkit & Resource Center](#marketing-toolkit--resource-center)
8. [Communication & Engagement](#communication--engagement)
9. [Payouts & Financial Tools](#payouts--financial-tools)
10. [Analytics & Intelligence](#analytics--intelligence)
11. [AI-Powered Tools](#ai-powered-tools)
12. [Social Proof & Directory](#social-proof--directory)
13. [Database Schema](#database-schema)
14. [API Endpoints](#api-endpoints)
15. [Admin Management](#admin-management)
16. [Testing Checklist](#testing-checklist)

---

## What Is the Affiliate System?

The Affiliate System lets you run a partner/referral program for your SaaS product. People (affiliates) sign up, get a unique referral link, and earn a percentage of every subscription payment made by someone they referred. It is a marketing channel where you only pay when you make money.

**What's included:**
- A public-facing affiliate program page anyone can find
- An application form so anyone can apply (no account needed)
- An admin review workflow to approve or reject applicants
- A standalone affiliate dashboard with 11+ navigation tabs where affiliates track clicks, signups, earnings, payouts, contests, and more
- Cookie-based referral tracking (30-day window by default, configurable)
- Automatic commission calculation when referred users pay via Stripe
- Performance tiers (Bronze, Silver, Gold, Platinum) that unlock higher commission rates
- Rate lock-in (grandfathering) so affiliates keep their terms even if you change the program later
- Milestone bonuses, contests, leaderboards, weekly challenges, and badges
- Deep link generator with UTM parameters and QR codes
- Co-branded landing pages at `/partner/[slug]`
- Discount codes with dual-attribution (cookie + code tracking)
- Marketing toolkit with swipe files, email templates, sharing cards, and starter kits
- Knowledge base and promotional calendar
- 14 AI-powered tools (coach, post writer, email drafter, video scripts, and more)
- Tax compliance tools (W-9/W-8BEN collection, 1099 export)
- Payout management with batch processing and receipt emails
- In-app messaging between admin and affiliates
- Broadcasts, drip sequences, surveys, and testimonials
- Public partner directory and case study library
- Fraud detection and automated scoring
- Affiliate API access and webhook notifications
- External affiliate network support (ShareASale, Impact, PartnerStack)

For detailed technical specifications of all 32 enhancement features, see `docs/musekit/AFFILIATE_ENHANCEMENTS.md`.

---

## Architecture: Separation from Product Users

**Affiliates and product users are completely separate.** This is a deliberate design choice.

| | Product Users | Affiliates |
|---|---|---|
| **Login URL** | `/login` | `/affiliate/login` |
| **Dashboard** | `/dashboard` (with sidebar) | `/affiliate/dashboard` (standalone, no sidebar) |
| **Purpose** | Use the product | Promote the product and earn commissions |
| **Account creation** | Self-service signup | Admin-approved application |
| **Navigation** | Full product sidebar | Minimal header with logout + 11 tab navigation |

**Why separate?**
- Affiliates don't need access to the product itself — they just need their referral link, stats, and payouts.
- Mixing the two creates confusion (is this person a customer or a promoter?).
- Some affiliates may never use the product at all (bloggers, influencers, consultants).
- Product users who want to become affiliates can also apply through the same public form.

**How they connect:**
- Product marketing pages include a `ReferralTracker` component that reads `?ref=CODE` from the URL and stores a cookie.
- When a visitor signs up for the product, the signup flow checks for the referral cookie and attributes the signup to the affiliate.
- When the referred user pays (via Stripe), the Stripe webhook calculates and records the affiliate's commission.

---

## All Affiliate Routes

### Public Pages (no login required)

| Route | Purpose |
|---|---|
| `/affiliate` | Landing page — program overview, commission rates, benefits, "How It Works", audience types, testimonials, CTAs |
| `/affiliate/join` | Application form — name, email, website, promotion methods (multi-select), message |
| `/affiliate/login` | Affiliate-only login — magic link or password |
| `/affiliate/forgot-password` | Password reset for affiliates |
| `/affiliate/set-password` | Set initial password after approval |
| `/partners` | Public affiliate directory — opt-in profiles with tier badges, bio, social links |
| `/partner/[slug]` | Co-branded landing page for individual affiliates |
| `/partner/verify/[code]` | Badge verification page — confirms affiliate badges are legitimate |

### Affiliate Dashboard (requires affiliate login)

| Route | Purpose |
|---|---|
| `/affiliate/dashboard` | Standalone dashboard with 11+ tabs — referral link, stats, earnings, payouts, marketing toolkit, analytics, AI tools, messages, contests, and more |

### Admin Pages (requires admin login)

| Route | Purpose |
|---|---|
| `/admin/setup/affiliate` | Full affiliate management — 15+ tabs for Settings, Tiers, Assets, Management, Applications, Networks, Broadcasts, Contests, Badges, and more |
| `/admin/setup/discount-codes` | Discount code management |

---

## How It Works — End to End

Here's the complete lifecycle, from a stranger finding your affiliate program to getting paid:

### Step 1: Discovery
A blogger, influencer, or anyone visits `/affiliate` and reads about the program — commission rates, cookie window, benefits, testimonials, and who can join.

### Step 2: Application
They click "Apply Now" and fill out the form at `/affiliate/join`. They provide their name, email, website/channel URL, how they plan to promote, and an optional message. No account is needed.

### Step 3: Admin Review
The application appears in the admin dashboard at `/admin/setup/affiliate` under the "Applications" tab with a "pending" status. An admin reviews it and clicks "Approve" or "Reject."

### Step 4: Account Provisioning (on approval)
When an admin approves an application, the system automatically:
1. Creates a Supabase user account with the applicant's email (or finds an existing one)
2. Generates a unique referral code (random hex string)
3. Creates a referral link record with `affiliate_role = 'affiliate'`
4. Assigns the `affiliate` role in the `user_roles` table
5. Sends an in-app notification welcoming them
6. Starts the 3-email drip onboarding sequence

### Step 5: Affiliate Login
The approved affiliate receives a login link (magic link via email) or can set a password. They log in at `/affiliate/login` and are taken to `/affiliate/dashboard`.

### Step 6: Sharing
From the dashboard, the affiliate copies their unique referral link (e.g., `https://yourapp.com/?ref=a1b2c3d4e5f6`) and shares it. They can also use the deep link generator to create links to specific pages, generate QR codes, create short links, or use discount codes.

### Step 7: Cookie Tracking
When someone clicks the referral link, the `ReferralTracker` component on your marketing pages:
1. Reads the `?ref=CODE` parameter from the URL
2. Sets a `pp_ref` cookie that lasts 30 days (configurable)
3. Stores the code in `localStorage` as a backup
4. Sends a click-tracking request to the API (increments the link's click count)
5. Records the landing page and source tag if present

### Step 8: Signup Attribution
When the visitor signs up as a product user:
1. The signup page reads the `pp_ref` cookie
2. Calls `/api/affiliate/track-signup` with the referral code and the new user's ID
3. The system creates a record in `affiliate_referrals` linking the affiliate to the new user
4. Runs fraud checks (same email domain, IP volume, self-referral)
5. Sends a notification to the affiliate: "New signup from your referral!"

### Step 9: Conversion (Stripe Payment)
When the referred user subscribes and Stripe processes the payment:
1. Stripe sends an `invoice.paid` webhook
2. The webhook handler looks up the paying customer's Supabase user ID
3. Checks `affiliate_referrals` for a matching record
4. If found, calculates the commission: invoice amount x affiliate's commission rate
5. Creates a record in `affiliate_commissions` with status `pending`
6. Checks for milestone bonuses and awards them if thresholds are met
7. Sends a notification to the affiliate: "You earned $X.XX commission!"

### Step 10: Payout
When the affiliate's balance reaches the minimum payout threshold ($50 by default):
1. Admin creates a payout batch (can batch multiple affiliates at once)
2. Admin processes the payment (manually via PayPal, bank transfer, etc.)
3. Admin marks the payout as `paid`
4. System auto-sends payout receipt emails
5. The affiliate sees the payout in their dashboard history

---

## Feature Breakdown

### Public Landing Page
**Route:** `/affiliate`

The public-facing marketing page for the affiliate program. Pulls live data from the program settings API so commission rates and durations always reflect current configuration. Includes testimonials from successful affiliates and a "How It Works" section.

### Application Form
**Route:** `/affiliate/join`

A simple form anyone can fill out — no account required. Fields: Full Name, Email, Website/Channel URL, Promotion Methods (multi-select checkboxes), Additional Message. Checks for duplicate applications by email.

### Affiliate Dashboard
**Route:** `/affiliate/dashboard`

A standalone page with its own minimal header (app name + email + logout). No product sidebar. Contains 11+ tabs:

- **Overview** — Referral link card, stats grid (clicks, signups, earnings), tier progress, recent activity
- **Referrals** — List of all referred signups with status and commission lifecycle tracker
- **Earnings** — Commission history with pending/approved/paid totals
- **Marketing** — Full marketing toolkit (links, QR codes, assets, swipe files, sharing cards)
- **Analytics** — Churn intelligence, cohort analysis, traffic insights, content intelligence, heatmap
- **AI Tools** — 14 AI-powered tools (coach, post writer, email drafter, video scripts, and more)
- **Contests** — Active contests, leaderboards, challenges, badges
- **Messages** — Direct messaging with admin
- **Payouts** — Payout history, schedule, tax information
- **Resources** — Knowledge base, promotional calendar, starter kit
- **Settings** — Profile, notification preferences, webhooks, API keys

### Referral Link & Cookie Tracking
**Component:** `src/components/referral-tracker.tsx`

A client-side component placed on marketing pages. Uses last-touch attribution — if a visitor clicks a different affiliate's link later, the cookie is overwritten. Click tracking is deduplicated per session via `sessionStorage`.

### Commission Tracking (Stripe)
**Webhook:** `POST /api/stripe/webhook` -> `invoice.paid` event

Automatic commission calculation using the affiliate's effective rate (considers tier and locked rate, uses whichever is higher). Deduplication via unique index on `stripe_invoice_id`. Supports second-tier commissions (earning from affiliates you recruited) and commission renewals.

### Fraud Detection
**Function:** `checkFraudFlags()` in `src/lib/affiliate/index.ts`

Automated scoring system checks for:
- Same email domain between affiliate and referred user
- High-volume IP addresses (3+ signups from same IP hash within 1 hour)
- Self-referral (same user ID)
- Additional automated fraud scoring with configurable thresholds

Flags are informational — admins review them to make decisions.

---

## Tiers, Gamification & Challenges

| Feature | Description |
|---------|-------------|
| **Performance Tiers** | Bronze, Silver, Gold, Platinum — escalating commission rates based on referral count. Fully configurable by admin. |
| **Milestone Bonuses** | One-time cash bonuses at referral count thresholds (e.g., $50 at 10 referrals). Progress bar on dashboard. |
| **Contests** | Time-bound competitions with prizes, leaderboards, and countdown timers. |
| **Leaderboards** | Ranked lists by referrals, earnings, or conversion rate. Filterable by time period. Privacy modes available. |
| **Badges & Achievements** | Visual badges for accomplishments ("First Sale", "Top 10%", "100 Referrals"). Verifiable at `/partner/verify/[code]`. |
| **Earnings Goals** | Self-set monthly targets with progress tracking. |
| **"Fastest to $X" Recognition** | Speed-based awards for reaching earnings milestones fastest. |
| **Weekly Challenges** | Micro-challenges with specific tasks, progress bars, badge rewards, and countdown timers. |

---

## Marketing Toolkit & Resource Center

| Feature | Description |
|---------|-------------|
| **Deep Link Generator** | Create referral-tracked links to any page with source tags and UTM parameters. |
| **QR Code Generator** | Branded QR codes containing the affiliate's referral link. |
| **Link Shortener** | Clean short links (e.g., `ppost.co/steele`). |
| **Media Kit Page** | One-click professional partner page. |
| **Copy-Paste Captions** | Pre-written social media posts with referral link auto-inserted. |
| **Sharing Cards** | Pre-designed social media images with referral code embedded. |
| **Co-Branded Landing Pages** | Customizable partner pages at `/partner/[slug]`. |
| **Discount Codes** | Branded coupon codes synced with Stripe. 6 discount types including percentage, fixed, free trial, and bundle. Dual-attribution with cookie tracking. |
| **Email Templates** | Pre-written email sequences with merge tags for personalization. |
| **Swipe Files** | Ready-to-use promotional emails with auto-filled merge tags. |
| **Starter Kit** | Curated bundle of essential materials for new affiliates. |
| **Knowledge Base** | Searchable help articles organized by category. |
| **Promotional Calendar** | Admin-set upcoming campaigns with countdown timers and linked assets. |
| **Asset Usage Analytics** | Tracks downloads, copies, and views for every marketing asset. |

---

## Communication & Engagement

| Feature | Description |
|---------|-------------|
| **Broadcasts** | Admin sends email announcements to all affiliates or segments with open/click tracking. |
| **In-App Messaging** | Two-way message threads between admin and individual affiliates. |
| **Drip Sequences** | 3-email automated onboarding: Welcome (immediate), Tips (24h), Strategy (72h). |
| **Announcements** | Admin-created news items on the affiliate dashboard. |
| **Affiliate Spotlight** | Monthly featured affiliate recognition. |
| **What's New Digest** | Feature update notifications. |
| **Surveys** | Satisfaction surveys with star ratings. Positive reviews can auto-convert to testimonials. |
| **Testimonials** | Success story submissions. Displayed on the affiliate landing page. |

---

## Payouts & Financial Tools

| Feature | Description |
|---------|-------------|
| **Payout Lifecycle** | Pending -> Approved -> Paid with visibility for both admin and affiliate. |
| **Batch Processing** | Process multiple payouts at once with auto-sent receipt emails. |
| **Payout Schedule Widget** | Shows next payout date, threshold progress, and pending balance. |
| **Tax Info Collection** | W-9 (US) and W-8BEN (international) tax form submission. Admin verification. |
| **Tax Summary** | Annual summary with estimated withholding and monthly breakdown. |
| **Admin 1099 Tax Export** | Year-end CSV of affiliates earning over $600. |
| **Earnings Statements** | Downloadable statements with period selection. |
| **Commission Lifecycle Tracker** | 7-step visual journey: Click -> Signup -> Trial -> Paid -> Commission -> Approved -> Paid Out. |
| **Second-Tier Commissions** | Earn percentage when recruited affiliates generate sales. |
| **Commission Renewals** | Extend commission window when referred customers renew. Bulk renewal support. |
| **Earnings Forecast** | Projected monthly earnings with optimistic/pessimistic range. |
| **Earnings Projections** | Multi-month projections (3, 6, 12 months) with goal progress tracking. |
| **Enhanced Payout History** | Filterable, paginated history with CSV export and summary statistics. |

---

## Analytics & Intelligence

| Feature | Description |
|---------|-------------|
| **Churn Intelligence** | Churn rate, reasons, timing patterns, and at-risk referrals. |
| **Cohort Analysis** | Groups referrals by signup month, tracks retention over time. |
| **Revenue Analytics** | Revenue by source, cumulative earnings, conversion funnel. |
| **Traffic Insights** | Geographic breakdown, device types, repeat visitor analysis. |
| **Connected Analytics** | Merges data from connected platforms with affiliate performance. |
| **Content Intelligence** | Promotion frequency, content type performance, platform correlation. |
| **Financial Overview** | Earnings vs costs, ROI, break-even analysis, projections. |
| **Predictive Intelligence** | Tier trajectory, churn predictions, seasonal patterns. |
| **Custom Range Reports** | Any date range with period-over-period comparison. |
| **Earnings Heatmap** | GitHub-style 52-week heatmap of daily earnings activity. |
| **Percentile Benchmarks** | Where an affiliate ranks vs all others in the program. |
| **Sparklines** | Mini trend charts in referral rows. |
| **Export Buttons** | CSV download for any data table. |

---

## AI-Powered Tools

All AI features pull real data from the affiliate's actual performance, connected platforms, and program context.

| Tool | Description |
|------|-------------|
| **AI Coach** | Personalized tips based on commissions, tier progress, contests, leaderboard position. |
| **AI Post Writer** | Platform-specific social media posts (7 platforms, 5 tones) with referral link embedded. |
| **AI Email Drafter** | Professional email sequences for audience promotion. |
| **AI Blog Outline** | Structured blog post outlines with SEO-friendly headings. |
| **AI Video Script** | Video talking points for YouTube, TikTok, Instagram Reels. |
| **AI Objection Handler** | Responses to common objections ("too expensive", "use competitor X"). |
| **AI Ad Copy** | Promotional ad text for paid advertising. |
| **AI Pitch Customizer** | Tailored pitches for different audience types. |
| **AI Audience Content** | Content ideas matched to affiliate's audience demographics. |
| **AI Promo Ideas** | Creative promotion suggestions based on trends and seasons. |
| **AI Onboarding Advisor** | Getting-started guidance for new affiliates. |
| **AI Conversion Optimizer** | Funnel analysis with specific improvement suggestions. |
| **Promotion Strategy Quiz** | 6-question interactive quiz that generates a 30-day playbook. |
| **Audience Analyzer** | Audience demographics analysis with AI-generated persona. |

**AI Provider:** xAI (Grok) via `grok-3-mini-fast` model, configurable via admin settings.

---

## Social Proof & Directory

| Feature | Description |
|---------|-------------|
| **Case Study Library** | Rich case studies with metrics, quotes, and share buttons. AI can auto-generate drafts from affiliate data. |
| **Public Affiliate Directory** | Opt-in public page at `/partners` with tier badges, bio, social links. Searchable and filterable. |
| **Verified Earnings Badges** | Embeddable badges at earning thresholds ($500+, $2,500+, $10,000+). Verifiable at `/partner/verify/[code]`. |

---

## Database Schema

### Core Tables (Migrations 005-009)

| Table | Purpose |
|---|---|
| `affiliate_profiles` | Extended affiliate data: quiz results, directory opt-in, health scores |
| `affiliate_settings` | Global config: commission rate, duration, min payout, cookie days |
| `affiliate_tiers` | Performance tiers: name, threshold, rate, perks, min payout override |
| `affiliate_referrals` | Each referred signup: affiliate ID, referred user, status, fraud flags, source tag |
| `affiliate_commissions` | Each commission: affiliate ID, Stripe invoice, amounts, rate, status |
| `affiliate_payouts` | Payout batches: affiliate ID, amount, method, status |
| `affiliate_payout_items` | Individual items within payout batches |
| `affiliate_assets` | Marketing materials: title, type, content/file URL |
| `affiliate_applications` | Applications from public form: name, email, website, status |
| `affiliate_milestones` | Milestone definitions: threshold, bonus amount |
| `affiliate_milestone_awards` | Awarded milestones per affiliate |
| `affiliate_contests` | Contest definitions: dates, metric, prizes |
| `affiliate_contest_entries` | Contest participation records |
| `affiliate_broadcasts` | Admin broadcast emails |
| `affiliate_broadcast_receipts` | Per-recipient delivery tracking |
| `affiliate_messages` | Admin-affiliate messaging threads |
| `affiliate_surveys` | Satisfaction survey responses |
| `affiliate_landing_pages` | Co-branded landing page content |
| `affiliate_short_links` | Shortened referral URLs |
| `affiliate_badges` | Earned badges per affiliate |
| `affiliate_badge_tiers` | Badge tier definitions |
| `affiliate_webhooks` | Affiliate-registered webhook URLs |
| `affiliate_webhook_deliveries` | Webhook delivery log |
| `affiliate_tax_info` | W-9/W-8BEN tax form data |
| `affiliate_network_settings` | External network configs |
| `discount_codes` | Promotional codes with Stripe integration |
| `discount_code_redemptions` | Code usage records with attribution |
| `referral_clicks` | Click tracking with landing page and source tag |
| `challenge_progress` | Weekly challenge completion tracking |
| `commission_renewals` | Extended commission windows |
| `case_studies` | Success story content |
| `knowledge_base_articles` | Help articles for affiliates |
| `promotional_calendar` | Upcoming campaigns and events |

### Row Level Security (RLS)

All affiliate tables have RLS enabled:
- **Program settings & tiers:** Readable by everyone (public info)
- **Referrals, commissions, payouts:** Affiliates can only see their own records
- **Assets:** Anyone can read active assets
- **Admin operations:** Use the Supabase service role key (bypasses RLS)

---

## API Endpoints

### Public (no auth required)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/affiliate/settings` | Get program settings |
| POST | `/api/affiliate/applications` | Submit affiliate application |
| GET | `/api/public/affiliate-directory` | Public partner directory |
| GET | `/api/affiliate/badges/verify/[code]` | Verify earnings badge |

### Affiliate Auth Required

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/affiliate/dashboard` | Full dashboard data |
| POST | `/api/affiliate/activate` | Activate and lock in terms |
| GET | `/api/affiliate/referrals` | Referral history |
| GET | `/api/affiliate/commissions` | Commission history |
| GET | `/api/affiliate/payouts` | Payout history |
| GET | `/api/affiliate/assets` | Marketing assets |
| GET | `/api/affiliate/leaderboard` | Leaderboard rankings |
| GET | `/api/affiliate/contests` | Active contests |
| GET | `/api/affiliate/challenges` | Weekly challenges |
| GET | `/api/affiliate/milestones` | Milestone progress |
| GET | `/api/affiliate/badges` | Earned badges |
| GET | `/api/affiliate/goals` | Earnings goals |
| GET | `/api/affiliate/messages` | Message thread |
| POST | `/api/affiliate/messages` | Send message |
| GET | `/api/affiliate/analytics/*` | All analytics endpoints |
| POST | `/api/affiliate/ai-*` | All AI tool endpoints |
| GET | `/api/affiliate/discount-codes` | Affiliate's discount codes |
| GET | `/api/affiliate/knowledge-base` | Knowledge base articles |
| GET | `/api/affiliate/promotional-calendar` | Upcoming campaigns |
| GET | `/api/affiliate/swipe-files` | Swipe file content |
| GET | `/api/affiliate/tax-info` | Tax information |
| GET | `/api/affiliate/tax-summary` | Annual tax summary |
| GET | `/api/affiliate/earnings-statement` | Downloadable statement |
| GET | `/api/affiliate/forecast` | Earnings forecast |
| GET | `/api/affiliate/renewals` | Commission renewals |
| GET/POST | `/api/affiliate/webhooks` | Affiliate webhook management |
| GET | `/api/affiliate/api-keys` | API key management |
| GET | `/api/affiliate/export-csv` | Data export |

### Admin Only

| Method | Endpoint | Purpose |
|---|---|---|
| GET/POST | `/api/affiliate/applications` | List/review applications |
| POST | `/api/affiliate/applications/review` | Approve or reject |
| GET/PUT | `/api/affiliate/settings` | Program settings |
| GET/POST/PUT/DELETE | `/api/affiliate/tiers` | Tier CRUD |
| GET/POST/DELETE | `/api/affiliate/assets` | Asset CRUD |
| GET/POST | `/api/admin/affiliate/broadcasts` | Broadcast management |
| GET | `/api/admin/affiliate/health` | Program health metrics |
| GET | `/api/admin/affiliate/program-intelligence` | Program intelligence |
| GET | `/api/admin/affiliate/messages/[id]` | View affiliate messages |
| GET/POST | `/api/admin/affiliate/tax-info` | Tax info management |
| GET | `/api/admin/affiliate/tax-export` | 1099 tax export |
| GET | `/api/admin/affiliates` | List all affiliates |
| GET | `/api/admin/affiliates/[userId]` | Affiliate detail |
| GET/POST | `/api/admin/discount-codes` | Discount code CRUD |
| GET/POST | `/api/admin/case-studies` | Case study management |
| GET/POST | `/api/admin/knowledge-base` | Knowledge base CRUD |
| GET | `/api/admin/revenue-attribution` | Revenue attribution report |
| GET | `/api/admin/revenue-waterfall` | Revenue waterfall chart |

### Internal (called by system components)

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/affiliate/track-signup` | Record a referred signup |
| POST | `/api/affiliate/drip` | Trigger drip email sequence |
| POST | `/api/referral` | Track a referral link click |

### Cron Jobs

| Endpoint | Purpose |
|---|---|
| `/api/cron/weekly-affiliate-digest` | Weekly summary email |
| `/api/cron/weekly-performance` | Weekly performance stats |
| `/api/cron/monthly-earnings` | Monthly earnings statement |
| `/api/cron/weekly-coach` | Weekly AI coaching email |
| `/api/cron/whats-new` | Feature update digest |

---

## Admin Management

The admin affiliate management page at `/admin/setup/affiliate` contains 15+ tabs:

- **Settings** — Commission rate, cookie window, min payout, attribution conflict policy, dormancy threshold
- **Tiers** — CRUD for performance tiers with names, thresholds, rates, perks
- **Milestones** — CRUD for milestone bonuses
- **Assets** — Marketing material management
- **Management** — Affiliate list with health scores, fraud flags, CRM cards
- **Applications** — Pending/approved/rejected application review
- **Networks** — External network configurations
- **Broadcasts** — Compose, send, and track email campaigns
- **Contests** — Create and manage time-bound competitions
- **Leaderboard Config** — Privacy and display settings
- **Badges** — Configure earning badge tiers
- **Testimonials** — Manage affiliate success stories
- **Payout Batches** — Scheduled batch management
- **Tax Info** — Review submitted tax forms, 1099 export
- **Messages** — View and respond to affiliate conversations
- **Program Health** — Dashboard-style overview of program metrics and ROI

---

## Testing Checklist

- [ ] Visitor can view the `/affiliate` landing page with live commission rates
- [ ] Visitor can submit an application at `/affiliate/join`
- [ ] Duplicate email applications are rejected
- [ ] Admin can approve/reject applications in the admin panel
- [ ] Approved affiliate can log in at `/affiliate/login`
- [ ] Dashboard shows referral link, stats, tier progress
- [ ] Referral link click sets `pp_ref` cookie and increments click count
- [ ] New signup with referral cookie creates `affiliate_referrals` record
- [ ] Fraud flags are set when appropriate (same domain, IP volume, self-referral)
- [ ] Stripe payment creates commission with correct rate
- [ ] Commission rate uses higher of locked rate vs tier rate
- [ ] Milestone bonuses auto-award at thresholds
- [ ] Leaderboard shows rankings with correct privacy mode
- [ ] Contests display with countdown timers and standings
- [ ] Deep links generate correctly with UTM parameters
- [ ] Discount codes sync with Stripe and apply at checkout
- [ ] Dual-attribution works (cookie vs code)
- [ ] AI tools generate personalized content using real affiliate data
- [ ] In-app messaging works between admin and affiliate
- [ ] Broadcasts send to correct audience segments
- [ ] Payout batch processing works with receipt emails
- [ ] Tax forms can be submitted and verified
- [ ] Partner directory shows opt-in affiliates
- [ ] Co-branded landing pages render correctly
- [ ] Badges verify at `/partner/verify/[code]`
- [ ] Webhook notifications deliver with HMAC signatures
