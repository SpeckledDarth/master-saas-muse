# Admin Relational Dashboard — Complete Blueprint

> **Created:** February 26, 2026
> **Last Updated:** February 26, 2026
> **Status:** 0 of 18 tasks complete. Sprint 1 ready to begin.
> **Goal:** Transform the admin area from a flat collection of pages into a world-class relational dashboard where every record is a doorway to every related record. Every SaaS built from MuseKit inherits this.

---

## Sprint Status Overview

| Sprint | Focus | Tasks | ✅ Done | ⚠️ Partial | ❌ Not Started | Sprint Status |
|--------|-------|-------|--------|-----------|---------------|---------------|
| Sprint 1: Foundation | Sidebar nav, bug fix, reusable components | T001, T002, T003, T004 | 0 | 0 | 4 | **NOT STARTED** |
| Sprint 2: CRM | People list + detail page with cross-links | T005, T006, T007, T008 | 0 | 0 | 4 | **NOT STARTED** |
| Sprint 3: Revenue & Subscriptions | Financial data views with cross-links | T009, T010, T011, T012 | 0 | 0 | 4 | **NOT STARTED** |
| Sprint 4: Dashboard Home & Search | Command center + Cmd+K + drill-down KPIs | T013, T014, T015 | 0 | 0 | 3 | **NOT STARTED** |
| Sprint 5: Polish & Cross-Linking | Related records sidebar, export, print, final QA | T016, T017, T018 | 0 | 0 | 3 | **NOT STARTED** |
| **Totals** | | **18 tasks** | **0** | **0** | **18** | |

---

## Design Philosophy

### The Four-Layer Depth Model

Every piece of data follows this drill-down pattern:

```
Layer 1: Dashboard Home
   Clickable KPI cards, alert cards, recent activity feed
   → Click any card or item

Layer 2: Filtered List Views
   CRM (people), Revenue (transactions), Subscriptions
   → Click any row

Layer 3: Detail Pages
   Full record with summary cards + tabs + related records sidebar
   → Click any related record

Layer 4: Cross-Linked Detail Pages
   Jump to any connected entity, then keep going
   (breadcrumbs keep you oriented)
```

At any point: **Cmd+K** to search and jump directly to any entity.

### The CEO Lens Principle

The admin dashboard shows **transactional and analytical data** — the business reality of each person, invoice, or subscription. It does NOT show user-facing tools (referral link copiers, content calendars, marketing asset browsers). If the CEO wants to see a user's world, they click **Impersonate**.

### Cross-Linking Rules

Every detail page must include:
1. **Summary cards** — key metrics for this entity at a glance
2. **Tabs** — organized sections of related data
3. **Related Records sidebar** — quick links to connected entities from other entity types
4. **Breadcrumbs** — always show where you are in the navigation hierarchy
5. **Action buttons** — contextual actions (Impersonate, View in Stripe, Email, Export)

---

## Entity Relationship Map

These are the core entities and how they connect via foreign keys:

```
                    ┌──────────────┐
                    │   PERSON     │
                    │ (auth.users) │
                    └──────┬───────┘
           ┌───────────────┼───────────────┐
           │               │               │
    ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
    │ SUBSCRIPTION│ │  INVOICES   │ │   TICKETS   │
    │ (muse_prod_ │ │ (invoices)  │ │  (tickets)  │
    │ subscriptns)│ │             │ │             │
    └──────┬──────┘ └──────┬──────┘ └─────────────┘
           │               │
           │        ┌──────▼──────┐
           │        │  PAYMENTS   │
           │        │ (payments)  │
           │        └─────────────┘
           │               │
           │        ┌──────▼──────┐
           └───────►│ COMMISSIONS │◄──── affiliate_user_id
                    │ (affiliate_ │
                    │ commissions)│
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   PAYOUTS   │
                    │ (affiliate_ │
                    │  payouts)   │
                    └─────────────┘
```

**Key foreign keys used for cross-linking:**
- `invoices.user_id` → person
- `payments.invoice_id` → invoice; `payments.user_id` → person
- `affiliate_commissions.affiliate_user_id` → person (affiliate); `affiliate_commissions.stripe_invoice_id` → invoice
- `affiliate_commissions.referral_id` → `affiliate_referrals.id` → `referred_user_id` → person (customer)
- `affiliate_payouts.affiliate_user_id` → person (affiliate)
- `muse_product_subscriptions.user_id` → person
- `tickets.user_id` → person; `tickets.assigned_to` → person (staff)
- `activities.user_id` → person; `activities.related_entity_id` → any entity

---

## Database Changes Required

