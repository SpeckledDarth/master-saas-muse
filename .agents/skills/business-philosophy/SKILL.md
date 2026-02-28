---
name: business-philosophy
description: Core business philosophies and strategic principles for PassivePost. Use when making product decisions, designing affiliate features, writing UI copy, planning new features, or whenever you need to understand WHY things are built the way they are. These principles are non-negotiable and apply to every session. Load this skill alongside project-context before any significant work.
---

# Business Philosophy — How We Think

These principles were established through extensive discussion with the founder. They are binding for all sessions and all features. If a decision conflicts with these principles, flag it before proceeding.

## 1. Multi-Layer Dogfooding

PassivePost dogfoods at multiple levels simultaneously:

**Layer 1: MuseKit → PassivePost.** PassivePost stress-tests MuseKit's SaaS template. Every feature exercises MuseKit's extensibility. If it works here, it works for any future product clone.

**Layer 2: PassivePost's affiliate program → PassivePost's own growth.** The affiliate program is itself a top-of-funnel acquisition channel for PassivePost. Affiliates are content creators. Content creators are PassivePost's target customers. By treating affiliates as partners and coaching them to succeed, we naturally convert them into paying users — because they realize they need the same tool for their own business. The affiliate program sells itself.

Every feature touching affiliates should be designed with this conversion play in mind: the affiliate experience should make them WANT to use PassivePost for their own content business.

## 2. Affiliates Are Partners, Not Transactions

This is the most important principle in the entire affiliate system. We do not treat affiliates as a cost center or a transactional channel. They are business partners.

**What this means in practice:**
- We want a little over volume — we'd rather have fewer, higher-quality, well-supported partners than a mass of unsupported affiliates
- Their success compounds into our success. If they earn more, we grow more.
- We honor our agreements absolutely — grandfathering is sacred. If an affiliate signed up under 25% for 12 months, those terms are locked. Changing global settings never breaks existing agreements.
- We invest in their growth through coaching, tools, and branded assets
- We give them control over their own business within our defined policies (branded codes, marketing assets, performance dashboards)

**What this means for UI/UX:**
- Never use language that makes affiliates feel like a number
- Show them their impact ("You've helped 12 customers discover PassivePost")
- Celebrate their wins (milestones, tier promotions, contest victories)
- Help them understand and optimize their performance

## 3. Coaching-First UX

The affiliate dashboard is not just a tool panel — it is a coaching experience. Every screen is an opportunity to help the affiliate succeed.

**Principles:**
- Turn limitations into learning moments (e.g., "code name taken" becomes "here's how to pick a code that builds YOUR brand")
- Add coaching notes, pro tips, and contextual guidance throughout workflows
- Info icons with tooltip text explain not just WHAT a field does, but WHY it matters
- Success messaging reinforces good behavior ("Pro tip: Say your code out loud. If it's easy to say on a podcast, your audience will remember it.")
- Performance sections include actionable insights, not just raw numbers

**This applies beyond the affiliate dashboard.** All user-facing interfaces should coach users toward success, not just present tools. The admin dashboard coaches the admin with best-practice defaults and reasoning tooltips.

## 4. Dual-Attribution Model

Every affiliate has two independent paths to earn referral credit:

1. **Referral link** — URL with cookie tracking. Best for digital content (blog posts, social media, YouTube descriptions, email newsletters).
2. **Discount code** — branded, memorable code. Best for verbal/audio content (podcasts, live streams, in-person mentions, video callouts) where listeners can't click a link but can remember a code.

**Long-tail value:** A discount code works years after it's shared. A podcast episode from 3 years ago still generates referrals if the host said "use code STEELE40." This is a major advantage over cookie-only attribution, where the cookie expires.

Both paths are always available. Both credit the affiliate. Conflict resolution (when two different affiliates' link and code both apply to the same conversion) is handled by the attribution conflict policy setting.

## 5. Labor Hierarchy

When designing any workflow, labor should be distributed in this priority order:

1. **User/Affiliate self-service** — The user or affiliate does the work themselves. The system gives them the tools and guardrails. Example: affiliate brands their own discount code, user schedules their own posts.
2. **n8n automation agents** — Automated workflows handle repetitive tasks under predefined admin policies. Example: auto-batch payout generation, re-engagement emails for dormant affiliates.
3. **Admin human labor** — The admin handles overarching business decisions: policy management, approval workflows, strategic decisions. The admin should NOT be doing repetitive operational work that automation or self-service can handle.

Minimize human input needed to support affiliates and users. Give them full control under defined policies so the system manages outcomes at scale.

## 6. Flywheel Conversion Play

PassivePost's core innovation is a self-reinforcing cycle:

```
Creator uses PassivePost → generates content data → AI coaching improves their content
→ better content drives more affiliate revenue → revenue keeps them on platform
→ platform usage generates more data → cycle repeats
```

The affiliate program adds another flywheel layer:

```
Affiliate promotes PassivePost → earns commissions → realizes they need PassivePost
for their own business → becomes a paying customer → their success attracts more
affiliates → cycle repeats
```

Every feature should be evaluated against these flywheels: does it strengthen the cycle, or is it disconnected from it?

## 7. Grandfathering Is Sacred

When an affiliate is approved under specific terms (commission rate, duration, cookie window, payout threshold), those terms are LOCKED for the duration of their agreement. This is not optional. This is not a nice-to-have. This is a core integrity promise.

- Changing global settings only affects affiliates enrolled AFTER the change
- Existing affiliates keep their original terms until their agreement expires
- New terms can be offered to existing affiliates, but they must explicitly accept them
- The system must make it impossible to accidentally break an existing agreement
- Affiliates can see their active agreement, terms, expiration, and remaining months on their dashboard

If you're building anything that touches affiliate settings or commission calculations, verify that grandfathering is respected before shipping.
