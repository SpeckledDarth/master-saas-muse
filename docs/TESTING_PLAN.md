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

## Pre-Testing Checklist

Before starting, confirm these are in place:

- [ ] Latest code is pushed to GitHub and deployed on Vercel
- [ ] You're logged into the admin account on passivepost.io
- [ ] You have a separate browser or incognito window ready for affiliate testing
- [ ] You have access to the email inbox for your test email address
- [ ] Supabase dashboard is accessible (for checking database records if needed)

---

## SECTION 1: Affiliate Program Settings (Admin)

> **Where:** Admin > Setup > Affiliate (Settings tab)

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| 1.1 | Load affiliate admin page | Go to `/admin/setup/affiliate` | Page loads with tabs: Health, Settings, Tiers, Assets, Applications, Members, Milestones, Broadcasts, Networks | |
| 1.2 | View current settings | Click "Settings" tab | See commission rate, duration, min payout, cookie days, active toggle, attribution policy | |
| 1.3 | Toggle program active/inactive | Turn off "Program Active" toggle, save | Settings saved successfully. Toggle reflects new state on page reload | |
| 1.4 | Change commission rate | Set a new commission rate (e.g., 25%), save | Saves successfully. Value persists on reload | |
| 1.5 | Change cookie duration | Set cookie days to a new value (e.g., 60), save | Saves successfully | |
| 1.6 | Change min payout | Set minimum payout to a new value, save | Saves successfully | |
| 1.7 | Change attribution conflict policy | Change between cookie_wins / code_wins / first_touch / split, save | Each option saves and persists on reload | |
| 1.8 | Toggle program back on | Turn "Program Active" back on, save | Saves successfully | |

---

## SECTION 2: Tier Management (Admin)

> **Where:** Admin > Setup > Affiliate > Tiers tab

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| 2.1 | View tiers | Click "Tiers" tab | See existing tiers (Bronze, Silver, Gold) with rates and thresholds | |
| 2.2 | Create a new tier | Click add, fill in name "Platinum", rate 35%, threshold 100 referrals | Tier created, appears in list | |
| 2.3 | Edit a tier | Edit Platinum tier, change rate to 40% | Tier updated, new rate shows | |
| 2.4 | Delete a tier | Delete the Platinum tier | Tier removed from list | |
| 2.5 | Tier ordering | Check that tiers display in logical order (lowest to highest threshold) | Tiers sorted by threshold | |

---

## SECTION 3: Marketing Assets (Admin)

> **Where:** Admin > Setup > Affiliate > Assets tab

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| 3.1 | View assets | Click "Assets" tab | See list of marketing assets (if any) | |
| 3.2 | Create banner asset | Add new asset: type=banner, name="Homepage Banner", URL to an image | Asset created and appears in list | |
| 3.3 | Create email template | Add new asset: type=email_template, name="Introduction Email", paste some text | Asset created | |
| 3.4 | Create social post | Add new asset: type=social_post, name="Twitter Promo", paste copy text | Asset created | |
| 3.5 | Create text snippet | Add new asset: type=text_snippet, name="Elevator Pitch" | Asset created | |
| 3.6 | Edit an asset | Edit any asset, change its name | Asset updated | |
| 3.7 | Delete an asset | Delete any asset | Asset removed from list | |

---

## SECTION 4: Public Affiliate Landing Page

> **Where:** `/affiliate` (logged out or incognito)

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| 4.1 | Page loads | Visit `/affiliate` in incognito | Public landing page loads with commission info, benefits, "How It Works" | |
| 4.2 | "Apply Now" button | Click "Apply Now" CTA | Navigates to `/affiliate/join` | |
| 4.3 | Footer link | Check site footer | "Affiliate Program" link exists and goes to `/affiliate` | |
| 4.4 | Mobile responsive | View page on mobile width (use browser dev tools) | Layout adjusts properly, no horizontal scroll, CTA visible | |

---

## SECTION 5: Affiliate Application Flow