### New Table: `user_tags`
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
CREATE INDEX IF NOT EXISTS idx_user_tags_user_id ON user_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tags_tag ON user_tags(tag);
```

### New Table: `entity_notes`
```sql
CREATE TABLE IF NOT EXISTS entity_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_entity_notes_entity ON entity_notes(entity_type, entity_id);
```

**Entity types for `entity_notes`:** `user`, `invoice`, `subscription`, `ticket`, `payout`

---

## Key Files Reference

### Existing Files (to modify)
| File | Purpose | Sprint |
|------|---------|--------|
| `src/app/admin/layout.tsx` | Admin navigation — replace horizontal bar with sidebar | 1 |
| `src/app/admin/page.tsx` | Dashboard home — upgrade to command center | 4 |
| `src/app/api/admin/metrics/route.ts` | Metrics API — fix crash | 1 |
| `src/app/admin/metrics/page.tsx` | Metrics page — fix crash | 1 |

### New Files (to create)
| File | Purpose | Sprint |
|------|---------|--------|
| `src/components/admin/sidebar.tsx` | Admin sidebar navigation component | 1 |
| `src/components/admin/breadcrumbs.tsx` | Breadcrumb navigation component | 1 |
| `src/components/admin/timeline.tsx` | Reusable timeline/activity feed component | 1 |
| `src/components/admin/related-records.tsx` | Related records sidebar for detail pages | 5 |
| `src/components/admin/entity-notes.tsx` | Reusable notes component for any entity | 2 |
| `src/app/admin/crm/page.tsx` | CRM master list page | 2 |
| `src/app/admin/crm/[userId]/page.tsx` | CRM detail page | 2 |
| `src/app/api/admin/crm/route.ts` | CRM list API | 2 |
| `src/app/api/admin/crm/[userId]/route.ts` | CRM detail API | 2 |
| `src/app/api/admin/crm/[userId]/tags/route.ts` | User tags API | 2 |
| `src/app/admin/revenue/page.tsx` | Revenue/transactions list page | 3 |
| `src/app/admin/revenue/[id]/page.tsx` | Transaction detail page | 3 |
| `src/app/api/admin/revenue/route.ts` | Revenue list API | 3 |
| `src/app/api/admin/revenue/[id]/route.ts` | Transaction detail API | 3 |
| `src/app/admin/subscriptions/page.tsx` | Subscriptions list page | 3 |
| `src/app/admin/subscriptions/[id]/page.tsx` | Subscription detail page | 3 |
| `src/app/api/admin/subscriptions/route.ts` | Subscriptions list API | 3 |
| `src/app/api/admin/subscriptions/[id]/route.ts` | Subscription detail API | 3 |
| `src/components/admin/command-palette.tsx` | Cmd+K global search | 4 |
| `src/app/api/admin/search/route.ts` | Global search API | 4 |
| `src/app/api/admin/dashboard/route.ts` | Dashboard home data API | 4 |

---

## Sprint 1: Foundation (Session 1)

**Goal:** Fix the metrics crash, replace horizontal nav with sidebar, build reusable components that all later sprints depend on.

**Why first:** Everything else depends on the sidebar navigation and the reusable timeline/breadcrumb components. Get the foundation right, everything else slots in cleanly.

### T001: Fix Metrics page crash
- **Blocked By**: []
- **Details**:
  - The `/admin/metrics` page crashes on Vercel with "Something went wrong"
  - Root cause: `adminClient.auth.admin.listUsers()` may fail on Supabase, or `subscriptions`/`feedback`/`waitlist` tables may not exist in Supabase
  - Fix: Wrap each data-fetching section (user count, subscription count, feedback count, waitlist count, revenue data) in its own try/catch block
  - Handle both Supabase error codes for missing tables: `42P01` and `PGRST205`
  - Each section returns 0/empty on failure so the rest of the page still renders
  - Also verify recharts components render safely with empty/null arrays
- **Files**: `src/app/api/admin/metrics/route.ts`, `src/app/admin/metrics/page.tsx`
- **Acceptance**: `/admin/metrics` loads on Vercel even if some data sources are unavailable — shows zeros/empty charts instead of crashing

### T002: Build admin sidebar navigation
- **Blocked By**: []
- **Details**:
  - Replace the horizontal scrolling nav bar in `src/app/admin/layout.tsx` with a proper collapsible sidebar
  - Sidebar groups (matching the reorganized admin structure):
    - **Dashboard** — `/admin` (home icon)
    - **CRM** — `/admin/crm` (BookUser icon) — `canManageUsers`
    - **Revenue** — `/admin/revenue` (DollarSign icon) — `canViewAnalytics`
    - **Subscriptions** — `/admin/subscriptions` (CreditCard icon) — `canViewAnalytics`
    - **Metrics** — `/admin/metrics` (BarChart3 icon) — `canViewAnalytics`
    - **Support** — future (MessageSquare icon) — placeholder, links to `/admin/feedback` for now
    - **Content** group (collapsible):
      - Blog — `/admin/blog` — `canEditContent`
      - Email Templates — `/admin/email-templates` — `canEditContent`
      - Waitlist — `/admin/waitlist` — `canManageUsers`
    - **Growth** group (collapsible):
      - Affiliate Program — `/admin/setup/affiliate` — `canEditSettings`
      - Discount Codes — `/admin/setup/discount-codes` — `canEditSettings`
      - Analytics — `/admin/analytics` — `canViewAnalytics`
      - Onboarding Funnel — `/admin/setup/funnel` — `canEditSettings`
    - **Settings** group (collapsible):
      - Branding — `/admin/setup/branding` — `canEditSettings`
      - Color Palette — `/admin/setup/palette` — `canEditSettings`
      - Homepage — `/admin/setup/content` — `canEditSettings`
      - Pages — `/admin/setup/pages` — `canEditSettings`
      - Pricing — `/admin/setup/pricing` — `canEditSettings`
      - Products — `/admin/setup/products` — `canEditSettings`
      - Features — `/admin/setup/features` — `canEditSettings`
      - Social Links — `/admin/setup/social` — `canEditSettings`
      - Support Config — `/admin/setup/support` — `canEditSettings`
      - Integrations — `/admin/setup/integrations` — `canEditSettings`
      - Testimonials — `/admin/setup/testimonials` — `canEditSettings`
      - Watermark — `/admin/setup/watermark` — `canEditSettings`
      - Compliance — `/admin/setup/compliance` — `canEditSettings`
      - Security — `/admin/setup/security` — `canEditSettings`
      - PassivePost Config — `/admin/setup/passivepost` — `canEditSettings`
    - **System** group (collapsible, admin-only):
      - Users — `/admin/users` — `canManageUsers`
      - Team — `/admin/team` — `canManageTeam`
      - Audit Logs — `/admin/audit-logs` — `canViewAnalytics`
      - Queue — `/admin/queue` — `isAppAdmin` only
      - SSO — `/admin/sso` — `isAppAdmin` only
      - Onboarding Wizard — `/admin/onboarding` — `canEditSettings`
  - Badge counts on key items (fetched from a lightweight API):
    - Support: open ticket count
    - CRM: new users today count
    - Revenue: failed payment count (if any)
  - Sidebar should be collapsible to icon-only mode on desktop
  - Mobile: sidebar slides in as overlay (hamburger menu trigger)
  - Active state: highlight current page, expand parent group if child is active
  - Respects the design system (palette colors, dark mode, component styling)
- **Files**: `src/components/admin/sidebar.tsx`, `src/app/admin/layout.tsx`
- **Acceptance**: Sidebar renders with all groups, collapses properly, mobile responsive, badge counts show, active states work. Old horizontal nav is removed.

### T003: Build breadcrumb navigation component
- **Blocked By**: []
- **Details**:
  - Create a reusable `<AdminBreadcrumbs />` component
  - Automatically generates breadcrumbs from the current URL path
  - Custom labels for known routes (e.g., `/admin/crm` → "CRM", `/admin/crm/[id]` → fetches user name)
  - Clickable segments — each breadcrumb is a link
  - Pattern: `Admin > CRM > Jane Smith > Invoice #1042`
  - Integrate into the admin layout so it appears on every admin page
  - Styled consistently with the design system
