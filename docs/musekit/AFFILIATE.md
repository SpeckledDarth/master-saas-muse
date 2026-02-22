# Affiliate System — Complete Guide

This document explains the entire Affiliate System built into MuseKit. It covers what it is, how it works, the architecture, every route, every database table, and how all the pieces connect. Written for someone reading about this for the first time.

---

## Table of Contents

1. [What Is the Affiliate System?](#what-is-the-affiliate-system)
2. [Key Architecture Decision: Separation from Product Users](#key-architecture-decision-separation-from-product-users)
3. [Sitemap — All Affiliate Routes](#sitemap--all-affiliate-routes)
4. [How It Works — End to End](#how-it-works--end-to-end)
5. [Feature Breakdown](#feature-breakdown)
   - [Public Landing Page](#1-public-landing-page)
   - [Application Form](#2-application-form)
   - [Admin Application Review](#3-admin-application-review)
   - [Affiliate Login](#4-affiliate-login)
   - [Affiliate Dashboard](#5-affiliate-dashboard)
   - [Referral Link & Cookie Tracking](#6-referral-link--cookie-tracking)
   - [Signup Attribution](#7-signup-attribution)
   - [Commission Tracking (Stripe)](#8-commission-tracking-stripe)
   - [Performance Tiers](#9-performance-tiers)
   - [Grandfathering / Rate Lock-In](#10-grandfathering--rate-lock-in)
   - [Fraud Detection](#11-fraud-detection)
   - [Payouts](#12-payouts)
   - [Marketing Assets](#13-marketing-assets)
   - [Email Drip Sequence](#14-email-drip-sequence)
   - [Notifications](#15-notifications)
   - [External Network Integrations](#16-external-network-integrations)
6. [Database Schema](#database-schema)
7. [API Endpoints](#api-endpoints)
8. [Key Files](#key-files)
9. [Admin Management](#admin-management)
10. [Glossary](#glossary)
11. [Testing Checklist](#testing-checklist)
12. [FAQ](#faq)

---

## What Is the Affiliate System?

The Affiliate System lets you run a partner/referral program for your SaaS product. People (affiliates) sign up, get a unique referral link, and earn a percentage of every subscription payment made by someone they referred. It's a marketing channel where you only pay when you make money.

**What's included:**
- A public-facing affiliate program page anyone can find
- An application form so anyone can apply (no account needed)
- An admin review workflow to approve or reject applicants
- A standalone affiliate dashboard where affiliates track clicks, signups, earnings, and payouts
- Cookie-based referral tracking (30-day window by default)
- Automatic commission calculation when referred users pay via Stripe
- Performance tiers that unlock higher commission rates
- Rate lock-in (grandfathering) so affiliates keep their terms even if you change the program later
- Fraud detection (same email domain, suspicious IP volume, self-referral)
- Payout management (pending → approved → paid)
- A library of marketing assets (banners, email templates, social posts)
- A 3-email onboarding drip sequence for new affiliates
- External affiliate network support (ShareASale, Impact, PartnerStack)

---

## Key Architecture Decision: Separation from Product Users

**Affiliates and product users are completely separate.** This is a deliberate design choice.

| | Product Users | Affiliates |
|---|---|---|
| **Login URL** | `/login` | `/affiliate/login` |
| **Dashboard** | `/dashboard` (with sidebar) | `/affiliate/dashboard` (standalone, no sidebar) |
| **Purpose** | Use the product | Promote the product and earn commissions |
| **Account creation** | Self-service signup | Admin-approved application |
| **Navigation** | Full product sidebar | Minimal header with logout |

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

## Sitemap — All Affiliate Routes

### Public Pages (no login required)

| Route | Purpose |
|---|---|
| `/affiliate` | Landing page — program overview, commission rates, benefits, "How It Works", audience types, CTAs |
| `/affiliate/join` | Application form — name, email, website, promotion methods (multi-select), message |
| `/affiliate/login` | Affiliate-only login — magic link or password |
| `/affiliate/test-links` | **Temporary** — developer quick-links page for testing (remove before launch) |

### Affiliate Dashboard (requires affiliate login)

| Route | Purpose |
|---|---|
| `/affiliate/dashboard` | Standalone dashboard — referral link, stats, earnings, payouts, tier progress, marketing assets |

### Admin Pages (requires admin login)

| Route | Purpose |
|---|---|
| `/admin/setup/affiliate` | Full affiliate management — tabs for Settings, Tiers, Assets, Management, Applications, Networks |

### Product-Side References

| Route | Purpose |
|---|---|
| `/dashboard/social/affiliate` | Legacy in-app affiliate page for product users who activated the affiliate program from within the product (before the open program existed) |
| Footer → "Affiliate Program" | Link in the website footer pointing to `/affiliate` |
| Sidebar → Earn → Affiliate | Link in the product sidebar pointing to `/affiliate` |

---

## How It Works — End to End

Here's the complete lifecycle, from a stranger finding your affiliate program to getting paid:

### Step 1: Discovery
A blogger, influencer, or anyone visits `/affiliate` and reads about the program — commission rates, cookie window, benefits, and who can join.

### Step 2: Application
They click "Apply Now" and fill out the form at `/affiliate/join`. They provide their name, email, website/channel URL, how they plan to promote, and an optional message. No account is needed.

### Step 3: Admin Review
The application appears in the admin dashboard at `/admin/setup/affiliate` under the "Applications" tab with a "pending" status. An admin reviews it and clicks "Approve" or "Reject."

### Step 4: Account Provisioning (on approval)
When an admin approves an application, the system automatically:
1. Creates a Supabase user account with the applicant's email (or finds an existing one if the email is already registered)
2. Generates a unique referral code (random hex string)
3. Creates a referral link record with `affiliate_role = 'affiliate'`
4. Assigns the `affiliate` role in the `user_roles` table
5. Sends an in-app notification welcoming them

Note: Commission rate lock-in (grandfathering) happens separately when the affiliate first activates through the dashboard via `/api/affiliate/activate`. At that point, the current program commission rate and duration are saved to their referral link record.

### Step 5: Affiliate Login
The approved affiliate receives a login link (magic link via email) or can set a password. They log in at `/affiliate/login` and are taken to `/affiliate/dashboard`.

### Step 6: Sharing
From the dashboard, the affiliate copies their unique referral link (e.g., `https://yourapp.com/?ref=a1b2c3d4e5f6`) and shares it with their audience — in blog posts, YouTube descriptions, newsletters, social media, etc.

### Step 7: Cookie Tracking
When someone clicks the referral link, the `ReferralTracker` component on your marketing pages:
1. Reads the `?ref=CODE` parameter from the URL
2. Sets a `pp_ref` cookie that lasts 30 days (configurable)
3. Stores the code in `localStorage` as a backup
4. Sends a click-tracking request to the API (increments the link's click count)

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
4. If found, calculates the commission: invoice amount × affiliate's commission rate
5. Creates a record in `affiliate_commissions` with status `pending`
6. Updates the affiliate's running totals on their referral link
7. Sends a notification to the affiliate: "You earned $X.XX commission!"

### Step 10: Payout
When the affiliate's balance reaches the minimum payout threshold ($50 by default):
1. Admin creates a payout record with status `pending`
2. Admin processes the payment (manually via PayPal, bank transfer, etc.)
3. Admin marks the payout as `paid`
4. The affiliate sees the payout in their dashboard history

---

## Feature Breakdown

### 1. Public Landing Page
**Route:** `/affiliate`

The public-facing marketing page for the affiliate program. Pulls live data from the program settings API so commission rates and durations always reflect current configuration.

**Sections:**
- Hero with headline ("Earn X% Recurring Commissions") and CTAs
- "How It Works" — 3-step cards (Apply → Share → Earn)
- "Why Partner With Us" — 6 benefit cards (recurring commissions, 30-day cookie, real-time dashboard, marketing materials, locked-in rates, performance tiers)
- "Who Can Be an Affiliate?" — audience types (bloggers, YouTubers, newsletter writers, podcasters, influencers, experts, course creators, freelancers, community leaders)
- Bottom CTA — "Ready to Start Earning?"

### 2. Application Form
**Route:** `/affiliate/join`

A simple form anyone can fill out — no account required.

**Fields:**
- Full Name (required)
- Email Address (required)
- Website / Channel URL (optional)
- Promotion Methods (required, multi-select checkboxes — select all that apply): Blog/Website, YouTube, Social Media, Newsletter, Podcast, Online Course/Community, Consulting/Freelance, Other. Stored as comma-separated string.
- Additional Message (optional)

**Behavior:**
- Checks for duplicate applications by email. If a pending or approved application exists, shows an error instead of creating a duplicate.
- On success, shows a confirmation screen: "We'll review your application and get back to you within 24-48 hours."

### 3. Admin Application Review
**Route:** `/admin/setup/affiliate` → Applications tab

Admins see a table of all applications with status badges (pending/approved/rejected), applicant details, and action buttons.

**Approve flow:**
1. Tries to create a new Supabase user with the applicant's email
2. If the email is already registered, finds the existing user instead
3. Generates a unique referral code
4. Creates the referral link and assigns the affiliate role
5. Only marks the application as "approved" after all provisioning succeeds
6. If any step fails, the application stays "pending" so the admin can retry

**Reject flow:**
- Simply marks the application as "rejected" with optional reviewer notes

### 4. Affiliate Login
**Route:** `/affiliate/login`

A standalone login page completely separate from the product login (`/login`).

**Two modes:**
- **Magic Link (default):** Enter email, receive a one-time login link via email, click it to access the dashboard. The redirect URL is set to `/affiliate/dashboard`.
- **Password:** Enter email and password for direct login. Redirects to `/affiliate/dashboard` on success.

**Links:**
- "Use password instead" / "Use magic link instead" to toggle between modes
- "Not an affiliate yet? Apply here" links to `/affiliate/join`
- Back arrow links to `/affiliate`

### 5. Affiliate Dashboard
**Route:** `/affiliate/dashboard`

A standalone page with its own minimal header (app name + email + logout). No product sidebar, no product header/footer. This is the affiliate's home base.

**Sections:**
- **Referral Link Card** — displays the full URL with copy button, shows locked-in terms badge
- **Stats Grid** — 4 cards: Link Clicks, Signups (with conversion rate), Pending Earnings, Total Earned
- **Tier Progress** — current tier name, commission rate, progress bar toward next tier
- **Tabbed Content:**
  - **Referrals** — list of all referred signups with status (signed_up, converted, churned) and date
  - **Earnings** — list of all commissions with amount, rate, status (pending, approved, paid), and breakdown (pending/approved/paid totals + minimum payout threshold)
  - **Payouts** — list of all payouts with amount, method, status, and date
  - **Marketing** — grid of available marketing assets (banners, email templates, social posts, text snippets) with copy/download buttons

**Auth check:** On load, checks Supabase auth. If not logged in, redirects to `/affiliate/login`. If logged in but not an affiliate (`is_affiliate` is false), shows a "Not an Affiliate Yet" card with an apply button.

### 6. Referral Link & Cookie Tracking
**Component:** `src/components/referral-tracker.tsx`

A client-side component placed on marketing pages. When a visitor arrives with `?ref=CODE` in the URL:

1. Fetches the cookie duration from program settings (default: 30 days)
2. Sets a `pp_ref` cookie with the referral code, lasting the configured number of days
3. Stores the code in `localStorage` as `ref_code` (backup)
4. Sends a POST to `/api/referral` to increment the click count (deduplicated per session via `sessionStorage`)

The cookie uses last-touch attribution — if a visitor clicks a different affiliate's link later, the cookie is overwritten with the new affiliate's code. However, click tracking is deduplicated per session (via `sessionStorage`), so the same referral code won't be tracked multiple times in a single browsing session.

### 7. Signup Attribution
**API:** `POST /api/affiliate/track-signup`

Called by the signup page after a new user creates their account:
1. Reads the referral code from the `pp_ref` cookie
2. Looks up the referral link to find the affiliate
3. Creates an `affiliate_referrals` record linking the affiliate to the new user
4. Runs fraud detection checks
5. Increments the affiliate's signup count
6. Sends a notification to the affiliate

### 8. Commission Tracking (Stripe)
**Webhook:** `POST /api/stripe/webhook` → `invoice.paid` event

When Stripe reports a successful payment:
1. Finds the Supabase user tied to the Stripe customer
2. Checks `affiliate_referrals` for a record where this user was referred
3. If the referral exists and is within the commission window:
   - Gets the affiliate's effective commission rate (considers tier and locked rate)
   - Calculates: `commission = invoice_amount × rate / 100`
   - Creates an `affiliate_commissions` record (status: `pending`)
   - Updates the affiliate's `total_earnings_cents` and `pending_earnings_cents`
   - Sends a notification
4. Deduplication: A unique index on `stripe_invoice_id` prevents double-counting

### 9. Performance Tiers
**Tables:** `affiliate_tiers`

Tiers reward high-performing affiliates with higher commission rates. Default tiers:

| Tier | Minimum Referrals | Commission Rate |
|---|---|---|
| Bronze | 0 | 20% |
| Silver | 25 | 25% |
| Gold | 100 | 30% |

Tiers are fully configurable by the admin (name, threshold, rate). The system always uses the best rate available to the affiliate — either their locked-in rate or their tier rate, whichever is higher.

### 10. Grandfathering / Rate Lock-In
When an affiliate explicitly activates via the `/api/affiliate/activate` endpoint (typically triggered from the dashboard), the current program terms are "locked in" on their referral link record:
- `locked_commission_rate` — the program's commission rate at the time of activation
- `locked_duration_months` — how long commissions last per referral
- `locked_at` — timestamp of when terms were locked

If you later lower the default commission rate from 20% to 15%, activated affiliates keep their original 20%. The system uses whichever is higher — the locked-in rate or the affiliate's current tier rate. If an affiliate has no locked rate and no applicable tier, the system falls back to a hardcoded default of 20%.

**Important:** Lock-in happens on activation, not on approval. An approved affiliate who hasn't yet activated does not have locked terms.

### 11. Fraud Detection
**Function:** `checkFraudFlags()` in `src/lib/affiliate/index.ts`

Runs automatically when a new referral is attributed. Checks for:

| Flag | What It Detects |
|---|---|
| `same_email_domain` | The affiliate and the referred user share the same email domain (e.g., both use @company.com) |
| `suspicious_ip_volume` | More than 3 signups from the same IP hash within 1 hour, all attributed to the same affiliate |
| `self_referral` | The affiliate referred themselves (same user ID) |

Fraud flags are stored as a JSON array on each `affiliate_referrals` record. They don't automatically block commissions — they're informational flags that admins can review.

### 12. Payouts
**Table:** `affiliate_payouts`

Payout lifecycle:
1. **Pending** — admin creates a payout batch for an affiliate whose balance exceeds the minimum threshold
2. **Approved** — admin confirms the payout amount
3. **Paid** — admin marks it as paid after sending the payment (via PayPal, bank transfer, etc.)

Default minimum payout: $50.00 (5000 cents). Configurable in admin settings.

### 13. Marketing Assets
**Table:** `affiliate_assets`

A library of ready-to-use promotional materials that affiliates can copy or download from their dashboard.

**Asset types:**
- `banner` — image banners for websites/blogs
- `email_template` — pre-written email copy
- `social_post` — ready-to-share social media posts
- `text_snippet` — text blurbs, testimonials, or talking points

Admins create and manage assets from the admin panel. Each asset can have text content (copyable), a file URL (downloadable), or both.

### 14. Email Drip Sequence
**API:** `POST /api/affiliate/drip`

A 3-email onboarding sequence sent to new affiliates via Resend. The endpoint is called with a `userId` and an internal secret. It checks which emails have already been sent (via the `email_drip_log` table) and sends the next one if the delay has elapsed:

1. **Welcome email** (step 1, sent immediately) — "You're In!" with referral link and dashboard link
2. **Tips email** (step 2, sent 24 hours after step 1) — "How top affiliates earn the most" with promotion tactics
3. **Strategy email** (step 3, sent 72 hours after step 1) — "Your first-week affiliate strategy" with the story formula

The drip endpoint is designed to be called by a cron job or queue worker. Each call checks timing and deduplication, so it's safe to call repeatedly — it won't double-send.

### 15. Notifications
In-app notifications are created at key events:
- Application approved → "Welcome to the Affiliate Program!"
- New referral signup → "New signup from your referral!"
- Commission earned → "You earned $X.XX commission!"
- Payout processed → "Your payout of $X.XX has been processed!"

Notifications appear in the affiliate dashboard and in the bell icon notification system.

### 16. External Network Integrations
**Table:** `affiliate_network_settings`

Support for three external affiliate platforms:

| Network | Purpose |
|---|---|
| **ShareASale** | Large affiliate marketplace |
| **Impact** | Enterprise partnership platform |
| **PartnerStack** | B2B SaaS-focused affiliate network |

Each network can be toggled on/off and configured with:
- **Tracking ID** — your merchant/advertiser ID on the platform
- **Postback URL** — the URL to ping when a conversion happens (server-side postback)
- **API Key** — for advanced integrations

When a Stripe conversion happens, the system can fire server-side postback requests to these networks so they track the sale on their end too. This lets you recruit affiliates through these established marketplaces in addition to your own program.

---

## Database Schema

### Core Tables (Migration 005)

| Table | Purpose |
|---|---|
| `affiliate_program_settings` | Single-row global config: commission rate, duration, min payout, cookie days, active flag |
| `affiliate_tiers` | Performance tiers: name, minimum referrals, commission rate, sort order |
| `affiliate_referrals` | Each referred signup: affiliate ID, referred user ID, ref code, IP hash, status, fraud flags |
| `affiliate_commissions` | Each commission event: affiliate ID, referral ID, Stripe invoice ID, amounts, rate, status |
| `affiliate_payouts` | Payout batches: affiliate ID, amount, method, status, processing info |
| `affiliate_assets` | Marketing materials: title, type, content/file URL, active flag |

### Referral Links Upgrades (Migrations 005 + 006)

Added columns to the existing `referral_links` table:
- `is_affiliate` (boolean) — whether this link is an active affiliate link
- `locked_commission_rate` — grandfathered rate
- `locked_duration_months` — grandfathered commission window
- `locked_at` — when terms were locked
- `current_tier_id` — FK to affiliate_tiers
- `total_earnings_cents`, `paid_earnings_cents`, `pending_earnings_cents` — running totals
- `affiliate_role` — 'user' or 'affiliate' (distinguishes product-user affiliates from open-program affiliates)

### Open Program Tables (Migration 006)

| Table | Purpose |
|---|---|
| `affiliate_applications` | Applications from the public form: name, email, website, method, status, reviewer info |
| `affiliate_network_settings` | External network configs: name, slug, active flag, tracking ID, postback URL, API key |

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
| GET | `/api/affiliate/settings` | Get program settings (commission rate, cookie days, etc.) |
| POST | `/api/affiliate/applications` | Submit a new affiliate application |

### Affiliate Auth Required
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/affiliate/dashboard` | Get full dashboard data (stats, referrals, commissions, payouts, tier) |
| GET | `/api/affiliate/assets` | Get marketing assets library |
| POST | `/api/affiliate/activate` | Activate affiliate status and lock in terms |
| GET | `/api/affiliate/referrals` | Get referral history |
| GET | `/api/affiliate/payouts` | Get payout history |

### Admin Only
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/affiliate/applications` | List all applications (with status filter) |
| POST | `/api/affiliate/applications/review` | Approve or reject an application |
| GET | `/api/affiliate/networks` | Get network integration settings |
| PUT | `/api/affiliate/networks` | Update a network's config |
| PUT | `/api/affiliate/settings` | Update program settings |
| GET/POST/PUT/DELETE | `/api/affiliate/tiers` | CRUD for performance tiers |
| GET/POST/DELETE | `/api/affiliate/assets` | CRUD for marketing assets |

### Internal (called by other system components)
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/affiliate/track-signup` | Record a referred signup (called from signup page) |
| POST | `/api/affiliate/drip` | Trigger drip email sequence |
| POST | `/api/referral` | Track a referral link click |

### Stripe Webhook
| Event | Handler |
|---|---|
| `invoice.paid` | Looks up referral, calculates commission, creates commission record |

---

## Key Files

| File | Purpose |
|---|---|
| `src/lib/affiliate/index.ts` | Core library — settings fetcher, tier logic, rate calculator, fraud detection, notifications |
| `src/components/referral-tracker.tsx` | Client component — reads `?ref=` param, sets cookie, tracks click |
| `src/app/affiliate/page.tsx` | Public landing page |
| `src/app/affiliate/join/page.tsx` | Application form |
| `src/app/affiliate/login/page.tsx` | Affiliate login (magic link + password) |
| `src/app/affiliate/dashboard/page.tsx` | Standalone affiliate dashboard |
| `src/app/admin/setup/affiliate/page.tsx` | Admin management (settings, tiers, assets, applications, networks) |
| `src/app/api/affiliate/` | All affiliate API routes |
| `src/app/api/stripe/webhook/route.ts` | Stripe webhook with commission handler |
| `migrations/core/005_affiliate_system.sql` | Core tables migration |
| `migrations/core/006_affiliate_applications.sql` | Open program tables migration |

---

## Admin Management

The admin affiliate page (`/admin/setup/affiliate`) has 6 tabs:

### Settings Tab
- Commission rate (percentage)
- Commission duration (months)
- Minimum payout threshold (dollars)
- Cookie duration (days)
- Program active toggle

### Tiers Tab
- Create, edit, delete performance tiers
- Each tier: name, minimum referrals, commission rate

### Assets Tab
- Create and manage marketing materials
- Each asset: title, description, type, content or file URL

### Management Tab
- Affiliate rankings (top performers)
- Fraud alerts (referrals with fraud flags)
- Payout management (approve/reject/mark paid)

### Applications Tab
- Table of all applications with status filter
- Approve or reject pending applications
- Approval auto-provisions the affiliate account

### Networks Tab
- Toggle external networks on/off
- Configure tracking IDs and postback URLs for ShareASale, Impact, PartnerStack

---

## Glossary

| Term | Definition |
|---|---|
| **Affiliate** | A person who promotes your product in exchange for commissions on referred sales |
| **Referral Code** | A unique string (e.g., `a1b2c3d4e5f6`) assigned to each affiliate, appended to URLs as `?ref=CODE` |
| **Referral Link** | The full URL an affiliate shares: `https://yourapp.com/?ref=CODE` |
| **Cookie Window** | How long the referral tracking cookie lasts (default: 30 days). If a visitor clicks an affiliate's link and signs up within this window, the affiliate gets credit. |
| **Commission** | The percentage of a payment that goes to the affiliate. Calculated as `invoice_amount × rate / 100`. |
| **Commission Window** | How long an affiliate earns commissions on a referred customer's payments (default: 12 months from the affiliate's activation date) |
| **Grandfathering / Rate Lock-In** | When an affiliate activates, the current program terms are saved on their account. Even if rates change later, they keep their original deal (or better, if tiers push them higher). |
| **Performance Tier** | A level in the tier system (Bronze, Silver, Gold) that unlocks higher commission rates as affiliates refer more customers |
| **Payout** | A payment made to an affiliate for their accumulated approved commissions |
| **Minimum Payout** | The minimum balance an affiliate must accumulate before a payout is processed (default: $50) |
| **Fraud Flag** | An automated warning on a referral indicating possible gaming (same domain, IP flooding, self-referral) |
| **Magic Link** | A one-time login link sent via email — no password needed |
| **Postback URL** | A server-to-server URL called when a conversion happens, used for external affiliate network tracking |
| **Attribution** | The process of connecting a signup/payment to the affiliate who referred that person |
| **Last-Touch Attribution** | The most recent affiliate link clicked gets credit. If a visitor clicks affiliate A's link and then affiliate B's link, affiliate B gets the referral. |

---

## Testing Checklist

Use this step-by-step walkthrough to verify the entire affiliate system works correctly.

### 1. Landing Page
- [ ] Visit `/affiliate` — page loads with commission rate, benefits, "How It Works"
- [ ] Commission rate displayed matches the value in admin settings
- [ ] "Apply Now" button links to `/affiliate/join`
- [ ] "Affiliate Login" button links to `/affiliate/login`
- [ ] Page is responsive on mobile

### 2. Application Flow
- [ ] Visit `/affiliate/join` — form loads with all fields
- [ ] Submit with valid data → see success confirmation
- [ ] Submit same email again → see "application already exists" error
- [ ] Submit with missing required fields → form validation prevents submission

### 3. Admin Review
- [ ] Log in as admin, go to `/admin/setup/affiliate` → "Applications" tab
- [ ] Pending application appears in the list
- [ ] Click "Approve" → application status changes to "approved"
- [ ] Verify a new user was created in Supabase Auth with the applicant's email
- [ ] Verify a referral link was created for that user
- [ ] Verify the `user_roles` table has an "affiliate" role entry
- [ ] Submit another application, click "Reject" → status changes to "rejected"

### 4. Affiliate Login
- [ ] Visit `/affiliate/login` → login page loads (NOT the product login)
- [ ] Enter the approved affiliate's email, click "Send Login Link" → "Check Your Email" screen
- [ ] Click the magic link from email → redirected to `/affiliate/dashboard`
- [ ] Log out, switch to password mode, enter credentials → redirected to dashboard
- [ ] Try logging in with a non-affiliate email → dashboard shows "Not an Affiliate Yet"

### 5. Affiliate Dashboard
- [ ] Dashboard loads with own header (no product sidebar)
- [ ] Referral link is displayed and copyable
- [ ] Stats show 0 clicks, 0 signups, $0 earnings (for new affiliates)
- [ ] Tier progress card shows current tier (Bronze)
- [ ] Referrals tab shows empty state
- [ ] Earnings tab shows empty state with payout threshold
- [ ] Payouts tab shows empty state
- [ ] Marketing tab shows available assets (or empty state if none created)

### 6. Referral Tracking
- [ ] Copy the affiliate's referral link from the dashboard
- [ ] Visit the link (e.g., `https://yourapp.com/?ref=abc123`) in an incognito window
- [ ] Check browser cookies for `pp_ref=abc123`
- [ ] Check `localStorage` for `ref_code=abc123`
- [ ] Refresh the affiliate dashboard → click count should increment

### 7. Signup Attribution
- [ ] In the incognito window (with the cookie set), sign up as a new product user
- [ ] Refresh the affiliate dashboard → signup count should increment
- [ ] Check the Referrals tab → a new entry with status "signed_up"

### 8. Commission (requires Stripe test mode)
- [ ] As the referred user, subscribe to a paid plan using a Stripe test card
- [ ] Verify the Stripe webhook fires and processes the `invoice.paid` event
- [ ] Refresh the affiliate dashboard → pending earnings should show the commission
- [ ] Check the Earnings tab → a new commission entry

### 9. Admin Settings
- [ ] Go to admin → Settings tab → change commission rate → save → verify landing page updates
- [ ] Go to Tiers tab → create a new tier → verify it appears in dashboard tier progress
- [ ] Go to Assets tab → create a marketing asset → verify it appears in affiliate dashboard
- [ ] Go to Networks tab → toggle ShareASale on, add a tracking ID → save

### 10. Navigation & Layout
- [ ] Product sidebar → "Earn > Affiliate" links to `/affiliate` (not the old in-app dashboard)
- [ ] Footer → "Affiliate Program" link points to `/affiliate`
- [ ] On affiliate dashboard pages, the product header and footer are hidden
- [ ] Affiliate dashboard has its own minimal header with app name and logout

---

## FAQ

**Q: Can someone be both a product user and an affiliate?**
Yes. If an existing product user applies through `/affiliate/join`, the approval process will find their existing Supabase account (instead of creating a new one) and add the affiliate role. They'll use the product login as usual AND can access `/affiliate/dashboard` with that same account.

**Q: What happens if I change the commission rate after affiliates have joined?**
Affiliates who have activated keep their locked-in rate. New affiliates (or those who haven't activated yet) get the new rate. The system always uses the best rate for the affiliate — whichever is higher between their locked rate and their current tier rate. If an affiliate has neither, a hardcoded default of 20% applies.

**Q: What happens if a referred customer cancels their subscription?**
Commissions are only generated on `invoice.paid` events. If the customer cancels, no more invoices are generated, so no more commissions. Already-earned commissions are not clawed back by default.

**Q: How long do commissions last?**
By default, 12 months from when the affiliate activated. This means if an affiliate refers someone in January 2026, they earn commissions on that customer's payments through January 2027. After that, payments from that customer no longer generate commissions. This is configurable in admin settings.

**Q: Can affiliates see who they referred?**
They can see referral counts, statuses (signed up, converted, churned), and dates — but not the referred user's name or email. This protects customer privacy.

**Q: How do payouts work?**
Payouts are currently manual. When an affiliate's balance exceeds the minimum threshold ($50 default), the admin creates a payout, processes the payment externally (PayPal, bank transfer, etc.), and marks it as paid. Automated payout integration (e.g., PayPal Mass Pay, Stripe Connect) can be added later.

**Q: What are the external networks (ShareASale, Impact, PartnerStack) for?**
These are established affiliate marketplaces where thousands of affiliates look for products to promote. By integrating with these networks, you can recruit affiliates from their existing pools. The integration uses server-side postback URLs — when a Stripe conversion happens, the system pings the network's postback URL so the sale is tracked on their platform too.

**Q: What if an affiliate tries to game the system?**
The fraud detection system automatically flags suspicious referrals (same email domain, high IP volume, self-referral). Flags are visible to admins in the Management tab. Flagged referrals still generate commissions by default — it's up to the admin to review and take action (reject the commission, disable the affiliate, etc.).

**Q: Is the affiliate system part of MuseKit or specific to one product?**
It's part of MuseKit core. Every product built on MuseKit gets the full affiliate system. The migrations live in `migrations/core/`, the library in `src/lib/affiliate/`, and the pages in `src/app/affiliate/`. Each product deployment has its own independent affiliate program with its own settings, tiers, and affiliates.
