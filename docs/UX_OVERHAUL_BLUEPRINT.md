# UX Overhaul Blueprint — PassivePost Admin Dashboard

> **Created:** February 28, 2026
> **Status:** Awaiting Build Approval
> **Scope:** Fix all UI/UX inconsistencies and bugs found during human QA testing of the Admin Dashboard (Sections 0.3–1.20e of Testing Plan)
> **Estimated Sessions:** 6 sprints (one session each)

---

## Problem Statement

Human QA testing of the Admin Dashboard revealed systemic UX inconsistencies and functional bugs. Pages were built across many sessions with no enforced standards, resulting in a product that works feature-by-feature but feels inconsistent as a whole. The tester's recurring comment — *"The inconsistency throughout the entire site is a UI/UX nightmare"* — appeared 5 times across different sections.

This blueprint defines every issue found, categorizes them, and lays out a sprint plan to fix them systematically.

---

## Issue Registry

Every issue found during testing, categorized and numbered for tracking.

### Category A: Bugs (Code Is Broken)

These are functional defects where the code doesn't do what it should.

| ID | Section | Issue | Severity |
|----|---------|-------|----------|
| BUG-01 | 0.3 | Paid user login lands on homepage instead of `/dashboard/social` | High |
| BUG-02 | 0.3 | Team member login lands on homepage instead of `/admin` | High |
| BUG-03 | 1.1 | Marketing header/banner visible on Admin Dashboard (should be hidden) | High |
| BUG-04 | 1.3 | Command palette search returns no results for users (typed "Speck") | High |
| BUG-05 | 1.3 | Command palette search returns no results for invoices | High |
| BUG-06 | 1.3 | Command palette search returns no results for subscriptions (typed "tier") | High |
| BUG-07 | 1.3 | Command palette tickets are not clickable | Medium |
| BUG-08 | 1.5, 1.10 | Impersonate feature shows admin's own view, not the impersonated user's view | High |
| BUG-09 | 1.6 | Revenue summary cards show $0.00 despite records having dollar amounts | High |
| BUG-10 | 1.5 | CRM list revenue column is empty, but Revenue page shows data for the same records | High |
| BUG-11 | 1.15 | Newly created milestone immediately shows "4 affiliates earned" (hardcoded/prepopulated count) | Medium |
| BUG-12 | 1.13 | Commission rate shows old value (20%) before updating to new value (25%) — visible FOUC | Medium |
| BUG-13 | 1.20a | Contest creation fails with an error when saving | High |
| BUG-14 | 1.20b | Payout batch approval shows "Rejected" status instead of "Approved" | High |
| BUG-15 | 1.20b | Can create unlimited payout batches with no duplicate/logic prevention | Medium |
| BUG-16 | 1.12 | Affiliate admin sub-banner renders incorrectly (layout/overlap issue) | Medium |

### Category B: UX Inconsistencies (Systemic Patterns)

These are not bugs per se — each page works individually — but the lack of consistency across pages makes the product feel unfinished.

| ID | Issue | Where It Appears |
|----|-------|-----------------|
| UX-01 | No vertical sidebar on Admin Dashboard (uses horizontal top-nav, unlike Social and Affiliate dashboards) | Admin layout |
| UX-02 | 4 different table implementations: shadcn Table, raw HTML table, div-based grid, Card lists | Users, Revenue, Waitlist, Team/Feedback/Blog/Queue |
| UX-03 | Inconsistent row clickability — some pages have clickable rows, some require clicking a small eye icon, some have no click action | Users (eye icon), Revenue (row click), Team (no click) |
| UX-04 | 3 different detail view patterns: new page, dialog/modal, nothing | Revenue→new page, Users→dialog, Team→nothing |
| UX-05 | Inconsistent search/filter/sort — each page has a different combination and layout | Every admin page |
| UX-06 | Mixed delete confirmations: some use AlertDialog, some use browser `confirm()` | Team, Feedback, Waitlist use `confirm()` |
| UX-07 | Money display inconsistent: some pages show "$0.00", others show em-dash "—" for zero amounts | Members page vs. Revenue page |
| UX-08 | No "X" (clear) button inside search fields | Tester noted on CRM page |
| UX-09 | CRM detail tabs reset to "Profile" on page refresh instead of preserving the active tab | CRM detail page |
| UX-10 | Breadcrumbs follow site map hierarchy, not browsing history (clicking a person from Revenue goes to CRM, but back button is needed to return to Revenue) | Revenue → CRM cross-navigation |
| UX-11 | User role editing is too easily accessible — open dropdown in list view, no confirmation step | User Management page |
| UX-12 | "System" menu group (Users, Team, Audit Logs) buried at end of admin nav; should be higher priority | Admin navigation order |
| UX-13 | Discount codes page: codes are not clickable for detail view | Discount Codes page |
| UX-14 | Date filter fields lack a "Clear All" option — must individually clear each date field | Revenue page |
| UX-15 | Contest winner info not shown in contest detail view, and winner name is not cross-linked to CRM | Contests tab |

### Category C: Feature Requests