- **Files**: `src/components/admin/breadcrumbs.tsx`, `src/app/admin/layout.tsx`
- **Acceptance**: Breadcrumbs appear on every admin page, segments are clickable, dynamic segments show entity names

### T004: Build reusable timeline component
- **Blocked By**: []
- **Details**:
  - Create a `<Timeline />` component that renders a chronological feed of events
  - Each event has: icon, title, description, timestamp, optional action link
  - Supports different event types with different icons/colors (signup, payment, login, ticket, commission, etc.)
  - Used in: CRM detail (Activity tab), Dashboard home (recent activity), entity detail pages
  - Loading skeleton state
  - Empty state with message
  - Respects design system colors (uses palette CSS variables, not hardcoded colors)
- **Files**: `src/components/admin/timeline.tsx`
- **Acceptance**: Component renders a vertical timeline with icons, timestamps, and clickable links. Works in both light and dark mode.

### Sprint 1 Completion Test
- [ ] `/admin/metrics` loads without crashing (even with missing tables)
- [ ] Admin sidebar renders with all groups, collapses properly
- [ ] Badge counts show on sidebar items
- [ ] Breadcrumbs appear on every admin page
- [ ] Timeline component renders sample data correctly
- [ ] Mobile sidebar works (hamburger menu)
- [ ] Dark mode looks correct
- [ ] Zero TypeScript errors

---

## Sprint 2: CRM (Session 2)

**Goal:** Build the CRM section — the CEO's primary tool for understanding every person in the system.

**Why second:** CRM is the most valuable new section. With the sidebar and reusable components from Sprint 1 in place, we can build it cleanly.

