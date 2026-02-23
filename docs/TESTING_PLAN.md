# PassivePost — Deep Testing Plan

> **Created:** February 23, 2026
> **Scope:** Phase 3 (Affiliate Core), Phase 3.5 (Open Affiliate Program), Phase 3.6 Sprint 1 (Revenue & Motivation), Phase 3.6 Sprint 2 (Tools & Analytics), Phase 3.6 Sprint 3 (Consolidation), Round 4 (Regression Fixes), Round 5 (11 Persistent Bug Fixes)
> **Test on:** Live Vercel deployment (passivepost.io)

---

## How to Use This Document

Work through each section in order. For each test:
- **PASS** = works as expected
- **FAIL** = broken or unexpected behavior (note what happened)
- **PARTIAL** = mostly works but has an issue

After testing, we'll fix all FAILs before moving to Sprint 4.

---

## Round 1 Results (Completed)

> These tests were confirmed working during Round 1 testing. No need to retest unless something changes.

**Issues Found & Fixed in Round 1:**
1. Broadcast edit/send UI buttons missing -> Fixed (added edit, send, delete buttons for drafts)
2. Top Performers card hidden when no data -> Fixed (always visible with empty state message)
3. Tier display not sorted by threshold -> Fixed (sorted by min_referrals)
4. Tab state lost on navigation -> Fixed (tab persistence via URL params)
5. "Affiliates" tab confusing name -> Fixed (renamed to "Members")
6. Drip email welcome not triggering on activation -> Fixed (fires on affiliate activate)
7. Build error: `.catch` on PromiseLike in activate route -> Fixed (replaced with try/catch)
8. Runtime crash: `useSearchParams` without Suspense -> Fixed (replaced with useState + useEffect)
9. Runtime crash: `e.perks.map is not a function` -> Fixed (perks data parsed as array on load)

**Round 1 Confirmed Working:**
- Admin dashboard loads (all sections except affiliate page had no issues)
- Test data seeded across all 11 affiliate tabs
- Affiliate page loads after bug fixes

---

## ROUND 2: Testing with Seeded Data

> **Goal:** Verify all affiliate admin tabs display seeded data correctly, and all CRUD operations work.
> **Pre-requisite:** Test data has been seeded. Admin is logged in on Vercel.

---

### SECTION R2-1: Health Tab (Default View)

> **Where:** Admin > Setup > Affiliate (Health tab loads by default)

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| R2-1.1 | Page loads without error | Go to `/admin/setup/affiliate` | Page loads, Health tab shown by default | |
| R2-1.2 | Overview KPI cards | Check the 4 KPI cards at top | Shows: Active affiliates (7), Dormant (1), Net ROI (dollar amount), Conversion Rate (percentage) | |
| R2-1.3 | Revenue Impact section | Check revenue breakdown | Shows: Total Revenue, Commissions Paid, Commissions Pending, Net ROI - all with dollar amounts | |
| R2-1.4 | Growth metrics | Check growth section | Shows: New Affiliates This Month, Referrals This Month, Conversions This Month - non-zero values | |
| R2-1.5 | Engagement metrics | Check engagement section | Shows: Avg Referrals per Affiliate, Avg Earnings per Affiliate | |
| R2-1.6 | Top Performers | Check top performers card | Lists up to 5 top affiliates by earnings with referral counts. If no data, shows "No performer data yet" | |
| R2-1.7 | Alerts section | Check alerts | Shows flagged referral count and pending payout amount | |

---

### SECTION R2-2: Summary Stats Cards (Above Tabs)

> **Where:** The 4 stat cards shown above all tabs

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| R2-2.1 | Affiliates count | Check first card | Shows total affiliate count (8) | |
| R2-2.2 | Referrals count | Check second card | Shows total referral count (34+) | |
| R2-2.3 | Revenue display | Check third card | Shows referred revenue as dollar amount | |
| R2-2.4 | Commissions display | Check fourth card | Shows commissions owed as dollar amount | |
| R2-2.5 | Fraud alerts banner | If flagged referrals exist | Yellow alert card appears below stats with flagged referral details | |

---

### SECTION R2-3: Applications Tab

