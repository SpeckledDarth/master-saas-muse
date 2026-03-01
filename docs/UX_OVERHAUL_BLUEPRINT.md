# UX Overhaul Blueprint — PassivePost Admin Dashboard

> **Created:** February 28, 2026
> **Status:** Sprints 1–9A COMPLETE — Sprints 9B–9C NOT STARTED (restructured from 3 sprints to 7 sub-sprints)
> **Scope:** Fix all UI/UX inconsistencies, bugs, and implement all agreed Feature Requests from human QA testing of the Admin Dashboard (Sections 0.3–1.20e of Testing Plan)
> **Estimated Sessions:** 15 sprints (one session each)

## Progress Tracker

| Sprint | Name | Status | Bugs/Issues Addressed |
|--------|------|--------|----------------------|
| 1 | Shared UX Components + Standards | COMPLETE | UX-02, UX-05, UX-06, UX-08, WC-03, WC-07, WC-09 |
| 2 | Critical Bug Fixes | COMPLETE | BUG-01, BUG-02, BUG-03, BUG-09, BUG-10, BUG-11 |
| 3 | More Bug Fixes + UX Quick Wins | COMPLETE | BUG-12, BUG-13, BUG-14, BUG-15, BUG-16 |
| 4A | Dashboard Shell + Navigation | COMPLETE | UX-01, UX-12, FR-03, FR-04, WC-02, WC-05 |
| 4B | Dashboard Shell Polish | COMPLETE | UX-07, UX-09, WC-01 |
| 5 | Command Palette + Impersonate + Cross-Linking | COMPLETE | BUG-04–08, UX-15, FR-08 |
| 6A | Utility Components + First 3 Page Conversions | COMPLETE | UX-02, UX-03, UX-05, UX-06, UX-11, WC-04, WC-06, WC-07, WC-08, WC-10 |
| 6B | Remaining Page Conversions + Verification | COMPLETE | UX-04, UX-13, WC-04, WC-08 |
| 7A | Confirm Dialogs + Small UX Fixes + EditableSettingsGroup Component | COMPLETE | UX-06 (remaining), UX-11, UX-14, FR-13 (component only) |
| 7B | Affiliate Settings Edit-Protection + Best Practices Reset | COMPLETE | FR-05, FR-13 (affiliate settings) |
| 8A | Contact Fields: Database + API + CRM UI | COMPLETE | FR-01 |
| 8B | Grandfathering Gaps | COMPLETE | FR-06 (GAP-1–6) |
| 9A | Discount Code Auto-Generation + Self-Branding | COMPLETE | FR-07 |
| 9B | Broadcast Summary Cards + File Upload | NOT STARTED | FR-02, FR-09 |
| 9C | Settings Edit-Protection on Remaining Pages | NOT STARTED | FR-13 (remaining pages) |

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

**Visual Reference (Vercel benchmark) — MANDATORY: Look at these images before writing any sidebar code.**

| # | File | What It Shows |
|---|------|---------------|
| 1 | `attached_assets/image_1772304093165.png` | **Vercel project overview — annotated.** "App Logo" arrow points to top-left (project icon + name). "User Acct Info" arrow points to bottom-left (user avatar pinned at footer). Shows Usage, Support, Settings as a separate bottom group in the sidebar. This is the structural reference for sidebar zones. |
| 2 | `attached_assets/image_1772316808365.png` | **Vercel top-level sidebar (clean, no annotations).** Shows the flat nav list. Some items are direct links (Overview, Deployments, Logs, Analytics). Others have a `>` chevron indicating drill-down sub-pages (Observability, Firewall, AI Gateway). Usage, Support, Settings pinned near bottom. |
| 3 | `attached_assets/image_1772303441657.png` | **Vercel top-level sidebar — annotated.** Green arrow highlights items with `>` chevrons (Flags, Agent, AI Gateway). These are the drill-down parents. Items without chevrons navigate directly. |
| 4 | `attached_assets/image_1772303557992.png` | **Vercel drilled into "Flags" — annotated.** "Top" arrow points to the back button (labeled "Flags" with `<` arrow). "Sub" arrow points to sub-items grouped under uppercase section headers (VERCEL FLAGS, MARKETPLACE, RESOURCES). This is the drill-down pattern to replicate. |
| 5 | `attached_assets/image_1772316861087.png` | **Vercel drilled into "Flags" — annotated (second angle).** Same drill-down view showing back button at top, grouped sub-items below. Shows "Overview" as first item inside the drilled group. |
| 6 | `attached_assets/image_1772303665694.png` | **Vercel Deployments list page.** Sidebar in top-level state. Content area uses full remaining width. Demonstrates sidebar staying compact while data-heavy content fills the rest. |
| 7 | `attached_assets/image_1772303695683.png` | **Vercel deployment detail page.** Shows horizontal sub-tabs (Deployment, Logs, Resources, Source, Open Graph) inside the CONTENT area — NOT in the sidebar. Tabs belong to the content, not the nav. |
| 8 | `attached_assets/image_1772305134858.png` | **Vercel deployment detail — annotated.** Green arrows highlight Usage, Support, Settings pinned at the bottom of the sidebar as a visually separate group from the main navigation items above. |
| 9 | `attached_assets/image_1772307185333.png` | **PassivePost CURRENT state (BEFORE).** Shows the old horizontal top-nav + sub-nav + left sidebar layout. This is what the Dashboard Shell replaces. The horizontal "Business, Support, Content, Growth, Settings, System" tabs at the top must become the vertical drill-down sidebar. |

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
| WC-01 | **Keyboard shortcuts** — `Cmd/Ctrl+K` opens command palette, `Cmd/Ctrl+/` focuses sidebar search, `Escape` closes drill-down and returns to top-level sidebar | Sprint 4B | Free — wiring events to existing components |
| WC-02 | **Recently visited** — small "Recent" section at top of sidebar showing 3-5 most recently visited pages for quick navigation | Sprint 4A | Free — building sidebar from scratch anyway |
| WC-03 | **Coaching-language empty states** — instead of generic "No results found," each table has contextual coaching text that guides the admin toward action (e.g., "No affiliates yet. Share your affiliate program link to start recruiting partners.") | Sprint 1 | Free — just string content in the empty state prop |
| WC-04 | **Relative timestamps with absolute tooltip** — all dates show "3 hours ago," "Yesterday," "Feb 14" with full absolute timestamp on hover. One utility function used everywhere. | Sprint 6A | Free — one function, applied during page conversions |
| WC-05 | **Sidebar nav badge counts** — small count badges on nav items showing actionable quantities (Tickets (3), Applications (2), Payouts (1)). Attention magnets that tell the admin where to act without clicking through every page. | Sprint 4A | Free — building sidebar from scratch anyway |
| WC-06 | **Inline health indicators on list rows** — small colored dot (green/yellow/red) next to each row based on simple rules: CRM (active/trial/churned), Affiliates (earning/dormant/flagged), Revenue (paid/pending/overdue) | Sprint 6A | Free — applying status indicator pattern already defined in Design Decision #2 |
| WC-07 | **CSV export on every list page** — one utility function that serializes visible table data to CSV and triggers browser download. Built into TableToolbar, available on every page that uses it. | Sprint 1 (utility) + Sprint 6A/6B (application) | Free — one function in Sprint 1, auto-available to all pages in Sprint 6A/6B |
| WC-08 | **Toast notifications for all mutations** — consistent success/error toasts on every save, create, update, delete action. Currently inconsistent — some pages show feedback, some don't. | Sprint 6A + 6B | Free — one line per mutation during page conversions |
| WC-09 | **Bulk action checkboxes (foundation)** — add optional select-row checkbox column to AdminDataTable. Enables future bulk actions (bulk role change, bulk approve applications, bulk close tickets). | Sprint 1 | Low-cost — few lines in the data table component |
| WC-10 | **Sparkline mini-charts in key list rows** — tiny 30-day trend line (thin SVG) in Revenue and Affiliate Members rows giving instant trend visibility without clicking into detail. One small reusable component. | Sprint 6A | Low-cost — one small SVG component, applied to 2-3 pages |

