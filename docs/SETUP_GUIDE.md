# Master SaaS Muse Template - Setup Guide

This guide walks you through creating a new SaaS from the Master SaaS Muse Template.

**Template Status: MVP COMPLETE + Team Collaboration (February 2026)**

---

## Table of Contents

1. [Quick Start (Clone Existing)](#quick-start-clone-existing-template)
2. [From Scratch Setup](#from-scratch-setup)
3. [Environment Variables](#environment-variables)
4. [Project Structure](#project-structure)
5. [Database Tables](#database-tables)
6. [Supabase Configuration](#supabase-configuration)
7. [Stripe Configuration](#stripe-configuration)
8. [Key Commands](#key-commands)

---

## Quick Start (Clone Existing Template)

If you're cloning the completed template:

### 1. Clone Repository
```bash
# Clone from GitHub
git clone https://github.com/SpeckledDarth/master-saas-muse.git my-new-saas
cd my-new-saas

# Install dependencies
npm install
```

### 2. Create Environment File
```bash
# Copy template
cp .env.template .env.local

# Edit with your values
nano .env.local
```

### 3. Set Up Supabase
- Create new Supabase project
- Run SQL from [Database Tables](#database-tables) section
- Copy credentials to `.env.local`

### 4. Set Up Stripe
- Create products in Stripe Dashboard
- Copy API keys to `.env.local`
- Set up webhook endpoint

### 5. Deploy to Vercel
```bash
# Push to your GitHub
git remote set-url origin https://github.com/YOUR_USERNAME/my-new-saas.git
git push -u origin main

# Import to Vercel from GitHub
# Add environment variables in Vercel dashboard
```

---

## From Scratch Setup

If creating a fresh Next.js project:

### Step 1: Create Next.js Project

```bash
npx create-next-app@latest master-saas-muse --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd master-saas-muse
```

### Step 2: Initialize Git and Push to GitHub

```bash
git init
git add .
git commit -m "Initial Next.js 14 setup"
git remote add origin https://github.com/YOUR_USERNAME/master-saas-muse.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Click **"Deploy"**

### Step 4: Install shadcn/ui

```bash
npx shadcn@latest init

# Install components
npx shadcn@latest add button card input label toast avatar badge dialog dropdown-menu separator tabs switch select textarea scroll-area form alert
```

### Step 5: Install Dependencies

```bash
# Core
npm install @supabase/supabase-js @supabase/ssr next-themes @tanstack/react-query zod stripe resend

# Form handling
npm install react-hook-form @hookform/resolvers

# Icons
npm install lucide-react

# Development
npm install -D @types/node
```

---

## Environment Variables

Create `.env.local` with these values:

```bash
# ===================
# SUPABASE
# ===================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# ===================
# STRIPE
# ===================
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (create in Stripe Dashboard)
STRIPE_PRO_PRICE_ID=price_...
STRIPE_TEAM_PRICE_ID=price_...

# ===================
# EMAIL (Resend)
# ===================
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com

# ===================
# ANALYTICS (Optional)
# ===================
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=yourdomain.com

# Sentry (deferred until Next.js 16 support)
# NEXT_PUBLIC_SENTRY_DSN=
# SENTRY_ORG=
# SENTRY_PROJECT=

# ===================
# APP
# ===================
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

## Project Structure

```
master-saas-muse/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   ├── reset-password/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── profile/page.tsx
│   │   │   ├── billing/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (marketing)/
│   │   │   ├── page.tsx (landing)
│   │   │   ├── pricing/page.tsx
│   │   │   └── layout.tsx
│   │   ├── admin/
│   │   │   ├── page.tsx (dashboard)
│   │   │   ├── users/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   │   ├── admin/
│   │   │   ├── stripe/
│   │   │   ├── email/
│   │   │   └── webhooks/
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/ (shadcn)
│   │   ├── layout/
│   │   ├── auth/
│   │   ├── admin/
│   │   ├── subscription/
│   │   └── analytics/
│   ├── lib/
│   │   ├── supabase/
│   │   ├── stripe/
│   │   ├── email/
│   │   ├── validation/
│   │   ├── rate-limit/
│   │   └── logging/
│   └── hooks/
├── docs/
│   ├── MASTER_PLAN.md
│   ├── MUSE_CHECKLIST.md
│   └── SETUP_GUIDE.md
├── config/
│   └── muse.config.json
├── middleware.ts
├── next.config.ts
├── .env.template
└── package.json
```

---

## Database Tables

Run this SQL in Supabase SQL Editor:

```sql
-- ===================
-- PROFILES (extends auth.users)
-- ===================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================
-- USER ROLES
-- ===================
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  app_id TEXT DEFAULT 'default',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, app_id)
);

-- ===================
-- ORGANIZATION SETTINGS
-- ===================
CREATE TABLE organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id TEXT NOT NULL DEFAULT 'default' UNIQUE,
  settings JSONB NOT NULL DEFAULT '{
    "organizationName": "My SaaS",
    "supportEmail": "support@example.com",
    "allowNewSignups": true,
    "maintenanceMode": false,
    "requireEmailVerification": false,
    "enableGoogleSignIn": true
  }'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO organization_settings (app_id) VALUES ('default');

-- ===================
-- AUDIT LOGS
-- ===================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  details JSONB,
  app_id TEXT DEFAULT 'default',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================
-- ORGANIZATIONS (for team collaboration)
-- ===================
CREATE TABLE organizations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Default Organization',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default organization
INSERT INTO organizations (name) VALUES ('Default Organization');

-- ===================
-- ORGANIZATION MEMBERS
-- ===================
CREATE TABLE organization_members (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'manager', 'member', 'viewer')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- ===================
-- INVITATIONS
-- ===================
CREATE TABLE invitations (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'manager', 'member', 'viewer')),
  token TEXT NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);

-- ===================
-- ENABLE RLS
-- ===================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- ===================
-- RLS POLICIES
-- ===================

-- Profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
  
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- User Roles
CREATE POLICY "Users can view own role" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON user_roles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage roles" ON user_roles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Organization Settings
CREATE POLICY "Anyone can read settings" ON organization_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can update settings" ON organization_settings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Audit Logs
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can insert own audit logs" ON audit_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Organizations (service role manages, users can read their org)
CREATE POLICY "Service role full access orgs" ON organizations
  FOR ALL USING (true);

-- Organization Members (service role manages via admin client)
CREATE POLICY "Service role full access org_members" ON organization_members
  FOR ALL USING (true);

-- Invitations (service role manages via admin client)
CREATE POLICY "Service role full access invitations" ON invitations
  FOR ALL USING (true);
```

> **Important RLS Note**: The policies above for organization tables use `FOR ALL USING (true)` which is permissive. **Access is controlled server-side** by using the Supabase admin client (service role) in API routes, not by RLS. This means:
> - Client-side queries to these tables may fail or return empty results
> - All team operations go through server API endpoints that use the admin client
> - For stricter RLS, add policies that check `auth.uid()` membership in organization_members

---

## Supabase Configuration

### Authentication Settings
1. Go to **Authentication > URL Configuration**
2. Set Site URL to your Vercel URL
3. Add Redirect URLs:
   - `https://your-app.vercel.app/*`
   - `http://localhost:3000/*`

### Storage Bucket
1. Create bucket named `avatars` (public)
2. Add policies for authenticated upload/update and public read

### Google OAuth (Optional)
1. Get credentials from Google Cloud Console
2. Enable in **Authentication > Providers > Google**

---

## Stripe Configuration

### Products & Prices
Create in Stripe Dashboard:
- **Pro Plan**: $29/month
- **Team Plan**: $99/month

### Webhook Endpoint
- URL: `https://your-app.vercel.app/api/stripe/webhook`
- Events to listen for:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

---

## Key Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (localhost:3000) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `git push` | Deploy to Vercel (auto-deploy) |

---

## Important URLs

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Stripe Dashboard](https://dashboard.stripe.com)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Google Cloud Console](https://console.cloud.google.com)
- [Resend Dashboard](https://resend.com)
- [Plausible Dashboard](https://plausible.io)

---

## What's Included (MVP + Team)

| Feature | Status |
|---------|--------|
| Email/Password Auth | Complete |
| Google OAuth | Complete |
| Profile with Avatar | Complete |
| Admin Dashboard | Complete |
| User Management | Complete |
| Stripe Billing | Complete |
| Customer Portal | Complete |
| Feature Gating | Complete |
| Email Notifications | Complete |
| Row Level Security | Complete |
| Rate Limiting | Complete |
| Security Headers | Complete |
| Plausible Analytics | Complete |
| Structured Logging | Complete |
| **Team Collaboration** | **Complete** |
| **Role-Based Permissions** | **Complete** |
| **Email Invitations** | **Complete** |
| Sentry Error Tracking | Deferred (Next.js 16) |

---

*Last Updated: February 4, 2026*