> **Where:** Admin > Setup > Affiliate > Applications tab

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| R2-3.1 | Tab loads | Click "Applications" tab | Shows applications list with pending count badge on tab | |
| R2-3.2 | Pending applications | Check for pending apps | 3 pending applications visible (Sarah Palmer, Mike Torres, Nina Patel) | |
| R2-3.3 | Approved/Rejected visible | Set filter to "All" | Shows all 5 applications: 3 pending, 1 approved (Lisa Wang), 1 rejected (Tom Baker) | |
| R2-3.4 | Filter by status | Try each filter option (All, Pending, Approved, Rejected) | List filters correctly for each status | |
| R2-3.5 | Approve an application | Approve Sarah Palmer's application | Status changes to "approved", account created | |
| R2-3.6 | Reject an application | Reject Mike Torres with reviewer notes | Status changes to "rejected", notes saved | |
| R2-3.7 | Delete an application | Delete Tom Baker's rejected application | Application removed from list | |

---

### SECTION R2-4: Settings Tab

> **Where:** Admin > Setup > Affiliate > Settings tab

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| R2-4.1 | Settings load | Click "Settings" tab | Current settings displayed (commission rate, duration, cookie days, etc.) | |
| R2-4.2 | Edit and save | Change commission rate to a new value, save | Saves successfully, value persists on page reload | |
| R2-4.3 | Re-engagement settings | Check re-engagement section | Shows dormancy threshold (30 days), max emails (3), toggle for enabled | |
| R2-4.4 | Auto-batch settings | Check auto-batch section | Shows payout schedule day, auto-approve threshold | |

---

### SECTION R2-5: Tiers Tab

> **Where:** Admin > Setup > Affiliate > Tiers tab

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| R2-5.1 | Tiers load sorted | Click "Tiers" tab | 5 tiers shown sorted by threshold: Starter (0), Bronze (10), Silver (25), Gold (50), Platinum (75) | |
| R2-5.2 | Tier details | Check each tier card | Shows name, referral threshold, commission rate, and perks (if any) | |
| R2-5.3 | Perks display correctly | Check tiers with perks | Perks shown as badges (not raw text/comma-separated string) | |
| R2-5.4 | Edit a tier | Click edit on any tier | Form pre-fills with current values, including perks as comma-separated text | |
| R2-5.5 | Save tier edit | Change a value and save | Tier updated, change visible immediately | |
| R2-5.6 | Create new tier | Click add, create "Diamond" with 100 referrals, 40% rate | New tier appears in sorted position | |
| R2-5.7 | Delete tier | Delete the "Diamond" tier | Tier removed from list | |

---

### SECTION R2-6: Milestones Tab

> **Where:** Admin > Setup > Affiliate > Milestones tab

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| R2-6.1 | Milestones load | Click "Milestones" tab | 5 milestones shown (First Referral through Legend) | |
| R2-6.2 | Milestone details | Check each milestone | Shows name, referral threshold, bonus amount, description | |
| R2-6.3 | Awards granted | Check milestone awards | Some milestones show number of affiliates who earned them | |
| R2-6.4 | Edit milestone | Edit any milestone | Form pre-fills, saves correctly | |
| R2-6.5 | Create milestone | Add a new milestone | Appears in list | |
| R2-6.6 | Delete milestone | Delete the new milestone | Removed from list | |

---

### SECTION R2-7: Marketing Assets Tab

> **Where:** Admin > Setup > Affiliate > Assets tab

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| R2-7.1 | Assets load | Click "Assets" tab | 6 assets shown (banners, email templates, social posts, comparison doc) | |
| R2-7.2 | Asset types | Check asset type labels | Each asset shows its type (Banner, Email Template, Social Post, etc.) | |
| R2-7.3 | View content | Click to expand/view an asset | Content displays correctly (no broken formatting) | |
| R2-7.4 | No emoji in templates | Check email templates and social posts | Templates contain no emoji characters | |
| R2-7.5 | Edit asset | Edit any asset | Saves correctly | |
| R2-7.6 | Create new asset | Add a new banner asset | Appears in list | |
| R2-7.7 | Delete asset | Delete the new asset | Removed from list | |

---

### SECTION R2-8: Broadcasts Tab