---

## Sprint Plan

8 sprints, each designed to complete in one session (3-5 tasks, clear done-test). Sprints are ordered by dependency and impact. Every sprint starts clean and ends clean.

---

### Sprint 1: Shared UX Components + Standards — COMPLETE

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

### Sprint 2: Critical Bug Fixes — COMPLETE

**Goal:** Fix the highest-impact functional bugs that make the product feel broken. These are independent of the UX component work.

| Task | Description | Files | Status |
|------|-------------|-------|--------|
| S2-T1 | Fix login redirect — paid users should land on `/dashboard/social/overview`, team members on `/admin` (not homepage) | `src/app/api/user/role/route.ts`, `src/app/(auth)/login/page.tsx`, `src/app/auth/callback/route.ts` | DONE |
| S2-T2 | Hide marketing header/banner on all dashboard routes (`/admin/*`, `/dashboard/*`, `/affiliate/*`) | `src/components/layout/header.tsx` | DONE |
| S2-T3 | Fix Revenue summary stats showing $0.00 — summary now uses unfiltered data, accepts both 'paid' and 'succeeded' statuses, deduplicates invoice+payment records | `src/app/api/admin/revenue/route.ts` | DONE |
| S2-T4 | Fix CRM list revenue column showing empty — now accepts both 'paid' and 'succeeded' statuses, includes payments (deduplicated against invoices) | `src/app/api/admin/crm/route.ts` | DONE |
| S2-T5 | Fix milestone earned count — now uses actual `affiliate_milestone_awards` table instead of live threshold calculation | `src/app/api/affiliate/milestones/route.ts`, `src/app/admin/setup/affiliate/page.tsx` | DONE |

**Done Test:** Login as paid user → lands on social dashboard. Login as team member → lands on admin. No marketing header on any dashboard. Revenue stats show real numbers. CRM revenue column matches Revenue page data. New milestones show 0 earned.

**Addresses:** BUG-01, BUG-02, BUG-03, BUG-09, BUG-10, BUG-11

---

### Sprint 3: More Bug Fixes + UX Quick Wins — COMPLETE

**Goal:** Fix remaining high-priority bugs and apply quick UX improvements that don't require full page conversions.

| Task | Description | Files | Status |
|------|-------------|-------|--------|
| S3-T1 | Fix commission rate FOUC — show loading spinner until settings are fetched, with error fallback to defaults | `src/app/affiliate/page.tsx` | DONE |
| S3-T2 | Fix contest creation error — `prize_description` was sending NULL to NOT NULL column; now sends empty string; improved error reporting in UI | `src/app/api/affiliate/contests/route.ts`, `src/app/admin/setup/affiliate/page.tsx` | DONE |
| S3-T3 | Fix payout batch approval showing "Rejected" — added optimistic UI update so status reflects immediately before refetch | `src/app/admin/setup/affiliate/page.tsx` | DONE |
| S3-T4 | Add payout batch duplicate prevention — API now checks for existing pending batch before generating a new one | `src/app/api/affiliate/payout-batches/route.ts` | DONE |
| S3-T5 | Fix affiliate admin sub-banner rendering — changed TabsList from `flex-wrap` to horizontal scroll to prevent vertical overflow | `src/app/admin/setup/affiliate/page.tsx` | DONE |

**Done Test:** Commission rate loads without flash. Contests can be created. Payout approval shows correct status. Cannot create duplicate batches. Sub-banner renders correctly.

**Addresses:** BUG-12, BUG-13, BUG-14, BUG-15, BUG-16

---

### Sprint 4A: Dashboard Shell + Navigation Overhaul — COMPLETE