| ID | Request | Status | Decision |
|----|---------|--------|----------|
| FR-01 | Full contact fields on user profile + CRM | **DECIDED** | Add all standard contact fields. 1-to-1 fields on profile table; 1-to-many fields (phones, emails, addresses, social links) in related tables. See Design Decisions below. |
| FR-02 | File upload for marketing assets (not just URL links) | **DECIDED** | Upload files directly from admin dashboard to Supabase Storage. Affiliates can view and download from their dashboard. 10MB limit, common formats. See Design Decisions below. |
| FR-03 | Move Affiliate admin pages to top-level (`/admin/affiliate`) | **DECIDED** | Affiliates promoted to own top-level sidebar group. URL changes from `/admin/setup/affiliate` to `/admin/affiliate`. See Design Decisions below. |
| FR-04 | System-wide vertical sidebar navigation for all dashboards | **DECIDED** | All dashboards use the same Dashboard Shell with vertical drill-down sidebar. No horizontal nav inside dashboards. See Design Decisions below. |
| FR-05 | Best practice defaults for all affiliate settings | **DECIDED** | 9 defaults agreed (20% commission, 60-day cookie, $50 min payout, etc.). Info icon tooltips on every field. "Reset to Best Practices" button. See Design Decisions below. |
| FR-06 | Grandfathering integrity for affiliate agreements | **DECIDED** | Core term-locking already built. Audit found 6 gaps to fix. See Design Decisions below. |
| FR-07 | Affiliate-branded discount codes | **DECIDED** | Dual-attribution (link + code). Auto-generated on approval. Affiliate self-brands from their dashboard. First-come-first-served + suggestions. Coaching notes in UI. See Design Decisions below. |
| FR-08 | Cross-linking for all related data throughout admin | **DECIDED** | All detail pages use collapsible accordion sections to show related records. Every person name, amount, and entity reference is a clickable cross-link. See Design Decisions below. |
| FR-09 | Broadcast performance surfaced at higher level | **DECIDED** | Summary cards + trend indicator above broadcast list. Open/click rate columns in list view. Broadcast category tagging. Affiliates see broadcasts in their dashboard. See Design Decisions below. |
| FR-10 | Payout workflow documentation | **Deferred** | Intentionally deferred until app features are more stable. Will document when the system is finalized. |
| FR-11 | Feature documentation for all affiliate settings | **Deferred** | Intentionally deferred until app features are more stable. Will document when the system is finalized. |
| FR-12 | Summary cards only on dashboard landing pages | **DECIDED** | KPI/summary cards appear ONLY on each dashboard's landing page (`/admin`, `/dashboard/social/overview`, `/affiliate/dashboard`). Not repeated on sub-pages. |
| FR-13 | Settings page edit protection | **DECIDED** | Keep form layout but fields are non-editable by default. Admin clicks "Edit" button to unlock, then saves. Protects against accidental changes. See Design Decisions below. |
| FR-14 | Admin's own account in Users list | **DECIDED** | Show ALL users including the admin's own account. Eliminates confusion. |

---

## Design Decisions — Agreed

These decisions were made during the Category C discussion (February 28, 2026). They are binding for all sprints in this blueprint and all future sessions. Benchmarked against the Vercel Dashboard UX patterns.

### 1. Dashboard Shell Pattern (FR-03 + FR-04)

All three dashboards (Admin, Affiliate, Social) use the same reusable **Dashboard Shell** template. The user learns the navigation once and it works identically everywhere. Only the content changes per page.

**The Dashboard Shell provides:**

| Zone | Contents | Behavior |
|------|----------|----------|
| **Sidebar — Top** | App logo (admin-configured from palette) | Always visible |
| **Sidebar — Search** | Search bar | Always visible, just below logo |
| **Sidebar — Navigation** | Nav items with drill-down sub-menus | Scrollable if needed |
| **Sidebar — Bottom** | User avatar, username, account actions (settings, sign out, switch dashboard) | Pinned to bottom, always visible |
| **Content Area** | Breadcrumbs at top, then page content | Full remaining width — no top header bar |

**Drill-down sub-menu behavior (Vercel pattern):**
- Top-level items that have children show a `>` chevron
- Clicking a parent item REPLACES the entire sidebar content with that section's sub-items + a `< Back` button at the top
- Sub-items can be grouped under small uppercase section labels for visual hierarchy
- Clicking `< Back` returns to the top-level sidebar

**No horizontal navigation inside any dashboard.** Horizontal nav is only used on marketing/public-facing pages. All dashboard navigation is vertical, inside the sidebar.

**No top header bar inside dashboards.** By placing the user account in the sidebar, the entire right side of the screen is freed for content. No header consuming vertical space.

**Responsive behavior:**
- **Desktop:** Sidebar visible, content fills remaining width
- **Tablet:** Sidebar collapses to icon-only mode (or hides behind hamburger), content goes full width
- **Mobile:** Sidebar hidden, thin top bar with hamburger opens sidebar as overlay

**Admin sidebar groupings (top to bottom):**

| Group | Items | Notes |
|-------|-------|-------|
| Dashboard | Overview (home) | Always first |
| People `>` | CRM, Users, Team | Users/Team moved up from "System" for high-frequency access |
| Money `>` | Revenue, Subscriptions, Metrics | Financial data together |
| Affiliates `>` | Overview, Applications, Members, Tiers, Milestones, Assets, Broadcasts, Contests, Payouts, Networks, Discount Codes, Settings, Audit | Promoted from `/admin/setup/affiliate` to top-level `/admin/affiliate` |
| Support `>` | Tickets, Feedback | Support-related |
| Content `>` | Blog, Changelog, Waitlist, Queue | Content management |
| Settings `>` | Branding/Palette, General Settings | System configuration |
| System `>` | Audit Logs | Low-frequency admin tools |

### 2. List View Pattern (Benchmarked from Vercel)

All data list pages follow the same pattern:

- **Toolbar at top:** Search input (with X clear button) + filter dropdowns side by side in a clean horizontal row. "Clear All" button when any filter is active. Optional CSV export button.
- **Data table below:** Clean, data-first layout. No card wrapper around the table itself. Airy row spacing with generous padding for visual delight.
- **Clickable rows:** Entire row is clickable (cursor pointer). Navigates to detail page.
- **Clickable column headers:** Click to sort ascending/descending. Arrow indicator shows current sort direction.
- **Status indicators:** Small colored dots + text (using semantic tokens: `--success`, `--danger`, `--warning`). Not large badges.
- **Pagination:** "Showing X–Y of Z" with prev/next controls at bottom.

### 3. Detail View Pattern (Benchmarked from Vercel)

All detail pages follow the same pattern:

- **Breadcrumb at top:** Shows full hierarchy path (e.g., `Admin > People > CRM > Jane Roberts`). Each segment is clickable.
- **Summary header:** Key facts at a glance (name, status, key metrics). Action buttons in the header (Edit, Impersonate, Email, etc.).
- **Collapsible accordion sections below:** Each section shows related data. Users expand what they need. Multiple sections can be open at once.
- **Cross-linking in every accordion:** Person names, amounts, entity references are all clickable links to their respective detail pages.

