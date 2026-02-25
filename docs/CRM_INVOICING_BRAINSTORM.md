# CRM & Invoicing Brainstorm — PassivePost

> **Status:** Phase 5 (Data Layer) COMPLETE. Phase 6 (Dashboard UI) is next. This doc remains the strategic vision — consult it when planning Phase 6-7 features.
> **Created:** February 24, 2026
> **Last Updated:** February 25, 2026

---

## Related Documents

| Document | Path | Relationship |
|----------|------|-------------|
| **Affiliate Enhancements** | `docs/musekit/AFFILIATE_ENHANCEMENTS.md` | Detailed implementation specs (SQL schemas, API endpoints, UI descriptions) for the 32 affiliate features in Phase 3.6. Many features here overlap — see the overlap map below. |
| **Affiliate System Guide** | `docs/musekit/AFFILIATE.md` | Complete guide to the existing affiliate system (Phases 3 + 3.5). What's already built. |
| **Development Roadmap** | `docs/ROADMAP.md` | Master execution tracker. This brainstorm doc feeds into Phases 5-7. |

**This document's role:** Strategic vision document with 217 features across all three dashboards (Admin, Affiliate, User). Covers CRM, invoicing, analytics, AI, and the dogfooding architecture. Use this for planning and prioritization. For affiliate-specific implementation details, see the Enhancements doc.

### Feature Overlap Map

Features in this document that have detailed implementation specs in `AFFILIATE_ENHANCEMENTS.md`:

| Brainstorm # | Brainstorm Feature | Enhancements # | Status |
|---|---|---|---|
| #42 | Earnings milestones with real rewards | E1: Milestone Bonuses | Built (Sprint 1) |
| #14 | Branded discount codes | E3: Discount Code System | Built (Sprint 1) |
| #9 | "My Links" performance dashboard | E4: Deep Link Generator | Built (Sprint 2) |
| #10 | Commission calculator widget | E5: Real-Time Earnings Widget | Built (Sprint 1) |
| #17 | Performance comparison | E2: Affiliate Leaderboard | Built (Sprint 2) |
| #15 | Real-time notifications when code used | E5 + existing notifications | Built |
| #19 | Branded landing page | E23: Co-Branded Landing Pages | Not Started (Sprint 4) |
| #20 | Affiliate onboarding checklist | E11: 7-Day Onboarding Sequence | Not Started (Sprint 3) |
| #16 | Shareable earnings milestone badges | E31: Verified Earnings Badges | Not Started (Sprint 4) |
| #39 | In-app messaging | E28: In-Dashboard Messaging | Not Started (Sprint 4) |
| #41 | Knowledge base / FAQ | E12: Affiliate Resource Center | Not Started (Sprint 3) |
| #18 | Seasonal/promo code boosts | E10: Quarterly Contests | Not Started (Sprint 3) |
| #48 | Feedback/suggestion box | E29: Affiliate Satisfaction Surveys | Not Started (Sprint 4) |

Features NOT in the Enhancements doc (new in this brainstorm): #1-8, #11-13, #21-38, #40, #42-217. These cover CRM, invoicing, user dashboard, admin CRM views, AI tools, analytics, and the unified BI vision — all part of the broader Phases 5-7 plan.

---

## MuseKit vs. PassivePost

- **MuseKit** = the reusable SaaS template/framework (auth, billing, admin, affiliate, teams, CRM, invoicing). The engine.
- **PassivePost** = a specific product built ON MuseKit (content scheduling/flywheel SaaS). One deployment with its own repo, database, Stripe account, branding.
- Every new SaaS product gets its own MuseKit deployment. Clean P&L, independent scaling, zero cross-pollination.
- CRM/invoicing features go into MuseKit (the template), so every future product gets them too.

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

## What Admin Can Create vs. What Affiliates Actually See

| Admin Feature | Affiliate Can See? | How? | Gap |
|---|---|---|---|
| **Tiers** (Bronze → Gold → Platinum) | YES | Progress bar on Overview, current/next tier, perks | Could add tier comparison table, promotion celebrations |
| **Milestones** (one-time bonuses) | YES | Cards with progress bars, checkmarks | Could add visual roadmap, countdown banners |
| **Contests** (competitions) | YES | Active/upcoming on Overview with countdown | Could add live contest leaderboard, past results |
| **Marketing Assets** (9 types) | YES | Marketing tab with copy/download | Could auto-insert affiliate's code/link, add collections |
| **Broadcasts** (email to affiliates) | PARTIAL | Email only, NOT in-app | Should ALSO create in-app notification |
| **Discount Codes** | PARTIAL | Can request codes | Can't customize code name (branded codes) |
| **Program Settings** | NO | Only sees own locked rate | Should show "My Terms" contract view |
| **Health Dashboard** | NO | Admin only | Makes sense |
| **Networks** | NO | Admin only | Makes sense |
| **Payout Runs** | NO | Sees individual payouts only | Could show payout schedule + in-progress notifications |
| **Fraud Flags** | NO | Admin only | Makes sense |
| **Audit Log** | NO | Admin only | Makes sense |

---

## Build Priority Tiers

### Tier 1: Must-Have (Makes dashboards functional)
- Universal `user_profiles` table (replaces affiliate-only profiles)
- `invoices` + `invoice_items` (local records of Stripe transactions)
- `payments` table (local payment records synced from Stripe)
- `affiliate_payout_items` junction (which earnings are in which payout)
- Expand admin affiliate detail view to show full CRM data
- Contract/agreement system
- Branded discount codes for affiliates

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