**Goal:** Build the Dashboard Shell component and apply it to the admin dashboard. This is the big structural work — vertical sidebar with drill-down sub-menus, user account pinned at bottom, no horizontal nav, no top header bar inside dashboards.

| Task | Description | Files | Status |
|------|-------------|-------|--------|
| S4A-T1 | Add pending affiliate application + payout batch counts to sidebar-counts API | `src/app/api/admin/sidebar-counts/route.ts` | DONE |
| S4A-T2 | Build admin vertical sidebar component using shadcn/ui Sidebar — 8 nav groups (Dashboard, People, Money, Affiliates, Support, Content, Settings, System), badge counts, "Recently Visited" (localStorage), user footer with dropdown, permission-based filtering | `src/components/admin/admin-sidebar.tsx` | DONE |
| S4A-T3 | Update admin layout — replace horizontal top-nav with SidebarProvider + vertical sidebar. Content header with breadcrumbs, command palette, theme toggle. Mobile hamburger trigger. | `src/app/admin/layout.tsx` | DONE |
| S4A-T4 | Create `/admin/affiliate` redirect route to `/admin/setup/affiliate` | `src/app/admin/affiliate/page.tsx` | DONE |

**Done Test:** Admin dashboard uses vertical sidebar. User account pinned at sidebar bottom. "Recently Visited" shows last 3-5 pages. Badge counts appear on Tickets/Applications/Payouts/Users/Revenue. No horizontal nav visible. Mobile sidebar works (hamburger overlay via SidebarTrigger). Affiliates accessible at `/admin/affiliate` (redirects to `/admin/setup/affiliate`). Breadcrumbs and command palette in content header.

**Addresses:** UX-01, UX-12, FR-03, FR-04, WC-02, WC-05

---

### Sprint 4B: Dashboard Shell Polish + Quick Fixes — COMPLETE

**Goal:** Add keyboard shortcuts, fix CRM tab persistence, and standardize money display across all admin pages. These are polish items that build on the Dashboard Shell from Sprint 4A.

| Task | Description | Files | Status |
|------|-------------|-------|--------|
| S4B-T1 | Add keyboard shortcuts — `Cmd/Ctrl+K` opens command palette (already worked), `Escape` closes drill-down and returns to top-level sidebar (WC-01). Note: `Cmd/Ctrl+/` deferred — no sidebar search bar exists yet; search lives in command palette via Cmd+K. | `src/components/admin/admin-sidebar.tsx` | DONE |
| S4B-T2 | Fix CRM detail tab persistence — use URL search params (`?tab=`) so refreshing preserves the active tab | `src/app/admin/crm/[userId]/page.tsx` | DONE |
| S4B-T3 | Standardize money display — show "$0.00" everywhere (never em-dash for money). Fixed affiliate member table zero-earnings display. All other money fields already used `formatCurrency()` which formats zeros correctly. | `src/app/admin/setup/affiliate/page.tsx` | DONE |

**Done Test:** `Cmd/Ctrl+K` opens palette, `Escape` closes drill-down. CRM detail refresh preserves the active tab via `?tab=` URL param. Money displays consistently as "$0.00" format — no em-dashes for zero amounts.

**Addresses:** UX-07, UX-09, WC-01

---

### Sprint 5: Command Palette + Impersonate + Cross-Linking — COMPLETE

**Goal:** Fix the two biggest functional gaps (search and impersonation) and implement the cross-linking pattern with collapsible accordion sections on detail pages.

| Task | Description | Files | Status |
|------|-------------|-------|--------|
| S5-T1 | Fix command palette search — replaced slow all-user fetch with DB-level `user_profiles` search + email match. Invoice/subscription results now show user names. | `src/app/api/admin/search/route.ts` | DONE |
| S5-T2 | Make command palette tickets clickable — created `/admin/feedback/[id]` detail page with ticket info, comments, reply form, status/priority controls, and submitter cross-link to CRM. Created `/api/admin/feedback/[id]` API route. | `src/app/admin/feedback/[id]/page.tsx`, `src/app/api/admin/feedback/[id]/route.ts` | DONE |
| S5-T3 | Fix impersonate — redirects now go to `/dashboard/social/overview` instead of `/`. Created `src/lib/effective-user.ts` helper for server-side user ID swapping. Banner already works. Note: Full API-level data swap deferred — requires updating all social API routes to use `getEffectiveUserId()`. | `src/lib/effective-user.ts`, CRM detail page, Users page | DONE (redirect fixed, data swap deferred) |
| S5-T4 | Added "Summary" tab to CRM detail as default — collapsible accordion sections for Revenue & Transactions, Affiliate Activity, Support Tickets, Activity Timeline, Notes, Contracts. Invoice amounts link to revenue detail. Ticket subjects link to feedback detail. "View all" links switch to dedicated tabs. | `src/app/admin/crm/[userId]/page.tsx` | DONE |
| S5-T5 | Cross-linking — affiliate member names link to CRM, contest winners link to CRM, DetailModal supports link-type fields. Revenue and subscription detail pages already had cross-links. | `src/app/admin/setup/affiliate/page.tsx`, `src/components/admin/DetailModal.tsx` | DONE |

**Done Test:** Command palette finds users by partial name/email. Clicking a ticket result navigates to detail page. Impersonation redirects to user dashboard with banner. CRM Summary tab shows all related data in accordions with cross-links. Person names across admin pages link to CRM.

**Addresses:** BUG-04, BUG-05, BUG-06, BUG-07, BUG-08, UX-15, FR-08

**Remaining work (deferred from S5-T3):** Update social API routes to use `getEffectiveUserId()` so impersonated view shows the target user's actual data, not just the admin's data with a banner.

---

### Sprint 6A: Utility Components + First 3 Page Conversions — COMPLETE

**Goal:** Build the utility components (relative timestamps, sparkline), then convert the first 3 admin pages to use the shared AdminDataTable, TableToolbar, and ConfirmDialog built in Sprint 1.

