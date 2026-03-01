# Blueprint Errata — Sprint 7–9 Corrections

> **Created:** March 1, 2026
> **Purpose:** Track every error found in the Sprint 7–9 sections of `docs/UX_OVERHAUL_BLUEPRINT.md`. Each item shows the exact wrong text, what's wrong with it, and the exact corrected text. Use this to monitor fixes as they're applied.
> **Total issues:** 9 (all 9 FIXED)
> **Sprint restructure:** After fixing all errata, Sprints 7/8/9 were split into 7 sub-sprints (7A, 7B, 8A, 8B, 9A, 9B, 9C) to fit cleanly in one session each. See the blueprint for details.

---

## Issues Already Fixed

### ✅ Issue #6 — S7-T5 missing Design Decision reference (FIXED)

**Sprint:** 7, Task S7-T5
**What was wrong:** The task listed the 9 defaults inline but didn't tell future sessions where to find the authoritative table with tooltip reasoning text.

**Old text:**
> Add "Reset to Best Practices" button (FR-05) at top of affiliate settings. Restores all 9 agreed defaults (20% commission, recurring, 60-day cookie, $50 min payout, monthly, 12-month residual, manual review, first-touch, 3 tiers enabled). ConfirmDialog before reset.

**Corrected text (already applied):**
> Add "Reset to Best Practices" button (FR-05) at top of affiliate settings. Restores all 9 agreed defaults (20% commission, recurring, 60-day cookie, $50 min payout, monthly, 12-month residual, manual review, first-touch, 3 tiers enabled). ConfirmDialog before reset. See Design Decision #9 ("Best Practice Defaults + Info Tooltips") in this document for the authoritative table of all 9 defaults with tooltip reasoning text.

---

### ✅ Issue #7 — S7-T3 component spec too vague (FIXED)

**Sprint:** 7, Task S7-T3
**What was wrong:** The original description said "Renders children as read-only by default (disabled inputs). 'Edit' button unlocks the group. 'Save' and 'Cancel' buttons appear in edit mode." — too vague for a future session to build correctly without guessing about props, the disabled mechanism, or which wrapper component to use.

**Old text:**
> Build reusable `<EditableSettingsGroup>` component (FR-13 foundation). Renders children as read-only by default (disabled inputs). "Edit" button unlocks the group. "Save" and "Cancel" buttons appear in edit mode. After save, returns to read-only. Uses design system CSS variables.

**Corrected text (already applied):**
> Build reusable `<EditableSettingsGroup>` component (FR-13 foundation). **Props:** `title: string` (group heading), `description?: string` (optional subtext), `children: ReactNode` (the form fields), `onSave: () => Promise<void>` (called when Save clicked), `isSaving?: boolean` (shows spinner on Save button). **Internal state:** `isEditing` boolean (default `false`). **When not editing:** renders a header row with `title` + pencil-icon "Edit" button; wraps `children` in a `<fieldset disabled>` so all nested inputs, selects, switches, and sliders appear grayed out and non-interactive. **When editing:** "Edit" button replaced by "Save" (primary) and "Cancel" (ghost) buttons; `<fieldset>` is no longer disabled so all fields become interactive. **On Save:** calls `onSave()`, awaits completion, then sets `isEditing` back to `false`. **On Cancel:** sets `isEditing` to `false` without saving. **Container:** `<DSCard>` with design system padding (`--card-padding`), radius (`--card-radius`), shadow (`--card-shadow`). All styling uses design system CSS variables — no hardcoded colors, spacing, radius, or shadows.

---

### ✅ Issue #1 — Wrong migration file number (FIXED)

**Sprint:** 8, Task S8-T1
**What's wrong:** The latest migration file in `migrations/core/` is `016_session_e_tables.sql`. The next migration must be numbered `017`, not `018`.

**Old text:**
> `migrations/core/018_contact_fields.sql`

**Corrected text (applied):**
> `migrations/core/017_contact_fields.sql`

---

### ✅ Issue #2 — S8-T1 missing context about existing user_profiles columns (FIXED)

**Sprint:** 8, Task S8-T1
**What's wrong:** The task says to create 4 new tables and add columns to `user_profiles`, but doesn't mention that `user_profiles` already has basic contact columns from migration `011_crm_foundation.sql`: `phone`, `address_line1`, `address_line2`, `city`, `state`, `postal_code`, `country`. A future session could get confused about why there's both a `phone` column on `user_profiles` AND a separate `user_phone_numbers` table, or might try to remove the existing columns.