### T005: Build CRM aggregation APIs
- **Blocked By**: [T002]
- **Details**:
  - `GET /api/admin/crm` — returns paginated list of all users with aggregated data:
    - Name, email, avatar (from `auth.users` + `user_profiles`)
    - Type badges: array of types this person holds (Subscriber, Affiliate, Team Member) — determined from `muse_product_subscriptions`, `affiliate_profiles`, `organization_members`
    - Current plan (free/pro/team) from `muse_product_subscriptions`
    - Total revenue: sum of `invoices.amount_paid_cents` where `status = 'paid'`
    - Status: active (logged in within 30 days) / inactive
    - Last active: `last_sign_in_at` from auth
    - Health score: 0-100 formula based on login recency (40%), subscription status (30%), activity count last 30 days (30%)
    - Tags: from `user_tags` table
    - Member since: `created_at`
  - Supports: `?search=`, `?type=`, `?plan=`, `?status=`, `?tag=`, `?sort=`, `?page=`, `?limit=`
  - `GET /api/admin/crm/[userId]` — returns complete CEO-level record:
    - Profile data (from `user_profiles` + auth metadata)
    - Subscription details (from `muse_product_subscriptions` + `muse_products`)
    - Unified transactions: all `invoices` + `payments` + `affiliate_commissions` + `affiliate_payouts` for this user, merged into one chronological list with type labels
    - Affiliate summary (IF affiliate): referral count, total commissions, current tier, conversion rate, payout total — from `affiliate_profiles`, `affiliate_referrals`, `affiliate_commissions`, `affiliate_payouts`
    - Activity timeline: from `activities` table
    - Support tickets: from `tickets` + `ticket_comments`
    - Admin notes: from `entity_notes` where `entity_type = 'user'`
    - Contracts: from `contracts` table
    - Tags: from `user_tags`
  - Each section wrapped in its own try/catch — missing tables return empty arrays, not crashes
  - Handle both `42P01` and `PGRST205` error codes
- **Files**: `src/app/api/admin/crm/route.ts`, `src/app/api/admin/crm/[userId]/route.ts`
- **Acceptance**: Both endpoints return properly structured JSON. Missing tables return empty data, not 500s.

### T006: Build CRM master list page
- **Blocked By**: [T005]
- **Details**:
  - `/admin/crm` — full-page table of all contacts
  - Columns: Avatar+Name, Email, Type (colored badges — Subscriber/Affiliate/Team, can show multiple), Plan, Total Revenue (formatted as currency), Status indicator (green/red dot), Last Active (relative time), Health Score (green/yellow/red dot + number), Tags
  - Search bar: filters as you type by name or email
  - Filter dropdowns: Type, Plan, Status, Tag
  - Sort: click column headers to sort
  - Pagination: 25 per page with page controls
  - Export CSV button: downloads all filtered results
  - Click any row → navigates to `/admin/crm/[userId]`
  - Loading skeleton while data loads
  - Empty state when no results match filters
  - Record count display: "Showing 1-25 of 142 contacts"
- **Files**: `src/app/admin/crm/page.tsx`
- **Acceptance**: Page loads with real user data, all filters work, sorting works, row click navigates, CSV export downloads

### T007: Build CRM detail page
- **Blocked By**: [T005, T004]
- **Details**:
  - `/admin/crm/[userId]` — full-page CEO-level detail view
  - **Header bar**:
    - Back arrow → returns to CRM list
    - Avatar, name (large), email
    - Type badges (Subscriber, Affiliate, Team Member)
    - Tags (editable — add/remove inline)
    - Action buttons: Impersonate (reuse existing logic), Email (mailto), View in Stripe (if `stripe_customer_id` exists), Edit Profile
  - **Summary cards row** (5-6 cards):
    - Total Revenue (sum of all paid invoices)
    - Current Plan (with tier badge)
    - Health Score (with color indicator)
    - Member Since (formatted date)
    - Days Since Last Login
    - If affiliate: Referral Count + Commission Total as additional cards
  - **6 Tabs**:
    1. **Profile** — editable fields: display name, phone, company, address (street, city, state, zip, country), bio, timezone, email preferences toggles. Save button calls existing profile update API.
    2. **Transactions** — unified chronological list of ALL financial records:
       - Invoices: amount, status badge, date, invoice number, PDF link, period
       - Payments: amount, card brand/last4, date, status
       - Affiliate commissions: amount, referral link, commission rate, status — only if affiliate
       - Affiliate payouts: amount, method, status, date — only if affiliate
       - Each row has a type badge (Invoice/Payment/Commission/Payout)
       - Click any invoice/payment → navigates to `/admin/revenue/[id]`
    3. **Activity** — uses the `<Timeline />` component from T004, showing chronological events from `activities` table
    4. **Support** — tickets list with status badges (open/closed/pending), priority, creation date. Click to expand conversation thread (comments). Shows assigned staff member.
    5. **Notes** — uses the `<EntityNotes />` component. Admin notes with add/delete, timestamps, author name. `entity_type = 'user'`, `entity_id = userId`
    6. **Contracts** — signed agreements with title, type, status badge, signed date, expiry date
  - If person is an affiliate, show a small "Affiliate Summary" card between header and tabs: referral count, total commissions earned, current tier, conversion rate