| Task | Description | Files | Status |
|------|-------------|-------|--------|
| S6A-T1 | Built `formatRelativeTime()` utility — returns "Just now", "3m ago", "Yesterday", "Feb 14" etc. Also `formatAbsoluteTime()` and `<RelativeTime>` component with tooltip. | `src/lib/format-relative-time.tsx` | DONE |
| S6A-T2 | Built `<Sparkline>` SVG polyline component — configurable width/height/color/strokeWidth, design system compliant default colors. | `src/components/admin/sparkline.tsx` | DONE |
| S6A-T3 | Converted User Management — AdminDataTable with sorting/pagination/clickable rows, TableToolbar with search + role filter + CSV, ConfirmDialog for delete, health dot indicators (green=subscribed, yellow=pending, red=inactive), RelativeTime for all timestamps. | `src/app/admin/users/page.tsx` | DONE |
| S6A-T4 | Converted Waitlist — AdminDataTable with sorting, TableToolbar with search + referral source filter + CSV, ConfirmDialog for delete (replaced browser confirm()), RelativeTime for signup dates. | `src/app/admin/waitlist/page.tsx` | DONE |
| S6A-T5 | Converted Team — Two AdminDataTables (members + invitations), TableToolbar with search + role filter + CSV, ConfirmDialog for remove member and cancel invitation (replaced confirm()), RelativeTime for all dates. Kept Role Permissions collapsible and Invite dialog. | `src/app/admin/team/page.tsx` | DONE |

**Done Test:** All 3 converted pages use AdminDataTable + TableToolbar + ConfirmDialog. Zero browser `confirm()` calls. Health dots on User rows. Relative timestamps on all pages. Toast on all mutations. CSV export in every toolbar. Clickable rows on User Management.

**Note:** Sparkline component built but not yet wired into Revenue list or Affiliate Members list rows — those pages are being converted in Sprint 6B.

**Addresses:** UX-02, UX-03, UX-05, UX-06, UX-11, WC-04, WC-06, WC-07, WC-08, WC-10

---

### Sprint 6B: Remaining Page Conversions + Final Verification

**Goal:** Convert the last 2 admin pages and verify consistency across all converted pages.

| Task | Description | Files |
|------|-------------|-------|
| S6B-T1 | Convert Feedback page — replaced Card list with AdminDataTable (7 columns: Email, Message, NPS, Status, Page URL, Date, Actions), added TableToolbar with search + status filter + CSV export, replaced `confirm()` with ConfirmDialog, used RelativeTime for timestamps, clickable rows → `/admin/feedback/${id}`. | `src/app/admin/feedback/page.tsx` | DONE |
| S6B-T2 | Convert Audit Logs page — replaced raw Table with AdminDataTable (5 columns: Time, User, Category, Action, Details), replaced manual filter Selects with TableToolbar (category + action filters), added Refresh button to toolbar, used RelativeTime for timestamps, kept server-side pagination (pageSize={50} hides internal pagination), kept Suspense wrapper, kept Dialog detail view on row click. | `src/app/admin/audit-logs/page.tsx` | DONE |
| S6B-T3 | Final consistency verification — all 5 pages (Users, Waitlist, Team, Feedback, Audit Logs) use AdminDataTable + TableToolbar + ConfirmDialog (where applicable) + RelativeTime. Zero `confirm()` calls. Health dots on User rows. CSV export on 4/5 toolbars (Audit Logs excluded — read-only). Toast on all mutations. Build compiles clean. | All converted admin pages | DONE |
| S6B-T4 | Wired shared Sparkline component into Revenue summary card (30-day daily trend) and Affiliate Members table (30-day earnings trend per member). Modified `/api/admin/revenue` to return `dailyTrend` array and `/api/affiliate/members` to return `earningsTrend` per member. | `src/app/admin/revenue/page.tsx`, `src/app/api/admin/revenue/route.ts`, `src/app/admin/setup/affiliate/page.tsx`, `src/app/api/affiliate/members/route.ts` | DONE |
| S6B-T5 | Made discount codes clickable with detail dialog (UX-13). Clicking a discount code row opens a detail dialog showing code name, status, discount value, duration, usage stats, revenue impact, linked affiliate (CRM cross-link), Stripe IDs, and action buttons. | `src/app/admin/setup/discount-codes/page.tsx` | DONE |

**Done Test:** All 5 converted pages use the same table component, same toolbar pattern, same confirmation dialogs. Rows are clickable where detail views exist. No browser `confirm()` calls remain on any converted page. All dates show relative timestamps with absolute tooltip on hover. Health dots appear on User and Affiliate rows. Toast notifications confirm every mutation. Sparkline shows 30-day revenue trend in the Revenue summary card. Sparkline shows 30-day earnings trend per affiliate in the Members table. Discount codes are clickable for a detail dialog view. CSV export works from every toolbar.

**Note on duplicate sparkline implementations:** The admin dashboard page (`src/app/admin/page.tsx`) uses a local `SparklineChart` that renders as a bar chart with day labels — visually distinct from the shared SVG polyline `Sparkline`. The flywheel reports (`src/components/affiliate/flywheel-reports.tsx`) uses 3 different visualization types (dual bars, progress bars). These are intentionally different visualization patterns and were not consolidated into the shared component.

**Addresses:** UX-04, UX-13, WC-04, WC-08, WC-10

---

### Sprint 7A: Confirm Dialogs + Small UX Fixes + EditableSettingsGroup Component

**Goal:** Replace every remaining browser `confirm()` call with the shared ConfirmDialog component, fix two small UX issues (role confirmation, date clear), and build the reusable EditableSettingsGroup component. All files touched in this sprint are under 52KB. No large file refactors.