> **Where:** Admin > Setup > Affiliate > Broadcasts tab

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| R2-8.1 | Broadcasts load | Click "Broadcasts" tab | 3 broadcasts shown (2 sent, 1 draft) | |
| R2-8.2 | Sent broadcast stats | Check sent broadcasts | Shows sent count, opened count, clicked count, date | |
| R2-8.3 | Draft shows actions | Check the draft broadcast | Edit (pencil), Send (arrow), and Delete (trash) buttons visible | |
| R2-8.4 | Edit draft | Click edit on draft, change subject | Dialog opens with pre-filled values, saves changes | |
| R2-8.5 | Send draft | Click send on draft | Confirmation dialog appears. On confirm, status changes to "sent" | |
| R2-8.6 | Create new broadcast | Click "New Broadcast", fill in subject/body | Draft created, appears in list | |
| R2-8.7 | Delete broadcast | Delete a broadcast | Removed from list | |

---

### SECTION R2-9: Members Tab

> **Where:** Admin > Setup > Affiliate > Members tab

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| R2-9.1 | Members load | Click "Members" tab | Table shows 8 affiliates with columns: Name/Email, Status, Tier, Referrals, Earnings, Joined, Actions | |
| R2-9.2 | Status badges | Check status column | Active affiliates show "Active" badge, dormant show different status | |
| R2-9.3 | Tier display | Check tier column | Each affiliate shows their assigned tier name | |
| R2-9.4 | Earnings display | Check earnings column | Dollar amounts shown, pending earnings shown if > $0 | |
| R2-9.5 | Search | Type a name or email in search | Table filters to matching results | |
| R2-9.6 | Sort by earnings | Click earnings column header | Table sorts by earnings (ascending/descending) | |
| R2-9.7 | Sort by referrals | Click referrals column header | Table sorts by referral count | |
| R2-9.8 | Delete member | Delete a test affiliate | Confirmation dialog, then member removed | |

---

### SECTION R2-10: Networks Tab

> **Where:** Admin > Setup > Affiliate > Networks tab

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| R2-10.1 | Networks load | Click "Networks" tab | Shows network cards (ShareASale, Impact, PartnerStack) | |
| R2-10.2 | Active networks | Check ShareASale and Impact | Both show as active with tracking IDs configured (SAS-12345, IMP-67890) | |
| R2-10.3 | Toggle network | Toggle one network off, then back on | State changes and persists | |
| R2-10.4 | Edit tracking ID | Change a tracking ID and save | New value persists on reload | |

---

### SECTION R2-11: Contests Tab

> **Where:** Admin > Setup > Affiliate > Contests tab

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| R2-11.1 | Contests load | Click "Contests" tab | 3 contests shown: 1 active, 1 upcoming, 1 completed | |
| R2-11.2 | Contest details | Check each contest | Shows name, status badge, metric, prize amount, date range | |
| R2-11.3 | Completed contest | Check the completed contest | Shows winner info if available | |
| R2-11.4 | Edit contest | Edit any contest | Form pre-fills, saves correctly | |
| R2-11.5 | Create contest | Add a new contest | Appears in list | |
| R2-11.6 | Delete contest | Delete the new contest | Removed from list | |

---

### SECTION R2-12: Payout Runs Tab

> **Where:** Admin > Setup > Affiliate > Payout Runs tab

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| R2-12.1 | Batches load | Click "Payout Runs" tab | 3 payout batches shown: 2 completed, 1 pending | |
| R2-12.2 | Batch details | Check each batch | Shows status badge, total amount, payout count, batch date | |
| R2-12.3 | Pending batch actions | Check the pending batch | Approve and Reject buttons visible | |
| R2-12.4 | Approve batch | Click Approve on pending batch | Status changes to "approved" | |
| R2-12.5 | Generate new batch | Click "Generate Payout Batch" | New batch created with pending commissions | |

---

### SECTION R2-13: Tab Navigation

> **Where:** Admin > Setup > Affiliate

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| R2-13.1 | Tab switching | Click through all 11 tabs | Each tab loads its content without errors | |
| R2-13.2 | Tab persistence | Click "Tiers" tab, then refresh the page | Page reloads on the Tiers tab (not reset to Health) | |
| R2-13.3 | Direct URL access | Visit `/admin/setup/affiliate?tab=broadcasts` directly | Opens on Broadcasts tab | |
| R2-13.4 | Applications badge | Check Applications tab trigger | Shows pending count badge (red) when pending apps exist | |

---