**Example — CRM detail page for "Jane Roberts":**
- Summary header: name, email, status, plan, health score
- `>` Profile (editable fields)
- `>` Revenue & Transactions (invoices, payments, commissions from revenue tables)
- `>` Affiliate Activity (if affiliate: referrals, earnings, tier, contests won)
- `>` Support (tickets)
- `>` Activity Timeline (all events)
- `>` Notes

**Example — Revenue detail page for a transaction:**
- Summary header: amount, type, status, date
- `>` Related Person (clickable link to CRM + inline preview of key stats)
- `>` Related Subscription (if applicable, clickable link)
- `>` Audit Trail

**Example — Contest detail page:**
- Summary header: name, status, metric, prize, date range
- `>` Winner (if completed — clickable link to CRM + winning stats)
- `>` Participants (table of affiliates, each clickable)
- `>` Related Payouts (if prize paid, clickable)

### 4. Summary Cards Placement (FR-12)

KPI/summary cards appear ONLY on each dashboard's landing page:
- `/admin` — Admin overview KPIs (MRR, Active Subscribers, etc.)
- `/dashboard/social/overview` — User dashboard KPIs
- `/affiliate/dashboard` — Affiliate overview KPIs

They are NOT repeated on sub-pages. When you drill into a sub-section (e.g., Affiliates > Members), you see the Members list — not the overview cards again.

### 5. Users List Completeness (FR-14)

The Users list shows ALL users, including the currently logged-in admin's own account. No records are hidden. This eliminates confusion about whether the list is complete.

### 6. Full Contact Fields (FR-01)

The user profile currently only stores display name, email, and avatar. This decision expands it to a world-class contact record, future-proofing for email personalization, SMS/2FA, invoicing, and CRM use.

**Fields directly on the user profile (1-to-1):**
- First name
- Last name
- Company / organization name
- Job title
- Timezone
- Bio / notes
- Website URL

Display name remains as-is — it's used throughout the app for display purposes. First + last name are separate fields filled in when available.

**Fields in related tables (1-to-many):**

Each related table follows the same pattern: user_id, label (user-chosen, e.g. "Mobile," "Work," "Home"), the value, and an is_primary flag.

| Related Table | Columns | Notes |
|---------------|---------|-------|
| `user_phone_numbers` | user_id, label, phone_number, is_primary | Future-proofs for SMS notifications, 2FA |
| `user_email_addresses` | user_id, label, email, is_primary, is_verified | Auth email stays on main profile; these are additional contact emails |
| `user_addresses` | user_id, label, street, city, state, zip, country, is_primary | Future-proofs for invoicing, shipping |
| `user_social_links` | user_id, platform (LinkedIn, Twitter, Instagram, etc.), url | No is_primary needed — one per platform |

The CRM detail page shows each category as a section with an "Add" button. The is_primary flag determines which entry is used as the default when the system needs one (e.g., sending an SMS, generating an invoice).

### 7. Marketing Asset File Upload (FR-02)

The current marketing assets page only supports pasting URL links. This decision adds direct file upload so admins can upload actual creative files (banners, ad copy PNGs, PDFs) from the dashboard.

**Implementation:**
- **Storage:** Supabase Storage bucket (`affiliate-assets`)
- **Upload:** Admin uploads files from the marketing assets page in the admin dashboard
- **Limits:** 10MB per file; allowed formats: PNG, JPG, GIF, SVG, PDF, DOCX, XLSX
- **Database:** Asset record stores both a `file_url` (Supabase Storage public URL) and the original `file_name`, `file_size`, `file_type` metadata
- **Affiliate view:** Affiliates see assets on their dashboard with a download button. They can preview images inline and download any file type.
- **Existing URL-only assets:** Continue to work. The upload is an additional option, not a replacement. An asset can have a URL link, an uploaded file, or both.

### 8. Settings Page Edit Protection (FR-13)

The current settings pages (affiliate commission, leaderboard, payout, re-engagement, etc.) display all fields as open, always-editable form inputs. This creates risk of accidental changes.

**Decided pattern:**
- Keep the current form layout and grouping — don't change to a card-based layout
- All fields render as **non-editable by default** (visually styled as read-only, showing current values clearly)
- Each logical group of fields has an **"Edit" button** that unlocks those fields for editing
- Once in edit mode, the admin can modify the group of related fields, then **Save** or **Cancel**
- After saving, fields return to non-editable state
- This protects against accidental changes while keeping the familiar form layout
- Groups that edit together: Commission Settings (rate, duration, min payout, cookie, attribution), Leaderboard Settings, Re-Engagement Settings, Payout Automation, Two-Tier Referrals, Fraud Detection, Surveys

This pattern applies to all settings pages across the admin dashboard, not just affiliate settings.

### 9. Best Practice Defaults + Info Tooltips (FR-05)

Every affiliate settings field gets:
1. An **info icon (ⓘ)** next to the field label that shows a tooltip on hover explaining what the field does and why the default was chosen
2. A global **"Reset to Best Practices"** button that restores all settings to the agreed defaults with one click

**Agreed defaults:**

| Setting | Default Value | Tooltip Reasoning |
|---------|---------------|-------------------|
| Commission Rate | 20% | Industry standard for SaaS recurring. High enough to attract affiliates, sustainable for the business. |
| Commission Type | Recurring | Incentivizes affiliates to bring quality, long-term customers rather than one-time signups. |
| Cookie Duration | 60 days | Generous enough to capture delayed conversions. 30 is stingy, 90+ is unusual for SaaS. |
| Minimum Payout | $50 | Low enough to not frustrate new affiliates, high enough to avoid micro-payout processing costs. |
| Payout Frequency | Monthly | Standard in the industry. Weekly is too operationally heavy, quarterly frustrates affiliates. |
| Earning Residual Period | 12 months | Full year of recurring commissions motivates affiliates to bring customers who stick around. |
| Auto-Approve Applications | No (manual review) | Prevents fraud and low-quality affiliates. Quality over quantity for a growing program. |
| Attribution Conflict Policy | First-touch (first referrer gets credit) | Simple, clear, avoids disputes between affiliates. Easy to explain and defend. |
| Tier System | Enabled, 3 tiers (Bronze/Silver/Gold) | Gamification drives affiliate performance. Escalating rates reward top performers. |