- **Files**: `src/app/admin/crm/[userId]/page.tsx`, `src/components/admin/entity-notes.tsx`
- **Acceptance**: All 6 tabs render with real data or graceful empty states. Profile edits save. Impersonate works. Transaction rows link to revenue detail. Tags add/remove works.

### T008: Build tags API and entity notes API
- **Blocked By**: []
- **Details**:
  - Run migration SQL to create `user_tags` and `entity_notes` tables (on Replit Postgres)
  - `GET/POST/DELETE /api/admin/crm/[userId]/tags` — manage tags on a user
    - GET: return all tags for user
    - POST: add a tag `{ tag: "VIP", color: "blue" }`
    - DELETE: remove a tag `{ tag: "VIP" }`
  - `GET/POST/DELETE /api/admin/notes` — manage notes on any entity
    - GET: `?entity_type=user&entity_id=xxx` returns all notes
    - POST: `{ entity_type, entity_id, body }` creates a note
    - DELETE: `?id=xxx` deletes a note (only author or admin can delete)
  - List Supabase migration SQL for user to run before testing on Vercel
- **Files**: `src/app/api/admin/crm/[userId]/tags/route.ts`, `src/app/api/admin/notes/route.ts`, migration SQL
- **Acceptance**: Tags can be added/removed on users. Notes can be added/deleted on any entity type. Both APIs return proper data.

### Sprint 2 Completion Test
- [ ] `/admin/crm` shows a list of all users with type badges, plan, revenue, health score
- [ ] Search and filter controls work on CRM list
- [ ] Clicking a row navigates to CRM detail page
- [ ] CRM detail page header shows user info, type badges, action buttons
- [ ] All 6 tabs render (Profile, Transactions, Activity, Support, Notes, Contracts)
- [ ] Profile tab edits save correctly
- [ ] Transactions tab shows unified financial data with type badges
- [ ] Tags can be added and removed
- [ ] Notes can be added and deleted
- [ ] CSV export downloads from CRM list
- [ ] Impersonate button works
- [ ] Empty states display properly for users with no transactions/tickets/etc.

---

## Sprint 3: Revenue & Subscriptions (Session 3)

**Goal:** Build the Revenue and Subscriptions sections with full cross-linking back to CRM.

**Why third:** With CRM in place, the Revenue and Subscriptions pages can cross-link to CRM profiles, completing the relational loop.

### T009: Build Revenue list API and page
- **Blocked By**: [T002]
- **Details**:
  - `GET /api/admin/revenue` — returns all financial transactions across the system:
    - Invoices: with user name/email, amount, status, date, invoice number
    - Payments: with user name/email, amount, card info, status, date
    - Commissions: with affiliate name/email, amount, rate, status, date
    - Payouts: with affiliate name/email, amount, method, status, date
    - Each record includes `type` field and `user_id` for cross-linking
  - Supports: `?type=` (invoice/payment/commission/payout), `?status=`, `?dateFrom=`, `?dateTo=`, `?search=` (user email/name), `?sort=`, `?page=`
  - `/admin/revenue` — full-page transaction list
    - Columns: Type badge, Description/Number, Person (name+email, clickable → CRM), Amount (formatted currency), Status badge, Date
    - Filter bar: type dropdown, status dropdown, date range picker, search
    - Sort by date, amount, status
    - Export CSV
    - Summary row at top: Total Revenue (paid invoices), Pending Commissions, Outstanding Payouts
    - Click any row → `/admin/revenue/[id]`
- **Files**: `src/app/api/admin/revenue/route.ts`, `src/app/admin/revenue/page.tsx`
- **Acceptance**: Revenue page shows all transaction types, filters work, clicking a row opens detail, clicking a person opens CRM

### T010: Build Transaction detail page
- **Blocked By**: [T009, T005]
- **Details**:
  - `/admin/revenue/[id]` — full detail for one transaction
  - Determines type from the ID (query invoices, then payments, then commissions, then payouts)
  - **For an Invoice:**
    - Header: Invoice number, status badge, total amount, date
    - Customer card: name, email, plan, health score — clickable → CRM
    - Payment details: card brand/last4, payment date, payment status (from `payments` table via `invoice_id`)
    - Subscription link: which subscription generated this invoice — clickable → subscription detail
    - Affiliate attribution: IF this customer was referred by an affiliate, show: affiliate name (clickable → CRM), commission amount, commission rate, commission status
    - Line items: from `invoice_items` if available
    - Actions: View in Stripe, Download PDF, Add Note
    - Notes: `<EntityNotes />` with `entity_type = 'invoice'`
  - **For a Payment:**
    - Header: Payment ID, amount, status, date
    - Customer card: clickable → CRM
    - Related invoice: clickable → invoice detail
    - Card details: brand, last4, payment method type
  - **For a Commission:**
    - Header: Commission amount, rate, status, date
    - Affiliate card: name, email, tier — clickable → CRM
    - Related invoice: the invoice that triggered this commission — clickable → invoice detail
    - Referred customer: the person who was referred and paid — clickable → CRM
    - Related referral: referral date, status
  - **For a Payout:**
    - Header: Payout amount, method, status, date
    - Affiliate card: clickable → CRM
    - Included commissions: list of commissions in this payout — each clickable → commission detail
    - Processed by: admin who approved — clickable → CRM
  - Breadcrumbs: `Admin > Revenue > Invoice #1042`