## Testing Notes (Round 2)

**Round 2 Focus:**
- Verify seeded test data displays correctly across all 11 tabs
- Test CRUD operations (create, edit, delete) on each tab
- Confirm no runtime crashes on any tab

**When something fails:**
1. Note the section number and what happened
2. Take a screenshot if possible
3. Check browser console for errors (F12 > Console)
4. We'll batch all fixes together

**Test data reference:**
- 8 affiliates (7 active, 1 dormant) across 5 tiers
- 34+ referrals, 52+ commissions
- 5 applications (3 pending, 1 approved, 1 rejected)
- 6 marketing assets
- 3 broadcasts (2 sent, 1 draft)
- 3 contests (1 active, 1 upcoming, 1 completed)
- 3 payout batches (2 completed, 1 pending)
- ShareASale and Impact networks activated

**Database check shortcut:** Check Supabase dashboard > Table Editor for affiliate_applications, referral_links, user_roles, affiliate_commissions, etc.

---

## ROUND 3: Consolidation & Centralized Systems

> **Created:** February 23, 2026
> **Goal:** Verify the architecture consolidation changes — affiliate audit tab now links to centralized audit logs, broadcasts can load from centralized email templates, and email templates support category tagging.
> **Pre-requisite:** Round 3 code pushed to GitHub and deployed on Vercel. Admin logged in. Migration `006_email_template_category.sql` run in Supabase (adds `category` column to `email_templates` table).

---

### SECTION R3-1: Audit Tab Consolidation

> **Where:** Admin > Setup > Affiliate > Audit tab
> **What changed:** The old audit tab (with inline timeline, filters, and detail modals) has been replaced with a simple info card that links to the centralized audit logs page.

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| R3-1.1 | Audit tab still exists | Click the "Audit" tab on the affiliate page | Tab loads without error | |
| R3-1.2 | Simple card displays | Check tab content | Shows a card with title "Audit Log", description text explaining all actions are tracked centrally, and a button | |
| R3-1.3 | No inline audit timeline | Look at the tab content | There is NO timeline of audit entries, NO entity type dropdown, NO action dropdown, NO refresh button — just the info card | |
| R3-1.4 | Link button works | Click "View Affiliate Audit Logs" button | Navigates to `/admin/audit-logs?category=affiliate` | |
| R3-1.5 | Centralized page loads | After clicking the link | Audit Logs page opens and shows affiliate-related events (if any exist) | |
| R3-1.6 | Category filter applied | Check the audit logs page after arriving via the link | The page should show only audit entries with affiliate-related actions (entries with `affiliate_` prefix in action names) | |

---

### SECTION R3-2: Centralized Audit Logs Page

> **Where:** Admin > Audit Logs (`/admin/audit-logs`)
> **What changed:** This page already existed. We're verifying it works correctly when accessed with the `?category=affiliate` filter.

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| R3-2.1 | Direct URL access | Go to `/admin/audit-logs` (no filter) | Page loads showing all audit log entries across all categories | |
| R3-2.2 | Filtered URL access | Go to `/admin/audit-logs?category=affiliate` | Page loads showing only affiliate-category audit entries | |
| R3-2.3 | Entries appear after actions | Go back to affiliate admin, make a change (e.g., edit a tier), then return to `/admin/audit-logs?category=affiliate` | The action you just performed appears in the log | |
| R3-2.4 | Entry details | Click on any audit entry | Shows detail information (action, entity, admin, timestamp) | |
| R3-2.5 | No filter shows everything | Visit `/admin/audit-logs` (no category param) | Shows entries from all sources, not just affiliate | |

---

### SECTION R3-3: Broadcast "Load from Template"

> **Where:** Admin > Setup > Affiliate > Broadcasts tab > "New Broadcast" button
> **What changed:** The create broadcast dialog now includes a "Load from Email Template" dropdown at the top. This pulls templates from the centralized email templates system.

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| R3-3.1 | Template dropdown visible | Click "New Broadcast" button | Dialog opens with a "Load from Email Template" dropdown above the Subject field | |
| R3-3.2 | Templates listed | Click the template dropdown | Shows all email templates from the centralized system. Templates with a category (other than "general") show the category in parentheses | |
| R3-3.3 | Loading a template | Select any template from the dropdown | The Subject and Body fields auto-fill with the selected template's content | |
| R3-3.4 | Can still edit after loading | Load a template, then change the subject or body text | Changes are allowed — the template just pre-fills, it doesn't lock | |
| R3-3.5 | Manage templates link | Look below the dropdown | Small text link says "Manage templates in Email Templates" — clicking it navigates to `/admin/email-templates` | |
| R3-3.6 | Not shown when editing | Click edit (pencil icon) on an existing draft broadcast | Dialog opens WITHOUT the template dropdown (only shows when creating new) | |
| R3-3.7 | Works without templates | If no email templates exist in the system | The dropdown section is hidden entirely — broadcast form works normally | |