## Brainstorm Features — Original Ideas (1-41)

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

## Brainstorm Features — Affiliate Delight & Relationship (42-58)

### Earnings & Money Features

42. **Earnings milestones with real rewards** — Not just badges. "Hit $500? Your rate goes from 30% to 35%." Tier system already exists — add celebration animations and congratulations emails on tier jumps.

43. **Earnings goal setter** — Affiliate sets personal monthly goal: "$1,000 this month." Dashboard shows progress bar. "You're 67% to your goal with 12 days left."

44. **Commission split estimator** — "If this customer stays 12 months at $49/month, you'll earn $176.40 total." Shows long-term value of each referral. Makes affiliates think about retention.

45. **"Fastest to $X" recognition** — "You hit $1,000 faster than 90% of affiliates." One-time recognition moment. Shareable.

### Relationship & Communication

46. **Dedicated affiliate manager contact** — Show a face and name on dashboard. "Your affiliate manager: Sarah." Makes it personal, not automated.

47. **Quarterly performance review email** — "Here's your Q1 summary: 45 referrals, $3,200 earned, best month was March." Professional, partner-level communication.

48. **Feedback/suggestion box** — "What would help you promote better?" Simple text form. Admin sees submissions. Affiliates feel heard.

49. **Birthday/anniversary recognition** — "Happy 1-year anniversary! You've earned $8,400 and referred 112 customers." Automated email, zero effort, huge goodwill.

### Tools That Save Them Time

50. **Link shortener built in** — Clean short links: `ppost.co/steele`. Looks better in videos and social posts. We control the redirect.

51. **QR code with branding** — QR codes exist. Add PassivePost logo in center and affiliate's discount code below. Downloadable PNG. Perfect for videos, business cards, flyers.

52. **Auto-generated "media kit" page** — One-click page affiliate shares with sponsors: "I'm an official PassivePost partner. Stats, discount code, what PassivePost does." Professional credibility.

53. **UTM builder with presets** — "YouTube video," "Instagram bio," "Email newsletter," "Blog post" — one click, link tagged with right UTM params. No manual entry.

### Education & Enablement

54. **"How top affiliates promote" guide** — Anonymized tips from best performers. "Affiliates who post 3x/week earn 4x more." Data-driven advice from real program data.

55. **Video tutorials library** — Short walkthroughs: "How to add your link to YouTube description," "How to write a promotional email." Admin uploads, affiliates binge.

56. **Promotion idea generator** — AI-powered. "Give me 5 ways to promote PassivePost to my audience of [fitness coaches]." Personalized to their niche.

57. **Monthly "what's new" digest** — When new features ship, affiliates get digest: "PassivePost launched [feature]. Here's how to pitch it." Fresh talking points.

### Social & Community

58. **Affiliate directory (opt-in)** — Public page listing top affiliates with links to their content. "Our Partners." Social proof for you, exposure for them.

59. **Referral of the month spotlight** — Admin picks one affiliate monthly to feature. Story, stats (with permission), tips. On dashboard and maybe public site.

60. **Affiliate-to-affiliate referrals** — "Know a great affiliate? Refer them, earn a bonus when they hit $100." Grows affiliate program through word of mouth.

### Smart Notifications That Drive Action

61. **"You're close" nudges** — "2 referrals away from next tier!" or "3 more conversions to unlock Gold badge." Timely, specific, actionable.

62. **Dormancy re-engagement with carrot** — Already have re-engagement system. Add incentive: "2x commission boost for the next 7 days to get you back."

63. **Trial expiry alerts** — "Your referral John is on day 12 of 14 trial. Hasn't upgraded yet." Gives affiliate a chance to follow up personally.

64. **Weekly performance snapshot** — Every Monday: "Last week: 12 clicks, 3 signups, $45 earned. Best day was Thursday." Quick, digestible, keeps them engaged.

---

## Brainstorm Features — Marketing Resource Center (65-80)

### Make the Assets Library a Toolkit

65. **"What's working" badges on assets** — Tag most-used or highest-converting assets. "Top Performer" badge. Affiliates gravitate toward proven materials.

66. **Asset usage tracking** — Log when affiliate downloads/copies asset. Show admins most-used assets. Show affiliates: "You've used 4 of 12 available assets."

67. **Categorized asset library with filters** — Organize by purpose (social, email, website), format (image, text, video), campaign/season. "Holiday 2026 Promo Kit" as grouped collection.

68. **Copy-paste social captions** — Pre-written post text with affiliate's referral link auto-inserted. One-click copy. "Share on Twitter" opens compose window with text pre-filled. Branded code auto-inserted.

69. **Customizable templates** — Email templates where affiliate swaps in their name, story, discount code before copying. "Hi, I'm Alex Steele and I use PassivePost for..."

### Case Studies & Social Proof

70. **Case study library as rich cards** — Not just PDF downloads. Show headline, key metric, customer quote, "Share This Story" button.

71. **Success story submissions** — Affiliates submit their own success stories. "I made $2,000 in my first month." Admin approves and publishes. Social proof for other affiliates.

72. **Testimonial clips** — Short video testimonials or quote cards affiliates can embed or share. Admin uploads, affiliate grabs.

### Email & Content Tools

73. **Email swipe file library** — Pre-written email sequences: "First introduction," "Follow-up after trial," "Limited time offer." Affiliate copies, personalizes, sends. Discount code auto-inserted.

74. **Content calendar suggestions** — "This week, post about [topic]. Here's a template." Tied to seasonal promotions or new features. Admin sets calendar, affiliates see suggestions.