- **Files**: `src/app/api/admin/revenue/[id]/route.ts`, `src/app/admin/revenue/[id]/page.tsx`
- **Acceptance**: All 4 transaction types render correctly. Cross-links to CRM profiles work. Cross-links to related invoices/payments work. Notes work. Breadcrumbs display correctly.

### T011: Build Subscriptions list API and page
- **Blocked By**: [T002]
- **Details**:
  - `GET /api/admin/subscriptions` — returns all subscriptions with user data:
    - Subscription ID, user name/email, product name, tier, status, amount (from Stripe price), renewal date, cancel_at_period_end
    - Churn risk indicator: `cancel_at_period_end = true` OR `current_period_end < 7 days from now`
  - Supports: `?status=` (active/canceled/past_due), `?tier=`, `?churnRisk=`, `?search=`, `?sort=`, `?page=`
  - `/admin/subscriptions` — full-page list
    - Columns: Person (clickable → CRM), Product, Tier badge, Status badge, Amount/mo, Renewal Date, Churn Risk indicator
    - Filter bar: status, tier, churn risk toggle
    - Summary row: Total Active, MRR by Tier, Churn Risk Count
    - Click any row → `/admin/subscriptions/[id]`
    - Export CSV
- **Files**: `src/app/api/admin/subscriptions/route.ts`, `src/app/admin/subscriptions/page.tsx`
- **Acceptance**: Subscriptions page shows all subscriptions, churn risk indicators display, filters work, cross-links to CRM work

### T012: Build Subscription detail page
- **Blocked By**: [T011, T005]
- **Details**:
  - `/admin/subscriptions/[id]` — full detail for one subscription
  - Header: Product name, tier badge, status badge, amount
  - Customer card: name, email, plan, health score — clickable → CRM
  - Subscription details: Stripe subscription ID, start date, current period, renewal date, cancel_at_period_end
  - Churn risk section: if at risk, show indicators (cancellation pending, missed payment, inactive user)
  - Invoice history: all invoices generated by this subscription — each clickable → `/admin/revenue/[id]`
  - Actions: View in Stripe, Cancel Subscription, Add Note
  - Notes: `<EntityNotes />` with `entity_type = 'subscription'`
  - Breadcrumbs: `Admin > Subscriptions > Jane Smith — Pro Plan`
- **Files**: `src/app/api/admin/subscriptions/[id]/route.ts`, `src/app/admin/subscriptions/[id]/page.tsx`
- **Acceptance**: Subscription detail renders with user cross-link, invoice history, churn risk indicators. Notes work.

### Sprint 3 Completion Test
- [ ] `/admin/revenue` shows all transaction types with person cross-links
- [ ] Revenue filters work (type, status, date range, search)
- [ ] Clicking a transaction opens its detail page
- [ ] Invoice detail shows customer, payment, subscription link, and affiliate attribution (if applicable)
- [ ] Commission detail shows affiliate, referred customer, and triggering invoice
- [ ] `/admin/subscriptions` shows all subscriptions with churn risk indicators
- [ ] Subscription detail shows customer, invoice history, churn risk
- [ ] All cross-links navigate to correct CRM profiles or revenue details
- [ ] Breadcrumbs work correctly on all detail pages
- [ ] CSV export works on both list pages

---

## Sprint 4: Dashboard Home & Command Palette (Session 4)

**Goal:** Transform the admin home page into a command center with clickable KPI cards, and add Cmd+K global search.

**Why fourth:** By now all the entity pages exist (CRM, Revenue, Subscriptions), so the KPI cards have destinations to link to, and the search has entities to index.

### T013: Build Dashboard Home data API
- **Blocked By**: []
- **Details**:
  - `GET /api/admin/dashboard` — returns all data needed for the command center:
    - **KPIs**: MRR (sum of active subscription amounts), Active Subscribers count, New Users This Week, Open Tickets count, Churn Rate (% of cancellations in last 30 days), Failed Payments count
    - **Alerts**: list of actionable items:
      - Subscriptions renewing in next 24 hours (count + link)
      - Failed payments needing attention (count + link)
      - Unresolved tickets older than 48 hours (count + link)
      - Pending affiliate payouts (count + link)
      - Pending affiliate applications (count + link)
    - **Recent Activity**: last 15 events from `activities` table with user names and entity links
    - **Revenue Trend**: last 7 days of daily revenue (for a sparkline)
  - Each section in its own try/catch — partial data is fine