> **Where:** `/affiliate/join` (incognito browser)
> **Important:** Use a real email address you can check

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| 5.1 | Application form loads | Visit `/affiliate/join` | Form shows: name, email, website (optional), promotion methods (checkboxes), message (optional) | |
| 5.2 | Submit with missing fields | Try to submit without name or email | Validation error shown, form doesn't submit | |
| 5.3 | Submit valid application | Fill in all fields with a real email, submit | Success message shown. Form resets or shows confirmation | |
| 5.4 | Confirmation email received | Check inbox for the email you used | Email arrives: "Application Received — We'll Be in Touch!" with your name, 24-48 hour timeline | |
| 5.5 | Admin notification email | Check admin inbox | Email arrives with applicant details and "Review Application" button | |
| 5.6 | Admin in-app notification | Go to admin dashboard, check notification bell | Notification about new application appears | |
| 5.7 | Application appears in admin | Go to Admin > Affiliate > Applications tab | New application visible with "pending" status | |
| 5.8 | Duplicate detection | Try to submit another application with the same email | Error: duplicate detected, application not created | |
| 5.9 | Application filter — All | Set filter to "All" | See all applications regardless of status | |
| 5.10 | Application filter — Pending | Set filter to "Pending" | Only pending applications shown | |

---

## SECTION 6: Application Review (Admin Approve/Reject)

> **Where:** Admin > Affiliate > Applications tab

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| 6.1 | Approve application | Click "Approve" on the pending application | Status changes to "approved". Supabase user created. Referral link created. Role assigned. | |
| 6.2 | Approval email | Check the applicant's email inbox | Welcome email arrives with login instructions and dashboard link | |
| 6.3 | Reject application | Submit a second test application, then reject it with notes | Status changes to "rejected". Notes saved. | |
| 6.4 | Delete application | Click delete on the rejected application | Application removed from list | |

---

## SECTION 7: Affiliate Login

> **Where:** `/affiliate/login` (incognito browser)
> **Use:** The email from the approved application

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| 7.1 | Login page loads | Visit `/affiliate/login` | Login form shows with magic link and password options | |
| 7.2 | Magic link login | Enter affiliate email, request magic link | Email sent. Clicking link logs in and redirects to `/affiliate/dashboard` | |
| 7.3 | Set password | After logging in, set a password (if option exists) | Password saved successfully | |
| 7.4 | Password login | Log out, then log back in with email + password | Successfully logged in, redirected to `/affiliate/dashboard` | |
| 7.5 | Non-affiliate login attempt | Try logging in with a non-affiliate email | Error message: not an affiliate or no account found | |
| 7.6 | Separate from product login | Confirm `/affiliate/login` is visually different from `/login` | Different branding/layout — no product sidebar or navigation | |

---

## SECTION 8: Affiliate Dashboard (Standalone)

> **Where:** `/affiliate/dashboard` (logged in as approved affiliate)

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| 8.1 | Dashboard loads | Visit `/affiliate/dashboard` | Dashboard loads with own header (no product sidebar) | |
| 8.2 | Stats cards visible | Check top of dashboard | Cards showing: clicks, signups, pending earnings, total earned | |
| 8.3 | Referral link displayed | Find your unique referral link | Link shown with copy button. Clicking copy copies to clipboard | |
| 8.4 | Tier progress | Check tier progress section | Shows current tier and progress to next tier | |
| 8.5 | Marketing assets | Check marketing assets section | Shows assets the admin created (banners, templates, etc.) | |
| 8.6 | Asset copy/download | Try to copy a text asset or view a banner | Copy works, banner displays | |

---

## SECTION 9: Referral Tracking & Cookie Attribution

> **Where:** Incognito browser + admin dashboard

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| 9.1 | Referral link click tracking | Open the affiliate's referral link (`?ref=CODE`) in incognito | Page loads. Click should be recorded. | |
| 9.2 | Cookie set | After clicking referral link, check browser cookies | `pp_ref` cookie exists with the affiliate's code | |
| 9.3 | Click count updates | Go back to affiliate dashboard, check clicks count | Click count incremented by 1 | |
| 9.4 | Admin click visibility | Admin > Affiliate page, check the affiliate's stats | Click count reflects the new click | |
| 9.5 | Source tag tracking | Click a link with `?ref=CODE&src=twitter` | Source tag "twitter" recorded on the click | |