The tooltip text doubles as in-app documentation — admins can learn what each setting does without leaving the page.

### 10. Grandfathering Integrity (FR-06)

**The rule:** Once an affiliate is approved under specific terms, those terms are locked for the duration of their agreement. If the admin changes global settings, the change only affects affiliates enrolled after the change. Existing affiliates keep their original terms until their agreement expires. New terms can be offered but never override existing agreements.

**What's already built and working:**

| Component | Location | Status |
|-----------|----------|--------|
| Term locking on approval | `src/lib/affiliate/index.ts` → `lockInAffiliateTerms()` | Working — copies global commission rate and duration months into `referral_links` record |
| Commission rate protection | `src/lib/affiliate/index.ts` → `getCommissionRate()` | Working — uses locked rate as floor, only overrides if performance tier offers higher rate |
| Expiration enforcement | `src/app/api/stripe/webhook/route.ts` | Working — checks `locked_at` + `locked_duration_months` to expire the commission window |
| Contracts table with versioning | `src/app/api/contracts/[id]/route.ts` | Working — editing an active contract creates a new version, marks old as "superseded" |
| Two-step signing | Contract PATCH endpoint | Working — affiliate signs, admin countersigns |
| Commission renewals | `commission_renewals` table | Exists — tracks `original_end_date`, `renewed_end_date`, status |

**Gaps found during audit (must be fixed):**

| Gap | Issue | Fix Required |
|-----|-------|-------------|
| **GAP-1** | No auto-contract on affiliate approval — affiliate can be earning commissions with no formal agreement on file | When `lockInAffiliateTerms()` runs, automatically generate a contract record with the locked values as structured data, not just freeform text |
| **GAP-2** | Contract body is freeform text with no link to actual locked values — admin could write "30% commission" in contract text while code enforces 20% | Add structured `terms` JSONB field to contracts table that stores the actual locked values (rate, duration, cookie, min payout). Contract body remains for legal text, but `terms` field is the source of truth. |
| **GAP-3** | Cookie duration not locked per affiliate — changing global cookie duration affects existing affiliates' attribution window | Add `locked_cookie_duration_days` to `referral_links` and populate it in `lockInAffiliateTerms()` |
| **GAP-4** | Min payout threshold not locked per affiliate — increasing global min payout could delay existing affiliates' payouts | Add `locked_min_payout_cents` to `referral_links` and populate it in `lockInAffiliateTerms()` |
| **GAP-5** | Affiliate-facing contract view needs verification — unclear if affiliates can see active terms, expiration, remaining months in a clear summary | Verify and fix the affiliate dashboard contract section to show: active agreement terms, effective date, expiration date, months remaining, signed status |
| **GAP-6** | No audit trail for global settings changes — when admin changes commission rate from 25% to 20%, no audit log entry is created | Add audit log entries for all affiliate settings changes, capturing old value → new value |

These gaps will be addressed in the sprint plan. GAP-1 through GAP-4 are schema/logic fixes. GAP-5 is a UI verification. GAP-6 is an audit trail addition.

### 11. Affiliate-Branded Discount Codes (FR-07)

**Dual-Attribution Model:** Every affiliate has two independent paths to earn referral credit:
1. **Referral link** — traditional URL with cookie tracking. Works for digital content (blog posts, social media, YouTube descriptions).
2. **Discount code** — a branded, memorable code. Works for verbal/audio content (podcasts, live streams, in-person mentions) where listeners can't click a link but can remember a code.

Both paths are valid. If a customer uses a code, the affiliate gets credit even without a cookie, even years later (under the latest active terms). This is the long-tail value — a podcast episode from 3 years ago still works if the host said "use code STEELE40."

**Auto-generation on affiliate approval:**
- When an affiliate is approved, the system auto-generates a default discount code based on their name + the current discount percentage (e.g., "STEELE20")
- The affiliate can then rename/brand it from their dashboard

**Affiliate self-branding from their dashboard:**
- Affiliates see their discount code(s) on their dashboard
- They can rename their code to anything they want (subject to rules below)
- They can see usage stats (how many times used, revenue generated)

**Naming collision policy — Option B: First-come, first-served + suggestions:**
- Codes are globally unique. Whoever claims a code name first owns it.
- If a requested code is taken, the system shows a coaching message and auto-suggests 3-4 alternatives based on the affiliate's name, discount percentage, or username.
- Taken message: *"That code is already claimed by another partner. Try something unique to your personal brand — your podcast name, your channel name, or a nickname your audience knows you by."*
- Suggestions example: "JSTEELE40, STEELE40OFF, JAES40"

**Code rules:**
- Uppercase, alphanumeric only, 4-20 characters. No spaces, no special characters.
- Reserved words blocked: "DISCOUNT," "FREE," "TEST," "ADMIN," "PASSIVEPOST," and similar common/brand words.
- One active branded code per affiliate by default. Admin can grant additional codes if needed.
- Rename limit: once per 30 days, to prevent confusion if old content already references the current code name.

**Coaching notes in the affiliate dashboard UI:**

On the code creation/management screen:
> *"Your discount code is your personal brand in action. Choose something memorable that your audience will associate with YOU — your name, your show, your catchphrase. Great codes are short, easy to say out loud, and easy to remember. Codes are first-come, first-served — the more unique to your brand, the better!"*

After code creation (pro tip):
> *"Pro tip: Say your code out loud. If it's easy to say on a podcast or livestream, your audience is more likely to remember it."*

On the code performance section:
> *"Every use of your code earns you commission. Share it in your bio, your email signature, your content descriptions. Even if someone uses your code 5 years from now, you'll still earn credit under your active terms."*

**Attribution conflict resolution:**
When both a referral link (cookie) and a discount code point to different affiliates for the same conversion, the existing `attribution_conflict_policy` setting determines who gets credit. The default is first-touch (the first referral method used wins).

**Stripe integration:**
Discount codes must be validated against Stripe's coupon/promotion code system. This has not been tested yet and will need a dedicated integration pass.

### 12. Broadcast Performance Surfacing (FR-09)

Broadcast engagement data is currently buried in individual broadcast detail views. This decision surfaces it at the list level so the admin can assess performance at a glance.

**Summary cards above the broadcast list view:**