### Gamified Engagement

75. **Weekly challenges** — "Share 3 posts this week using a new asset, earn a bonus badge." Tracked via asset usage.

76. **New asset notifications** — When admin uploads materials, affiliates get notification: "New swipe file added: Holiday Promo Kit." Drives them back to dashboard.

77. **"Starter Kit" for new affiliates** — Curated bundle of 5 best assets for getting started. Shown during onboarding. "Step 1: Grab your starter kit."

78. **Promotional calendar with countdown timers** — "Black Friday promo starts in 12 days. Here are your assets." Creates urgency, gives prep time.

### Analytics on Assets

79. **"Which asset drove my conversions?"** — Track which asset affiliate used before referral converted. "Your top asset was Instagram banner — 8 conversions." Powerful.

80. **A/B guidance** — "Affiliates who use email templates convert 3x better than link-only." Data-driven nudges to use more of the toolkit.

---

## Brainstorm Features — AI-Powered Tools (81-98)

### Content Generation

81. **AI Social Post Writer** — Pick platform (Twitter/LinkedIn/Instagram/Facebook), tone (casual/professional/urgent/storytelling), describe audience. AI generates 3 post variations with discount code and referral link embedded. One-click copy.

82. **AI Email Draft Generator** — "Write an email to my subscribers introducing PassivePost." Input: audience type, length, angle (pain point/benefit/urgency). AI generates complete email with branded code and link.

83. **AI Blog Post Outline** — "Give me a blog outline about why creators need scheduling tools." Generates headings, key points, CTA with affiliate link.

84. **AI Video Script Generator** — "Write a 60-second YouTube script reviewing PassivePost." Includes hook, features to mention, CTA with discount code. Perfect for YouTubers.

85. **AI Ad Copy Generator** — Short-form for paid ads. "Write a Facebook ad targeting small business owners." Headline, body, CTA variations.

### Personalization & Audience Targeting

86. **Audience-aware content** — Affiliate sets niche in profile (e.g., "fitness coaches"). All AI content auto-tailors: "PassivePost helps fitness coaches schedule content while they focus on clients."

87. **AI pitch customizer** — Paste potential customer's website/social URL. AI analyzes and generates personalized pitch. Like having a sales coach.

88. **Objection handler** — "My audience says scheduling tools are too expensive." AI generates 3 responses using PassivePost's pricing and features. Common objections pre-loaded, custom ones accepted.

### Performance Intelligence

89. **AI Weekly Coach** — Every Monday, AI analyzes performance data and sends personalized tip: "Your LinkedIn posts convert 4x better than Twitter. Double down on LinkedIn this week."

90. **AI-suggested best time to post** — Based on when referral clicks happen most. "Your audience clicks most 9-11am EST on weekdays."

91. **AI conversion optimizer** — "3 of your last 10 referrals signed up but didn't convert. Here are talking points for follow-up."

92. **"Why they didn't convert" insights** — When trial expires without converting, AI suggests reasons and gives follow-up template. "They never connected a social account. Try this message..."

### Smart Automation

93. **Auto-generated promotional calendar** — AI creates month-long posting plan based on upcoming features, seasonal events, audience, past performance. "Week 1: Feature spotlight. Week 2: Success story. Week 3: Discount push."

94. **AI hashtag suggestions** — For each generated post, relevant hashtags for the platform. Already in bonus features list.

95. **Smart notification copywriting** — System notifications are AI-polished to feel warm and motivating, not robotic.

### Affiliate Onboarding AI

96. **AI onboarding advisor** — First week guided assistant: "I see you haven't set up your branded code. Want me to suggest names based on your name and niche?"

97. **"Analyze my audience" tool** — Input social handle or website URL. AI summarizes: "Your audience is 25-35, interested in photography. Top 3 features to highlight for them."

98. **Promotion strategy quiz** — Short interactive quiz: "How do you reach your audience? What's your content style?" AI generates personalized promotion playbook. "You're a Video-First Promoter. Here's your 30-day plan."

### AI Differentiation

**Why this is better than "just use ChatGPT":**
- Affiliate's discount code auto-inserted in every generation
- Referral link auto-inserted
- Audience/niche remembered from profile
- Performance data informs suggestions
- PassivePost features and pricing baked into every prompt
- No context-setting needed — the AI just knows

### AI Cost Control
- Daily generation limit by tier (Free: 5/day, Gold: 20/day, Platinum: unlimited)
- Cache popular prompts — serve cached variations for common requests
- Short completions — social posts and ad copy cost pennies per generation

---

## Brainstorm Features — Surfacing Existing Admin Features (99-108)

These require NO new tables — just wiring up existing systems.

99. **Broadcasts → also in-app notification** — When admin sends broadcast email, also create notification record for each recipient. Nearly free — one line in broadcast send logic.

100. **New asset upload → trigger affiliate notification** — "New marketing asset available: Spring Promo Banner." Drives affiliates back to toolkit.

101. **Auto-insert affiliate code/link into text assets** — Before affiliate copies email template or social post, auto-replace placeholders with their specific code and link. Zero manual work.

102. **Tier promotion celebration** — Confetti animation + congratulations card when affiliate reaches new tier. Automated email: "You hit Gold! Commission now 35%."

103. **Live contest leaderboard** — During active contest, show real-time ranking. "You're 3rd. 2 more referrals to take 2nd." Leaderboard API already exists.

104. **"My Terms" formal contract view** — Show locked-in agreement: commission rate, duration, cookie days, minimum payout. Data already in referral_links table.

