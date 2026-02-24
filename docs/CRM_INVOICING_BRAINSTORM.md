# CRM & Invoicing Brainstorm — PassivePost

> **Status:** BRAINSTORMING — Not approved for build yet. Do NOT start building until user approves a final plan.
> **Created:** February 24, 2026
> **Last Updated:** February 24, 2026

---

## Core Problem Statement

Every dashboard (Admin, Affiliate, User) needs CRM-style account management and transaction-level financial visibility. The current codebase has affiliate-specific tables and APIs, but lacks:
1. A universal profile system (only affiliates have profiles today)
2. Local invoicing/payment records (Stripe handles payments but no local records exist)
3. Support ticket system
4. Contract/agreement tracking
5. Admin CRM view showing full account picture for any user type

---

## Gap Analysis: What Exists vs. What's Needed

### CRM Tables

| Table | Exists? | Notes |
|-------|---------|-------|
| Users | Yes | Supabase auth.users + user_roles + team_members |
| UserProfiles (universal) | PARTIAL | Only `affiliate_profiles` exists. No profile for regular users or admins. |
| Roles / UserRoles | PARTIAL | `user_roles` exists but simple strings, no permissions table |
| Permissions / RolePermissions | NO | Hardcoded in code |
| Teams / Organizations | Yes | `organizations` table exists |
| TeamMembers | Yes | `team_members` table exists |
| Contacts (CRM leads/customers) | NO | |
| Accounts (companies) | NO | |
| Opportunities (deals/pipeline) | NO | |
| Activities (calls/meetings/tasks/notes) | NO | Audit log tracks admin actions, not CRM activities |
| Campaigns (marketing) | PARTIAL | `affiliate_broadcasts` covers email to affiliates only |
| Tickets (support) | NO | |
| TicketComments | NO | |

### Invoicing Tables

| Table | Exists? | Notes |
|-------|---------|-------|
| Invoices | NO | Stripe processes payments but no local invoice records |
| InvoiceItems | NO | |
| InvoiceTemplates | NO | |
| Payments (local records) | NO | No local payment transaction records |
| Refunds | NO | |
| AffiliateEarnings | PARTIAL | `affiliate_commissions` is similar but less granular |
| AffiliatePayoutItems (junction) | NO | Can't see which earnings were in which payout |
| InvoicePayments (partial payment junction) | NO | |

### Reporting Tables

| Table | Exists? | Notes |
|-------|---------|-------|
| AuditLogs | Yes | `affiliate_audit_log` + centralized audit system |
| Metrics (pre-computed) | NO | Currently calculated on every page load |

---

## Build Priority Tiers

### Tier 1: Must-Have (Makes dashboards functional)
- Universal `user_profiles` table (replaces affiliate-only profiles)
- `invoices` + `invoice_items` (local records of Stripe transactions)
- `payments` table (local payment records synced from Stripe)
- `affiliate_payout_items` junction (which earnings are in which payout)
- Expand admin affiliate detail view to show full CRM data
- Contract/agreement system (see Brainstorm Features below)
- Branded discount codes for affiliates (see Brainstorm Features below)

### Tier 2: Should-Have (Makes it a real SaaS template)
- `tickets` + `ticket_comments` (basic support system)
- `activities` table (log calls, notes, tasks)
- `contacts` table (CRM contact records)
- In-app messaging between affiliate and admin

### Tier 3: Nice-to-Have (Can be added later)
- `accounts` / `opportunities` (full sales pipeline)
- `campaigns` / `campaign_contacts` (marketing automation)
- `permissions` / `role_permissions` (database-driven RBAC)
- `invoice_templates`, `payment_gateways`, `refunds`
- Pre-computed `metrics` table

---

## Brainstorm Features (Agreed Ideas)

### For Everyone (All User Types)

1. **Unified profile with completion meter** — "Your profile is 70% complete" with a progress ring. Nudges to add phone, address, avatar. Same component across all dashboards.

2. **Activity timeline** — Chronological feed of all account events. "Commission earned," "Payout processed," "Invoice paid," "Password changed." One component, filtered by role.

3. **Email preferences center** — Users choose what emails they get (weekly digest, payout notifications, announcements). Simple preferences table.

4. **Export anything to CSV** — One shared export utility. Any table view (commissions, payments, referrals, invoices) gets a download button.

5. **Dark mode** — Already works across all dashboards.

### For Affiliates

6. **Downloadable tax summary (1099-ready PDF)** — Button already exists in dashboard. Needs real invoice/payment data to populate. Year filter, totals, payout history.

7. **Monthly earnings statement (emailed)** — Automated email on 1st of each month: "Here's what you earned in January." Pulls from commissions + payouts.

8. **Payout receipt emails with line items** — When admin processes payout, affiliate gets email receipt showing which commissions were included. Requires `affiliate_payout_items` junction.

9. **"My Links" performance dashboard** — Already partially built. With activities table, can show click-through rates per link over time.

10. **Commission calculator widget** — "If you refer X users at $Y/month, you'd earn $Z/year." Pure frontend math, no data needed.