---

### SECTION R3-4: Email Templates — Category Tagging

> **Where:** Admin > Email Templates (`/admin/email-templates`)
> **What changed:** Email templates now have a "Category" field. Available categories: General, Onboarding, Billing, Affiliate, Team, Notification. Categories appear as badges on template cards.

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| R3-4.1 | Page loads | Go to `/admin/email-templates` | Page loads with all existing templates | |
| R3-4.2 | Category badges | Check existing template cards | Templates with a category other than "general" show a small category badge next to their name | |
| R3-4.3 | Create with category | Click "Create Template", fill in name, description | A "Category" dropdown appears with options: General, Onboarding, Billing, Affiliate, Team, Notification | |
| R3-4.4 | Category saves on create | Create a template with category set to "affiliate", save | Template appears in list with "affiliate" badge | |
| R3-4.5 | Category in edit mode | Click edit on any existing template | A "Category" dropdown appears next to the Subject Line field | |
| R3-4.6 | Category saves on edit | Change an existing template's category to "billing", save | Category badge updates on the card | |
| R3-4.7 | Default category | Create a template without changing the category dropdown | Category defaults to "general" (no badge shown since general is the default) | |
| R3-4.8 | Templates show in broadcast | Create a template with category "affiliate", then go to affiliate broadcasts and click "New Broadcast" | The newly created template appears in the "Load from Template" dropdown with "(affiliate)" label | |

---

### SECTION R3-5: General Regression

> **Where:** Admin > Setup > Affiliate (all tabs)
> **Goal:** Make sure the consolidation changes didn't break anything from Round 2.

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| R3-5.1 | All tabs load | Click through every tab on the affiliate admin page | All tabs load without errors (Health, Applications, Settings, Tiers, Milestones, Assets, Broadcasts, Members, Networks, Contests, Payout Runs, Audit) | |
| R3-5.2 | Tab count | Count the tabs | 12 tabs total | |
| R3-5.3 | Health tab still default | Navigate to `/admin/setup/affiliate` (no tab param) | Health tab loads as default | |
| R3-5.4 | Tab persistence | Click "Tiers" tab, refresh page | Still on Tiers tab after reload | |
| R3-5.5 | Broadcasts still work | Go to Broadcasts tab | Existing broadcasts display, New Broadcast button works | |
| R3-5.6 | Detail modals still work | Click on any tier, milestone, contest, or broadcast entry | Detail modal opens with correct information | |
| R3-5.7 | No console errors | Open browser console (F12), navigate through tabs | No red error messages in console | |

---

### SECTION R3-6: Database Migration Check

> **Where:** Supabase dashboard
> **Goal:** Verify the category column was added to email_templates.

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| R3-6.1 | Migration applied | Check `email_templates` table in Supabase Table Editor | A `category` column exists with type `text` | |
| R3-6.2 | Default value | Check existing rows in email_templates | All pre-existing templates have `category = 'general'` | |
| R3-6.3 | No data loss | Count rows in email_templates | Same number of templates as before the migration | |

---

## Testing Notes (Round 3)

**Round 3 Focus:**
- Architecture consolidation — systems are connected, not duplicated
- Centralized audit logs work with affiliate category filter
- Broadcast dialog integrates with email templates
- Email templates support category tagging
- No regressions from Round 2

**Migration required before testing:**
Run this SQL in Supabase SQL Editor:
```sql
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS category text DEFAULT 'general';
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
```
(File: `migrations/extensions/006_email_template_category.sql`)

**When something fails:**
1. Note the section number (R3-X.X) and what happened
2. Take a screenshot if possible
3. Check browser console for errors (F12 > Console)
4. We'll batch all fixes together

