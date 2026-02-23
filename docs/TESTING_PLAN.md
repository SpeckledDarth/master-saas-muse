# PassivePost — Deep Testing Plan

> **Created:** February 23, 2026
> **Scope:** Phase 3 (Affiliate Core), Phase 3.5 (Open Affiliate Program), Phase 3.6 Sprint 1 (Revenue & Motivation), Phase 3.6 Sprint 2 (Tools & Analytics)
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

## Testing Notes

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

*Round 1 original test plan (Sections 1-27) retained for reference in git history.*