| Card | Metric | Purpose |
|------|--------|---------|
| **Average Open Rate** | Across all broadcasts (e.g., "72%") | Are affiliates reading your communications? A drop signals subject line or frequency issues. |
| **Average Click Rate** | Across all broadcasts (e.g., "34%") | Is your content compelling enough to drive action? Opens without clicks means they read but didn't engage. |
| **Best Performer** | Name + open rate of the top broadcast | Quick reference — what worked? Can you repeat the pattern? |
| **Last Broadcast** | Date + name + open/click rates | How recent was your last communication? Long gaps signal a need to re-engage. |

**Trend indicator on Average Open Rate card:**
- Compares last 5 broadcasts vs. prior 5
- Simple up/down arrow with percentage change
- Tells the admin whether their communication strategy is improving over time

**List view columns added:**
- **Open Rate %** — visible in the broadcast list row
- **Click Rate %** — visible in the broadcast list row
- Both columns are sortable, so the admin can rank broadcasts by engagement

**Broadcast category tagging (optional on creation):**
- Categories: "Contest," "Tier Change," "Policy Update," "General"
- Summary cards can show breakdowns by category (e.g., "Contest announcements average 85% open rate vs. Policy updates at 62%")
- Helps the admin understand which types of communications resonate most

**Affiliate-side visibility:**
- Affiliates see broadcasts in their dashboard
- Each broadcast is clickable to read the full message
- Closes the loop: admin sends → affiliates receive and engage → admin sees engagement data

**Future enhancement (not in this blueprint):**
Broadcast-to-outcome correlation — did the change announced in a broadcast actually move downstream metrics (signups, revenue, affiliate activity)? This ties into the analytics flywheel and belongs in a future analytics sprint.

---

## World-Class Enhancements

These 10 enhancements are essentially "free" — they're better defaults and small additions folded into work we're already doing. Each is mapped to the sprint where it naturally fits.

| # | Enhancement | Sprint | Cost |
|---|------------|--------|------|
| WC-01 | **Keyboard shortcuts** — `Cmd/Ctrl+K` opens command palette, `Cmd/Ctrl+/` focuses sidebar search, `Escape` closes drill-down and returns to top-level sidebar | Sprint 4 | Free — wiring events to existing components |
| WC-02 | **Recently visited** — small "Recent" section at top of sidebar showing 3-5 most recently visited pages for quick navigation | Sprint 4 | Free — building sidebar from scratch anyway |
| WC-03 | **Coaching-language empty states** — instead of generic "No results found," each table has contextual coaching text that guides the admin toward action (e.g., "No affiliates yet. Share your affiliate program link to start recruiting partners.") | Sprint 1 | Free — just string content in the empty state prop |
| WC-04 | **Relative timestamps with absolute tooltip** — all dates show "3 hours ago," "Yesterday," "Feb 14" with full absolute timestamp on hover. One utility function used everywhere. | Sprint 6 | Free — one function, applied during page conversions |
| WC-05 | **Sidebar nav badge counts** — small count badges on nav items showing actionable quantities (Tickets (3), Applications (2), Payouts (1)). Attention magnets that tell the admin where to act without clicking through every page. | Sprint 4 | Free — building sidebar from scratch anyway |
| WC-06 | **Inline health indicators on list rows** — small colored dot (green/yellow/red) next to each row based on simple rules: CRM (active/trial/churned), Affiliates (earning/dormant/flagged), Revenue (paid/pending/overdue) | Sprint 6 | Free — applying status indicator pattern already defined in Design Decision #2 |
| WC-07 | **CSV export on every list page** — one utility function that serializes visible table data to CSV and triggers browser download. Built into TableToolbar, available on every page that uses it. | Sprint 1 (utility) + Sprint 6 (application) | Free — one function in Sprint 1, auto-available to all pages in Sprint 6 |
| WC-08 | **Toast notifications for all mutations** — consistent success/error toasts on every save, create, update, delete action. Currently inconsistent — some pages show feedback, some don't. | Sprint 6 | Free — one line per mutation during page conversions |
| WC-09 | **Bulk action checkboxes (foundation)** — add optional select-row checkbox column to AdminDataTable. Enables future bulk actions (bulk role change, bulk approve applications, bulk close tickets). | Sprint 1 | Low-cost — few lines in the data table component |
| WC-10 | **Sparkline mini-charts in key list rows** — tiny 30-day trend line (thin SVG) in Revenue and Affiliate Members rows giving instant trend visibility without clicking into detail. One small reusable component. | Sprint 6 | Low-cost — one small SVG component, applied to 2-3 pages |

---

## Sprint Plan

Each sprint is designed to complete in one session (3-5 tasks, clear done-test). Sprints are ordered by dependency and impact.

---

### Sprint 1: Shared UX Components + Standards

**Goal:** Build the reusable components that all future sprints depend on. No page conversions yet — just the building blocks.

| Task | Description | Files |
|------|-------------|-------|
| S1-T1 | Write UX Standards rules section in `docs/DESIGN_SYSTEM_RULES.md` — define the ONE correct pattern for tables, toolbars, detail views, confirmations, empty states, loading states, pagination, money formatting, search clear buttons | `docs/DESIGN_SYSTEM_RULES.md` |
| S1-T2 | Build `<AdminDataTable>` — reusable data table component using shadcn Table with: column definitions, clickable rows, sort state, coaching-language empty state prop (WC-03), loading skeleton, pagination, optional select-row checkbox column for future bulk actions (WC-09) | `src/components/admin/data-table.tsx` |
| S1-T3 | Build `<TableToolbar>` — consistent search + filter + sort bar with: search input (with X clear button), filter dropdowns, sort selector, CSV export utility function built-in (WC-07), optional date range, "Clear All" reset | `src/components/admin/table-toolbar.tsx`, `src/lib/csv-export.ts` |
| S1-T4 | Build `<ConfirmDialog>` — wraps shadcn AlertDialog with standard destructive confirmation pattern. Replaces all `confirm()` calls. | `src/components/admin/confirm-dialog.tsx` |
| S1-T5 | Update the `design-system` agent skill with UX Standards rules so all future sessions enforce them automatically | `.agents/skills/design-system/SKILL.md` |