| Task | Description | Files |
|------|-------------|-------|
| S7A-T1 | Replace 7 remaining browser `confirm()` calls with ConfirmDialog — integrations (1), passivepost (1), affiliate (2: delete affiliate record, delete application), email-templates (1), blog (1), sso (1). After this, zero `confirm()` calls should remain in any admin page. | `src/app/admin/setup/integrations/page.tsx` (21KB), `src/app/admin/setup/passivepost/page.tsx` (51KB), `src/app/admin/setup/affiliate/page.tsx` (212KB — only the 2 confirm calls, no other changes), `src/app/admin/email-templates/page.tsx` (24KB), `src/app/admin/blog/page.tsx` (17KB), `src/app/admin/sso/page.tsx` (13KB) |
| S7A-T2 | UX-11: Add role change confirmation on Users page — wrap role Select in a ConfirmDialog ("Change role from X to Y?") before firing the API call. UX-14: Add "Clear Dates" button next to Revenue page date filters that resets dateFrom and dateTo in one click. | `src/app/admin/users/page.tsx` (36KB), `src/app/admin/revenue/page.tsx` (15KB) |
| S7A-T3 | Build reusable `<EditableSettingsGroup>` component (FR-13 foundation). **Props:** `title: string` (group heading), `description?: string` (optional subtext), `children: ReactNode` (the form fields), `onSave: () => Promise<void>` (called when Save clicked), `isSaving?: boolean` (shows spinner on Save button). **Internal state:** `isEditing` boolean (default `false`). **When not editing:** renders a header row with `title` + pencil-icon "Edit" button; wraps `children` in a `<fieldset disabled>` so all nested inputs, selects, switches, and sliders appear grayed out and non-interactive. **When editing:** "Edit" button replaced by "Save" (primary) and "Cancel" (ghost) buttons; `<fieldset>` is no longer disabled so all fields become interactive. **On Save:** calls `onSave()`, awaits completion, then sets `isEditing` back to `false`. **On Cancel:** sets `isEditing` to `false` without saving. **Container:** `<DSCard>` with design system padding (`--card-padding`), radius (`--card-radius`), shadow (`--card-shadow`). All styling uses design system CSS variables — no hardcoded colors, spacing, radius, or shadows. | `src/components/admin/editable-settings-group.tsx` (NEW FILE) |

**Done Test:** Running `grep -rn "confirm(" src/app/admin/ | grep -v ConfirmDialog | grep -v onConfirm | grep -v confirmText | grep -v confirmLabel | grep -v confirmButton | grep -v import | grep -v "//"` returns zero results (this filters out legitimate uses like ConfirmDialog props and imports — only raw browser `confirm()` calls would remain). Role change on Users page shows confirmation dialog before firing. Revenue date filters have a Clear Dates button. EditableSettingsGroup component exists, renders correctly with disabled fieldset pattern, and toggles between read-only and edit modes.

**Addresses:** UX-06 (remaining `confirm()` calls), UX-11, UX-14, FR-13 (component only)

---

### Sprint 7B: Affiliate Settings Edit-Protection + Best Practices Reset

**Goal:** Apply the EditableSettingsGroup component (built in 7A) to the affiliate settings page, and add the "Reset to Best Practices" button. This sprint focuses entirely on one large file (`src/app/admin/setup/affiliate/page.tsx`, 212KB). The file is large because it contains all affiliate admin tabs (Members, Applications, Settings, Broadcasts, etc.) in a single monolith.

| Task | Description | Files |
|------|-------------|-------|
| S7B-T1 | Apply EditableSettingsGroup to Affiliate Settings page (FR-13). Wrap each settings section in its own EditableSettingsGroup. Groups: Commission Settings (rate, duration, min payout, cookie, attribution), Leaderboard Settings, Re-Engagement Settings, Payout Automation, Two-Tier Referrals, Fraud Detection, Surveys. Each group editable independently — editing one group does not unlock others. Each group's "Save" button calls the existing settings save API for that group's fields only. | `src/app/admin/setup/affiliate/page.tsx` (212KB) |
| S7B-T2 | Add "Reset to Best Practices" button (FR-05) at top of affiliate settings. Restores all 9 agreed defaults (20% commission, recurring, 60-day cookie, $50 min payout, monthly, 12-month residual, manual review, first-touch, 3 tiers enabled). ConfirmDialog before reset. See Design Decision #9 ("Best Practice Defaults + Info Tooltips") in this document for the authoritative table of all 9 defaults with tooltip reasoning text. | `src/app/admin/setup/affiliate/page.tsx` (212KB) |

**Done Test:** All affiliate settings groups are read-only by default with Edit button to unlock. Clicking Edit on one group does NOT unlock other groups. Save returns the group to read-only. Cancel discards changes and returns to read-only. "Reset to Best Practices" button exists at the top of settings, shows a ConfirmDialog before resetting, and restores all 9 values from Design Decision #9.

**Addresses:** FR-05, FR-13 (affiliate settings)

---

### Sprint 8A: Contact Fields — Database + API + CRM UI

**Goal:** Create the 4 contact-related database tables from FR-01, add profile columns, build all CRUD API routes, and wire everything into the CRM detail page. This sprint creates new files (migration, API routes) and modifies one existing page (CRM detail, 42KB). No large file refactors.