---

## ROUND 4: Regression Tests for Round 3 Fixes

> **Created:** February 23, 2026
> **Goal:** Verify the 6 fixes deployed after Round 3 testing. Only tests prone to breakage from these specific changes are included.
> **Pre-requisite:** Round 4 code pushed to GitHub and deployed on Vercel. Admin logged in.

---

### SECTION R4-1: Email Template Save/Edit

> **Where:** Admin > Email Templates (`/admin/email-templates`)
> **What was fixed:** Templates were failing to save silently. API now handles missing `category` column gracefully, and error messages now display properly.

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| R4-1.1 | Create new template | Click "Create Template", fill in name, subject, body. Save. | Template saves successfully and appears in the list | |
| R4-1.2 | Edit existing template | Click edit on any template, change the subject or body. Save. | Saves without error, updated content shows on reload | |
| R4-1.3 | Error message displays | (If possible) try saving a template with an empty required field | A meaningful error message appears in the toast — not blank or generic | |

---

### SECTION R4-2: Audit Log Filtering

> **Where:** Admin > Audit Logs (`/admin/audit-logs`)
> **What was fixed:** Category and action filters were conflicting, causing empty results. Action filter now hides when a category is selected.

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| R4-2.1 | Category filter hides action | Select "affiliate" from the Category dropdown | The Action dropdown disappears. Results show only affiliate-related entries | |
| R4-2.2 | Return to all categories | Change Category back to "All Categories" | The Action dropdown reappears. Results are unfiltered | |
| R4-2.3 | Action filter works alone | With Category set to "All Categories", select an action (e.g., "approve") | Results filter correctly by that action | |
| R4-2.4 | No empty results from conflict | Select category "affiliate", then switch back to "All Categories" and pick an action | Results appear correctly — no blank screen from stale filters | |

---

### SECTION R4-3: Broadcast Edit Dialog

> **Where:** Admin > Setup > Affiliate > Broadcasts tab
> **What was fixed:** Field was confusingly labeled "Subject" in both create and edit. Renamed to "Broadcast Name" to distinguish from email subject line.

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| R4-3.1 | Create label correct | Click "New Broadcast" | First text input is labeled "Broadcast Name" (not "Subject") | |
| R4-3.2 | Edit shows field | Click edit (pencil icon) on an existing broadcast | Dialog opens with "Broadcast Name" field visible and pre-filled | |
| R4-3.3 | Edit saves changes | Change the broadcast name in edit mode, save | Updated name appears in the broadcast list | |

---

### SECTION R4-4: Affiliate Applications

> **Where:** Public form at `/affiliate/join` and Admin > Setup > Affiliate > Applications tab
> **What was fixed:** Applications weren't loading or saving due to missing `deleted_at` column. API now retries without that filter.

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| R4-4.1 | Submit new application | Go to `/affiliate/join`, fill in a fresh email and details, submit | Success message appears | |
| R4-4.2 | Application appears in admin | Go to Admin > Affiliate > Applications tab | The application you just submitted appears in the list | |
| R4-4.3 | Duplicate blocked | Submit a second application with the same email | You get a "pending application" message, not a crash or silent failure | |

---

### SECTION R4-5: Notifications

> **Where:** Any page (notification bell icon) + browser console
> **What was fixed:** `/api/notifications` was returning 500 errors because the notifications table may not exist. Now returns empty data gracefully.

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| R4-5.1 | No console 500 errors | Open browser console (F12 > Console), navigate through admin pages | No red 500 errors from `/api/notifications` | |
| R4-5.2 | Bell icon works | If a notification bell is visible, click it | Opens without crashing (may show empty list) | |

---

### SECTION R4-6: Members Search Scope

> **Where:** Admin > Setup > Affiliate > Members tab
> **What was fixed:** Search was matching user IDs and referral codes (hidden fields). Now only matches name and email.

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| R4-6.1 | Search by name | Type part of a known member's name in the search box | Member appears in results | |
| R4-6.2 | Search by email | Type part of a known member's email | Member appears in results | |
| R4-6.3 | ID does not match | Copy a user ID or referral code and paste it into search | No results found (search should NOT match hidden fields) | |

---

## Testing Notes (Round 4)