**Done Test:** All 3 components render correctly in isolation. Empty states show coaching language. CSV export downloads a file. Checkbox column toggles row selection. UX Standards section exists in design system rules. Agent skill updated. No pages converted yet — that's Sprint 6.

**Addresses:** UX-02, UX-05, UX-06, UX-08, WC-03, WC-07, WC-09 (foundations only — application happens in later sprints)

---

### Sprint 2: Critical Bug Fixes

**Goal:** Fix the highest-impact functional bugs that make the product feel broken. These are independent of the UX component work.

| Task | Description | Files |
|------|-------------|-------|
| S2-T1 | Fix login redirect — paid users should land on `/dashboard/social/overview`, team members on `/admin` (not homepage) | Auth callback route or middleware |
| S2-T2 | Hide marketing header/banner on all dashboard routes (`/admin/*`, `/dashboard/*`, `/affiliate/*`) | `src/components/layout/header.tsx` |
| S2-T3 | Fix Revenue summary stats showing $0.00 — trace the aggregation query and fix the data path | `src/app/admin/revenue/page.tsx`, related API route |
| S2-T4 | Fix CRM list revenue column showing empty — verify the join/query matches the Revenue page's data source | `src/app/admin/crm/page.tsx`, related API route |
| S2-T5 | Fix milestone earned count — newly created milestones should show 0, not a hardcoded number | Milestone component or API route |

**Done Test:** Login as paid user → lands on social dashboard. Login as team member → lands on admin. No marketing header on any dashboard. Revenue stats show real numbers. CRM revenue column matches Revenue page data. New milestones show 0 earned.

**Addresses:** BUG-01, BUG-02, BUG-03, BUG-09, BUG-10, BUG-11

---

### Sprint 3: More Bug Fixes + UX Quick Wins

**Goal:** Fix remaining high-priority bugs and apply quick UX improvements that don't require full page conversions.

| Task | Description | Files |
|------|-------------|-------|
| S3-T1 | Fix commission rate FOUC — show skeleton/loading state instead of stale value while fetching | Affiliate settings/landing components |
| S3-T2 | Fix contest creation error — debug and fix the save failure | Contest API route and form |
| S3-T3 | Fix payout batch approval showing "Rejected" — trace the status update logic | Payout batch API route |
| S3-T4 | Add payout batch duplicate prevention — prevent creating new batch when pending batch exists | Payout batch API route |
| S3-T5 | Fix affiliate admin sub-banner rendering (layout/overlap) | Affiliate admin page layout |

**Done Test:** Commission rate loads without flash. Contests can be created. Payout approval shows correct status. Cannot create duplicate batches. Sub-banner renders correctly.

**Addresses:** BUG-12, BUG-13, BUG-14, BUG-15, BUG-16

---

### Sprint 4: Dashboard Shell + Navigation Overhaul

**Goal:** Build the Dashboard Shell component and apply it to the admin dashboard. This implements the Vercel-benchmarked navigation pattern: vertical sidebar with drill-down sub-menus, user account pinned at bottom, no horizontal nav, no top header bar inside dashboards.

| Task | Description | Files |
|------|-------------|-------|
| S4-T1 | Build the Dashboard Shell component — reusable layout with sidebar (three zones: logo at top, search + nav in middle, user account pinned at bottom), drill-down sub-menu behavior, breadcrumb bar in content area, responsive breakpoints (desktop/tablet/mobile), "Recently Visited" section at top of nav showing 3-5 most recent pages (WC-02) | `src/components/layout/dashboard-shell.tsx` |
| S4-T2 | Build admin sidebar nav content — define all nav groups (Dashboard, People, Money, Affiliates, Support, Content, Settings, System) with sub-items and drill-down definitions. Move Affiliates to top-level (`/admin/affiliate`). Move Users/Team into "People" group near top. Add badge counts on actionable items: Tickets, Applications, Payouts (WC-05). | `src/components/admin/admin-sidebar.tsx` |
| S4-T3 | Update admin layout to use Dashboard Shell. Remove horizontal top-nav. Remove top header bar. Content area gets full remaining width. | `src/app/admin/layout.tsx` |
| S4-T4 | Add keyboard shortcuts — `Cmd/Ctrl+K` opens command palette, `Cmd/Ctrl+/` focuses sidebar search, `Escape` closes drill-down and returns to top-level sidebar (WC-01) | Dashboard Shell component |
| S4-T5 | Fix CRM detail tab persistence — use URL search params so refreshing preserves the active tab | `src/app/admin/crm/[userId]/page.tsx` |
| S4-T6 | Standardize money display — show "$0.00" everywhere (never em-dash for money) and apply across admin pages | All admin pages showing currency |

**Done Test:** Admin dashboard uses the Dashboard Shell with vertical sidebar. Drill-down sub-menus work (e.g., clicking Affiliates replaces sidebar with affiliate sub-items + back button). User account is pinned at sidebar bottom. "Recently Visited" shows last 3-5 pages. Badge counts appear on Tickets/Applications/Payouts. Keyboard shortcuts work. No horizontal nav or top header bar visible. Mobile sidebar works (hamburger overlay). Affiliates accessible at `/admin/affiliate`. CRM detail refresh preserves tab. Money displays consistently.

**Addresses:** UX-01, UX-07, UX-09, UX-12, FR-03, FR-04, WC-01, WC-02, WC-05

---

### Sprint 5: Command Palette + Impersonate + Cross-Linking

**Goal:** Fix the two biggest functional gaps (search and impersonation) and implement the cross-linking pattern with collapsible accordion sections on detail pages.

| Task | Description | Files |
|------|-------------|-------|
| S5-T1 | Fix command palette search — wire up user search (by name/email), subscription search, invoice search against real database queries | Command palette component, search API route |
| S5-T2 | Make command palette tickets clickable — results should navigate to the entity's detail page | Command palette component |
| S5-T3 | Fix impersonate — impersonated view should show the target user's dashboard, not the admin's own view | Impersonate route and session handling |
| S5-T4 | Add collapsible accordion sections to CRM detail page showing related records: Revenue & Transactions, Affiliate Activity (if affiliate), Support tickets, Activity Timeline, Notes. All person names, amounts, and entities are clickable cross-links. | CRM detail page, shared accordion component |
| S5-T5 | Add cross-linking to Revenue detail (related person with inline preview), Contest detail (winner + participants as clickable links), and Payout/Members pages (person names → CRM) | Revenue detail, Contest, Payout, Members pages |