105. **Terms changelog** — "Program default changed from 30% to 25% on March 1. Your locked rate of 30% is unaffected." Builds massive trust.

106. **Payout schedule display** — "Next batch runs March 15. You have $340 pending." Data in program settings already.

107. **Payout in-progress notifications** — "Your payout of $340 has been approved and is being processed." Status updates through existing notification system.

108. **Milestone countdown as persistent banner** — "You're 3 referrals away from the $200 bonus!" Not buried in overview — visible everywhere.

---

## Brainstorm Features — Invoicing & Financial Tools for Affiliates (109-132)

### The Dogfooding Insight

PassivePost is a content scheduling tool. Affiliates are content creators who need to grow their own business. They use PassivePost for THEMSELVES — to schedule posts, build audience, get followers. The affiliate program is a bonus layer: they're already power users, so recommending PassivePost is authentic, not a sales pitch.

This creates a flywheel:
- Affiliate uses PassivePost to grow their business → loves it
- Recommends it authentically to their audience → earns commissions
- Their followers sign up, some become affiliates → cycle repeats
- Every feature improvement helps the user AND makes the affiliate a better promoter

**The invoicing features aren't just admin tools. For affiliate-creators running lean businesses, clean earnings statements, tax summaries, and commission receipts ARE business value.**

### Professional Earnings & Statements

109. **Professional earnings statements** — Properly formatted document with PassivePost branding, legal name, address, period, itemized commissions, running total. Downloadable PDF. Monthly and annual versions. Looks like something their accountant would be proud of.

110. **Real-time earnings dashboard "business mode"** — Toggle from gamified view to clean financial view. Revenue this quarter, expenses (subscription cost), net income, projected annual earnings. Makes them feel like a real business.

111. **Automatic invoice generation for payouts** — When paid, they get a proper invoice/receipt: "Payment from PassivePost Inc. to [Legal Name] for affiliate commissions, period: Jan 1-31, 2026." For their own bookkeeping.

112. **Expense offset visibility** — "Your subscription costs $49/month. Affiliate earnings this month: $340. Net profit: $291." Shows subscription literally pays for itself. Powerful retention.

### Tax Time Made Easy

113. **1099-ready annual summary** — One click: complete earnings summary for tax preparer. Total earnings, payout dates, methods, withholding. "Hand this to your accountant."

114. **Quarterly estimated tax helper** — "Based on Q1 earnings ($2,400), set aside ~$600 for estimated taxes." Not tax advice — helpful reminder with calculation. Creators forget this and get burned.

115. **W-9 collection and storage** — Collect W-9 info (tax_id field exists). Store securely. When 1099 time comes, everything ready. No chasing people in January.

116. **Tax document download center** — One page: all tax docs. 1099 forms, annual summaries, payout receipts by year. "Tax Season? We've got you covered."

### Financial Transparency

117. **Commission lifecycle tracker** — For every commission, show full journey: "Referral clicked → Signed up (Day 1) → Trial (Day 3) → Converted (Day 12) → Invoice paid (Day 14) → Commission earned: $14.70 → Approved (Day 30) → In payout batch (Day 45) → Paid to PayPal (Day 47)." Complete transparency.

118. **Projected future earnings** — "34 active referrals paying monthly. At current rates, ~$510/month for next 8 months." Shows residual income pipeline. The number that makes them think "I can't leave."

119. **Earnings by referral** — "Customer Jane generated $280 in commissions over 9 months." Shows most valuable referrals. Maybe they want to thank Jane or target similar people.

120. **Churn impact alerts** — "Referral John cancelled. Recurring commission of $14.70/month ended. Remaining active referrals: 33." Honest, transparent. They respect it.

### Business Tools

121. **Earnings export for bookkeeping** — CSV or QuickBooks-compatible format. Columns match accountant expectations: date, description, amount, category, tax year. One click import.

122. **Multi-year financial history** — "2025: $4,200. 2026 (YTD): $3,100." Year-over-year comparison. Shows growth. Makes them feel like they're building something.

123. **Payment method verification** — Before payouts: "Sending $340 to PayPal at alex@steele.com. Correct?" Prevents wrong-account problems.

124. **Currency display preference** — International affiliates see earnings in local currency (converted at current rate) even if payouts in USD. Small touch, big impact.

125. **Affiliate branded invoice for their clients** — If affiliate recommends PassivePost to their own clients as part of a service, give them a professional handoff document: "I set up PassivePost for you. Here's the cost, my referral link, your 40% discount."

126. **ROI report for their clients** — "Since using PassivePost: 48 posts across 4 platforms, saving ~12 hours/month." If affiliate sells PassivePost as part of service package, proves value.

### Notifications That Build Trust

127. **Payout confirmation with receipt** — Instant notification + email when money lands. "Payout of $340.00 sent to PayPal (alex@steele.com). Receipt attached." Peace of mind.

128. **Commission approval notifications** — "3 commissions totaling $44.10 approved, moved to pending payout balance." They see money moving through pipeline.

129. **Annual earnings milestone emails** — "$5,000 lifetime!" "$10,000!" Genuine achievements. Celebrate them.

130. **Upcoming payout preview** — "Next payout March 15. Estimated: $340 based on approved commissions." No surprises.

---

## Brainstorm Features — Partnership-Level Features (131-147)

### Give Them Ownership

131. **Affiliate revenue share dashboard** — Show like a partnership: "Revenue from your referrals: $3,400. Your share (30%): $1,020. PassivePost share: $2,380." Total transparency. No other program does this.