**Round 4 Focus:**
- These 15 tests cover ONLY the 6 areas changed after Round 3
- If all pass, we can move forward to Sprint 4 features
- If any fail, note the test number and what happened

**When something fails:**
1. Note the section number (R4-X.X) and what happened
2. Take a screenshot if possible
3. Check browser console for errors (F12 > Console)
4. We'll batch all fixes together

---

## ROUND 5: Regression Tests for 11 Persistent Bug Fixes

> **Created:** February 23, 2026
> **Goal:** Verify the 11 fixes deployed after Rounds 2-4 testing. These bugs had persisted across multiple rounds (some reported 4+ times). This round confirms they are finally resolved.
> **Pre-requisite:** Round 5 code pushed to GitHub and deployed on Vercel. Admin logged in. Seeded test data still present.

---

### SECTION R5-1: Networks — Read-Only Fields

> **Where:** Admin > Setup > Affiliate > Networks tab
> **What was fixed:** Tracking ID and postback URL were editable inline in the table, but changes weren't saving reliably. Now they display as read-only text in the table row and can only be edited via the detail dialog.

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| R5-1.1 | Fields are read-only in table | Go to Networks tab, look at ShareASale row | Tracking ID ("SAS-12345") and postback URL shown as plain text, NOT editable input fields | |
| R5-1.2 | Edit via detail dialog | Click on the ShareASale row to open detail dialog | Dialog opens with editable fields for tracking ID and postback URL | |
| R5-1.3 | Save from dialog | Change the tracking ID in the dialog, save | Value updates and persists on page reload | |

---

### SECTION R5-2: Members — Status Badges

> **Where:** Admin > Setup > Affiliate > Members tab
> **What was fixed:** All members were showing "Pending Setup" regardless of activity. Status now considers signups > 0 or approved application as "Active".

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| R5-2.1 | Active affiliates show Active | Check status column for affiliates with referrals | Affiliates with signups/referrals show "Active" badge (green) | |
| R5-2.2 | Dormant shows differently | Check status for dormant affiliate | Shows "Dormant" or different badge, not "Active" | |
| R5-2.3 | No "Pending Setup" for active | Scan all member rows | No active affiliate with referrals shows "Pending Setup" | |

---

### SECTION R5-3: Members — Earnings Display

> **Where:** Admin > Setup > Affiliate > Members tab
> **What was fixed:** $0.00 was displaying for affiliates with no earnings. Now shows an em-dash (—) instead. Pending earnings still display when > $0 even if total is $0.

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| R5-3.1 | No $0.00 shown | Check earnings column for affiliates with no earnings | Shows "—" instead of "$0.00" | |
| R5-3.2 | Real earnings display | Check earnings for affiliates with earnings | Dollar amounts shown correctly (e.g., "$125.00") | |
| R5-3.3 | Pending earnings visible | Check for affiliates with pending commissions | "pending" line appears below the total (or below the em-dash if total is $0 but pending > $0) | |

---

### SECTION R5-4: Broadcasts — CRUD Operations

> **Where:** Admin > Setup > Affiliate > Broadcasts tab
> **What was fixed:** Create, send, and delete were all failing due to missing database columns. API now retries with minimal fields on column errors.

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| R5-4.1 | Create draft | Click "New Broadcast", fill in name and body, save | Draft created and appears in list | |
| R5-4.2 | Edit draft | Click edit (pencil) on the draft, change the body, save | Changes saved successfully | |
| R5-4.3 | Send broadcast | Click send (arrow) on a draft | Confirmation dialog appears. On confirm, status changes to "sent" | |
| R5-4.4 | Delete broadcast | Delete any broadcast | Removed from list without error | |

---

### SECTION R5-5: Applications — Delete

> **Where:** Admin > Setup > Affiliate > Applications tab
> **What was fixed:** Delete was failing because it tried to soft-delete (set deleted_at column) which may not exist. Now falls back to hard delete.

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| R5-5.1 | Delete rejected application | Set filter to show rejected apps. Click delete on one. | Application removed from list without error | |
| R5-5.2 | Delete pending application | Click delete on a pending application | Confirmation dialog, then application removed | |

---

### SECTION R5-6: Payout Runs — Full Functionality