| Task | Description | Files |
|------|-------------|-------|
| S8A-T1 | Create FR-01 database tables + profile columns. Tables: `user_phone_numbers` (id, user_id, label, phone_number, is_primary, created_at), `user_email_addresses` (id, user_id, label, email, is_primary, is_verified, created_at), `user_addresses` (id, user_id, label, street, city, state, zip, country, is_primary, created_at), `user_social_links` (id, user_id, platform, url, created_at). Add columns to `user_profiles` via ALTER TABLE ADD COLUMN IF NOT EXISTS: first_name, last_name, company, job_title, website. Run on Replit Postgres, provide Supabase SQL. **Important context:** `user_profiles` already has basic 1-to-1 contact columns (`phone`, `address_line1`, `address_line2`, `city`, `state`, `postal_code`, `country`) from migration `011_crm_foundation.sql`. Those existing columns remain as-is for primary contact info. The new `user_phone_numbers` and `user_addresses` tables handle the 1-to-many pattern (multiple phones, multiple addresses per user). Do not remove or modify the existing columns. | `migrations/core/017_contact_fields.sql` (NEW FILE) |
| S8A-T2 | Build CRUD API routes for each contact table: `/api/admin/crm/[userId]/phones`, `/api/admin/crm/[userId]/emails`, `/api/admin/crm/[userId]/addresses`, `/api/admin/crm/[userId]/social-links` (each: GET, POST, PUT, DELETE). Update `/api/user/profile` to accept and return the new 1-to-1 fields (first_name, last_name, company, job_title, website). **Boundary:** These routes are MuseKit core (CRM is core infrastructure, not PassivePost-specific). They belong outside `/social/` directories per the boundary rules in the project-context skill. | New route files under `src/app/api/admin/crm/[userId]/phones/route.ts`, `src/app/api/admin/crm/[userId]/emails/route.ts`, `src/app/api/admin/crm/[userId]/addresses/route.ts`, `src/app/api/admin/crm/[userId]/social-links/route.ts` (all NEW FILES), `src/app/api/user/profile/route.ts` (existing, modify) |
| S8A-T3 | Wire contact sections into CRM detail page. Add accordion sections to the Summary tab: Phone Numbers, Email Addresses, Addresses, Social Links — each with Add button, inline edit/delete, is_primary indicator. Add first_name, last_name, company, job_title, website to the Profile tab. Use design system components (DSCard, ConfirmDialog for delete). | `src/app/admin/crm/[userId]/page.tsx` (42KB) |

**Done Test:** All 4 contact tables exist in Replit Postgres. CRUD API routes return 200 with correct data (test each: GET returns list, POST creates record, PUT updates record, DELETE removes record). CRM detail page shows Phone, Email, Address, Social Link accordion sections with add/edit/delete and is_primary indicator. Profile tab shows first_name, last_name, company, job_title, website fields. Supabase migration SQL provided to user.

**Addresses:** FR-01

---

### Sprint 8B: Grandfathering Gaps (FR-06)

**Goal:** Fix all 6 grandfathering gaps found during the FR-06 audit. This sprint touches critical business logic in `src/lib/affiliate/index.ts` (8KB), adds ALTER TABLE statements to the migration file from 8A, and adds audit logging to the affiliate settings page (212KB — targeted changes only, not a full refactor). This is the most business-critical sprint — grandfathering is a core integrity promise per the business philosophy.

| Task | Description | Files |
|------|-------------|-------|
| S8B-T1 | Fix GAP-1 and GAP-2: When `lockInAffiliateTerms()` runs, auto-generate a contract record with structured locked values. Add a `terms` JSONB field to the contracts table (via ALTER TABLE ADD COLUMN IF NOT EXISTS in `migrations/core/017_contact_fields.sql`) that stores the actual locked values: `{ commission_rate, duration_months, cookie_duration_days, min_payout_cents }`. The contract body remains for legal text, but the `terms` field is the machine-readable source of truth. | `src/lib/affiliate/index.ts` (8KB), `migrations/core/017_contact_fields.sql` |
| S8B-T2 | Fix GAP-3 and GAP-4: Add `locked_cookie_duration_days` (INTEGER) and `locked_min_payout_cents` (INTEGER) columns to `referral_links` via ALTER TABLE ADD COLUMN IF NOT EXISTS in `migrations/core/017_contact_fields.sql`. Update `lockInAffiliateTerms()` to populate both new columns from the current global affiliate settings when locking terms. | `src/lib/affiliate/index.ts` (8KB), `migrations/core/017_contact_fields.sql` |
| S8B-T3 | Fix GAP-5: Verify that the affiliate dashboard contract section shows active agreement terms, effective date, expiration date, months remaining, and signed status. If any of these are missing or incorrect, fix the display. Do NOT refactor the affiliate dashboard monolith — make targeted fixes only. | `src/app/affiliate/dashboard/page.tsx` (361KB — read the contract section only, make targeted fixes) |
| S8B-T4 | Fix GAP-6: Add audit log entries for affiliate settings changes. When the admin saves changed affiliate settings, create an audit log entry capturing the old value and new value for each changed field. | `src/app/admin/setup/affiliate/page.tsx` (212KB — add audit logging to the existing save handler, no other changes) |

**Done Test:** `lockInAffiliateTerms()` locks all 4 values (rate, duration, cookie, min payout) and auto-creates a contract with structured `terms` JSONB. `referral_links` table has `locked_cookie_duration_days` and `locked_min_payout_cents` columns. Affiliate dashboard contract section shows active terms, expiration, and months remaining. Changing affiliate settings creates an audit log entry with old and new values. **Critical verification:** Changing global commission rate does NOT change `locked_commission_rate` on existing `referral_links` rows — only affiliates enrolled after the change get the new rate. Supabase migration SQL provided to user (same file as 8A, run once).

**Addresses:** FR-06 (GAP-1 through GAP-6)

---

### Sprint 9A: Discount Code Auto-Generation + Self-Branding (FR-07)

**Goal:** Implement the dual-attribution discount code system. Auto-generate a branded discount code when an affiliate is approved, and allow affiliates to rename their code from their dashboard with coaching text. This sprint touches two API route files (both under 11KB) and the affiliate dashboard monolith (361KB — targeted changes to the discount code section only, not a full refactor). See Design Decision #11 ("Affiliate-Branded Discount Codes") for the full specification including naming rules, coaching text, and collision policy.