132. **Lifetime value counter per referral** — "Sarah: 11 months, $539 revenue, $161.70 your earnings, $49.30 estimated remaining (1 month left)." Each referral as an asset, not a one-time event.

133. **"My Portfolio" view** — Referrals as investment portfolio. Active, churned, in trial, total lifetime value, monthly recurring commission. "Portfolio: 34 active, 6 churned, 3 trial. Monthly recurring: $510."

### Make Them Look Professional

134. **Affiliate certification badge** — "Certified PassivePost Partner" badge for website, email signature, YouTube. Multiple sizes. Builds credibility with THEIR audience.

135. **Custom referral landing page analytics** — For branded pages (`/ref/steele40`): visits, bounce rate, signups. Like their own mini-website analytics.

136. **Co-branded case study** — "Alex Steele grew audience 40% using PassivePost." We write (or AI drafts), they approve, goes on OUR site and THEIRS. Both benefit.

### Protect the Relationship

137. **Commission dispute system** — Flag if commission was missed/incorrect. Simple form: "I believe referral X should have generated commission because..." Admin reviews, approves or explains. Transparent resolution. Builds trust even when answer is no.

138. **Grace period on churn** — "Referral John cancelled. If they resubscribe within 30 days, your commission continues." Shown clearly. Reduces anxiety.

139. **Rate lock guarantee visibility** — "Your 30% rate is locked until January 2027. Set when you joined, cannot be reduced." Front and center. Written like a promise, not fine print.

### Passive Income Visibility

140. **Earnings while you sleep counter** — Live ticker: "You earned $4.20 while you were away." Last login vs. commissions since. Reinforces "passive" in passive income.

141. **Annual projection** — "At current $510/month, on track for $6,120 this year from PassivePost alone." Updates monthly. Makes opportunity feel real.

142. **Compound growth visualization** — "Month 1: $50. Month 3: $180. Month 6: $510. Growing 25% month-over-month." Simple growth curve chart. Motivating.

---

## Brainstorm Features — Commission Renewal & Customer Success (143-150)

### The Big Idea: Affiliates as Customer Success Partners

Traditional model: Commission window ends after 12 months. Affiliate loses interest in that customer. SaaS keeps 100%.

PassivePost model: Affiliate can EXTEND commission window by actively helping retain the customer. They become a mini customer success rep — not forced, but financially motivated.

**Why it works for PassivePost:**
- Customer retention goes UP (someone personally checking in on them)
- Free customer success reps who are financially motivated
- Retained customer at 20% commission is better than churned customer at 0%
- Lower than acquisition cost of replacing a churned customer

**Why it works for affiliates:**
- Portfolio doesn't expire — ongoing asset they can maintain
- 12-month income becomes potentially indefinite
- Rewards affiliates who care about their referrals

### Features

143. **Commission renewal system** — At month 10-11, affiliate gets heads-up: "Sarah's commission window ends in 2 months. Want to extend it?" If affiliate does a check-in and customer stays active, window extends 6-12 months at slightly lower rate (30% → 20%).

144. **Customer health indicators for referrals** — "Is Sarah logging in? Posting? Has usage dropped?" Visible in affiliate's portfolio view. Green/yellow/red status per referral.

145. **Pre-written check-in templates** — "Hey Sarah, just wanted to see how PassivePost is working for you..." Affiliate personalizes and sends. Logged as renewal activity.

146. **Issue flagging on behalf of referrals** — "Sarah mentioned trouble with Instagram posting." Goes to admin as support ticket FROM the affiliate. Affiliate becomes the customer's advocate.

147. **Renewal activity log** — Affiliate logs outreach, both sides see effort. Shows PassivePost that affiliate is actively maintaining relationships.

148. **Renewal dashboard** — "Sarah: window expires in 60 days. Status: Active, posting 3x/week. Renewal eligible: Yes. Complete a check-in to qualify."

149. **Post-renewal confirmation** — "Sarah's commission extended 12 months at 20%. New expiration: March 2028." Clear, celebratory.

150. **Renewal earnings projection** — "You have 12 referrals eligible for renewal next quarter. If all renew at 20%, that's ~$180/month continuing income you'd otherwise lose."

---

---

## Brainstorm Features — Business Intelligence & Analytics (151-188)

### Charts & Graphs Affiliates Expect

151. **Earnings line chart** — X-axis time (daily/weekly/monthly toggle), Y-axis dollars. Multiple lines: Earned, Approved, Paid. Hover shows exact values per day. Shows the pipeline visually.

152. **Clicks & conversions dual-axis chart** — Bar chart for clicks, line overlay for conversions. Volume AND quality together. "Tons of clicks March 5 but no conversions — what happened?"

153. **Conversion funnel visualization** — Proper funnel graphic: wide at top (clicks), narrowing through signups, trials, paid. Percentages between stages. Color-coded. Exactly like Google Analytics funnels.

154. **Revenue pie chart by source** — "YouTube: 45%, Email: 30%, Instagram: 15%, Twitter: 10%." Instant visual of where money comes from. Helps decide where to double down.

155. **Earnings heatmap calendar** — Like GitHub's contribution graph but for earnings. Each day colored by amount earned. See patterns: "I earn more on weekdays" or "best days are after video uploads."

156. **Referral retention curve** — Line chart: what % of referrals still active at month 1, 2, 3... 12. Classic cohort retention chart. If curve drops at month 3, they know where to focus.

