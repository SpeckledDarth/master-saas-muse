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

### Category C: Feature Requests (Need Discussion Before Building)

These are new features or design changes the tester requested. They require a conversation before implementation because they involve product decisions, workflow changes, or scope expansion.

| ID | Request | Tester's Context | Discussion Needed |
|----|---------|-------------------|-------------------|
| FR-01 | Add first name + last name fields to CRM detail (keep display name too) | "I want more information from users for potential email personalization" | Pros/cons of adding fields vs. using display name parsing |
| FR-02 | File upload capability for marketing assets (not just URL links) | "We cannot simply rely on URL link only. Needs to connect to Supabase storage" | Supabase Storage integration, file size limits, CDN |
| FR-03 | Move Affiliate admin pages to top-level (`/admin/affiliate`) instead of buried in `/admin/setup/affiliate` | "These will be accessed more than most and should have front priority" | Full admin sitemap reassessment |
| FR-04 | System-wide vertical sidebar navigation for all dashboards | "Minimize, if not remove, horizontal navigation while in any of the dashboards" | Sidebar design, mobile behavior, collapsible states |
| FR-05 | Best practice defaults for all affiliate settings with ability to "Reset to Best Practice" | "I always want a way to return to Best Practice regardless of changes" | Define what "best practice" means for each setting |
| FR-06 | Grandfathering mechanism — setting changes honored for existing affiliates enrolled under previous terms | "All changes should be tracked in audit logs; affiliates must be grandfathered" | Complex business logic, retroactive vs. prospective |
| FR-07 | Affiliate-branded discount codes — affiliates choose their own code names (e.g., "STEELE40") | "Push the labor and decision of this to the affiliate directly" | UUID-based tracking with branded alias overlay |
| FR-08 | Cross-linking for all related data throughout the entire admin (person → CRM, amount → detail, winner → profile) | "If a person/user is shown, I should be able to click on the name and be directed to the User details tab" | Audit every page for cross-link opportunities |
| FR-09 | Broadcast performance data surfaced at a higher level (not just in detail view) | "Right now this is basically hidden intel" | Where to surface it — dashboard? separate analytics? |
| FR-10 | Payout workflow documentation — clear explanation of how auto-batch, generate, approve/reject works | "I need clear understanding how the code works" | Write operational documentation |
| FR-11 | Detailed feature documentation for all configurable affiliate settings | "We need a document to explain all of these so planning can be done offline" | Documentation effort, possibly in-app help |
| FR-12 | Recurring metrics cards should only appear on the Affiliate Health landing page, not every sub-tab | "This is high level summary and should be on the landing page only" | Review which summary cards appear where |
| FR-13 | Affiliate settings should use clickable cards that expand into editable modals (instead of always-open form fields) | "I want to see current settings but not be open editable fields" | UX pattern for settings pages |
| FR-14 | Clarify whether admin's own account should appear in Users list | "My personal admin account is not shown — maybe intentional?" | Clarify user list filtering logic |

---

## Sprint Plan

Each sprint is designed to complete in one session (3-5 tasks, clear done-test). Sprints are ordered by dependency and impact.

---

### Sprint 1: Shared UX Components + Standards

**Goal:** Build the reusable components that all future sprints depend on. No page conversions yet — just the building blocks.

| Task | Description | Files |
|------|-------------|-------|
| S1-T1 | Write UX Standards rules section in `docs/DESIGN_SYSTEM_RULES.md` — define the ONE correct pattern for tables, toolbars, detail views, confirmations, empty states, loading states, pagination, money formatting, search clear buttons | `docs/DESIGN_SYSTEM_RULES.md` |
| S1-T2 | Build `<AdminDataTable>` — reusable data table component using shadcn Table with: column definitions, clickable rows, sort state, empty state, loading skeleton, pagination | `src/components/admin/data-table.tsx` |
| S1-T3 | Build `<TableToolbar>` — consistent search + filter + sort bar with: search input (with X clear button), filter dropdowns, sort selector, optional CSV export, optional date range, "Clear All" reset | `src/components/admin/table-toolbar.tsx` |
| S1-T4 | Build `<ConfirmDialog>` — wraps shadcn AlertDialog with standard destructive confirmation pattern. Replaces all `confirm()` calls. | `src/components/admin/confirm-dialog.tsx` |
| S1-T5 | Update the `design-system` agent skill with UX Standards rules so all future sessions enforce them automatically | `.agents/skills/design-system/SKILL.md` |

**Done Test:** All 3 components render correctly in isolation. UX Standards section exists in design system rules. Agent skill updated. No pages converted yet — that's Sprint 6.

**Addresses:** UX-02, UX-05, UX-06, UX-08 (foundations only — application happens in later sprints)

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

### Sprint 4: Admin Sidebar + Navigation