- **Files**: `src/app/api/admin/dashboard/route.ts`
- **Acceptance**: API returns all sections. Missing tables return empty data, not crashes.

### T014: Build Dashboard Home page
- **Blocked By**: [T013, T004]
- **Details**:
  - Replace the current bare admin home page with the command center
  - **KPI cards row** (6 cards, responsive grid):
    - Each card shows: icon, label, big number, small trend indicator
    - Each card is **clickable** → navigates to the appropriate filtered list view:
      - MRR → `/admin/revenue?type=invoice&status=paid`
      - Active Subscribers → `/admin/subscriptions?status=active`
      - New Users This Week → `/admin/crm?status=active&sort=newest`
      - Open Tickets → `/admin/feedback` (or future support page)
      - Churn Rate → `/admin/subscriptions?churnRisk=true`
      - Failed Payments → `/admin/revenue?status=failed`
  - **Alerts section** (cards with warning styling):
    - Each alert shows: icon, title, count, one-click action
    - Clickable → navigates to filtered view
    - Only shows alerts that have count > 0
  - **Recent Activity feed** (uses `<Timeline />` component from T004):
    - Shows last 15 events
    - Each event clickable → navigates to the relevant entity
    - "View All" link → `/admin/audit-logs`
  - **Revenue sparkline** (small 7-day trend chart, uses `useChartConfig()` for colors)
  - Loading skeletons while data loads
- **Files**: `src/app/admin/page.tsx`
- **Acceptance**: Dashboard shows KPIs, alerts, activity feed. Every card and item is clickable and navigates to the correct filtered view. Dark mode looks correct.

### T015: Build Command Palette (Cmd+K)
- **Blocked By**: [T005, T009, T011]
- **Details**:
  - `GET /api/admin/search?q=` — searches across all entities:
    - Users: by name, email
    - Invoices: by invoice number, amount
    - Subscriptions: by user name/email
    - Tickets: by subject, ticket number
    - Returns up to 5 results per entity type, each with: type label, title, subtitle, URL
  - Create `<CommandPalette />` component using existing `cmdk` / `src/components/ui/command.tsx`
    - Opens with Cmd+K (Mac) or Ctrl+K (Windows)
    - Also accessible via search icon in admin sidebar header
    - Search input with instant results grouped by entity type
    - Each result shows: type icon, title, subtitle
    - Enter or click → navigate to entity detail page
    - Escape or click outside → close
    - Recent searches remembered (localStorage)
  - Integrate into admin layout so it's available on every admin page
- **Files**: `src/components/admin/command-palette.tsx`, `src/app/api/admin/search/route.ts`, `src/app/admin/layout.tsx`
- **Acceptance**: Cmd+K opens search overlay from any admin page. Typing returns grouped results across all entity types. Selecting a result navigates to the correct detail page. Escape closes.

### Sprint 4 Completion Test
- [ ] Dashboard home shows 6 clickable KPI cards with real data
- [ ] Clicking each KPI card navigates to the correct filtered list view
- [ ] Alerts section shows actionable items (or hides when none)
- [ ] Recent activity feed shows real events, each clickable
- [ ] Revenue sparkline renders
- [ ] Cmd+K opens command palette from any admin page
- [ ] Search returns results across users, invoices, subscriptions, tickets
- [ ] Selecting a search result navigates correctly
- [ ] Loading states display properly
- [ ] Dark mode looks correct

---

## Sprint 5: Polish & Cross-Linking (Session 5)

**Goal:** Add the Related Records sidebar to all detail pages, ensure export/print works everywhere, and do final QA across all sprints.

**Why last:** This sprint ties everything together. The Related Records sidebar requires all entity pages to exist first.

### T016: Build Related Records sidebar component
- **Blocked By**: [T007, T010, T012]
- **Details**:
  - Create a `<RelatedRecords />` component that renders a sidebar/section on detail pages
  - Input: `entityType` + `entityId` + preloaded data about the current entity
  - Output: grouped lists of related records from OTHER entity types
  - **On CRM detail page** (person): already handled by tabs — skip sidebar here
  - **On Invoice detail page**: "Other invoices from this customer" (up to 5, clickable), "Customer's subscription" (clickable), "Customer's open tickets" (up to 3, clickable)
  - **On Subscription detail page**: "Other subscriptions by this customer" (if multi-product), "Recent invoices" (up to 5, clickable), "Customer's tickets" (up to 3, clickable)
  - **On Commission/Payout detail**: "Other commissions by this affiliate" (up to 5), "Affiliate's referrals" (up to 5)
  - Uses a compact card style — small text, minimal padding
  - Lazy-loads related data via a single API call: `GET /api/admin/related?entityType=invoice&entityId=xxx`
- **Files**: `src/components/admin/related-records.tsx`, `src/app/api/admin/related/route.ts`
- **Acceptance**: Related records sidebar appears on Revenue and Subscription detail pages. All links navigate correctly. Empty sections are hidden.