**Old text:**
> Create FR-01 database tables + profile columns. Tables: `user_phone_numbers` (user_id, label, phone_number, is_primary), `user_email_addresses` (user_id, label, email, is_primary, is_verified), `user_addresses` (user_id, label, street, city, state, zip, country, is_primary), `user_social_links` (user_id, platform, url). Add columns to `user_profiles`: first_name, last_name, company, job_title, website. Run on Replit Postgres, provide Supabase SQL.

**Corrected text (applied):**
> Create FR-01 database tables + profile columns. Tables: `user_phone_numbers` (user_id, label, phone_number, is_primary), `user_email_addresses` (user_id, label, email, is_primary, is_verified), `user_addresses` (user_id, label, street, city, state, zip, country, is_primary), `user_social_links` (user_id, platform, url). Add columns to `user_profiles` via ALTER TABLE ADD COLUMN IF NOT EXISTS: first_name, last_name, company, job_title, website. Run on Replit Postgres, provide Supabase SQL. **Important context:** `user_profiles` already has basic 1-to-1 contact columns (`phone`, `address_line1`, `address_line2`, `city`, `state`, `postal_code`, `country`) from migration `011_crm_foundation.sql`. Those existing columns remain as-is for primary contact info. The new `user_phone_numbers` and `user_addresses` tables handle the 1-to-many pattern (multiple phones, multiple addresses per user). Do not remove or modify the existing columns.

---

### ✅ Issue #3 — S8-T4 vague file reference for migration (FIXED)

**Sprint:** 8, Task S8-T4
**What's wrong:** The Files column says "migration SQL (referral_links columns)" — that's not a file path. A future session won't know where to put the ALTER TABLE statements for `locked_cookie_duration_days` and `locked_min_payout_cents`.

**Old text (Files column):**
> `src/lib/affiliate/index.ts`, migration SQL (referral_links columns), `src/app/admin/setup/affiliate/page.tsx`

**Corrected text (applied, Files column):**
> `src/lib/affiliate/index.ts`, `migrations/core/017_contact_fields.sql` (add ALTER TABLE statements for `locked_cookie_duration_days` INTEGER and `locked_min_payout_cents` INTEGER on `referral_links`), `src/app/admin/setup/affiliate/page.tsx`

---

### ✅ Issue #4 — S9-T4 missing Supabase Storage bucket prerequisite (FIXED)

**Sprint:** 9, Task S9-T4
**What's wrong:** The task says to upload files to Supabase Storage bucket `affiliate-assets`, but that bucket doesn't exist yet. If a session builds the upload code and pushes to Vercel without creating the bucket first, every upload will fail in production with no explanation.

**Old text:**
> Marketing asset file upload (FR-02). Build `FileUpload` component (reuse ImageUpload pattern) supporting PNG, JPG, GIF, SVG, PDF, DOCX, XLSX (10MB limit). Wire into "Add Asset" dialog — toggle between URL input and file upload. Upload to Supabase Storage bucket `affiliate-assets`. Store file_url, file_name, file_size, file_type on asset record. Affiliates see download button on their dashboard.

**Corrected text (applied):**
> Marketing asset file upload (FR-02). Build `FileUpload` component (reuse ImageUpload pattern) supporting PNG, JPG, GIF, SVG, PDF, DOCX, XLSX (10MB limit). Wire into "Add Asset" dialog — toggle between URL input and file upload. Upload to Supabase Storage bucket `affiliate-assets`. Store file_url, file_name, file_size, file_type on asset record. Affiliates see download button on their dashboard. **Prerequisite:** The `affiliate-assets` bucket must be created in Supabase Storage (public read access for download URLs, authenticated upload) before this feature can work on Vercel. Include bucket creation instructions in the Supabase migration inventory provided to the user.

---

### ✅ Issue #5 — S8-T2 missing MuseKit/PassivePost boundary confirmation (FIXED)

**Sprint:** 8, Task S8-T2
**What's wrong:** The new CRUD API routes go under `/api/admin/crm/[userId]/`. The project has a strict boundary rule: MuseKit code outside `/social/`, PassivePost code inside `/social/`. CRM is MuseKit core infrastructure. The blueprint doesn't state this, so a future session might second-guess the placement or put the files in the wrong directory.

**Old text:**
> Build CRUD API routes for each contact table: `/api/admin/crm/[userId]/phones`, `/api/admin/crm/[userId]/emails`, `/api/admin/crm/[userId]/addresses`, `/api/admin/crm/[userId]/social-links` (each: GET, POST, PUT, DELETE). Update `/api/user/profile` to accept and return the new 1-to-1 fields.