157. **Month-over-month comparison bars** — Side-by-side: this month vs. last month for clicks, signups, conversions, earnings. Immediate visual of growth or decline.

158. **Cumulative earnings area chart** — Total lifetime earnings growing over time. The line that only goes up. Motivating.

### Conversion Funnel Intelligence

159. **Conversion rate by channel** — "YouTube links: 8%. Instagram bio: 3%. Email newsletter: 12%." Uses existing UTM/source tags. Tells them where to focus.

160. **Conversion rate over time** — Trend line: "5% January → 7% February → 9% March." Are they improving? Data tells them.

161. **Drop-off analysis** — "42 clicked, 18 signed up, 6 trialed, 3 paid." Make it actionable: "Biggest drop-off: trial → paid. 12 started trials but didn't convert."

162. **Trial-to-paid benchmarks** — "Your trial conversion: 25%. Average across all affiliates: 35%." Motivating, not shaming. Shows room to improve.

### Audience & Traffic Insights

163. **Click heatmap by day/hour** — Calendar-style: "Most clicks on Tuesdays 10am and Thursdays 7pm." Tells them exactly when audience is responsive.

164. **Geographic breakdown** — "68% US, 15% UK, 8% Canada." Helps tailor content and posting times.

165. **Device breakdown** — "72% mobile, 28% desktop." Informs which platforms to focus on.

166. **Repeat visitor tracking** — "15 people clicked your link multiple times before signing up." Shows some need multiple touches. Encourages persistence.

167. **Referral source attribution** — "Top 3: YouTube description (40%), Twitter bio (25%), email signature (15%)." Shows where link placement works best.

### Churn Intelligence

168. **Churn rate for their referrals** — "3 of 37 churned this month (8%). Average: 6%." If high, something about audience fit or expectations is off.

169. **Churn reasons** — "2 cited 'too expensive.' 1 cited 'didn't use enough.'" Surface Stripe exit survey data when available.

170. **Churn timing patterns** — "Most churned in months 2-3." Suggests they need to follow up with referrals early.

171. **At-risk referral alerts** — "Sarah hasn't logged in for 14 days. Unusual for her." Early warning for check-in. Ties to commission renewal system.

172. **Net referral growth** — "This month: +5 new, -2 churned = net +3." Portfolio growing or shrinking?

### Performance Benchmarks

173. **Percentile ranking** — "Top 12% for conversion rate, top 25% for referrals, top 8% for earnings." Multiple dimensions so everyone finds a strength.

174. **Month-over-month scorecard** — Key metrics with up/down arrows: "Clicks: 245 (+18%), Signups: 14 (+40%), Conversions: 6 (+20%), Earnings: $88.20 (+25%)."

175. **Personal best tracking** — "Best month ever: February, 8 conversions, $117.60." Something to beat. "You're 2 away from a new record!"

176. **Efficiency metrics** — "Earnings per click: $0.36. Earnings per signup: $6.30." Shows value of each interaction. Quality over quantity.

### AI-Powered Analytics Suggestions

177. **"Why conversions dropped" analysis** — AI analyzes changes: "Click volume up 30% but conversions flat. Suggests lower-quality traffic. Targeting right audience?"

178. **Content type recommendations** — "Tutorial content converts 2.5x better than discount-only posts. Try 'How I use PassivePost.'"

179. **Channel optimization** — "Email converts at 12% but you send 1 link/month. 2x email links could add ~$60/month."

180. **Audience fit score** — AI estimates audience-product fit: "Your audience converts 2x average. Strong fit. Increase promotion frequency."

181. **Seasonal trend predictions** — "Earnings spike 40% in January and September historically. Plan biggest pushes then."

182. **Competitor displacement tips** — "Churned referrals commonly switched to [competitor]. Here are 3 talking points about why PassivePost is better."

### Campaign-Level Tracking (Single Exposure Metrics)

183. **Campaign creator** — Affiliate creates campaign: "Episode 47 - Tech Tools Review" with date, platform, notes. System generates unique tracking link: `passivepost.com/?ref=steele40&campaign=ep47`. Every promotion becomes measurable.

184. **Campaign dashboard** — Each campaign gets own metrics card: clicks, signups, conversions, earnings. "Episode 47: 230 clicks, 12 signups, 4 paid, $58.80." Know exactly which content performs.

185. **Campaign comparison table** — Side-by-side: "Ep 47: 4 conversions, $58.80. Ep 48: 1 conversion, $14.70. Blog March 5: 6 conversions, $88.20." Instantly see winners.

186. **Campaign ROI calculator** — "Ep 47 took ~3 hours. Earned $58.80 = $19.60/hour. Still earning — 2 more signups this week."

187. **Campaign timeline** — Visual timeline showing launch dates and click/conversion activity. Shows "long tail" — YouTube videos earning months later.

188. **Campaign tagging on existing links** — Retroactively tag: "All clicks from YouTube March 1-7 = Episode 47 campaign." Uses existing UTM system.

### Connected Analytics (External Platform Integration)

189. **YouTube Analytics integration** — Connect YouTube (OAuth). Pull views, watch time. Show: "Video got 15,000 views. 230 clicked link (1.5%). 12 signed up. 4 paid. Video-to-customer: 0.027%." Gold.

190. **Google Analytics integration** — Connect GA for their blog. "Blog post: 3,200 pageviews. 89 clicked through. 8 signed up."

191. **Podcast analytics** — Connect Spotify/Apple Podcasts. "Episode 47: 5,400 downloads. 230 clicked (4.3%)." Shows reach-to-click efficiency.