**Done Test:** Command palette finds users by partial name/email. Clicking a result navigates to the correct detail page. Impersonation shows the target user's view with impersonation banner. CRM detail page has accordion sections with related revenue/affiliate/support data. Person names across all admin pages are clickable links to CRM detail. Contest winners are clickable. Revenue detail shows related person.

**Addresses:** BUG-04, BUG-05, BUG-06, BUG-07, BUG-08, UX-15, FR-08

---

### Sprint 6: Admin Page Conversions to Shared Components

**Goal:** Convert admin pages to use the shared AdminDataTable, TableToolbar, and ConfirmDialog components built in Sprint 1. This is where the systemic UX consistency gets applied.

| Task | Description | Files |
|------|-------------|-------|
| S6-T1 | Convert User Management page — replace eye icon with clickable rows, add TableToolbar, protect role editing behind intentional action (edit button → dialog), use ConfirmDialog for delete. Add health dot indicators (WC-06): green=active, yellow=trial, red=churned. Use relative timestamps (WC-04). Add toast on all mutations (WC-08). | User management admin page |
| S6-T2 | Convert Waitlist page — replace div grid with AdminDataTable, add toolbar with search + filters. Use relative timestamps (WC-04). Add toast on mutations (WC-08). | Waitlist admin page |
| S6-T3 | Convert Team page — replace Card list with AdminDataTable, add ConfirmDialog for remove, replace `confirm()`. Use relative timestamps (WC-04). Add toast on mutations (WC-08). | Team admin page |
| S6-T4 | Convert Feedback page — replace Card list with AdminDataTable, add toolbar with status filter, replace `confirm()` for delete. Use relative timestamps (WC-04). Add toast on mutations (WC-08). | Feedback admin page |
| S6-T5 | Convert Audit Logs page — apply AdminDataTable, ensure consistent row click → dialog pattern. Use relative timestamps (WC-04). | Audit Logs admin page |
| S6-T6 | Build `<Sparkline>` mini-chart component (thin SVG, 30-day trend). Apply to Revenue list (revenue trend per user) and Affiliate Members list (referral trend per affiliate) (WC-10). | `src/components/admin/sparkline.tsx`, Revenue page, Members page |
| S6-T7 | Build `formatRelativeTime()` utility function — returns "3 hours ago," "Yesterday," "Feb 14" with full ISO timestamp available for tooltip. Used by all converted pages (WC-04). | `src/lib/format-relative-time.ts` |

**Done Test:** All 5 converted pages use the same table component, same toolbar pattern, same confirmation dialogs. Rows are clickable where detail views exist. No browser `confirm()` calls remain on any converted page. All dates show relative timestamps with absolute tooltip on hover. Health dots appear on User and Affiliate rows. Toast notifications confirm every mutation. Sparklines show 30-day trends on Revenue and Affiliate Members rows. CSV export works from every toolbar.

**Addresses:** UX-02, UX-03, UX-04, UX-05, UX-06, UX-11, UX-13, WC-04, WC-06, WC-07, WC-08, WC-10

---

## Design System Compliance — Mandatory for All Sprints

The Color Palette page (`/admin/setup/palette`) is the single source of truth for ALL visual styling across the entire app — all three dashboards plus marketing pages. Every shared component built in this blueprint and every page conversion MUST consume CSS variables from the design system. No hardcoded Tailwind spacing, colors, radius, or shadows. This rule has been violated in past sessions, costing days of rework.

### CSS Variables Each Shared Component Must Use

**AdminDataTable (`src/components/admin/data-table.tsx`)**

| Visual Property | CSS Variable | Never Use |
|----------------|-------------|-----------|
| Table container padding | `--card-padding` | `p-4`, `p-6` |
| Table container radius | `--card-radius` | `rounded-lg`, `rounded-md` |
| Table container shadow | `--card-shadow` | `shadow-sm`, `shadow-md` |
| Table container border | `--card-border-width`, `--card-border-style` | `border`, `border-2` |
| Row stripe effect | `--table-stripe-opacity` | `bg-gray-50`, `bg-muted/50` with hardcoded opacity |
| Row border lines | `--table-border-opacity` | `border-b` with hardcoded opacity |
| Row hover effect | `--hover-transform`, `--transition-speed` | `hover:bg-gray-100`, hardcoded transitions |
| Row hover background | `bg-muted` (allowed Tailwind class) | `bg-gray-50`, `bg-slate-100` |
| Header background | `bg-muted` (allowed Tailwind class) | `bg-gray-100`, `bg-slate-50` |
| Header text | `text-muted-foreground` (allowed) | `text-gray-500`, `text-slate-600` |
| Empty state text | `text-muted-foreground` (allowed) | `text-gray-400`, `text-gray-500` |
| Status colors in cells | `--success`, `--warning`, `--danger`, `--info` | `text-green-600`, `text-red-500`, `text-amber-600` |
| Content gap (between toolbar and table) | `--content-density-gap` | `gap-4`, `space-y-4` |

**TableToolbar (`src/components/admin/table-toolbar.tsx`)**

| Visual Property | CSS Variable | Never Use |
|----------------|-------------|-----------|
| Toolbar spacing | `--content-density-gap` | `gap-3`, `gap-4` |
| Search input radius | `--input-radius` | `rounded-md` |
| Filter/sort button radius | `--btn-radius` | `rounded-lg`, `rounded-full` |
| Button font weight | `--btn-font-weight` | `font-medium` (hardcoded) |
| Transition speed | `--transition-speed` | `transition-all duration-200` |
| Clear button (X) color | `text-muted-foreground` (allowed) | `text-gray-400` |

**ConfirmDialog (`src/components/admin/confirm-dialog.tsx`)**