### T017: Export CSV on all list views + print-friendly detail pages
- **Blocked By**: [T006, T009, T011]
- **Details**:
  - Ensure CSV export button exists on: CRM list, Revenue list, Subscriptions list
  - Each export includes all filtered results (not just current page)
  - CSV columns match the visible table columns
  - Print CSS for detail pages:
    - Add `@media print` styles to admin layout
    - Hide sidebar, breadcrumbs, action buttons
    - Format tabs as sequential sections (all tabs visible in print)
    - Clean typography, no backgrounds
    - Invoice detail: formatted like a real invoice when printed
  - Test print preview on CRM detail, Invoice detail, Subscription detail
- **Files**: Print CSS in `src/app/globals.css` or admin-specific CSS, export logic in each list page
- **Acceptance**: CSV downloads work on all 3 list pages. Print preview looks clean on all detail pages. Sidebar and nav are hidden in print.

### T018: Final QA and cross-link verification
- **Blocked By**: [T016, T017]
- **Details**:
  - End-to-end walkthrough of the complete four-layer depth model:
    1. Dashboard Home → click MRR card → Revenue list (filtered) → click an invoice → Invoice detail → click customer name → CRM detail → click a ticket → Support → back via breadcrumbs
    2. Cmd+K search for a user → CRM detail → Transactions tab → click an invoice → Revenue detail → Related Records sidebar → click another invoice → verify breadcrumbs
  - Verify all empty states (user with no invoices, no tickets, no affiliate status)
  - Verify dark mode on every new page
  - Verify mobile responsiveness on sidebar, list pages, detail pages
  - Verify badge counts on sidebar update correctly
  - Run TypeScript compiler — zero errors
  - List all Supabase migrations needed (in order)
  - List any new environment variables
  - Update `docs/FEATURE_INVENTORY.md` with all new features
  - Update `docs/ROADMAP.md` with completion status
- **Files**: Various
- **Acceptance**: Complete four-layer drill-down works end-to-end. All cross-links navigate correctly. No TypeScript errors. All pages work in light/dark mode and on mobile.

### Sprint 5 Completion Test
- [ ] Related Records sidebar appears on Revenue and Subscription detail pages
- [ ] All related record links navigate correctly
- [ ] CSV export works on CRM, Revenue, and Subscriptions list pages
- [ ] Print preview looks clean on CRM detail, Invoice detail, Subscription detail
- [ ] Complete drill-down path works: Dashboard → List → Detail → Cross-link → Detail
- [ ] Cmd+K search works from any admin page
- [ ] All empty states display properly
- [ ] Dark mode correct on all new pages
- [ ] Mobile responsive on all new pages
- [ ] Zero TypeScript errors
- [ ] Supabase migration list documented
- [ ] FEATURE_INVENTORY.md updated
- [ ] ROADMAP.md updated

---

## Supabase Migration Inventory

All migrations needed before testing on Vercel (cumulative — run all in order):

### Migration 1: Tags and Entity Notes (Sprint 2)
```sql
-- User Tags
CREATE TABLE IF NOT EXISTS user_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  color TEXT DEFAULT 'gray',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tag)
);
CREATE INDEX IF NOT EXISTS idx_user_tags_user_id ON user_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tags_tag ON user_tags(tag);

-- Entity Notes (universal notes for any entity)
CREATE TABLE IF NOT EXISTS entity_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_entity_notes_entity ON entity_notes(entity_type, entity_id);
```

---

## Rules for Development

1. **Never hardcode colors** — use palette CSS variables (`bg-primary-*`, `text-primary-*`, `hsl(var(--success))`)
2. **Always use `useChartConfig()`** for any chart components
3. **Handle missing tables** — check both `42P01` and `PGRST205` error codes
4. **Destructure Supabase responses** — always check `{ data, error }`, never chain `.catch()`
5. **Each API section in its own try/catch** — partial data is always better than a crash
6. **Cross-links must be bidirectional** — if Invoice links to Person, Person must link to Invoice
7. **Empty states are required** — every tab, every list, every sidebar section must handle zero results gracefully
8. **Breadcrumbs on every detail page** — using the `<AdminBreadcrumbs />` component
9. **data-testid on all interactive elements** — following the `{action}-{target}` pattern
10. **Self-contained components** — each tab/section fetches its own data and handles its own loading/error states

---

## Session Continuity Protocol

At the end of each sprint session:
1. Update the Sprint Status Overview table at the top of this document
2. Mark completed tasks with ✅
3. Update `docs/ROADMAP.md` with session log
4. Update `docs/FEATURE_INVENTORY.md` with new features
5. List any issues discovered for the next sprint
6. List exact Supabase migrations the user needs to run before next Vercel test

At the start of each sprint session:
1. Read this blueprint — check which sprint is current
2. Read `docs/LESSONS_LEARNED.md` — check for new anti-patterns
3. Read `docs/ROADMAP.md` — check for any new bugs or priorities
4. Resume from the documented stopping point