**Corrected text (applied):**
> Build CRUD API routes for each contact table: `/api/admin/crm/[userId]/phones`, `/api/admin/crm/[userId]/emails`, `/api/admin/crm/[userId]/addresses`, `/api/admin/crm/[userId]/social-links` (each: GET, POST, PUT, DELETE). Update `/api/user/profile` to accept and return the new 1-to-1 fields. **Boundary:** These routes are MuseKit core (CRM is core infrastructure, not PassivePost-specific). They belong outside `/social/` directories per the boundary rules in the project-context skill.

---

### ✅ Issue #8 — Sprint 7 Done Test grep pattern too loose (FIXED)

**Sprint:** 7, Done Test
**What's wrong:** The test says `grep -r 'confirm(' src/app/admin/` should return zero results. But that pattern also matches legitimate code like `onConfirm(`, `confirmText`, `ConfirmDialog`, import statements, and comments. A future session would run this, see matches from the ConfirmDialog component itself, and think they still have `confirm()` calls to fix.

**Old text:**
> **Done Test:** `grep -r 'confirm(' src/app/admin/` returns zero results. Role change on Users page shows confirmation dialog before firing. Revenue date filters have a Clear Dates button. All affiliate settings groups are read-only by default with Edit button to unlock. "Reset to Best Practices" button exists and restores all 9 defaults with confirmation.

**Corrected text (applied):**
> **Done Test:** Running `grep -rn "confirm(" src/app/admin/ | grep -v ConfirmDialog | grep -v onConfirm | grep -v confirmText | grep -v confirmLabel | grep -v confirmButton | grep -v import | grep -v "//"` returns zero results (this filters out legitimate uses like ConfirmDialog props and imports — only raw browser `confirm()` calls would remain). Role change on Users page shows confirmation dialog before firing. Revenue date filters have a Clear Dates button. All affiliate settings groups are read-only by default with Edit button to unlock. "Reset to Best Practices" button exists and restores all 9 defaults with confirmation.

---

### ✅ Issue #9 — Sprint 8 Done Test missing grandfathering non-regression check (FIXED)

**Sprint:** 8, Done Test
**What's wrong:** The Done Test verifies that `lockInAffiliateTerms()` locks all 4 values and auto-creates a contract, but it doesn't test the most important thing about grandfathering: that changing global settings does NOT retroactively change locked values on existing affiliates. That's the entire point of FR-06 and the core integrity promise described in the business philosophy.

**Old text:**
> **Done Test:** All 4 contact tables exist in Replit Postgres. CRUD API routes return 200 with correct data. CRM detail page shows Phone, Email, Address, Social Link sections with add/edit/delete. Profile tab shows first/last name, company, job title, website. `lockInAffiliateTerms()` locks all 4 values (rate, duration, cookie, min payout) and auto-creates a contract with structured terms. Changing affiliate settings creates an audit log entry. Supabase migration SQL provided to user.

**Corrected text (applied):**
> **Done Test:** All 4 contact tables exist in Replit Postgres. CRUD API routes return 200 with correct data. CRM detail page shows Phone, Email, Address, Social Link sections with add/edit/delete. Profile tab shows first/last name, company, job title, website. `lockInAffiliateTerms()` locks all 4 values (rate, duration, cookie, min payout) and auto-creates a contract with structured terms. Changing affiliate settings creates an audit log entry. Verify that changing global commission rate does NOT change `locked_commission_rate` on existing `referral_links` rows — only affiliates enrolled after the change get the new rate. Supabase migration SQL provided to user.

---

## Summary

| Issue | Sprint | Task | Status |
|-------|--------|------|--------|
| #1 — Wrong migration number (018 → 017) | 8 | S8-T1 | ✅ FIXED |
| #2 — Missing user_profiles existing columns context | 8 | S8-T1 | ✅ FIXED |
| #3 — Vague migration file reference | 8 | S8-T4 | ✅ FIXED |
| #4 — Missing Supabase Storage bucket prerequisite | 9 | S9-T4 | ✅ FIXED |
| #5 — Missing MuseKit boundary confirmation | 8 | S8-T2 | ✅ FIXED |
| #6 — Missing Design Decision #9 reference | 7 | S7-T5 | ✅ FIXED |
| #7 — Component spec too vague | 7 | S7-T3 | ✅ FIXED |
| #8 — Done Test grep pattern too loose | 7 | Done Test | ✅ FIXED |
| #9 — Done Test missing grandfathering check | 8 | Done Test | ✅ FIXED |