| Visual Property | CSS Variable | Never Use |
|----------------|-------------|-----------|
| Dialog container radius | `--card-radius` | `rounded-lg` |
| Destructive button color | `text-destructive` / `bg-destructive` (allowed) | `bg-red-600`, `text-red-500` |
| Button radius | `--btn-radius` | `rounded-md` |
| Transition speed | `--transition-speed` | hardcoded `duration-200` |

### Wrapper Component Usage

Where possible, shared components should compose the DS wrapper components:

- **DSCard** (`@/components/ui/ds-card`) — Use as the outer container for AdminDataTable. Automatically applies `--card-padding`, `--card-radius`, `--card-shadow`, `--card-border-width`, `--card-border-style`.
- **DSSection** (`@/components/ui/ds-section`) — Use for spacing between major page sections (e.g., between toolbar and table, between table and pagination).
- **DSGrid** (`@/components/ui/ds-grid`) — Use for stat card layouts above tables. Automatically applies `--content-density-gap`.

### Sprint 6 Conversion Rule

When converting existing admin pages (Sprint 6), the conversion includes removing hardcoded styling. Every page touched must be audited for:

1. Hardcoded Tailwind color classes (`text-green-*`, `bg-red-*`, `text-blue-*`, etc.) → replace with semantic tokens
2. Hardcoded spacing (`p-4`, `gap-4`, `space-y-6`) → replace with CSS variable classes
3. Hardcoded radius (`rounded-lg`, `rounded-md`) → replace with CSS variable classes
4. Hardcoded shadows (`shadow-sm`, `shadow-md`) → replace with CSS variable classes
5. Hardcoded chart colors → use `useChartConfig()` hook

**Allowed exceptions** (per `docs/DESIGN_SYSTEM_RULES.md`):
- Font sizes: `text-xs`, `text-sm`, `text-lg`, `text-2xl`
- Font weights in body text: `font-bold`, `font-medium`, `font-semibold`
- Icon sizes: `w-4`, `h-4`, `w-8`, `h-8`
- Micro-spacing (≤0.75rem): `mb-2`, `mt-1`, `ml-1`
- Chart container heights: `min-h-[400px]`, `h-[300px]`
- Animations: `animate-pulse`, `animate-spin`
- Text utilities: `truncate`, `tabular-nums`, `whitespace-nowrap`

### Verification Step

At the end of Sprint 1, run a grep across all new component files to confirm zero hardcoded color classes, zero hardcoded spacing on cards, and zero hardcoded shadows. This is a pass/fail gate before Sprint 1 can be marked complete.

---

## Items NOT In This Blueprint

The following items require further discussion before they can be planned. They are tracked here but will NOT be built until discussed and approved:

**Intentionally Deferred (not blocked — waiting for app stability):**
- **FR-10** — Payout workflow documentation — will be written once payout features are finalized
- **FR-11** — Feature documentation for all affiliate settings — will be written once settings are stable

**UX items needing discussion:**
- **UX-10** (Breadcrumbs following history vs. sitemap) — Breadcrumbs showing site hierarchy is standard UX. Browser back button handles "return to where I came from." Need to discuss whether changing this is the right call.

**Future blueprint work:**
- **Affiliate Dashboard restructure** (breaking the 7,400-line monolith into route-based pages) — deserves its own blueprint after the Admin Dashboard is solid.
- **Social Dashboard consistency audit** — already fairly consistent. Will audit after admin work is complete.
- **Apply Dashboard Shell to Affiliate and Social dashboards** — after the Shell is proven on Admin (Sprint 4), apply to the other two dashboards in a future sprint.
- **Connected Analytics & BI Layer** — merge Content data (scheduler) + Performance data (Plausible/GA) + Revenue data (affiliate/Stripe) into a unified intelligence layer. Enables questions no siloed tool can answer. Full vision documented in `docs/FUTURE_PLAN_CONNECTED_DATA_VISION.md`.
- **AI Coaching Layer** — feed connected data into AI (Grok/xAI) + n8n automation. AI identifies insights, n8n drafts actions, low-risk auto-executes, high-risk queues for admin approval. Serves admin, users, and affiliates. Depends on Connected Analytics layer. Full vision documented in `docs/FUTURE_PLAN_CONNECTED_DATA_VISION.md`.
- **Build sequence:** UX Overhaul (current blueprint) → Connected Analytics → AI Coaching Layer.

---

## Sprint Continuity Rules

1. Each sprint starts by reading this blueprint and confirming which sprint is current.
2. At the end of each sprint, update this document: mark sprint as COMPLETE, note any carryover items.
3. If a sprint can't finish, document exactly what's done and what remains.
4. Sprint dependencies: Sprint 1 must complete before Sprint 6. Sprint 4 (Dashboard Shell) should complete before applying the Shell to other dashboards in future work. All other sprints are independent and can run in any order.
5. After Sprint 6, the team will assess whether a second blueprint is needed for the Affiliate Dashboard restructure and applying the Dashboard Shell to all three dashboards.
6. FR-13 (settings page edit protection) is now decided — Sprint 3 can proceed with this pattern.
7. Grandfathering gaps (GAP-1 through GAP-6) should be scheduled in a future sprint or added to an existing sprint that touches affiliate logic.

---

## Key Files Reference

| File | Role |
|------|------|
| `src/app/admin/layout.tsx` | Admin dashboard layout (where sidebar will live) |
| `src/components/admin/sidebar.tsx` | Current horizontal top-nav (to be replaced) |
| `src/components/layout/header.tsx` | Marketing header (needs hiding on dashboards) |
| `src/app/admin/revenue/page.tsx` | Revenue list page |
| `src/app/admin/crm/page.tsx` | CRM list page |
| `src/app/admin/crm/[userId]/page.tsx` | CRM detail page |
| `src/app/affiliate/dashboard/page.tsx` | Affiliate monolith (7,400 lines — future blueprint) |
| `src/components/social/social-sidebar.tsx` | Social sidebar (reference for admin sidebar) |
| `docs/DESIGN_SYSTEM_RULES.md` | Where UX Standards rules will be added |
| `.agents/skills/design-system/SKILL.md` | Agent skill to enforce standards |

---

*This blueprint tracks all issues found during Admin Dashboard QA testing (Sections 0.3–1.20e). It will be updated as sprints complete.*
