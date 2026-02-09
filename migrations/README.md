# MuseKit Database Migrations

This directory contains SQL migration files for MuseKit and its extensions (Muses).

## Structure

```
migrations/
├── core/           # MuseKit core tables (shared across ALL clones)
├── extensions/     # Muse-specific tables (unique to each SaaS built on MuseKit)
└── README.md       # This file
```

## How It Works

### Core Migrations (`core/`)

These define the foundational tables that every MuseKit clone needs. They include the SocioScheduler module tables (social_accounts, social_posts) and any future shared infrastructure.

**Rules:**
- Never add Muse-specific fields to core tables
- These migrations run first, on every clone
- Use `CREATE TABLE IF NOT EXISTS` for idempotency
- Core tables use RLS tied to `user_id` / `org_id`

### Extension Migrations (`extensions/`)

These define tables specific to a particular Muse (SaaS product built on MuseKit). Each Muse adds its own numbered migration files here.

**Rules:**
- Extension tables can reference core tables via foreign keys
- Never modify core table structures — only add new tables or use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
- Use `CREATE TABLE IF NOT EXISTS` for idempotency
- Apply RLS policies to all extension tables
- Document what each migration adds in a comment at the top

**Example for SocioScheduler:**
```
extensions/
└── 001_socioschedule_tables.sql   # brand_preferences, alert_logs, social_posts extensions
```

**Example for a future Muse (e.g., RealtyMuse):**
```
extensions/
└── 001_realtymuse_tables.sql      # mls_listings, property_alerts, etc.
```

## Running Migrations

### Fresh Clone Setup
1. Run all files in `core/` in numerical order
2. Run all files in `extensions/` in numerical order

### In Supabase
Paste the SQL into the Supabase SQL Editor and execute, or use the Supabase CLI:
```bash
# Core tables
psql $DATABASE_URL -f migrations/core/001_social_tables.sql

# Extension tables (Muse-specific)
psql $DATABASE_URL -f migrations/extensions/001_socioschedule_tables.sql
```

## Key Principles

1. **Single DB per Muse Clone** — Core MuseKit + extensions in one Supabase project
2. **No Commingling** — Never add Muse-specific fields to core MuseKit tables
3. **Modular Extensions** — Each Muse runs its own post-clone migration
4. **RLS Everywhere** — All tables (core + extension) use Row Level Security
5. **Text over Enums** — Use text fields for configurable values (admins define options from dashboard)
6. **Idempotent** — All migrations use IF NOT EXISTS / IF EXISTS patterns