---

## SECTION 10: Affiliate Member Management (Admin)

> **Where:** Admin > Setup > Affiliate > Members tab

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| 10.1 | Members tab loads | Click "Members" tab | Table loads with approved affiliates showing name, email, status, referrals, earnings | |
| 10.2 | Search members | Type affiliate name in search box | Results filtered to matching members | |
| 10.3 | Sort by column | Click column headers (name, referrals, earnings) | Table sorts by that column | |
| 10.4 | Member status display | Check status badges | Active/pending_setup/inactive badges displayed correctly | |
| 10.5 | Delete member | Click delete on a test affiliate | Confirmation prompt. On confirm: affiliate removed, all related records cleaned up | |
| 10.6 | Verify cascade cleanup | After deleting, check Supabase for orphaned records | No commissions, payouts, referrals, referral_links, or user_roles remain for deleted user | |

---

## SECTION 11: Re-Application Flow

> **Where:** `/affiliate/join` (incognito) + Admin

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| 11.1 | Delete approved affiliate | Admin > Members > delete the approved affiliate | Member removed | |
| 11.2 | Re-apply with same email | Go to `/affiliate/join`, submit with the same email | Application accepted (no duplicate error) | |
| 11.3 | New application shows | Admin > Applications tab | New "pending" application visible | |
| 11.4 | Re-approve | Approve the re-application | New Supabase user + referral link created. Affiliate can log in again. | |

---

## SECTION 12: Discount Code System

> **Where:** Admin > Setup > Discount Codes (`/admin/setup/discount-codes`)

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| 12.1 | Page loads | Visit `/admin/setup/discount-codes` | Discount codes admin page loads | |
| 12.2 | Create percentage code | Create: code "SAVE20", type=percentage, value=20, active | Code created, appears in list | |
| 12.3 | Create fixed amount code | Create: code "10OFF", type=fixed_amount, value=1000 (cents) | Code created | |
| 12.4 | Create affiliate-linked code | Create: code "PARTNER10", type=percentage, value=10, link to an affiliate | Code created with affiliate attribution | |
| 12.5 | Set usage limit | Create code with max_uses=5 | Code created with usage limit shown | |
| 12.6 | Set expiry date | Create code with an expiration date | Code created with expiry date shown | |
| 12.7 | Edit a code | Edit any code, change the value | Code updated | |
| 12.8 | Toggle active/inactive | Toggle a code inactive | Code shows as inactive | |
| 12.9 | Delete a code | Delete a test code | Code removed from list | |
| 12.10 | Validate active code (API) | Call `/api/discount-codes/validate` with an active code | Returns valid with discount details | |
| 12.11 | Validate expired code | Set a code's expiry to the past, validate it | Returns invalid/expired | |
| 12.12 | Validate inactive code | Toggle code inactive, validate it | Returns invalid | |
| 12.13 | Validate used-up code | Set max_uses=1, redeem once, validate again | Returns invalid (limit reached) | |

---

## SECTION 13: Milestone Bonuses

> **Where:** Admin > Affiliate > Milestones tab + Affiliate Dashboard

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| 13.1 | Milestones tab loads | Click "Milestones" tab | Shows milestone list (may be empty) | |
| 13.2 | Create milestone | Add: name="First 5", threshold=5 referrals, bonus=$50, description | Milestone created | |
| 13.3 | Create second milestone | Add: name="Power 25", threshold=25, bonus=$150 | Second milestone created | |
| 13.4 | Edit milestone | Edit "First 5", change bonus to $75 | Milestone updated | |
| 13.5 | Delete milestone | Delete "Power 25" | Milestone removed | |
| 13.6 | Toggle active/inactive | Toggle a milestone inactive | Status changes | |
| 13.7 | Affiliate sees milestones | Log in as affiliate, check dashboard | Milestone progress card visible with progress bars | |
| 13.8 | Progress display | Check the progress toward "First 5" | Shows current referral count vs. threshold (e.g., "2/5 referrals") | |