| Task | Description | Files |
|------|-------------|-------|
| S9A-T1 | Auto-generate branded discount code on affiliate approval (FR-07). After creating referral link in the approval flow, auto-generate a code based on affiliate name + discount percentage (e.g., "STEELE20"). Validation: uppercase, alphanumeric only, 4-20 characters. Reserved words blocked: "DISCOUNT", "FREE", "TEST", "ADMIN", "PASSIVEPOST" and similar. Collision handling: if code exists, auto-suffix with incrementing numbers (e.g., "STEELE20" taken → try "STEELE201", "STEELE202"). One active branded code per affiliate by default. | `src/app/api/affiliate/applications/review/route.ts` (11KB), `src/app/api/affiliate/discount-codes/route.ts` (3KB) |
| S9A-T2 | Affiliate self-branding for discount codes (FR-07 continued). Add a rename UI in the affiliate dashboard's discount code section. 30-day cooldown between renames (enforce server-side, show remaining days in UI). Collision detection: if requested code is taken, show coaching message and 3-4 auto-suggested alternatives based on affiliate name/username/discount. Coaching text as specified in Design Decision #11: personal brand guidance on creation, pro tip about saying code out loud, performance tip about sharing everywhere. | `src/app/affiliate/dashboard/page.tsx` (361KB — discount code section only), `src/app/api/affiliate/discount-codes/route.ts` (3KB) |

**Done Test:** Approving an affiliate application auto-creates a linked discount code (e.g., "STEELE20"). Code follows naming rules (uppercase, alphanumeric, 4-20 chars). Reserved words are blocked. Collisions handled with numeric suffix. Affiliates can see their code on their dashboard. Affiliates can rename their code (30-day cooldown enforced). Taking a taken code shows coaching message + 3-4 suggestions. Coaching text is visible on the discount code management section.

**Addresses:** FR-07

---

### Sprint 9B: Broadcast Summary Cards + Marketing Asset File Upload

**Goal:** Surface broadcast engagement data at the list level with summary cards and sortable columns, and add file upload capability for marketing assets. This sprint adds features to the affiliate settings page (212KB — targeted additions to the broadcasts tab and marketing assets tab) and creates one new component.

| Task | Description | Files |
|------|-------------|-------|
| S9B-T1 | Broadcast summary cards + list enhancements (FR-09). Add 4 summary cards above broadcast list: Average Open Rate (with trend arrow — compare last 5 broadcasts vs prior 5), Average Click Rate, Best Performer (broadcast name + open rate), Last Broadcast (date + name + open/click rates). Add Open Rate % and Click Rate % sortable columns to the broadcast list. Add category tagging on broadcast creation with options: Contest, Tier Change, Policy Update, General. See Design Decision #12 ("Broadcast Performance Surfacing") for full specification. | `src/app/admin/setup/affiliate/page.tsx` (212KB — broadcasts tab section only) |
| S9B-T2 | Marketing asset file upload (FR-02). Build `FileUpload` component (reuse the existing ImageUpload pattern from `src/components/admin/image-upload.tsx` if it exists, otherwise create fresh) supporting PNG, JPG, GIF, SVG, PDF, DOCX, XLSX (10MB limit). Wire into the "Add Asset" dialog on the marketing assets tab — add a toggle between URL input and file upload. Upload to Supabase Storage bucket `affiliate-assets`. Store file_url, file_name, file_size, file_type on the asset record. Affiliates see a download button on their dashboard for uploaded files. **Prerequisite:** The `affiliate-assets` bucket must be created in Supabase Storage (public read access for download URLs, authenticated upload) before this feature can work on Vercel. Include bucket creation instructions in the Supabase migration inventory provided to the user. | `src/components/admin/file-upload.tsx` (NEW FILE), `src/app/admin/setup/affiliate/page.tsx` (212KB — marketing assets tab section only), `src/app/api/affiliate/assets/route.ts` (9KB) |

**Done Test:** Broadcast tab shows 4 summary cards with real data computed from existing broadcasts. Trend arrow on Average Open Rate card shows up/down/flat based on last 5 vs prior 5. Open Rate % and Click Rate % columns visible and sortable in broadcast list. Category tagging dropdown available on broadcast creation dialog. Admin can upload files (PNG, PDF, etc.) from the marketing assets "Add Asset" dialog. Uploaded files stored in Supabase Storage. Affiliates can download uploaded files from their dashboard. Supabase Storage bucket creation instructions provided to user.

**Addresses:** FR-02, FR-09

---

### Sprint 9C: Settings Edit-Protection on Remaining Pages (FR-13 continued)

**Goal:** Apply the EditableSettingsGroup component (built in Sprint 7A, proven on affiliate settings in Sprint 7B) to 5 more high-priority settings pages. This is repetitive pattern application — same component, different pages. All target files are under 43KB. Lower-priority pages (features, content, social, passivepost, watermark) keep their current behavior for now.

| Task | Description | Files |
|------|-------------|-------|
| S9C-T1 | Apply EditableSettingsGroup to the Branding settings page. Identify logical groupings of settings fields (e.g., Logo & Favicon, Brand Colors, Typography, Social Links). Wrap each group in EditableSettingsGroup. Each group editable independently. | `src/app/admin/setup/branding/page.tsx` (43KB) |
| S9C-T2 | Apply EditableSettingsGroup to the Compliance settings page. Identify logical groupings (e.g., Privacy Policy, Terms of Service, Cookie Consent, Data Retention). Wrap each group in EditableSettingsGroup. | `src/app/admin/setup/compliance/page.tsx` (18KB) |
| S9C-T3 | Apply EditableSettingsGroup to the Security, Support, and Pricing settings pages. These are the three smallest files. Security: group by authentication settings, session settings, rate limiting. Support: group by contact info, help center settings. Pricing: group by plan configuration, trial settings. Wrap each group in EditableSettingsGroup. | `src/app/admin/setup/security/page.tsx` (18KB), `src/app/admin/setup/support/page.tsx` (7KB), `src/app/admin/setup/pricing/page.tsx` (10KB) |

**Done Test:** All 5 settings pages (Branding, Compliance, Security, Support, Pricing) show fields as read-only by default. Each logical group has its own "Edit" button. Clicking Edit unlocks only that group. Save returns the group to read-only. Cancel discards changes. No hardcoded colors, spacing, radius, or shadows — all styling uses design system CSS variables.