**Goal:** Replace the admin horizontal top-nav with a proper vertical sidebar matching the other dashboards. Fix navigation-related UX issues.

| Task | Description | Files |
|------|-------------|-------|
| S4-T1 | Build admin vertical sidebar component with all current nav groups, collapsible sections, mobile hamburger behavior, badge counts | `src/components/admin/admin-sidebar.tsx` |
| S4-T2 | Update admin layout to use sidebar instead of horizontal top-nav. Reorder nav: move System (Users, Team, Audit Logs) higher in the list | `src/app/admin/layout.tsx` |
| S4-T3 | Fix CRM detail tab persistence — use URL search params so refreshing preserves the active tab | `src/app/admin/crm/[userId]/page.tsx` |
| S4-T4 | Standardize money display — pick one rule (show "$0.00" everywhere, never em-dash for money) and apply across admin pages | All admin pages showing currency |

**Done Test:** Admin dashboard has a vertical sidebar. Mobile sidebar works. System items appear near the top. CRM detail refresh preserves tab. Money displays consistently everywhere.

**Addresses:** UX-01, UX-07, UX-09, UX-12

---

### Sprint 5: Command Palette + Impersonate + Cross-Linking

**Goal:** Fix the two biggest functional gaps (search and impersonation) and add cross-linking.

| Task | Description | Files |
|------|-------------|-------|
| S5-T1 | Fix command palette search — wire up user search (by name/email), subscription search, invoice search against real database queries | Command palette component, search API route |
| S5-T2 | Make command palette tickets clickable — results should navigate to the entity's detail page | Command palette component |
| S5-T3 | Fix impersonate — impersonated view should show the target user's dashboard, not the admin's own view | Impersonate route and session handling |
| S5-T4 | Add cross-linking throughout admin: person names link to CRM detail, amounts link to transaction detail, contest winners link to CRM | Revenue, Contests, Payouts, Members pages |

**Done Test:** Command palette finds users by partial name/email. Clicking a result navigates to the correct detail page. Impersonation shows the target user's view with impersonation banner. Person names and key data are clickable across admin pages.

**Addresses:** BUG-04, BUG-05, BUG-06, BUG-07, BUG-08, UX-15, FR-08

---

### Sprint 6: Admin Page Conversions to Shared Components

**Goal:** Convert admin pages to use the shared AdminDataTable, TableToolbar, and ConfirmDialog components built in Sprint 1. This is where the systemic UX consistency gets applied.

| Task | Description | Files |
|------|-------------|-------|
| S6-T1 | Convert User Management page — replace eye icon with clickable rows, add TableToolbar, protect role editing behind intentional action (edit button → dialog), use ConfirmDialog for delete | User management admin page |
| S6-T2 | Convert Waitlist page — replace div grid with AdminDataTable, add toolbar with search + filters | Waitlist admin page |
| S6-T3 | Convert Team page — replace Card list with AdminDataTable, add ConfirmDialog for remove, replace `confirm()` | Team admin page |
| S6-T4 | Convert Feedback page — replace Card list with AdminDataTable, add toolbar with status filter, replace `confirm()` for delete | Feedback admin page |
| S6-T5 | Convert Audit Logs page — apply AdminDataTable, ensure consistent row click → dialog pattern | Audit Logs admin page |

**Done Test:** All 5 converted pages use the same table component, same toolbar pattern, same confirmation dialogs. Rows are clickable where detail views exist. No browser `confirm()` calls remain on any converted page.

**Addresses:** UX-02, UX-03, UX-04, UX-05, UX-06, UX-11, UX-13

---

## Items NOT In This Blueprint

The following items from the test results require discussion before they can be planned. They are tracked here but will NOT be built until discussed and approved:

- **FR-01 through FR-14** — All feature requests listed in Category C above
- **UX-10** (Breadcrumbs following history vs. sitemap) — This is a design philosophy question. Browser back button handles the "return to where I came from" case. Breadcrumbs showing the site hierarchy is standard UX. Need to discuss whether changing this is the right call.
- **Affiliate Dashboard restructure** (breaking the 7,400-line monolith) — This is a significant effort that deserves its own blueprint after the Admin Dashboard is solid.
- **Social Dashboard consistency audit** — The social dashboard is already fairly consistent. Will audit after admin work is complete.
- **Discount code workflow redesign** (FR-07) — Requires product design discussion about affiliate self-service vs. admin control.

---

## Sprint Continuity Rules

1. Each sprint starts by reading this blueprint and confirming which sprint is current.
2. At the end of each sprint, update this document: mark sprint as COMPLETE, note any carryover items.
3. If a sprint can't finish, document exactly what's done and what remains.
4. Sprint dependencies: Sprint 1 must complete before Sprint 6. All other sprints are independent and can run in any order.
5. After Sprint 6, the team will assess whether a second blueprint is needed for the Affiliate Dashboard restructure.

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
