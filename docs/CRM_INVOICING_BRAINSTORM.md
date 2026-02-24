# CRM & Invoicing Brainstorm — PassivePost

> **Status:** BRAINSTORMING — Not approved for build yet. Do NOT start building until user approves a final plan.
> **Created:** February 24, 2026
> **Last Updated:** February 24, 2026

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

## Affiliate Philosophy

The best affiliate programs make affiliates feel three things:
1. **"They actually want me to succeed"** — tools, education, proactive tips
2. **"I know exactly where I stand"** — transparent earnings, clear terms, real-time data
3. **"I'm a partner, not a contractor"** — branded codes, personal pages, recognition, communication

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