192. **Social media analytics** — Connect Instagram/Twitter/LinkedIn. "Instagram post reached 12,000. 180 clicked." Per-platform efficiency.

193. **Merged analytics dashboard** — One page: external metrics (views, downloads, reach) NEXT TO affiliate metrics (clicks, signups, earnings). Full picture, one place.

194. **Cross-platform performance comparison** — "YouTube: 0.027% viewer-to-customer. Podcast: 0.041%. Blog: 0.019%. Focus on podcast." Data-driven channel strategy.

### Smart Insights From Connected Data

195. **Content-to-revenue attribution** — "Top 3 revenue-generating content this quarter: 1) YouTube 'Creator Tools' ($240), 2) Podcast Ep 52 ($180), 3) Blog 'My Tech Stack' ($95)."

196. **Audience overlap detection** — "72% of signups come within 48 hours of YouTube upload. Post affiliate link in first comment immediately."

197. **Optimal promotion frequency** — "Every 3rd video mention earns 2.5x more than every-video mentions. Frequency fatigue is real."

198. **Content format recommendations** — "Tutorials convert 3x vs. casual mentions. Your tutorials: 0.045% vs. mentions: 0.015%."

### Reporting & Exports

199. **Weekly performance email** — Monday morning: "45 clicks, 6 signups, 2 conversions, $29.40. Conversion rate: 7% (↑ from 5%)." Digestible, actionable.

200. **Monthly business report PDF** — Comprehensive: all metrics, trends, top links, revenue breakdown, tax summary. Show-your-accountant quality.

201. **Custom date range reports** — "Show me Black Friday through Cyber Monday." Pull any date range. Measure specific campaigns.

202. **Comparison reports** — "Q1 vs Q2 side-by-side." Quarterly or monthly growth trajectory.

203. **Scheduled report delivery** — "Send performance report every Monday 9am." Set and forget.

### Analytics UX/UI Principles

204. **Dashboard customization** — Drag/drop widgets. Some want earnings first, others want funnel. Their choice.

205. **Global date range picker** — One selector filters everything. Last 7/30/90 days, this year, custom. Standard.

206. **Real-time updates** — "Last updated: 2 minutes ago." They're used to YouTube Studio near-real-time.

207. **Mobile-responsive analytics** — Check stats from phone. Swipeable cards, collapsible sections. Charts work on small screens.

208. **Sparklines in table rows** — Tiny activity trend line in each referral row. Visual without taking space.

209. **Tooltips on everything** — Hover any metric: plain-English explanation. "Conversion rate: percentage of clickers who became paying customers."

210. **Export any chart** — Download as PNG (share on social: "look at my growth!") or CSV for their own analysis.

---

---

## The Unified Business Intelligence Vision (211-217)

### The Closed-Loop System

Every feature we've brainstormed connects to a larger system. This is not a collection of features — it's a **closed-loop business intelligence engine** where:

1. **The product generates data** (what users/affiliates do)
2. **The CRM organizes relationships** (who everyone is and how they connect)
3. **The invoicing tracks money** (what moved, where, why)
4. **The analytics turn it into insight** (what's working, what's not)
5. **The AI turns insight into action** (specific things to do right now)
6. **The actions generate new data** (and the loop continues)

Every feature participates in this loop. The more features active, the smarter the whole system gets.

### Big Picture Connections

211. **Affiliate-as-Customer Feedback Loop** — When an affiliate uses PassivePost to schedule their promotional posts about PassivePost, we can close the loop entirely: we know WHEN they posted (content calendar), WHERE (platform), WHAT they said (content), and the RESULT (clicks, signups, conversions from affiliate tracking). We can tell them: "Your Tuesday 9am Instagram 'How I plan my content week' post generated 45 clicks and 3 signups. Your Thursday LinkedIn post got 12 clicks and 0 signups. Instagram + personal stories = your winning formula." **No other platform can do this** because no other platform is both the content tool AND the affiliate program.

212. **Admin Intelligence That Flows to Affiliates** — Admin sees ALL affiliates. Aggregate data flows back anonymously: "Affiliates who post 3x/week earn 4x more." "Top content type this month: video tutorials." "Email newsletter referrals have 60% lower churn than social." "Average click-to-conversion time: 8 days." Admin gets "Program Intelligence" dashboard; best insights push to affiliates as coaching tips.

213. **Referral Health → Affiliate Coaching → Customer Retention Triangle** — Customer usage data shows if referral is thriving or at risk → flows to affiliate as health indicators → affiliate checks in (commission renewal system) → customer retention improves → more revenue for PassivePost AND more commissions → activity data flows to admin showing which affiliates are best customer success partners. Three-way feedback loop: Admin ↔ Affiliate ↔ Customer.

214. **Content Performance Intelligence** — Since PassivePost IS the content tool, we know what the affiliate creates for their OWN business. With opt-in: "Your most engaging topics: [X, Y, Z]. Create PassivePost promos around those." "You scheduled 45 posts, 3 mentioned PassivePost. Affiliates mentioning PassivePost in 10% of posts earn 2x more." The product KNOWS their content patterns and can suggest natural affiliate integration.

215. **Unified Financial View** — For customer-affiliates: "Subscription: $49/month. Affiliate earnings: $340/month. Net income from PassivePost: +$291." Break-even tracker: "Subscription free since month 3. Total cost: $294. Total earned: $2,040. Net: +$1,746." Tax consolidation: one document with expense (subscription) AND income (commissions). ROI of upgrading: "Pro plan affiliates earn 35% more on average."