---

## SECTION 14: Real-Time Earnings Widget

> **Where:** Affiliate Dashboard (`/affiliate/dashboard`)

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| 14.1 | Earnings widget visible | Check affiliate dashboard | "Earnings" card/widget visible | |
| 14.2 | Period toggle | Switch between Today / Week / Month | Numbers update for each period | |
| 14.3 | Zero state | New affiliate with no earnings | Shows $0.00 gracefully, no errors | |

---

## SECTION 15: Broadcast System (Admin)

> **Where:** Admin > Affiliate > Broadcasts tab

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| 15.1 | Broadcasts tab loads | Click "Broadcasts" tab | Shows broadcast list (may be empty) | |
| 15.2 | Create draft broadcast | Click "New Broadcast", fill in subject + body, save as draft | Draft saved, appears in list with "draft" status | |
| 15.3 | Edit draft | Edit the draft, change subject line | Draft updated | |
| 15.4 | Set audience | Choose audience: all / top_performers / dormant | Audience selection saves | |
| 15.5 | Send broadcast | Click "Send" on the draft | Status changes to "sent". Count shows recipients | |
| 15.6 | Email delivered | Check affiliate inbox | Broadcast email arrives with the subject/body you wrote | |
| 15.7 | Delete broadcast | Delete a sent broadcast | Broadcast removed from list | |

---

## SECTION 16: Program Health Dashboard (Admin)

> **Where:** Admin > Affiliate > Health tab (default tab)

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| 16.1 | Health tab loads | Go to affiliate admin page | Health tab loads as default with KPI cards | |
| 16.2 | KPI cards display | Check the cards | Shows: active affiliates, dormant count, net ROI, conversion rate | |
| 16.3 | Revenue impact | Check revenue section | Shows commission-related revenue data | |
| 16.4 | Top performers | Check top performers section | Lists ranked affiliates (or empty state if none) | |
| 16.5 | Engagement metrics | Check engagement section | Shows relevant engagement data | |
| 16.6 | Zero-data state | If no affiliate activity yet | Cards show zeros gracefully, no crashes | |

---

## SECTION 17: Deep Link Generator (Affiliate Dashboard)

> **Where:** `/affiliate/dashboard` — Deep Link section

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| 17.1 | Deep link tool visible | Check affiliate dashboard | Deep link generator section visible | |
| 17.2 | Generate link to pricing | Select "Pricing" page, generate link | Link created like `passivepost.io/pricing?ref=CODE` | |
| 17.3 | Generate link to custom page | Enter a custom path (e.g., `/blog/my-post`), generate | Link created with custom path + ref code | |
| 17.4 | Copy deep link | Click copy button | Link copied to clipboard | |
| 17.5 | UTM toggle on | Turn on UTM parameters | Link gets `&utm_source=affiliate&utm_medium=...` appended | |
| 17.6 | UTM toggle off | Turn off UTM parameters | UTM params removed from link | |

---

## SECTION 18: Leaderboard (Affiliate Dashboard)

> **Where:** `/affiliate/dashboard` — Leaderboard section

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| 18.1 | Leaderboard visible | Check affiliate dashboard | Leaderboard card visible (if enabled in admin settings) | |
| 18.2 | Leaderboard privacy | Check how names display | Initials or full names depending on admin privacy setting | |
| 18.3 | Own position highlighted | Find your position in leaderboard | Your entry is visually highlighted | |
| 18.4 | Admin toggle leaderboard | Admin > Settings > toggle leaderboard off | Leaderboard hidden from affiliate dashboard | |
| 18.5 | Admin toggle back on | Admin > Settings > toggle leaderboard on | Leaderboard reappears | |

---

## SECTION 19: Conversion Funnel (Affiliate Dashboard)