> **Where:** Admin > Setup > Affiliate > Payout Runs tab
> **What was fixed:** Generate batch was crashing, approve/reject buttons were missing. Completely rewritten with column-resilient inserts and proper button rendering.

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| R5-6.1 | Batches display | Go to Payout Runs tab | Existing batches shown with status, amount, count, and date | |
| R5-6.2 | Pending batch actions | Check a pending batch | "Approve" and "Reject" buttons visible | |
| R5-6.3 | Approve batch | Click Approve on a pending batch | Status changes to "approved" | |
| R5-6.4 | Generate new batch | Click "Generate Payout Batch" | New batch created (or message saying no pending commissions) | |

---

### SECTION R5-7: Contests — Create and Winner Display

> **Where:** Admin > Setup > Affiliate > Contests tab
> **What was fixed:** Contest create was failing due to missing status column. Now auto-determines status from dates. Completed contests now show winner info.

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| R5-7.1 | Create contest | Click "New Contest", fill in name, metric, prize, start/end dates. Save. | Contest created and appears in list | |
| R5-7.2 | Auto status | Create a contest with start date in the future | Status automatically set to "upcoming" | |
| R5-7.3 | Winner display | Check the completed contest | Shows a trophy icon with winner email/name | |
| R5-7.4 | Edit contest | Edit any contest, change the prize amount, save | Updated value persists | |
| R5-7.5 | Delete contest | Delete the contest you just created | Removed from list | |

---

### SECTION R5-8: Milestones — Earned Count

> **Where:** Admin > Setup > Affiliate > Milestones tab
> **What was fixed:** No count was shown for how many affiliates earned each milestone. Now displays "X affiliates earned" below each milestone.

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| R5-8.1 | Count always shown | Check each milestone | Every milestone shows "X affiliates earned" text (including "0 affiliates earned" for unearned ones) | |
| R5-8.2 | Count styling | Compare earned vs unearned | Milestones with earners show green text; milestones with 0 show muted/gray text | |
| R5-8.3 | Count accuracy | Cross-check with Members tab | The count matches the number of members whose referrals meet or exceed the milestone threshold | |

---

### SECTION R5-9: Audit Logs — Click-to-Expand and URL Filter

> **Where:** Admin > Audit Logs (`/admin/audit-logs`)
> **What was fixed:** Clicking an entry did nothing. URL category filter wasn't triggering. Audit events weren't recording because insert failed on missing columns.

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| R5-9.1 | Click to expand | Click on any audit log entry | A detail dialog opens showing action, entity, admin, timestamp, and any metadata | |
| R5-9.2 | URL filter works | Navigate to `/admin/audit-logs?category=affiliate` | Page loads with only affiliate-category entries shown | |
| R5-9.3 | Events record after actions | Perform an action (e.g., edit a tier on the affiliate page), then check audit logs | The action appears as a new entry | |
| R5-9.4 | Close dialog | Click outside or press X on the detail dialog | Dialog closes cleanly | |

---

### SECTION R5-10: General Regression

> **Where:** Admin > Setup > Affiliate (all tabs)
> **Goal:** Confirm the 11 fixes didn't break anything else.

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| R5-10.1 | All 12 tabs load | Click through every tab | All tabs load without errors or crashes | |
| R5-10.2 | Tab persistence | Click "Contests" tab, refresh page | Still on Contests tab after reload | |
| R5-10.3 | No console errors | Open browser console (F12), navigate through all tabs | No red error messages | |
| R5-10.4 | Health tab KPIs | Check Health tab | KPI cards still display data correctly | |
| R5-10.5 | Settings save | Go to Settings tab, change a value, save | Saves successfully | |

---

## Testing Notes (Round 5)

**Round 5 Focus:**
- These 35 tests cover the 11 bugs that persisted across Rounds 2-4
- All fixes use column-resilient patterns (try full insert, retry with minimal fields on column errors)
- If all pass, we move forward to the next development phase
- If any fail, note the test number and what happened

**Key architecture note:**
The fixes use a "try → catch column error → retry with fewer fields" pattern. This means they work regardless of which optional columns exist in your Supabase database. You do NOT need to run any new migrations for these fixes.

**When something fails:**
1. Note the section number (R5-X.X) and what happened
2. Take a screenshot if possible
3. Check browser console for errors (F12 > Console)
4. We'll batch all fixes together

---

*Round 1 original test plan (Sections 1-27) retained for reference in git history.*
