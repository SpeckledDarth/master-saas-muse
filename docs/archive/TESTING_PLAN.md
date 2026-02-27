# PassivePost — QA Testing Plan

> **Purpose:** This document is the testing reference for anyone doing QA on the PassivePost platform. It covers all built features organized by dashboard area.
>
> **How to use this document:**
> - Work through each section relevant to the area you're testing
> - For each test, mark: **PASS**, **FAIL** (note what happened), or **PARTIAL** (mostly works but has an issue)
> - Open browser console (F12) to check for JavaScript errors during testing
> - Test on both desktop and mobile viewports where noted

---

## Table of Contents

1. [Admin Dashboard](#1-admin-dashboard)
2. [Affiliate Dashboard](#2-affiliate-dashboard)
3. [User Dashboard](#3-user-dashboard)
4. [Public Pages](#4-public-pages)
5. [Cross-Cutting Features](#5-cross-cutting-features)

---

## 1. Admin Dashboard

### 1.1 Admin Login & Navigation

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Admin can access dashboard | Log in as admin, navigate to `/admin` | Admin dashboard loads with sidebar navigation | |
| Setup wizard visible | Check for setup wizard or onboarding tasks | Setup tasks are listed with completion status | |
| All admin sections accessible | Click through each sidebar link | Every admin page loads without errors | |

### 1.2 User Management

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| User list loads | Go to Admin > Users | Table of all users displays with name, email, role, and status | |
| Search users | Type a name or email in search box | Table filters to matching results | |
| Assign user role | Change a user's role (user, affiliate, admin) | Role updates and persists on reload | |
| Impersonate user | Click impersonate on any user | Platform switches to that user's view. Impersonation indicator visible. | |
| Exit impersonation | Click the exit/stop impersonation button | Returns to admin view | |

### 1.3 Affiliate Program — Health Tab

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Health tab loads by default | Go to `/admin/setup/affiliate` | Health tab shows as the default view | |
| KPI cards display | Check the overview cards at top | Shows: Active affiliates, Dormant, Net ROI, Conversion Rate | |
| Revenue impact section | Check revenue breakdown area | Shows: Total Revenue, Commissions Paid, Commissions Pending, Net ROI | |
| Growth metrics | Check growth section | Shows: New Affiliates This Month, Referrals This Month, Conversions This Month | |
| Top performers | Check top performers card | Lists top affiliates by earnings. Shows "No performer data yet" if empty | |
| Alerts section | Check alerts area | Shows flagged referral count and pending payout amount | |

### 1.4 Affiliate Program — Applications Tab

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Applications list loads | Click "Applications" tab | Shows list of applications with pending count badge | |
| Filter by status | Try each filter (All, Pending, Approved, Rejected) | List filters correctly for each status | |
| Approve an application | Click approve on a pending application | Status changes to "approved", affiliate account created | |
| Reject an application | Click reject, add reviewer notes | Status changes to "rejected", notes saved | |
| Delete an application | Delete a rejected application | Application removed from list | |

### 1.5 Affiliate Program — Settings Tab

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Settings load | Click "Settings" tab | Current settings displayed (commission rate, cookie days, etc.) | |
| Edit and save | Change commission rate, save | Saves successfully, value persists on reload | |
| Re-engagement settings | Check re-engagement section | Shows dormancy threshold, max emails, enable toggle | |
| Auto-batch settings | Check auto-batch section | Shows payout schedule day and auto-approve threshold | |

### 1.6 Affiliate Program — Tiers Tab

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Tiers load sorted | Click "Tiers" tab | Tiers shown sorted by referral threshold (lowest first) | |
| Tier details visible | Check each tier card | Shows name, referral threshold, commission rate, and perks | |
| Perks display as badges | Check tiers with perks | Perks shown as badges, not raw text | |
| Edit a tier | Click edit, change a value, save | Updated value appears immediately | |
| Create new tier | Add a new tier with name, threshold, rate | New tier appears in sorted position | |
| Delete a tier | Delete a tier | Tier removed from list | |

### 1.7 Affiliate Program — Milestones Tab

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Milestones load | Click "Milestones" tab | All milestones display with details | |
| Milestone details | Check each milestone | Shows name, referral threshold, bonus amount, description | |
| Earned count shown | Check below each milestone | Shows "X affiliates earned" (including "0 affiliates earned") | |
| CRUD operations | Create, edit, and delete milestones | All operations succeed without errors | |

### 1.8 Affiliate Program — Marketing Assets Tab

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Assets load | Click "Assets" tab | All assets display with type labels | |
| Asset types visible | Check type labels | Each asset shows its type (Banner, Email Template, Social Post, etc.) | |
| View content | Click to expand an asset | Content displays without broken formatting | |
| CRUD operations | Create, edit, and delete assets | All operations succeed without errors | |

### 1.9 Affiliate Program — Broadcasts Tab

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Broadcasts load | Click "Broadcasts" tab | Shows broadcasts with sent/draft status | |
| Sent broadcast stats | Check a sent broadcast | Shows sent count, opened count, clicked count, date | |
| Draft shows action buttons | Check a draft broadcast | Edit, Send, and Delete buttons visible | |
| Create new broadcast | Click "New Broadcast", fill in name and body | Draft created and appears in list | |
| Load from email template | In create dialog, use "Load from Template" dropdown | Subject and body auto-fill from selected template | |
| Edit draft | Click edit on a draft, change body, save | Changes saved successfully | |
| Send broadcast | Click send on a draft, confirm | Status changes to "sent" | |
| Delete broadcast | Delete a broadcast | Removed from list | |

### 1.10 Affiliate Program — Members Tab

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Members table loads | Click "Members" tab | Table shows affiliates with: Name/Email, Status, Tier, Referrals, Earnings, Joined | |
| Status badges correct | Check status column | Active affiliates show "Active", dormant show different status. No active affiliate shows "Pending Setup" | |
| Earnings display | Check earnings column | Real dollar amounts shown. Zero earnings show em-dash, not "$0.00" | |
| Search by name | Type part of a name in search | Matching members appear | |
| Search by email | Type part of an email in search | Matching members appear | |
| Search does not match IDs | Paste a user ID into search | No results (search only matches name and email) | |
| Sort columns | Click column headers | Table sorts correctly | |

### 1.11 Affiliate Program — Networks Tab

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Networks load | Click "Networks" tab | Shows network cards (ShareASale, Impact, PartnerStack) | |
| Fields are read-only in table | Check network row | Tracking ID and postback URL shown as plain text, not editable inputs | |
| Edit via detail dialog | Click on a network row | Dialog opens with editable fields for tracking ID and postback URL | |
| Toggle network | Toggle a network on/off | State changes and persists | |

### 1.12 Affiliate Program — Contests Tab

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Contests load | Click "Contests" tab | Shows contests with status badges (active, upcoming, completed) | |
| Contest details | Check each contest | Shows name, status, metric, prize amount, date range | |
| Completed contest shows winner | Check a completed contest | Shows trophy icon with winner info | |
| Auto status from dates | Create contest with future start date | Status automatically set to "upcoming" | |
| CRUD operations | Create, edit, and delete contests | All operations succeed without errors | |

### 1.13 Affiliate Program — Payout Runs Tab

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Batches display | Click "Payout Runs" tab | Shows batches with status, amount, count, and date | |
| Pending batch has actions | Check a pending batch | "Approve" and "Reject" buttons visible | |
| Approve batch | Click Approve on pending batch | Status changes to "approved" | |
| Generate new batch | Click "Generate Payout Batch" | New batch created (or message saying no pending commissions) | |

### 1.14 Affiliate Program — Audit Tab

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Audit tab loads | Click "Audit" tab | Shows info card linking to centralized audit logs | |
| Link navigates correctly | Click "View Affiliate Audit Logs" | Opens `/admin/audit-logs?category=affiliate` | |

### 1.15 Affiliate Program — Tab Navigation

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| All tabs load | Click through every tab | Each tab loads without errors | |
| Tab persistence | Click a tab, refresh the page | Same tab remains selected after reload | |
| Direct URL access | Visit `/admin/setup/affiliate?tab=broadcasts` | Opens directly on Broadcasts tab | |
| Applications badge | Check Applications tab | Shows pending count badge when pending apps exist | |

### 1.16 Centralized Audit Logs

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Page loads | Go to `/admin/audit-logs` | Shows all audit log entries | |
| Category filter | Select "affiliate" from Category dropdown | Shows only affiliate-related entries. Action dropdown disappears. | |
| Return to all categories | Change Category to "All Categories" | Action dropdown reappears, all entries shown | |
| Click to expand entry | Click on any audit log entry | Detail dialog opens with action, entity, admin, timestamp, metadata | |
| Events record after actions | Perform an action (edit a tier), then check audit logs | The action appears as a new entry | |

### 1.17 Email Templates

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Templates page loads | Go to `/admin/email-templates` | All templates display | |
| Category badges visible | Check template cards | Templates with non-general category show a category badge | |
| Create template | Create a template with name, subject, body, and category | Template saves and appears in list with category badge | |
| Edit template | Edit a template's subject and category | Changes save and display correctly | |
| Template appears in broadcasts | Create an "affiliate" category template, then create a new broadcast | Template appears in the "Load from Template" dropdown | |

### 1.18 Admin Reporting

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Revenue attribution loads | Go to Admin > Analytics (revenue attribution) | Shows affiliate vs direct revenue breakdown with charts | |
| Revenue waterfall loads | Check revenue waterfall section | Visual waterfall from gross revenue to net after commissions | |
| Metrics dashboard | Go to Admin > Metrics | KPI dashboard with configurable alert thresholds | |
| Admin stats | Check admin stats area | Overview statistics for platform health | |

### 1.19 Admin CRM Features

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Affiliate CRM card | Click an affiliate name in Members tab | Full profile drawer opens with earnings, payouts, tickets, activities, notes | |
| Add admin note | Add an internal note to an affiliate record | Note saves and is visible only to admins | |
| Health scores visible | Check affiliate health indicators | Green/yellow/red indicators based on activity and conversion rate | |
| Ticket management | Go to Admin > Tickets (if separate page exists) | Can view and manage support tickets across all users | |

### 1.20 Other Admin Pages

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Blog management | Go to Admin > Blog | Blog post management interface loads | |
| Feedback page | Go to Admin > Feedback | User feedback submissions visible | |
| Queue management | Go to Admin > Queue | Background job queues display with status | |
| Waitlist | Go to Admin > Waitlist | Waitlist entries visible | |
| Team management | Go to Admin > Team | Team member management interface loads | |
| Onboarding funnel | Go to Admin > Onboarding | Onboarding step completion tracking visible | |

---

## 2. Affiliate Dashboard

### 2.1 Affiliate Signup & Login

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Application form accessible | Go to `/affiliate/join` | Public application form loads | |
| Submit application | Fill in email and details, submit | Success message appears | |
| Duplicate blocked | Submit a second application with the same email | "Pending application" message, not a crash | |
| Affiliate login | Go to `/affiliate/login` with approved credentials | Logs in and redirects to affiliate dashboard | |
| Forgot password | Go to `/affiliate/forgot-password` | Password reset flow works | |

### 2.2 Affiliate Dashboard — Overview

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Dashboard loads | Go to `/affiliate/dashboard` | Dashboard loads with navigation tabs | |
| Earnings summary | Check overview cards | Shows total earnings, pending, and paid amounts | |
| Current tier displayed | Check tier section | Shows current tier with progress toward next tier | |
| Active contests | Check contests section | Shows active/upcoming contests with countdown timers | |
| Recent activity | Check activity feed | Shows recent commissions, referrals, and other events | |

### 2.3 Affiliate Dashboard — Links & Tracking

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Referral link visible | Check referral link section | Unique referral link displayed with copy button | |
| Deep link generator | Create a link to a specific page with UTM parameters | Link generated with proper tracking parameters | |
| Link shortener | Shorten a referral link | Clean short link generated | |
| QR code generation | Generate a QR code for a referral link | Branded QR code created and downloadable | |
| Link performance | Check link performance data | Click counts and conversion data per link | |

### 2.4 Affiliate Dashboard — Commissions & Earnings

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Commissions list | Check commissions section | Shows all commissions with status (pending, approved, paid) | |
| Commission lifecycle | Click on a commission | Shows 7-step journey from click to paid out | |
| Earnings projections | Check earnings projections | Shows 3, 6, 12 month projections with annual forecast | |
| Earnings forecast | Check forecast section | Shows projected monthly earnings with optimistic/pessimistic range | |
| Commission split estimator | Use the commission calculator | Shows how earnings split across tiers and products | |

### 2.5 Affiliate Dashboard — Payouts & Financial Tools

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Payout history | Check payout history | Filterable, paginated list with CSV export | |
| Payout schedule | Check payout schedule widget | Shows next payout date, minimum threshold progress, pending balance | |
| Earnings statement | Download an earnings statement | PDF-style document with period selection | |
| Tax center | Check tax center panel | Year selector, estimated withholding, monthly breakdown, downloadable report | |
| Tax info submission | Submit W-9 or W-8BEN info | Form saves successfully | |
| Commission renewals | Check renewal interface | Shows eligible referrals with bulk renewal option | |

### 2.6 Affiliate Dashboard — Marketing Toolkit

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Marketing assets load | Check marketing toolkit tab | All available assets display with types | |
| Copy-paste captions | Copy a social media caption | Referral link auto-inserted in copied text | |
| Email templates with merge tags | View an email template | Merge tags ({affiliate_name}, {referral_link}, {discount_code}) auto-filled | |
| Swipe files | View swipe file library | Pre-written emails with auto-filled affiliate info | |
| Media kit page | View or generate media kit | Professional partner page with brand, stats, and materials | |
| Sharing cards | View sharing cards | Social media images with referral code embedded | |
| Discount codes | Check discount code section | Shows assigned branded codes with usage stats | |

### 2.7 Affiliate Dashboard — Knowledge Base & Resources

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Knowledge base loads | Check knowledge base section | Searchable help articles organized by category | |
| Search works | Search for a keyword | Relevant articles appear | |
| Promotional calendar | Check promotional calendar | Upcoming campaigns with countdown timers and content suggestions | |
| Starter kit | Check starter kit section (for new affiliates) | Curated bundle of essential materials | |

### 2.8 Affiliate Dashboard — Gamification

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Tier progress | Check tier progress section | Current tier with visual progress toward next tier | |
| Milestones | Check milestones | Shows earned and upcoming milestones with progress bars | |
| Badges | Check badges section | Earned badges displayed on profile | |
| Leaderboard | Check leaderboard | Ranked list by referrals, earnings, or conversion rate | |
| Goals | Set an earnings goal | Progress bar shows progress toward personal target | |
| Challenges | Check weekly challenges | Active challenges with progress bars and countdown timers | |
| Contests | Check contests section | Active/upcoming contests with leaderboard and prizes | |

### 2.9 Affiliate Dashboard — AI Tools

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| AI Post Writer | Generate a social post | Platform-specific content generated with referral link embedded | |
| AI Email Drafter | Generate a promotional email | Professional email with affiliate's discount code and link | |
| AI Blog Outline | Generate a blog outline | Structured outline with headings and CTA | |
| AI Video Script | Generate a video script | Platform-appropriate script with hook, features, CTA | |
| AI Coach | Check weekly coaching | Personalized tips based on actual performance data | |
| AI Objection Handler | Enter a common objection | 3 response variations generated using product pricing and features | |
| Promotion Strategy Quiz | Take the 6-question quiz | Personalized 30-day promotional playbook generated | |
| Audience Analyzer | Run audience analysis | AI-powered audience persona generated from traffic data | |
| AI Ad Copy | Generate ad copy | Short-form ad text with headline, body, CTA variations | |

### 2.10 Affiliate Dashboard — Analytics

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Churn intelligence | Check churn analytics | Churn rate, reasons, timing patterns, at-risk referrals | |
| Cohort analysis | Check cohort analytics | Referrals grouped by signup month with retention tracking | |
| Revenue analytics | Check revenue section | Revenue breakdown with conversion funnel | |
| Traffic insights | Check traffic analytics | Geographic, device, and repeat visitor data | |
| Connected analytics | Check connected analytics (if platforms connected) | External platform data merged with affiliate metrics | |
| Content intelligence | Check content analytics | Promotion frequency and content type performance correlation | |
| Earnings heatmap | Check heatmap view | GitHub-style 52-week activity heatmap | |
| Percentile benchmarks | Check benchmark data | Ranking compared to other affiliates | |
| Custom date range | Select a custom date range | Analytics filter to the selected period | |
| CSV export | Click export on any data table | CSV file downloads with correct data | |

### 2.11 Affiliate Dashboard — Communication

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| In-app messaging | Open messaging section | Message thread with admin visible. Can send new messages. | |
| Unread indicator | Check for unread messages | Unread count badge visible when messages exist | |
| Announcements | Check announcements section | Admin announcements visible | |
| What's new digest | Check what's new section | Recent platform updates and feature releases shown | |
| Surveys | Check for active surveys | Survey form accessible with star rating and feedback fields | |

### 2.12 Affiliate Dashboard — Profile & Social Proof

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Profile settings | Update affiliate profile | Changes save successfully | |
| Co-branded landing page | Visit partner page at `/partner/[slug]` | Personalized landing page with affiliate branding | |
| Case study submission | Submit a success story | Story submitted for admin review | |
| Testimonial submission | Submit a testimonial | Testimonial saved and pending approval | |
| Directory opt-in | Toggle public directory visibility | Affiliate appears/disappears from `/partners` page | |

### 2.13 Affiliate Dashboard — Mobile Responsiveness

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Dashboard on mobile viewport | Resize browser to phone width | All panels stack vertically without horizontal scrolling | |
| Navigation on mobile | Check tab navigation on small screen | Tabs are accessible (scrollable or collapsible) | |
| Charts on mobile | Check analytics charts on small screen | Charts resize and remain readable | |

---

## 3. User Dashboard

### 3.1 User Authentication

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Email/password login | Log in with email and password | Dashboard loads successfully | |
| OAuth login | Log in with a social provider (Twitter, LinkedIn, Facebook, Instagram) | Dashboard loads successfully | |
| Password reset | Go through forgot password flow | Reset email sent, new password works | |
| Signup | Create a new account | Account created, redirected to onboarding or dashboard | |

### 3.2 Billing & Subscription

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Billing page loads | Go to `/billing` or billing section | Current plan, billing cycle, and payment status shown | |
| Invoice history | Check invoice list | All invoices displayed with status, date, and amount | |
| Invoice detail | Click on an invoice | Full invoice detail with line items | |
| Invoice PDF download | Click download on an invoice | PDF file downloads | |
| Stripe customer portal | Click "Manage Subscription" link | Opens Stripe portal for payment method and plan changes | |
| Feature gating | Try accessing a premium feature on a free plan | Upgrade prompt shown instead of feature | |
| Affiliate invitation visible | Check billing page for affiliate card | "Earn 30% commission" card with link to affiliate application | |

### 3.3 Support

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Submit ticket | Go to support section, create a new ticket | Ticket created with subject, description, and priority | |
| View ticket history | Check existing tickets | List of tickets with status (Open, In Progress, Resolved, Closed) | |
| Add comment to ticket | Open a ticket and add a comment | Comment appears in the thread | |
| Ticket status updates | Check a ticket that admin has responded to | Updated status and admin comments visible | |

### 3.4 Profile & Security

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Profile page loads | Go to `/profile` | Profile information displayed with edit capability | |
| Update profile | Change profile fields, save | Changes persist on reload | |
| Security page | Go to `/security` | Password change and session management options shown | |
| Change password | Change password using current password | Password updated successfully | |
| Email preferences | Go to email preferences | Category-based email preference toggles shown | |
| Toggle email preferences | Turn off a notification category | Change saves and persists | |

### 3.5 Usage & Insights

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Usage insights | Check usage section | Activity metrics shown (e.g., "You published 12 posts this month") | |
| Membership info | Check membership section | Current plan and feature access displayed | |

---

## 4. Public Pages

### 4.1 Marketing Pages

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Homepage loads | Visit root URL | Landing page loads with hero, features, and CTA | |
| Features page | Go to `/features` | Feature descriptions and comparisons displayed | |
| Pricing page | Go to `/pricing` | Plans with prices, features, and signup buttons | |
| About page | Go to `/about` | Company information displayed | |
| Contact page | Go to `/contact` | Contact form or information displayed | |
| FAQ page | Go to `/faq` | Frequently asked questions with answers | |
| Docs page | Go to `/docs` | Documentation or help content | |

### 4.2 Legal & Policy Pages

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Terms of Service | Go to `/terms` | Terms displayed | |
| Privacy Policy | Go to `/privacy` | Privacy policy displayed | |
| Cookie Policy | Go to `/cookie-policy` | Cookie policy displayed | |
| Acceptable Use | Go to `/acceptable-use` | Acceptable use policy displayed | |
| Accessibility | Go to `/accessibility` | Accessibility statement displayed | |
| DMCA | Go to `/dmca` | DMCA policy displayed | |
| Security Policy | Go to `/security-policy` | Security policy displayed | |
| AI Data Usage | Go to `/ai-data-usage` | AI data usage policy displayed | |
| Data Handling | Go to `/data-handling` | Data handling policy displayed | |

### 4.3 Social Proof Pages

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Partners directory | Go to `/partners` | Public list of opt-in affiliates with tier badges, bios, and social links | |
| Search partners | Use search or filter on partners page | Results filter correctly by name or tier | |
| Partner landing page | Visit `/partner/[slug]` for a known affiliate | Co-branded page with affiliate info and discount | |
| Testimonials | Go to `/testimonials` | Approved testimonials displayed | |
| Blog | Go to `/blog` | Blog posts listed | |
| Blog post | Click a blog post | Full blog post content loads | |
| Changelog | Go to `/changelog` | Platform changelog/updates displayed | |

### 4.4 SEO & Meta Tags

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Open Graph tags | View page source on any public page | og:title, og:description, og:type, og:url tags present | |
| Page titles | Check browser tab title on public pages | Each page has a unique, descriptive title | |
| Canonical URLs | View page source | Canonical URL tags present | |
| Mobile viewport | Check viewport meta tag | Proper viewport configuration for mobile rendering | |

---

## 5. Cross-Cutting Features

### 5.1 Authentication & Security

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Protected routes | Try accessing `/admin` while logged out | Redirected to login page | |
| Role enforcement | Try accessing admin page as regular user | Access denied or redirect | |
| SSO/SAML login | Log in via SSO (if configured) | Successfully authenticates and reaches dashboard | |

### 5.2 Content Scheduling (Product Features)

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Social dashboard loads | Go to `/dashboard/social/overview` | Content scheduling dashboard loads | |
| Connect social account | Go to social settings, connect a platform | OAuth flow completes, account connected | |
| Create post | Create a new social post | Post saved as draft or scheduled | |
| Schedule post | Schedule a post for future date/time | Post appears in calendar at scheduled time | |
| Calendar view | Go to calendar page | Visual calendar with scheduled posts | |
| Blog management | Go to blog section | Blog post creation and management interface | |
| Content intelligence | Check intelligence section | Content analysis and optimization suggestions | |
| Engagement metrics | Check engagement section | Engagement data from connected platforms | |

### 5.3 Notifications

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Notification bell visible | Check header on any authenticated page | Notification bell icon present | |
| Bell click opens panel | Click the notification bell | Notification panel opens without crashing (may show empty list) | |
| No console 500 errors | Check browser console while navigating | No red 500 errors from `/api/notifications` | |

### 5.4 Dark Mode

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Theme toggle | Click theme toggle button | Page switches between light and dark mode | |
| Theme persists | Toggle theme, refresh page | Theme remains as set after reload | |
| All dashboards work | Navigate through admin, affiliate, and user dashboards in dark mode | All elements readable with proper contrast | |

### 5.5 Email System

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Transactional emails send | Trigger an action that sends email (signup, password reset) | Email received | |
| Branded receipts | Complete a payment | Branded receipt email received (not just Stripe default) | |
| Drip sequences | Activate a new affiliate | Welcome email received, follow-up emails sent on schedule | |

### 5.6 Mobile Responsiveness (General)

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Public pages on mobile | View marketing pages on phone viewport | Content stacks properly, no horizontal scroll | |
| Admin pages on mobile | View admin pages on phone viewport | Sidebar collapses, content remains usable | |
| Forms on mobile | Fill out forms (signup, ticket, etc.) on phone viewport | All form fields accessible and functional | |

### 5.7 Accessibility

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| ARIA labels | Inspect interactive elements | ARIA labels present on buttons, inputs, and toggles | |
| Keyboard navigation | Tab through form elements | Focus moves logically through the page | |
| Screen reader labels | Check for sr-only labels | Screen-reader-only labels present on key elements | |

---

## Testing Tips

**When something fails:**
1. Note the section and test name
2. Describe what actually happened vs what was expected
3. Take a screenshot if possible
4. Check browser console (F12 > Console) for red error messages
5. Note the URL where the failure occurred

**Environment notes:**
- Test on the live deployment (passivepost.io)
- Admin account required for admin dashboard tests
- Affiliate account required for affiliate dashboard tests
- Regular user account required for user dashboard tests
- Browser: Test in Chrome primarily, spot-check in Firefox and Safari

**Test data:**
- Seeded test data should be present (affiliates, referrals, commissions, applications, contests, etc.)
- If data appears missing, check with the development team before reporting as a bug

---

*This document covers all built features of PassivePost as a QA reference. Update status columns as testing progresses.*