> **Where:** `/affiliate/dashboard` — Funnel section

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| 19.1 | Funnel chart visible | Check affiliate dashboard | Conversion funnel section visible | |
| 19.2 | Funnel stages | Check the stages displayed | Shows: Clicks → Signups → Conversions → Paid | |
| 19.3 | Drop-off rates | Check between stages | Percentage drop-off shown between each stage | |
| 19.4 | Period selector | Switch between time periods | Funnel data updates for selected period | |
| 19.5 | Zero-data funnel | New affiliate with no activity | Shows zero values gracefully | |

---

## SECTION 20: Earnings Forecast (Affiliate Dashboard)

> **Where:** `/affiliate/dashboard` — Forecast section

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| 20.1 | Forecast card visible | Check affiliate dashboard | Earnings forecast section visible | |
| 20.2 | Projection display | Check the projected monthly earnings | Shows projected amount with optimistic/pessimistic range | |
| 20.3 | Pace comparison | Check pace vs. last month | Shows whether ahead or behind last month's pace | |
| 20.4 | Tier alert | Check for tier upgrade proximity | If near next tier, shows an alert about upcoming promotion | |
| 20.5 | Zero-data forecast | New affiliate with no earnings | Shows $0 projection gracefully | |

---

## SECTION 21: Source Tag Tracking (Affiliate Dashboard)

> **Where:** `/affiliate/dashboard` — Sources section

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| 21.1 | Sources tab visible | Check affiliate dashboard | "Sources" section or tab visible | |
| 21.2 | Source breakdown | If you clicked links with `?src=twitter` earlier | "twitter" source appears with click count | |
| 21.3 | Multiple sources | Click referral link with `?src=youtube` in another tab | Both "twitter" and "youtube" appear in sources | |
| 21.4 | No-source clicks | Click referral link without `?src=` | Shows as "direct" or uncategorized | |

---

## SECTION 22: Affiliate Activation & Term Lock-In

> **Where:** Product user dashboard (`/dashboard/social/affiliate`) + Admin

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| 22.1 | Product user affiliate page | Log in as a product user, visit `/dashboard/social/affiliate` | Affiliate page loads with activation option | |
| 22.2 | Activate as affiliate | Click activate. Review locked-in terms (rate, duration) | Terms displayed before activation. On accept: referral link created, terms locked in | |
| 22.3 | Locked terms persist | Admin changes global commission rate. Check product-user affiliate's dashboard | Product-user still shows their original locked-in rate, not the new global rate | |
| 22.4 | Tier override | If affiliate reaches Silver tier (higher rate), check dashboard | Higher tier rate is used instead of locked-in rate | |

---

## SECTION 23: Stripe Commission & Payout Lifecycle

> **Where:** Stripe dashboard + Admin + Affiliate dashboard
> **Note:** These tests require a Stripe test-mode payment. If you can't trigger a real Stripe event, verify the webhook handler code exists and the database tables are ready.

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| 23.1 | Referral signup tracked | Click affiliate link, sign up as new user | `affiliate_referrals` record created linking new user to affiliate | |
| 23.2 | Commission on payment | Trigger a Stripe `invoice.paid` event (test mode) for the referred user | `affiliate_commissions` record created with correct amount based on locked-in rate | |
| 23.3 | Commission deduplication | Send the same `invoice.paid` event again | No duplicate commission created (deduplicated by stripe_invoice_id) | |
| 23.4 | Pending earnings update | Check affiliate dashboard after commission | Pending earnings balance increased | |
| 23.5 | Payout request | Admin > create payout for affiliate | Payout created with "pending" status | |
| 23.6 | Payout approval | Admin approves the payout | Status changes to "approved" | |
| 23.7 | Payout marked paid | Admin marks payout as paid | Status changes to "paid". Affiliate balance updated. Commissions marked as paid | |
| 23.8 | Payout notification | Check affiliate notifications after payout processed | Notification received about payout | |

---

## SECTION 24: Fraud Detection & Notifications