216. **Community Intelligence** — Affiliate feedback, success stories, support tickets help everyone: Admin → prioritize product dev. Affiliates → motivation from peers. Customers → confidence in product. Marketing → real stories and testimonials from genuine users.

217. **Predictive Intelligence** — With enough data: "Likely to hit Gold tier by June — here's how to accelerate." "Your referrals typically churn at month 4 — check in at month 3 to reduce churn 40%." "Earnings dip in summer — build evergreen content now." "3 referrals have usage patterns of likely upgraders — send this Pro features message."

---

## The Dogfooding Architecture (CRITICAL — Read Every Session)

### Three Layers of Dogfooding

**Layer 1: PassivePost the company uses PassivePost.**
PassivePost uses its own product to schedule and publish its own marketing content across social platforms. Every feature built is used internally. Every bug found is found as a real user. The company is its own best case study.

**Layer 2: Affiliates use PassivePost to promote PassivePost.**
Affiliates are content creators who need to grow their own business — scheduling posts, building audience, getting followers. That's exactly what PassivePost does. So they use PassivePost for THEMSELVES, and promoting it to their audience is an authentic recommendation, not a sales pitch. The product they sell is the product they use to sell it.

**Layer 3: Customers become affiliates who use PassivePost.**
Product customers love PassivePost → become affiliates → use PassivePost to promote PassivePost → their followers sign up → some become affiliates → cycle repeats. Self-reinforcing flywheel.

### Why This Creates a Moat

- **Authenticity drives conversions** — Affiliates who are power users are the most credible promoters. They show their own dashboard, their own results.
- **Zero acquisition cost on many affiliates** — They signed up for the product. The affiliate program is a natural extension.
- **Dual retention** — Customer-affiliates have TWO reasons to stay: product value AND commission income. Churn drops dramatically.
- **Every improvement helps twice** — Better scheduling features help the user AND make the affiliate a better promoter. One investment, double return.
- **Invoicing = business value** — Clean earnings statements, tax summaries, commission receipts aren't just nice features. For affiliate-creators running lean businesses, they ARE business value. Hard to leave.

### Cross-Muse Strategy

**MuseKit is the engine. Every Muse gets the full system.**

- **MuseKit** = reusable SaaS template (auth, billing, admin, affiliate, CRM, invoicing, analytics, AI). Built once.
- **PassivePost** = content scheduling Muse. Has special dogfooding synergy.
- **Future Muses** (e.g., PiggyBalance — kids financial literacy for homeschoolers) = different products, same MuseKit engine, same world-class affiliate system.

**The architecture is three layers:**

1. **MuseKit Core** — CRM, invoicing, analytics, affiliate dashboard, AI tools. Universal. Every Muse gets it for free.
2. **Product-Specific Synergy** — How the specific Muse's product enhances the affiliate experience. PassivePost: content scheduling helps promotion. PiggyBalance: might offer teaching resources, lesson plans. Each Muse finds its own angle.
3. **Cross-Muse Network** (future vision) — Affiliates across all Muses form a broader partner ecosystem. PiggyBalance affiliates are content creators who need PassivePost. PassivePost affiliates might have audiences interested in PiggyBalance.

**The cross-pollination:**
- Every Muse creates a new affiliate pool
- Every affiliate pool contains content creators who need PassivePost
- PassivePost becomes connective tissue across all Muses
- An affiliate promoting PiggyBalance today might promote PassivePost tomorrow, and a future Muse after that

**All affiliates need PassivePost. All Muses need affiliates. PassivePost is a customer of itself.**

---

## Affiliate Philosophy

The best affiliate programs make affiliates feel three things:
1. **"They actually want me to succeed"** — tools, education, proactive tips
2. **"I know exactly where I stand"** — transparent earnings, clear terms, real-time data
3. **"I'm a partner, not a contractor"** — branded codes, personal pages, recognition, communication

**PassivePost and affiliates are business partners.** We need promotion, they need revenue, they already have followers. Perfect match. The more thrilled they are, the more they promote. That helps PassivePost too. We are not a greedy company.

---

## Key Design Principle

> Many PassivePost customers will ALSO be affiliates. They use PassivePost to grow their own business, and promoting it as an affiliate is a natural bonus. The world-class UX/UI investment must carry across all three dashboards (Admin, Affiliate, User). Consistent components, consistent quality.

---

## User's Reference Schema

Full table structure brainstorm is saved at:
`attached_assets/Pasted--CRM-Basics-Core-User-Management-Tables-These-tables-ha_1771965360650.txt`

---

## Feature Count Summary

| Section | Features | Range |
|---------|----------|-------|
| Original Ideas (All User Types) | 41 | #1-41 |
| Affiliate Delight & Relationship | 23 | #42-64 |
| Marketing Resource Center | 16 | #65-80 |
| AI-Powered Tools | 18 | #81-98 |
| Surfacing Existing Admin Features | 10 | #99-108 |
| Invoicing & Financial Tools | 22 | #109-130 |
| Partnership-Level Features | 12 | #131-142 |
| Commission Renewal & Customer Success | 8 | #143-150 |
| Business Intelligence & Analytics | 60 | #151-210 |
| Unified BI Vision & Big Picture | 7 | #211-217 |
| **TOTAL** | **217** | |

---

## Next Steps

1. Finalize which features to build (prioritize by impact vs. effort)
2. Design final table schema
3. Create session plan with exact tasks
4. User approves → Build begins

---

*This document must be preserved across sessions. It is the single source of truth for CRM/Invoicing planning until a build plan is approved.*
