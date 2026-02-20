# Documentation Structure

This documentation is organized into two distinct categories:

## `/docs/musekit/` — Template Documentation

These docs describe the **MuseKit SaaS template** itself — the reusable foundation that every product is built on. When you clone MuseKit to create a new SaaS, these docs stay.

| Document | Purpose |
|----------|---------|
| `PROJECT_OVERVIEW.md` | What MuseKit is, the problem it solves, high-level capabilities |
| `ARCHITECTURE.md` | Deployment model, tech stack, extension patterns, database design |
| `SETUP_GUIDE.md` | Step-by-step guide for setting up a new MuseKit instance |
| `ADDING_A_PRODUCT.md` | How to add a new product extension to MuseKit |
| `ADMIN_GUIDE.md` | Admin dashboard usage, branding, settings, user management |
| `MASTER_PLAN.md` | Development roadmap, module status, version history |
| `MUSE_CHECKLIST.md` | Quick-start checklist for launching a new Muse |

## `/docs/passivepost/` — Product Documentation

These docs describe **PassivePost** — the first product built on MuseKit. When you clone MuseKit for a different SaaS product, delete this folder and create your own product docs.

| Document | Purpose |
|----------|---------|
| `PRODUCT_GUIDE.md` | What PassivePost is, who it's for, features, tiers, architecture |
| `BLOG_PUBLISHING.md` | Blog publishing feature: platforms, cross-linking, SEO, content series |
| `ROADMAP.md` | PassivePost-specific feature roadmap and implementation phases |

## When Cloning MuseKit for a New Product

1. Keep everything in `/docs/musekit/`
2. Delete `/docs/passivepost/`
3. Create `/docs/yourproduct/` with your own product documentation
4. Update `PRODUCT_GUIDE.md` with your product's details