> **Where:** Admin affiliate page + notification bell

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| 24.1 | Self-referral detection | Try to click your own affiliate link and sign up | Fraud flag: "self-referral" set on the referral record | |
| 24.2 | Same email domain flag | Referral where referred user has same email domain as affiliate | Fraud flag: "same email domain" | |
| 24.3 | Fraud alerts in admin | Check admin affiliate page | Fraud alert cards visible for flagged referrals | |
| 24.4 | Click notification | Click an affiliate's referral link | Affiliate gets an in-app notification about the click | |
| 24.5 | Signup notification | New user signs up via referral link | Affiliate gets notification about the signup | |
| 24.6 | Commission notification | Commission created from Stripe payment | Affiliate gets notification about earnings | |
| 24.7 | Drip email - Welcome | New affiliate activated | Welcome drip email sent immediately | |
| 24.8 | Drip email - Tips (24hr) | Wait 24 hours after activation (or check `email_drip_log` table) | Tips email scheduled/sent | |

---

## SECTION 25: Network Integration (Admin)

> **Where:** Admin > Affiliate > Networks tab

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| 25.1 | Networks tab loads | Click "Networks" tab | Shows ShareASale, Impact, PartnerStack cards | |
| 25.2 | Configure a network | Enter a tracking ID and postback URL for one network | Settings saved | |
| 25.3 | Toggle network active | Toggle one network active, then inactive | State changes and persists on reload | |

---

## SECTION 26: Email Delivery Verification

> **Where:** Email inboxes (admin + affiliate)

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| 26.1 | Application confirmation email | Submit new application | Applicant gets "Application Received" email | |
| 26.2 | Admin notification email | After application submitted | Admin gets email with applicant details + review button | |
| 26.3 | Approval welcome email | Admin approves application | Applicant gets welcome email with login instructions | |
| 26.4 | Broadcast email | Admin sends broadcast | All targeted affiliates receive the email | |
| 26.5 | Affiliate drip - Welcome | New affiliate activated | Welcome email (immediate) arrives | |
| 26.6 | Check spam folders | For any missing emails | Emails may be in spam/promotions | |
| 26.7 | Email "from" address | Check sender on all emails | Consistent sender name and from address | |

---

## SECTION 27: Edge Cases & Error Handling

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| 27.1 | Affiliate dashboard — unauthenticated | Visit `/affiliate/dashboard` logged out | Redirected to `/affiliate/login` | |
| 27.2 | Product user visits affiliate dashboard | Log in as regular product user, visit `/affiliate/dashboard` | Access denied or redirect (not shown product dashboard content) | |
| 27.3 | Admin pages — non-admin access | Log in as affiliate, try to visit `/admin/setup/affiliate` | Access denied | |
| 27.4 | API error handling | Call `/api/affiliate/applications` with invalid data (no name) | Returns error with helpful message, doesn't crash | |
| 27.5 | Missing database tables | If tables haven't been migrated on a fresh install | APIs return graceful errors (not 500 crashes) | |
| 27.6 | Very long application message | Submit application with a 2000+ character message | Accepted or gracefully truncated, no crash | |
| 27.7 | Special characters in name | Submit application with name like "O'Brien" or "Maria-José" | Accepted without issues | |

---

## Testing Notes

**Recommended order:**
1. Sections 1-3: Admin setup (settings, tiers, assets)
2. Sections 4-8: Full affiliate lifecycle (apply → approve → login → dashboard)
3. Sections 9-11: Tracking, member management, re-application
4. Sections 12-16: Sprint 1 features (discount codes, milestones, earnings, broadcasts, health)
5. Sections 17-21: Sprint 2 features (deep links, leaderboard, funnel, forecast, source tags)
6. Sections 22-24: Core Phase 3 (term lock-in, Stripe commissions, fraud/notifications)
7. Sections 25-27: Networks, email delivery, edge cases

**When something fails:**
1. Note the section number and what happened
2. Take a screenshot if possible
3. Check browser console for errors (F12 > Console)
4. We'll batch all fixes together

**Database check shortcut:** If you need to verify data was created/deleted correctly, you can check the Supabase dashboard > Table Editor and look at the relevant tables (affiliate_applications, referral_links, user_roles, affiliate_commissions, etc.)

---

*This document will be updated with test results as we work through it.*