**Addresses:** FR-13 (remaining pages)

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

The following items require further discussion or are intentionally deferred. They are tracked here but will NOT be built as part of this blueprint:

**Intentionally Deferred (not blocked — waiting for app stability):**
- **FR-10** — Payout workflow documentation — will be written once payout features are finalized
- **FR-11** — Feature documentation for all affiliate settings — will be written once settings are stable

**UX items needing discussion:**
- **UX-10** (Breadcrumbs following history vs. sitemap) — Breadcrumbs showing site hierarchy is standard UX. Browser back button handles "return to where I came from." Need to discuss whether changing this is the right call.

**Deferred implementation work (documented but out of scope for this blueprint):**
- **S5-T3 full data swap** — Social API routes still use `auth.getUser()` directly instead of `getEffectiveUserId()`. Impersonation redirects to the user dashboard with a banner, but the data shown is still the admin's. Full impersonation data swap requires updating all social API routes and is deferred to a future sprint.

**Future blueprint work:**
- **Affiliate Dashboard restructure** (breaking the 7,400-line monolith into route-based pages) — deserves its own blueprint after the Admin Dashboard is solid.
- **Social Dashboard consistency audit** — already fairly consistent. Will audit after admin work is complete.
- **Apply Dashboard Shell to Affiliate and Social dashboards** — after the Shell is proven on Admin (Sprint 4), apply to the other two dashboards in a future sprint.
- **Connected Analytics & BI Layer** — merge Content data (scheduler) + Performance data (Plausible/GA) + Revenue data (affiliate/Stripe) into a unified intelligence layer. Enables questions no siloed tool can answer. Full vision documented in `docs/FUTURE PLAN - CONNECTED_DATA_VISION.md`.
- **AI Coaching Layer** — feed connected data into AI (Grok/xAI) + n8n automation. AI identifies insights, n8n drafts actions, low-risk auto-executes, high-risk queues for admin approval. Serves admin, users, and affiliates. Depends on Connected Analytics layer. Full vision documented in `docs/FUTURE PLAN - CONNECTED_DATA_VISION.md`.
- **Build sequence:** UX Overhaul (current blueprint) → Connected Analytics → AI Coaching Layer.

**Feature Requests now assigned to sprints (moved from this section):**
- FR-01 → Sprint 8A | FR-02 → Sprint 9B | FR-05 → Sprint 7B | FR-06 → Sprint 8B | FR-07 → Sprint 9A | FR-09 → Sprint 9B | FR-13 → Sprints 7A (component) + 7B (affiliate) + 9C (remaining pages)

---

## Sprint Continuity Rules

1. Each sprint starts by reading this blueprint and confirming which sprint is current.
2. At the end of each sprint, update this document: mark sprint as COMPLETE, note any carryover items.
3. If a sprint can't finish, document exactly what's done and what remains.
4. Sprint dependencies:
   - Sprint 1 must complete before Sprint 6A/6B (shared components used in page conversions).
   - Sprint 4A must complete before Sprint 4B (Shell must exist before polish).
   - Sprint 6A must complete before Sprint 6B (utilities built in 6A, remaining pages + verification in 6B).
   - Sprint 4A (Dashboard Shell) should complete before applying the Shell to other dashboards in future work.
   - Sprints 2, 3, and 5 are independent of each other and can run in any order.
   - Sprint 7A must complete before Sprint 7B (EditableSettingsGroup component must exist before it can be applied to affiliate settings).
   - Sprint 7A must complete before Sprint 9C (EditableSettingsGroup component must exist before it can be applied to other settings pages).
   - Sprint 8A must complete before Sprint 8B (migration file with contact tables must exist before grandfathering ALTER TABLE statements are added to it; also the migration must be run before GAP fixes can be tested).
   - Sprint 9A T1 (auto-generate codes) must complete before T2 (self-branding relies on codes existing).
   - Sprints 7A/7B, 8A/8B, and 9A/9B/9C are independent of each other at the group level (7x can run before or after 8x or 9x), but within each group the A/B/C ordering must be respected.
5. After Sprint 9C, the blueprint is fully complete. Next step: assess whether a second blueprint is needed for the Affiliate Dashboard restructure and applying the Dashboard Shell to all three dashboards.

**Sprint summary (15 sprints, 1-5 tasks each, each fits in one session):**

| Sprint | Tasks | Largest File Touched | Focus |
|--------|-------|---------------------|-------|
| 1 | 5 | N/A (new files) | Shared UX components + standards |
| 2 | 5 | Various (under 50KB) | Critical bug fixes |
| 3 | 5 | Various (under 50KB) | More bug fixes + UX quick wins |
| 4A | 4 | Layout (new shell) | Dashboard Shell (structural) |
| 4B | 3 | Various (under 50KB) | Shell polish + quick fixes |
| 5 | 5 | Various (under 50KB) | Command palette + impersonate + cross-linking |
| 6A | 5 | Various (under 50KB) | Utility components + first 3 page conversions |
| 6B | 5 | Various (under 50KB) | Remaining page conversions + final verification |
| 7A | 3 | 51KB (passivepost settings) | Confirm dialogs + small UX fixes + EditableSettingsGroup component |
| 7B | 2 | 212KB (affiliate settings) | Affiliate settings edit-protection + best practices reset |
| 8A | 3 | 42KB (CRM detail) | Contact fields: database + API + CRM UI |
| 8B | 4 | 361KB (affiliate dashboard, targeted) | Grandfathering gaps (critical business logic) |
| 9A | 2 | 361KB (affiliate dashboard, targeted) | Discount code auto-generation + self-branding |
| 9B | 2 | 212KB (affiliate settings, targeted) | Broadcast summary cards + file upload |
| 9C | 3 | 43KB (branding settings) | Settings edit-protection on remaining pages |

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
