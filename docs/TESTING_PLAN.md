# PassivePost — QA Testing Plan

> **Purpose:** This document is the testing reference for QA on the PassivePost platform. It covers all built features organized by user type so you can test each perspective end-to-end.
>
> **How to use this document:**
> - Work through each section relevant to the role you're testing
> - For each test, mark: **PASS**, **FAIL** (note what happened), or **PARTIAL** (mostly works but has an issue)
> - Open browser console (F12) to check for JavaScript errors during testing
> - Test on both desktop and mobile viewports where noted
> - Test on the **Vercel deployment** (not Replit preview)

---

## Table of Contents

0. [Setup & Test Accounts](#0-setup--test-accounts)
1. [Admin Dashboard (CEO Level)](#1-admin-dashboard-ceo-level)
2. [Admin Team Member](#2-admin-team-member)
3. [Affiliate Dashboard](#3-affiliate-dashboard)
4. [Paid User Dashboard (PassivePost)](#4-paid-user-dashboard-passivepost)
5. [Public Pages](#5-public-pages)
6. [Cross-Cutting Features](#6-cross-cutting-features)

---

## 0. Setup & Test Accounts

### Prerequisites

Before testing, ensure these SQL scripts have been run in the **Supabase SQL Editor**:

1. `migrations/supabase/sync_013_016_plus_missing.sql` — Creates all missing tables
2. `migrations/seed/comprehensive-seed-data.sql` — Seeds test content (contests, knowledge base, assets, etc.)
3. Sprint 2 CRM tables (if not already run):
```sql
CREATE TABLE IF NOT EXISTS user_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  color TEXT DEFAULT 'gray',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tag)
);
CREATE TABLE IF NOT EXISTS entity_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Test Accounts Needed

| Role | How to Get It | What You'll Test |
|------|---------------|------------------|
| **Admin** | Your main account with `admin` role in `user_roles` table | Full admin dashboard, CRM, revenue, settings |
| **Admin Team Member** | Create a second account, add to `organization_members` with role `manager` or `member` | Admin access with restricted permissions |
| **Affiliate** | Apply at `/affiliate/join`, then approve via admin dashboard. Or create directly in `affiliate_profiles` | Affiliate dashboard, earnings, marketing tools |
| **Paid User** | Create a regular account, subscribe via Stripe checkout | User dashboard, social features, billing |

### 0.1 Account Verification

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Admin account exists | Query `user_roles` for your admin user ID | Row with `role = 'admin'` exists | |
| Team member account exists | Query `organization_members` for second account | Row with appropriate role exists | |
| Affiliate account exists | Query `affiliate_profiles` for affiliate user | Row with affiliate data exists | |
| Regular user account exists | Log in with a non-admin, non-affiliate account | Reaches user dashboard without redirects to admin or affiliate | |

---

## 1. Admin Dashboard (CEO Level)

### 1.1 Admin Login & Navigation

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Admin can access dashboard | Log in as admin, navigate to `/admin` | Admin dashboard loads with sidebar navigation | |
| Sidebar shows all groups | Check sidebar for section groups | Groups visible: Dashboard, CRM, Revenue, Subscriptions, Metrics, Support, Content, Growth, Settings, System | |
| Sidebar badge counts | Check sidebar items with counts | Badge counts load (e.g., open tickets, pending items) | |
| Sidebar collapse mode | Click the collapse toggle on desktop | Sidebar shrinks to icon-only mode, expands on hover or click | |
| Mobile sidebar | Resize to phone width, tap hamburger menu | Sidebar opens as overlay, closes on selection or outside tap | |
| Breadcrumbs display | Navigate to any sub-page (e.g., `/admin/crm`) | Breadcrumb trail shows: Admin > CRM | |
| Breadcrumb navigation | Click a breadcrumb segment | Navigates to that level | |

### 1.2 Dashboard Home

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| KPI cards load | Go to `/admin` | 6 KPI cards: MRR, Active Subscribers, New Users, Open Tickets, Churn Rate, Failed Payments | |
| KPI cards are clickable | Click each KPI card | Each navigates to the relevant filtered list view | |
| Alerts section | Check alerts area below KPIs | Shows alerts only when count > 0 (renewals, failed payments, stale tickets, pending payouts, pending applications) | |
| Recent activity feed | Check activity timeline | Shows last 15 events with icons and timestamps | |
| Revenue sparkline | Check revenue chart | 7-day revenue trend chart displays | |
| Skeleton loading | Refresh the page and watch | Skeleton placeholders appear before data loads | |

### 1.3 Command Palette

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Open with keyboard | Press Cmd+K (Mac) or Ctrl+K (Windows) | Command palette dialog opens | |
| Search users | Type a user name or email | Matching users appear in results | |
| Search invoices | Type an invoice number or amount | Matching invoices appear | |
| Search subscriptions | Type a subscription-related term | Matching subscriptions appear | |
| Search tickets | Type a ticket subject | Matching tickets appear | |
| Navigate from result | Click a search result | Navigates to the detail page for that entity | |
| Recent searches | Open palette after previous searches | Recent searches shown | |
| Close palette | Press Escape or click outside | Palette closes | |

### 1.4 CRM — People List

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| CRM list loads | Go to `/admin/crm` | Table of users with: Avatar+Name, Email, Type badges, Plan, Revenue, Status, Last Active, Health Score, Tags | |
| Type badges correct | Check Type column | Shows correct badges: Subscriber, Affiliate, Team (can have multiple) | |
| Health scores display | Check Health Score column | Color-coded scores (green/yellow/red) based on activity | |
| Search by name | Type a name in search box | Table filters to matching results (debounced) | |
| Search by email | Type an email in search box | Table filters to matching results | |
| Filter by type | Use Type dropdown filter | Filters to selected type only | |
| Filter by status | Use Status dropdown filter | Filters by active/inactive | |
| Sort options | Change sort (newest, oldest, revenue, health, name) | Table reorders correctly | |
| Pagination | If more than 25 users, check pagination | "Showing 1-25 of X contacts" with page controls | |
| CSV export | Click export button | CSV file downloads with all filtered results | |
| Click to detail | Click any row | Navigates to `/admin/crm/[userId]` | |
| Empty state | Search for nonsense term | Empty state message shown | |

### 1.5 CRM — Detail Page

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Detail page loads | Click a user from CRM list | Full detail page with header, cards, and tabs | |
| Header info | Check page header | Back arrow, avatar, name, email, type badges, action buttons | |
| Action buttons | Check header actions | Impersonate, Email, View in Stripe buttons visible | |
| Summary cards | Check 5 cards below header | Total Revenue, Current Plan, Health Score, Member Since, Days Since Login | |
| Affiliate summary | View an affiliate's detail page | Extra card showing: referrals, commissions, tier, conversion rate, payouts | |
| Tag management | Add a tag with a color | Tag appears as colored badge on the user | |
| Remove tag | Click X on an existing tag | Tag removed | |
| Profile tab | Click Profile tab | Editable form with save button | |
| Transactions tab | Click Transactions tab | Unified table of invoices, payments, commissions, payouts (merged chronologically) | |
| Activity tab | Click Activity tab | Timeline component with color-coded events | |
| Support tab | Click Support tab | Ticket cards with status | |
| Notes tab | Click Notes tab | EntityNotes component — can add and delete notes | |
| Add a note | Type a note and save | Note appears with your name and timestamp | |
| Delete a note | Delete your own note | Note removed | |
| Contracts tab | Click Contracts tab | Contract cards with signing status | |

### 1.6 Revenue — List

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Revenue list loads | Go to `/admin/revenue` | Table of transactions with type badges | |
| Summary stats | Check stats above table | Total Revenue, Pending Commissions, Outstanding Payouts | |
| Filter by type | Use type filter (invoice, payment, commission, payout) | List filters correctly | |
| Filter by status | Use status filter | List filters correctly | |
| Filter by date | Use date range filter | List filters to date range | |
| Search | Type search term | Matching transactions shown | |
| Sort | Change sort order | Table reorders | |
| CSV export | Click export | CSV downloads | |
| Cross-link to CRM | Click a person name in the table | Navigates to their CRM detail page | |
| Click to detail | Click a transaction row | Navigates to revenue detail page | |

### 1.7 Revenue — Detail

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Invoice detail | Click an invoice | Shows customer, line items, payment status, amount, dates | |
| Payment detail | Click a payment | Shows payer, amount, method, linked invoice | |
| Commission detail | Click a commission | Shows affiliate, referral, amount, status, linked subscription | |
| Payout detail | Click a payout | Shows affiliate, amount, included commissions | |
| EntityNotes on invoice | Check notes section on an invoice detail | Can add/view notes | |
| Cross-links work | Click linked entities (customer → CRM, subscription → subscription detail) | Navigates correctly | |

### 1.8 Subscriptions — List

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Subscriptions list loads | Go to `/admin/subscriptions` | Table of subscriptions with status | |
| Summary stats | Check stats above table | Active Count, MRR, Churn Risk Count, Tier Breakdown | |
| Churn risk toggle | Toggle churn risk view | At-risk subscriptions highlighted | |
| Churn risk indicators | Check at-risk subscriptions | Visual indicators showing risk level | |
| Filter by status | Use status filter | Filters correctly | |
| Filter by tier | Use tier filter | Filters correctly | |
| Search | Type search term | Matching subscriptions shown | |
| CSV export | Click export | CSV downloads | |
| Cross-link to CRM | Click a subscriber name | Navigates to CRM detail page | |
| Click to detail | Click a subscription row | Navigates to subscription detail page | |

### 1.9 Subscriptions — Detail

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Detail loads | Click a subscription from list | Customer card, product info, status, dates | |
| Churn risk section | Check churn risk area | Risk indicators with explanations | |
| Invoice history | Check invoices section | Linked invoices with cross-links to revenue detail | |
| Stripe link | Click Stripe link | Opens Stripe dashboard (or shows link) | |
| EntityNotes | Check notes section | Can add/view notes | |

### 1.10 User Management

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| User list loads | Go to Admin > Users | Table of all users with name, email, role, status | |
| Search users | Type in search box | Table filters to matching results | |
| Assign user role | Change a user's role | Role updates and persists on reload | |
| Impersonate user | Click impersonate on any user | Platform switches to that user's view with impersonation indicator | |
| Exit impersonation | Click exit impersonation button | Returns to admin view | |

### 1.11 Affiliate Program — Health Tab

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Health tab loads by default | Go to `/admin/setup/affiliate` | Health tab shows as default view | |
| KPI cards | Check overview cards | Shows: Active Affiliates, Dormant, Net ROI, Conversion Rate | |
| Revenue impact | Check revenue breakdown | Total Revenue, Commissions Paid, Commissions Pending, Net ROI | |
| Growth metrics | Check growth section | New Affiliates, Referrals, Conversions this month | |
| Top performers | Check top performers card | Lists top affiliates by earnings | |
| Alerts | Check alerts area | Flagged referral count and pending payout amount | |

### 1.12 Affiliate Program — Applications Tab

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Applications list | Click "Applications" tab | Shows applications with pending count badge | |
| Filter by status | Try All, Pending, Approved, Rejected | List filters correctly | |
| Approve application | Click approve on pending | Status changes, affiliate account created | |
| Reject application | Click reject, add notes | Status changes, notes saved | |
| Delete application | Delete a rejected application | Removed from list | |

### 1.13 Affiliate Program — Settings Tab

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Settings load | Click "Settings" tab | Commission rate, cookie days, and other settings displayed | |
| Edit and save | Change a setting value, save | Saves successfully, persists on reload | |
| Re-engagement settings | Check re-engagement section | Dormancy threshold, max emails, enable toggle | |
| Auto-batch settings | Check auto-batch section | Payout schedule day and auto-approve threshold | |

### 1.14 Affiliate Program — Tiers Tab

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Tiers load sorted | Click "Tiers" tab | Tiers shown sorted by referral threshold | |
| Tier details | Check each tier card | Name, referral threshold, commission rate, perks | |
| Perks as badges | Check tiers with perks | Perks shown as badges | |
| Edit tier | Click edit, change value, save | Updates immediately | |
| Create tier | Add new tier | Appears in sorted position | |
| Delete tier | Delete a tier | Removed from list | |

### 1.15 Affiliate Program — Milestones Tab

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Milestones load | Click "Milestones" tab | All milestones with details | |
| Milestone details | Check each | Name, referral threshold, bonus amount, description | |
| Earned count | Check below each milestone | "X affiliates earned" displayed | |
| CRUD operations | Create, edit, delete | All succeed without errors | |

### 1.16 Affiliate Program — Marketing Assets Tab

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Assets load | Click "Assets" tab | All assets with type labels | |
| Asset types | Check labels | Each shows its type (Banner, Email Template, Social Post, etc.) | |
| View content | Click to expand | Content displays without broken formatting | |
| CRUD operations | Create, edit, delete | All succeed | |

### 1.17 Affiliate Program — Broadcasts Tab

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Broadcasts load | Click "Broadcasts" tab | Shows broadcasts with sent/draft status | |
| Sent broadcast stats | Check a sent broadcast | Sent, opened, clicked counts and date | |
| Draft actions | Check a draft | Edit, Send, Delete buttons visible | |
| Create broadcast | Click New, fill in name and body | Draft created | |
| Load from template | Use "Load from Template" dropdown | Subject and body auto-fill | |
| Edit draft | Edit and save | Changes saved | |
| Send broadcast | Send a draft, confirm | Status changes to sent | |
| Delete broadcast | Delete one | Removed from list | |

### 1.18 Affiliate Program — Members Tab

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Members table loads | Click "Members" tab | Table: Name/Email, Status, Tier, Referrals, Earnings, Joined | |
| Status badges | Check status column | Active shows "Active", dormant shows different | |
| Earnings display | Check earnings column | Dollar amounts; zero shows em-dash not "$0.00" | |
| Search by name | Type partial name | Matching members appear | |
| Search by email | Type partial email | Matching members appear | |
| Sort columns | Click column headers | Table sorts correctly | |

### 1.19 Affiliate Program — Networks Tab

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Networks load | Click "Networks" tab | Network cards (ShareASale, Impact, PartnerStack) | |
| Fields read-only in table | Check network row | Tracking ID and postback URL shown as plain text, not editable | |
| Edit via detail dialog | Click on a network row | Dialog opens with editable fields for tracking ID and postback URL | |
| Toggle network | Toggle a network on/off | State changes and persists | |

### 1.20a Affiliate Program — Contests Tab

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Contests load | Click "Contests" tab | Contests with status badges (active, upcoming, completed) | |
| Contest details | Check each contest | Name, status, metric, prize amount, date range | |
| Completed contest winner | Check a completed contest | Trophy icon with winner info | |
| Auto status from dates | Create contest with future start date | Status automatically set to "upcoming" | |
| CRUD operations | Create, edit, delete contests | All succeed | |

### 1.20b Affiliate Program — Payout Runs Tab

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Batches display | Click "Payout Runs" tab | Batches with status, amount, count, date | |
| Pending batch actions | Check a pending batch | "Approve" and "Reject" buttons visible | |
| Approve batch | Click Approve on pending | Status changes to "approved" | |
| Generate new batch | Click "Generate Payout Batch" | New batch created (or message if no pending commissions) | |

### 1.20c Affiliate Program — Audit Tab

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Audit tab loads | Click "Audit" tab | Info card linking to centralized audit logs | |
| Link navigates | Click "View Affiliate Audit Logs" | Opens `/admin/audit-logs?category=affiliate` | |

### 1.20d Affiliate Program — Tab Navigation

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| All tabs load | Click through every tab | Each loads without errors | |
| Tab persistence | Click a tab, refresh page | Same tab selected after reload | |
| Direct URL access | Visit `/admin/setup/affiliate?tab=broadcasts` | Opens on correct tab | |
| Applications badge | Check Applications tab | Shows pending count badge when pending apps exist | |

### 1.20e Affiliate Program — Discount Codes

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Discount codes page | Go to `/admin/setup/discount-codes` | List of discount codes | |
| Create code | Create new branded code with percentage or fixed amount | Code created | |
| Assign to affiliate | Assign code to an affiliate | Code appears in affiliate's dashboard | |
| Usage stats | Check a code's usage | Click count and conversion data | |
| CRUD operations | Edit, deactivate, delete | All succeed | |

### 1.20 Design System — Palette Page

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Palette page loads | Go to `/admin/setup/palette` | Color picker, shade scale, design system sections visible | |
| Change primary color | Pick a new primary color | Shade scale regenerates, preview updates live | |
| Semantic colors harmonize | Check semantic colors section | Success/warning/danger show "(auto-harmonized)" labels | |
| Preset buttons | Click each preset (Clean & Airy, Compact & Dense, Bold & Modern, Minimal) | All settings change to match preset | |
| Export config | Click Export JSON | JSON file downloads with current settings | |
| Import config | Import a previously exported JSON | Settings restore from file | |
| Typography section | Expand Typography accordion | H1/H2/H3 previews update when changing fonts/sizes | |
| Layout section | Change content density | Gap spacing changes across the site | |
| Dark mode section | Change dark mode option | Force-light/force-dark/user-choice respected | |
| Live preview | Check preview cards on the right | Cards update in real-time as settings change | |

### 1.21 Centralized Audit Logs

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Page loads | Go to `/admin/audit-logs` | All audit log entries displayed | |
| Category filter | Select "affiliate" | Shows only affiliate entries | |
| Expand entry | Click an entry | Detail dialog with action, entity, admin, timestamp, metadata | |
| Events record | Perform an action (edit a tier), check audit logs | New entry appears | |

### 1.22 Email Templates

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Templates load | Go to `/admin/email-templates` | All templates display | |
| Category badges | Check template cards | Non-general templates show category badge | |
| Create template | Create with name, subject, body, category | Saves and appears with badge | |
| Edit template | Edit subject and category | Changes save correctly | |
| Template in broadcasts | Create affiliate-category template, then new broadcast | Template appears in "Load from Template" dropdown | |

### 1.23 Admin Reporting & Analytics

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Revenue attribution | Go to `/admin/analytics` | Affiliate vs direct revenue breakdown with charts | |
| Revenue waterfall | Check waterfall section | Visual waterfall from gross revenue to net after commissions | |
| Metrics dashboard | Check metrics area | KPI dashboard with configurable alert thresholds | |
| Admin stats overview | Check stats area | Platform health overview statistics | |

### 1.24 Admin CRM Features (Beyond List/Detail)

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Affiliate CRM card | Click affiliate name in Members tab | Full profile with earnings, payouts, tickets, activities, notes | |
| Add admin note | Add internal note to affiliate record | Note saves, visible only to admins | |
| Health scores visible | Check health indicators | Green/yellow/red based on activity and conversion | |
| Ticket management | View tickets across users | Can view and manage support tickets | |

### 1.25 Admin Content & Growth Pages

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Blog management | Go to `/admin/blog` | Blog post management loads | |
| Feedback page | Go to `/admin/feedback` | User feedback visible | |
| Waitlist | Go to `/admin/waitlist` | Waitlist entries visible | |
| Onboarding funnel | Go to `/admin/onboarding` | Step completion tracking visible | |

### 1.26 Admin System & Configuration Pages

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Team management | Go to `/admin/team` | Team member management loads | |
| Queue management | Go to `/admin/queue` | Background job queues display | |
| SSO configuration | Go to `/admin/sso` | SSO setup page loads | |
| Admin settings | Go to `/admin/settings` | General settings page loads | |

### 1.27 Admin Setup Pages (All Must Load)

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Branding | Go to `/admin/setup/branding` | Logo, colors, brand name settings | |
| Content | Go to `/admin/setup/content` | Content management settings | |
| Features | Go to `/admin/setup/features` | Feature toggles | |
| Pages | Go to `/admin/setup/pages` | Page configuration | |
| Pricing | Go to `/admin/setup/pricing` | Plan and pricing configuration | |
| Social | Go to `/admin/setup/social` | Social media configuration | |
| Compliance | Go to `/admin/setup/compliance` | Legal/compliance settings | |
| Support | Go to `/admin/setup/support` | Support configuration | |
| Security | Go to `/admin/setup/security` | Security settings | |
| Integrations | Go to `/admin/setup/integrations` | Third-party integration settings | |
| Products | Go to `/admin/setup/products` | Product registry management | |
| PassivePost | Go to `/admin/setup/passivepost` | PassivePost-specific settings | |
| Testimonials | Go to `/admin/setup/testimonials` | Testimonial management with approve/reject | |
| Watermark | Go to `/admin/setup/watermark` | Post watermark configuration | |
| Funnel | Go to `/admin/setup/funnel` | Onboarding funnel configuration | |

---

## 2. Admin Team Member

### 2.1 Team Member Access

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Team member can access admin | Log in as team member, go to `/admin` | Admin dashboard loads (same as admin) | |
| Sidebar visible | Check sidebar | All admin sections accessible | |
| Dashboard home loads | Check `/admin` | KPI cards and alerts display | |
| CRM accessible | Go to `/admin/crm` | People list loads | |
| Revenue accessible | Go to `/admin/revenue` | Revenue list loads | |
| Subscriptions accessible | Go to `/admin/subscriptions` | Subscription list loads | |

### 2.2 Team Member Restrictions

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Cannot access affiliate dashboard | Navigate to `/affiliate/dashboard` | Redirected away (not an affiliate) | |
| User nav shows correct items | Click avatar dropdown | Shows: Admin Dashboard, PassivePost, Profile, Billing, Log out. No Affiliate Dashboard. | |
| API auth works | Actions (add note, tag user) succeed | Team members can perform admin API actions | |

### 2.3 Role Levels

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Owner role access | Log in as org owner | Full admin access | |
| Manager role access | Log in as org manager | Admin access (same pages) | |
| Member role access | Log in as org member | Admin access (same pages) | |
| Viewer role blocked | Set role to "viewer" in `organization_members`, try `/admin` | Access denied or redirected | |

---

## 3. Affiliate Dashboard

### 3.1 Affiliate Signup & Login

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Application form | Go to `/affiliate/join` | Public application form loads | |
| Submit application | Fill in email and details, submit | Success message | |
| Duplicate blocked | Submit same email again | "Pending application" message, not crash | |
| Affiliate login | Go to `/affiliate/login` with approved credentials | Logs in, redirects to `/affiliate/dashboard` | |
| Magic link login | Use magic link option on affiliate login | Email sent, link logs in successfully | |
| Forgot password | Go to `/affiliate/forgot-password` | Reset flow works | |
| Set password | Go to `/affiliate/set-password` after magic link | Can set a permanent password | |

### 3.2 Affiliate Dashboard — Overview

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Dashboard loads | Go to `/affiliate/dashboard` | Dashboard loads with navigation tabs | |
| Earnings summary | Check overview cards | Total earnings, pending, paid amounts | |
| Current tier | Check tier section | Current tier with progress toward next | |
| Active contests | Check contests section | Active/upcoming contests with countdown | |
| Recent activity | Check activity feed | Recent commissions, referrals, events | |

### 3.3 Links & Tracking

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Referral link visible | Check referral link section | Unique link with copy button | |
| Deep link generator | Create link with UTM parameters | Link generated with tracking params | |
| Link shortener | Shorten a referral link | Short link generated | |
| QR code generation | Generate QR code | Branded QR code downloadable | |
| Link performance | Check link stats | Click counts and conversion data per link | |
| Test links page | Go to `/affiliate/test-links` | Link testing interface loads | |

### 3.4 Commissions & Earnings

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Commissions list | Check commissions section | All commissions with status (pending, approved, paid) | |
| Commission lifecycle | Click a commission | 7-step journey from click to paid | |
| Earnings projections | Check projections | 3, 6, 12 month projections with annual forecast | |
| Earnings forecast | Check forecast | Monthly projections with optimistic/pessimistic range | |
| Commission split estimator | Use calculator | Shows split across tiers and products | |

### 3.5 Payouts & Financial Tools

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Payout history | Check payout history | Filterable, paginated list with CSV export | |
| Payout schedule | Check schedule widget | Next payout date, threshold progress, pending balance | |
| Earnings statement | Download statement | PDF-style document with period selection | |
| Tax center | Check tax panel | Year selector, estimated withholding, monthly breakdown, downloadable report | |
| Tax info submission | Submit W-9 or W-8BEN | Form saves | |
| Commission renewals | Check renewal interface | Eligible referrals with bulk renewal option | |

### 3.6 Marketing Toolkit

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Marketing assets load | Check toolkit tab | All assets with type labels | |
| Copy-paste captions | Copy a social caption | Referral link auto-inserted | |
| Email templates with merge tags | View email template | `{affiliate_name}`, `{referral_link}`, `{discount_code}` auto-filled | |
| Swipe files | View swipe file library | Pre-written emails with affiliate info filled | |
| Media kit page | View or generate media kit | Professional partner page with stats | |
| Sharing cards | View sharing cards | Social images with referral code | |
| Discount codes | Check discount section | Assigned branded codes with usage stats | |

### 3.7 Knowledge Base & Resources

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Knowledge base loads | Check KB section | Searchable articles by category | |
| Search works | Search for keyword | Relevant articles appear | |
| Promotional calendar | Check calendar | Upcoming campaigns with countdown and content suggestions | |
| Starter kit | Check starter kit (new affiliates) | Curated bundle of essentials | |

### 3.8 Gamification

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Tier progress | Check tier progress | Current tier with visual progress bar | |
| Milestones | Check milestones | Earned and upcoming with progress bars | |
| Badges | Check badges | Earned badges on profile | |
| Leaderboard | Check leaderboard | Ranked list by referrals, earnings, or conversion | |
| Goals | Set an earnings goal | Progress bar toward personal target | |
| Challenges | Check weekly challenges | Active challenges with progress and countdown | |
| Contests | Check contests | Active/upcoming with leaderboard and prizes | |

### 3.9 AI Tools

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| AI Post Writer | Generate a social post | Platform-specific content with referral link embedded | |
| AI Email Drafter | Generate promotional email | Professional email with discount code and link | |
| AI Blog Outline | Generate blog outline | Structured outline with headings and CTA | |
| AI Video Script | Generate video script | Script with hook, features, CTA | |
| AI Coach | Check weekly coaching | Personalized tips based on actual performance data | |
| AI Objection Handler | Enter common objection | 3 response variations using real product details | |
| Promotion Strategy Quiz | Take 6-question quiz | Personalized 30-day playbook generated | |
| Audience Analyzer | Run analysis | AI persona generated from traffic data | |
| AI Ad Copy | Generate ad copy | Short-form ad with headline, body, CTA variations | |

### 3.10 Analytics

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Churn intelligence | Check churn analytics | Churn rate, reasons, timing, at-risk referrals | |
| Cohort analysis | Check cohort view | Referrals grouped by signup month with retention | |
| Revenue analytics | Check revenue section | Revenue breakdown with conversion funnel | |
| Traffic insights | Check traffic analytics | Geographic, device, repeat visitor data | |
| Connected analytics | Check connected analytics (if platforms connected) | External platform data merged with affiliate metrics | |
| Content intelligence | Check content analytics | Promotion frequency and content type performance | |
| Earnings heatmap | Check heatmap | GitHub-style 52-week activity heatmap | |
| Percentile benchmarks | Check benchmarks | Ranking vs other affiliates | |
| Custom date range | Select custom range | Analytics filter to selected period | |
| CSV export | Click export on data table | CSV downloads with correct data | |

### 3.11 Communication

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| In-app messaging | Open messaging | Message thread with admin. Can send new messages. | |
| Unread indicator | Check for unread | Unread count badge visible | |
| Announcements | Check announcements | Admin announcements visible | |
| What's new digest | Check digest | Recent platform updates shown | |
| Surveys | Check for active surveys | Survey form with star rating and feedback | |

### 3.12 Profile & Social Proof

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Profile settings | Update affiliate profile | Changes save | |
| Co-branded landing page | Visit `/partner/[slug]` | Personalized page with affiliate branding | |
| Case study submission | Submit success story | Submitted for admin review | |
| Testimonial submission | Submit testimonial | Saved and pending approval | |
| Directory opt-in | Toggle public directory visibility | Appears/disappears from `/partners` | |

### 3.13 Affiliate Operational & Compliance Features

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Fraud detection flags | Check if any referrals are flagged | Flagged referrals show warning indicators | |
| API keys | Check API access section (if tier permits) | Can generate/view API keys | |
| Webhooks | Check webhook configuration | Can add webhook URLs with event selection | |
| Badge verification | Visit `/partner/verify/[code]` for your badge | Verification page confirms badge authenticity | |
| Terms/rate lock-in | Check commission terms section | Shows locked-in rate if terms were locked at activation | |
| Disputes | Check if dispute mechanism is available | Can view or file disputes on flagged commissions | |

### 3.14 Mobile Responsiveness

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Dashboard on mobile | Resize to phone width | Panels stack vertically, no horizontal scroll | |
| Navigation on mobile | Check tabs on small screen | Tabs accessible (scrollable or collapsible) | |
| Charts on mobile | Check charts on small screen | Charts resize and remain readable | |

---

## 4. Paid User Dashboard (PassivePost)

### 4.1 User Login

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Email/password login | Log in at `/login` | Dashboard loads | |
| OAuth login | Log in with social provider | Dashboard loads | |
| Password reset | Use forgot password flow | Reset email sent, new password works | |
| Signup | Create account at `/signup` | Account created, redirected to dashboard | |
| Referral tracking | Sign up with `?ref=CODE` in URL | Referral attributed to affiliate | |

### 4.2 Social Media Overview

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Social dashboard loads | Go to `/dashboard/social/overview` | Content overview page loads | |
| Social navigation | Check sidebar/nav | All social sections accessible: Overview, Posts, Queue, Calendar, Blog, Engagement, Intelligence, Settings | |
| Onboarding flow | Go to `/dashboard/social/onboarding` (for new users) | Step-by-step setup guide | |

### 4.3 Platform Connections

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Settings page loads | Go to `/dashboard/social/settings` | Platform connection management | |
| Connect Twitter/X | Click connect for Twitter | OAuth flow, account connected | |
| Connect LinkedIn | Click connect for LinkedIn | OAuth flow, account connected | |
| Connect Facebook | Click connect for Facebook | OAuth flow, account connected | |
| Connect Instagram | Click connect for Instagram | OAuth flow, account connected | |
| Connect Reddit | Click connect for Reddit | OAuth flow, account connected | |
| Connect Discord | Click connect for Discord | OAuth flow, account connected | |
| Connect YouTube | Click connect for YouTube | OAuth flow, account connected | |
| Connect Pinterest | Click connect for Pinterest | OAuth flow, account connected | |
| Disconnect platform | Click disconnect on connected account | Account removed | |

### 4.4 Content Creation & Scheduling

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Create post | Go to Posts, create new post | Post editor loads with platform selection | |
| Schedule post | Set future date/time, save | Post appears in calendar at scheduled time | |
| Queue view | Go to `/dashboard/social/queue` | Queued posts shown in order | |
| Calendar view | Go to `/dashboard/social/calendar` | Visual calendar with scheduled posts | |
| Multi-platform post | Select multiple platforms | Post formatted for each platform | |

### 4.5 Blog Management

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Blog page loads | Go to `/dashboard/social/blog` | Blog management interface | |
| Blog posts list | Go to `/dashboard/social/blog/posts` | List of blog posts | |
| Compose blog post | Go to `/dashboard/social/blog/compose` | Blog editor loads | |
| WordPress publishing | Connect WordPress, publish a post | Post appears on WordPress site | |
| Ghost publishing | Connect Ghost, publish a post | Post appears on Ghost site | |

### 4.6 Analytics & Intelligence

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Engagement page | Go to `/dashboard/social/engagement` | Engagement metrics from connected platforms | |
| Intelligence page | Go to `/dashboard/social/intelligence` | Content analysis and optimization suggestions | |
| Brand page | Go to `/dashboard/social/brand` | Brand management interface | |

### 4.7 Advanced Social Features

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Automation page | Go to `/dashboard/social/automation` | Automation rules interface | |
| Distribution page | Go to `/dashboard/social/distribution` | Content distribution settings | |
| Revenue page | Go to `/dashboard/social/revenue` | Revenue tracking from social content | |
| Retention page | Go to `/dashboard/social/retention` | Audience retention analytics | |
| Collaboration page | Go to `/dashboard/social/collaboration` | Team collaboration features | |
| Leads page | Go to `/dashboard/social/leads` | Lead tracking from social activity | |
| Affiliate page | Go to `/dashboard/social/affiliate` | User's affiliate activity (if they're also an affiliate) | |

### 4.8 Feature Gating by Subscription Tier

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Free tier limits | On free plan, try to connect 3+ platforms | Upgrade prompt shown at limit (2 platforms for Starter) | |
| Free tier AI limit | On free plan, generate 6+ AI posts in one day | Upgrade prompt after 5 generations | |
| Pro tier limits | On Pro plan, verify higher limits | 10 daily AI generations, 3 platforms, 2 daily posts | |
| Premium tier access | On Premium plan, verify full access | 100 AI generations, 10 platforms, unlimited posts | |
| Upgrade banner | Hit a limit | Clear upgrade banner with plan comparison | |

### 4.9 Billing & Subscription

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Billing page loads | Go to `/billing` | Current plan, billing cycle, payment status | |
| Invoice history | Check invoice list | All invoices with status, date, amount | |
| Invoice detail | Click an invoice | Full detail with line items | |
| Invoice PDF download | Click download | PDF file downloads | |
| Stripe customer portal | Click "Manage Subscription" | Opens Stripe portal | |
| Affiliate invitation | Check billing page | "Earn 30% commission" card with link to application | |

### 4.10 Support

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Submit ticket | Go to `/support`, create ticket | Ticket created with subject, description, priority | |
| View ticket history | Check existing tickets | List with status (Open, In Progress, Resolved, Closed) | |
| Add comment | Open ticket, add comment | Comment appears in thread | |
| Status updates | Check admin-responded ticket | Updated status and admin comments visible | |

### 4.11 Profile & Security

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Profile page loads | Go to `/profile` | Profile info with edit capability | |
| Update profile | Change fields, save | Persists on reload | |
| Security page | Go to `/security` | Password change and session management | |
| Change password | Change password | Updated successfully | |
| Email preferences | Check for email preference settings | Category-based toggles for notification types | |
| Toggle email pref | Turn off a notification category | Change saves and persists | |
| Usage insights | Check usage/membership section | Activity metrics shown (posts published, etc.) | |
| Membership info | Check plan display | Current plan and feature access displayed | |

### 4.12 User Navigation Menu

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| User nav items | Click avatar dropdown | Shows: PassivePost, Profile, Billing, Log out | |
| No admin items | Check dropdown as regular user | No Admin Dashboard link | |
| Affiliate link conditional | Check dropdown when user IS also an affiliate | Affiliate Dashboard link appears | |

---

## 5. Public Pages

### 5.1 Marketing Pages

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Homepage | Visit root URL | Landing page with hero, features, CTA | |
| Features page | Go to `/features` | Feature descriptions | |
| Feature detail | Go to `/features/[slug]` | Individual feature page loads | |
| Pricing page | Go to `/pricing` | Plans with prices, features, signup buttons | |
| About page | Go to `/about` | Company info | |
| Contact page | Go to `/contact` | Contact form or info | |
| FAQ page | Go to `/faq` | Questions with answers | |
| Docs page | Go to `/docs` | Documentation/help content | |

### 5.2 Legal & Policy Pages

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Terms of Service | Go to `/terms` | Terms displayed | |
| Privacy Policy | Go to `/privacy` | Policy displayed | |
| Cookie Policy | Go to `/cookie-policy` | Policy displayed | |
| Acceptable Use | Go to `/acceptable-use` | Policy displayed | |
| Accessibility | Go to `/accessibility` | Statement displayed | |
| DMCA | Go to `/dmca` | Policy displayed | |
| Security Policy | Go to `/security-policy` | Policy displayed | |
| AI Data Usage | Go to `/ai-data-usage` | Policy displayed | |
| Data Handling | Go to `/data-handling` | Policy displayed | |

### 5.3 Social Proof & Community Pages

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Partners directory | Go to `/partners` | Public list of opt-in affiliates with badges, bios, links | |
| Search partners | Use search/filter | Results filter by name or tier | |
| Partner landing page | Visit `/partner/[slug]` | Co-branded page with affiliate info and discount | |
| Partner badge verification | Visit `/partner/verify/[code]` | Badge verification page loads | |
| Testimonials page | Go to `/testimonials` | Approved testimonials displayed | |
| Social proof popups | Visit homepage, wait a few seconds | Social proof notification popups appear (if enabled) | |
| Live usage counters | Check homepage stats section | Animated counters showing real database numbers | |
| Blog listing | Go to `/blog` | Blog posts listed | |
| Blog post detail | Click a post | Full content loads | |
| Changelog | Go to `/changelog` | Platform updates displayed | |
| Custom landing pages | Visit `/p/[slug]` (if any exist) | Custom landing page renders | |

### 5.4 SEO & Meta Tags

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Open Graph tags | View page source on any public page | `og:title`, `og:description`, `og:type`, `og:url` present | |
| Page titles | Check browser tab on public pages | Each page has unique, descriptive title | |
| Canonical URLs | View page source | Canonical URL tags present | |
| Mobile viewport | Check viewport meta tag | Proper viewport configuration | |

---

## 6. Cross-Cutting Features

### 6.1 Authentication & Role Enforcement

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Protected routes (logged out) | Try `/admin` while logged out | Redirected to login | |
| Admin blocked for users | Log in as regular user, go to `/admin` | Redirected to `/` | |
| Affiliate redirect | Log in as affiliate-only, go to `/dashboard` | Redirected to `/affiliate/dashboard` | |
| Non-affiliate blocked | Log in as non-affiliate, go to `/affiliate/dashboard` | Redirected to `/` | |
| Admin can access all | Log in as admin, visit `/admin`, `/dashboard`, `/affiliate/dashboard` | All three load | |

### 6.2 Content Scheduling (Product Core)

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Social dashboard | Go to `/dashboard/social/overview` as paid user | Overview loads | |
| Connect account | Connect at least one platform | OAuth completes, account shows as connected | |
| Create and schedule | Create a post, schedule for future | Post saved and visible in calendar | |

### 6.3 Notifications

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Bell visible | Check header on authenticated page | Notification bell icon present | |
| Bell opens panel | Click bell | Panel opens without crash | |
| No 500 errors | Check browser console while navigating | No red 500 errors from `/api/notifications` | |

### 6.4 Dark Mode

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Theme toggle | Click theme toggle | Switches between light and dark | |
| Theme persists | Toggle, refresh page | Theme remains after reload | |
| Admin dashboard in dark | Navigate admin pages in dark mode | All elements readable with proper contrast | |
| Affiliate dashboard in dark | Navigate affiliate pages in dark mode | All elements readable | |
| User dashboard in dark | Navigate user pages in dark mode | All elements readable | |
| Force-light mode | Admin sets dark mode to force-light in palette | Toggle disappears, always light | |
| Force-dark mode | Admin sets dark mode to force-dark in palette | Toggle disappears, always dark | |

### 6.5 Design System Visual Consistency

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Change primary color | Admin changes primary color in palette | All branded elements update (buttons, links, charts) | |
| Change card padding | Admin changes card padding preset | All cards adjust spacing | |
| Change content density | Admin changes content density | Grid gaps adjust across pages | |
| Semantic colors harmonize | Change primary color, check success/warning/danger | Semantic colors shift to harmonize with new primary | |
| Charts respond | Change chart settings (bar thickness, dots, grid) | Charts on all dashboards update | |

### 6.6 Email System

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Signup welcome email | Create new account | Welcome email received | |
| Password reset email | Trigger password reset | Reset email received | |
| Affiliate approval email | Approve an affiliate application | Affiliate receives notification email | |
| Affiliate onboarding drip | After affiliate approval | Welcome sequence begins (3 emails over time) | |
| Branded receipt | Complete a Stripe payment | Branded receipt email received (not just Stripe default) | |
| Broadcast delivery | Send an affiliate broadcast from admin | Affiliates receive the broadcast email | |
| Weekly digest | Wait for scheduled digest (or trigger manually) | Digest email with performance summary received | |

### 6.7 Mobile Responsiveness

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Public pages on mobile | View marketing pages on phone width | Content stacks, no horizontal scroll | |
| Admin sidebar on mobile | View admin on phone width | Sidebar collapses, hamburger menu works | |
| Forms on mobile | Fill out forms on phone width | All fields accessible and functional | |

### 6.8 Accessibility

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| ARIA labels | Inspect interactive elements | ARIA labels on buttons, inputs, toggles | |
| Keyboard navigation | Tab through form elements | Focus moves logically | |
| Screen reader labels | Check for sr-only labels | Present on key elements | |

---

## Testing Tips

**When something fails:**
1. Note the section and test name
2. Describe what actually happened vs what was expected
3. Take a screenshot if possible
4. Check browser console (F12 > Console) for red error messages
5. Note the URL where the failure occurred

**Environment notes:**
- Test on the live Vercel deployment (not Replit preview)
- Admin account required for Section 1
- Second account with team role required for Section 2
- Affiliate account required for Section 3
- Regular paid user account required for Section 4
- Browser: Test in Chrome primarily, spot-check Firefox and Safari

**Test data:**
- Seeded test data should be present after running the seed SQL scripts
- If data appears missing, check whether the seed scripts were run in Supabase
- Some features require user interaction to generate data (AI tools, quizzes, goals) — these are by design

**Reporting results:**
- Mark each test: **PASS**, **FAIL** (with description), or **PARTIAL** (mostly works, note the issue)
- Group failures by severity: Blocker (can't proceed), Major (feature broken), Minor (cosmetic or edge case)
- Provide the URL and any console errors for every FAIL

---

*This document covers all built features of PassivePost. Update status columns as testing progresses.*