11. **Referral sharing cards** — Pre-designed social media images with referral code baked in. Uses existing assets system.

12. **Pending payout tracker** — "You've earned $X. Need $Y more to hit minimum. At your pace, you'll hit it by [date]." Forecast API already does similar math.

13. **Contract/agreement system** — Affiliates can view their locked-in terms (e.g., 30% residual for 12 months). Even if admin changes program terms later, the affiliate's locked terms are honored and visible. Both sides have a record. Admin can see all active agreements. History of term changes preserved.

14. **Branded discount codes** — Admin creates discount code config (discount %, duration, etc.), but affiliate can customize the code name. Example: YouTuber Alex Steele changes code from "GnYY67h" to "STEELE40" for 40% off. Makes affiliates feel like partners, not numbers.

15. **Real-time notifications when someone uses your code** — "Someone just signed up with STEELE40!" Push notification or email. Trigger on existing referral tracking.

16. **Shareable earnings milestone badges** — "I've earned $1,000 with PassivePost!" — downloadable/shareable image for social proof.

17. **Performance comparison** — "You're in the top 15% of affiliates this month." Percentile from leaderboard data.

18. **Seasonal/promo code boosts** — Admin creates limited-time "double commission" period. Affiliates see banner: "2X commissions through March 31!"

19. **Branded landing page** — Each affiliate gets customizable page at `/ref/steele40`. Shows their name, short pitch, and discount. Feels like THEIR promotion.

20. **Affiliate onboarding checklist** — "Set up profile, customize discount code, share first link, earn first commission." Gamified persistent progress.

### For Product Users (Customers)

21. **Invoice history page** — Every payment, downloadable as PDF. Stripe data synced locally.

22. **Subscription management self-service** — Already via Stripe portal, but add local "billing" tab showing plan, next billing date, payment method, past invoices.

23. **Usage/feature access summary** — "Your plan includes X, Y, Z. Upgrade to get A, B, C." Feature gating already exists — this is a view of it.

24. **Support ticket submission** — Simple form: subject, description, priority. User sees ticket history and status.

25. **Account security page** — Change password, active sessions, 2FA (future). Supabase auth features in clean UI.

26. **Referral program invitation** — Subtle prompt: "Love PassivePost? Become an affiliate and earn 30%." One-click to apply since many customers become affiliates.

27. **Payment receipt emails with branding** — Branded receipt on payment, not just Stripe default. Uses invoice table + email templates.

28. **Upcoming billing reminder** — "Your next payment of $X is March 1." 3-day advance email. Reduces failed payments.

29. **Usage insights** — "You published 12 posts this month, up from 8 last month." Simple product usage stats.

### For Admins

30. **Affiliate "at a glance" CRM card** — Click affiliate name, see EVERYTHING: contact info, earnings, payouts, tickets, activity log, notes. One page.

31. **Bulk payout processing with receipts** — Payout batches table exists. Add auto receipt emails when batch processed.

32. **Revenue attribution report** — "How much revenue from affiliates vs. direct?" Pulls from invoices + referrals.

33. **Scheduled email reports** — Weekly revenue summary, affiliate activity digest, ticket status. Email + queue infrastructure exists.

34. **Quick notes on any account** — Admin adds internal notes to any user/affiliate record. Simple activities/notes entry.

35. **Affiliate health score** — Auto-calculated from: profile completeness, recent activity, conversion rate, support tickets. Red/yellow/green indicator. Admin instantly sees who needs attention.

36. **Revenue waterfall** — Visual: "Total revenue → Affiliate commissions → Net revenue." Chart showing program cost vs. value.

37. **One-click impersonation from CRM** — Impersonation exists, but add single button on affiliate detail: "See what Alex sees."

38. **Automated fraud flags with context** — Fraud flags exist on referrals. Surface as actionable alerts: "Same IP as 3 other signups." Admin can dismiss or investigate.

### Cross-Dashboard

39. **In-app messaging** — Simple message thread between affiliate and admin. Conversation log on the account. Both sides see it. Not a full chat system.

40. **Announcement banner system** — Admin posts announcement, shows as dismissible banner on all dashboards. Uses existing notification system.

41. **Knowledge base / FAQ** — Static searchable help pages. Admin writes, everyone searches. Reduces support load.

---

## Key Design Principle

> Many PassivePost customers will ALSO be affiliates. The world-class UX/UI investment must carry across all three dashboards (Admin, Affiliate, User). Consistent components, consistent quality.

---

## User's Reference Schema

Full table structure brainstorm is saved at:
`attached_assets/Pasted--CRM-Basics-Core-User-Management-Tables-These-tables-ha_1771965360650.txt`

---

## Next Steps

1. Continue brainstorming — add more ideas to this document
2. Finalize which features to build
3. Design final table schema
4. Create session plan with exact tasks
5. User approves → Build begins

---

*This document must be preserved across sessions. It is the single source of truth for CRM/Invoicing planning until a build plan is approved.*
