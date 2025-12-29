# Master SaaS Muse Template - Setup Guide

This guide walks you through creating the Next.js 14 + Vercel project from scratch.

---

## Table of Contents

1. [Step 1: Create Next.js Project](#step-1-create-nextjs-project-locally)
2. [Step 2: Push to GitHub](#step-2-initialize-git-and-push-to-github)
3. [Step 3: Deploy to Vercel](#step-3-deploy-to-vercel)
4. [Step 4: Install shadcn/ui](#step-4-install-shadcnui)
5. [Step 5: Install Dependencies](#step-5-install-additional-dependencies)
6. [Step 6: Environment Variables](#step-6-set-up-environment-variables)
7. [Step 7: Project Structure](#step-7-project-structure)
8. [Step 8: Configure Supabase](#step-8-configure-supabase)
9. [Database Tables](#database-tables)

---

## Step 1: Create Next.js Project Locally

Open your terminal and run:

```bash
# Create a new Next.js 14 project with TypeScript, Tailwind, ESLint, and App Router
npx create-next-app@latest master-saas-muse --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Navigate into the project
cd master-saas-muse
```

When prompted:
- Would you like to use TypeScript? **Yes**
- Would you like to use ESLint? **Yes**  
- Would you like to use Tailwind CSS? **Yes**
- Would you like to use `src/` directory? **Yes**
- Would you like to use App Router? **Yes**
- Would you like to customize the default import alias? **Yes** → Use `@/*`

---

## Step 2: Initialize Git and Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Create your first commit
git add .
git commit -m "Initial Next.js 14 setup"

# Create a new repository on GitHub
# Go to github.com → New Repository → Name: "master-saas-muse" → Create

# Connect and push
git remote add origin https://github.com/YOUR_USERNAME/master-saas-muse.git
git branch -M main
git push -u origin main
```

---

## Step 3: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import your GitHub repository `master-saas-muse`
4. Vercel will auto-detect Next.js settings
5. Click **"Deploy"**

Your app will be live at `https://master-saas-muse.vercel.app` (or similar)

---

## Step 4: Install shadcn/ui

```bash
# Initialize shadcn/ui
npx shadcn@latest init

# When prompted:
# - Style: Default
# - Base color: Slate
# - CSS variables: Yes

# Install core components
npx shadcn@latest add button card input label toast avatar badge dialog dropdown-menu separator tabs switch select textarea scroll-area form
```

---

## Step 5: Install Additional Dependencies

```bash
# Core dependencies
npm install @supabase/supabase-js @supabase/ssr next-themes @tanstack/react-query zod

# Form handling
npm install react-hook-form @hookform/resolvers

# Icons
npm install lucide-react

# Development
npm install -D @types/node
```

---

## Step 6: Set Up Environment Variables

Create `.env.local` file:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe (for later)
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

In Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add the same variables for Production/Preview/Development

---

## Step 7: Project Structure

After setup, your project should look like:

```
master-saas-muse/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (marketing)/
│   │   │   ├── page.tsx (landing)
│   │   │   ├── pricing/page.tsx
│   │   │   └── layout.tsx
│   │   ├── admin/
│   │   │   ├── page.tsx
│   │   │   ├── users/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── webhooks/
│   │   │   └── admin/
│   │   ├── globals.css
│   │   └── layout.tsx (root)
│   ├── components/
│   │   ├── ui/ (shadcn)
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── ThemeToggle.tsx
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── SignupForm.tsx
│   │   └── landing/
│   │       ├── Hero.tsx
│   │       └── Features.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── middleware.ts
│   │   ├── stripe/
│   │   │   └── client.ts
│   │   └── utils.ts
│   ├── hooks/
│   │   └── use-toast.ts
│   └── types/
│       └── database.ts
├── middleware.ts
├── next.config.js
├── tailwind.config.ts
├── package.json
└── .env.local
```

---

## Step 8: Configure Supabase

1. Go to [supabase.com](https://supabase.com) → Create new project
2. Copy Project URL and anon key to `.env.local`
3. Enable Email provider in Authentication → Providers
4. Enable Google OAuth:
   - Get credentials from Google Cloud Console
   - Add to Supabase Authentication → Providers → Google
5. Create `avatars` storage bucket:
   - Storage → Create bucket → Name: "avatars" → Public: Yes
   - Add RLS policies for authenticated uploads

---

## Database Tables

Run in Supabase SQL Editor:

```sql
-- User roles table
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  app_id TEXT DEFAULT 'default',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, app_id)
);

-- Organization settings
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

-- Audit logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  details JSONB,
  app_id TEXT DEFAULT 'default',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plans
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  price_monthly INTEGER NOT NULL DEFAULT 0,
  price_yearly INTEGER DEFAULT 0,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  limits JSONB NOT NULL DEFAULT '{}'::jsonb,
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User subscriptions
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  current_period_end TIMESTAMPTZ,
  app_id TEXT DEFAULT 'default',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, app_id)
);

-- Insert default plans
INSERT INTO plans (name, slug, price_monthly, features, limits) VALUES
  ('Free', 'free', 0, '["Basic features", "Community support"]', '{"projects": 1, "storage_mb": 100}'),
  ('Pro', 'pro', 1999, '["All Free features", "Priority support", "Advanced analytics"]', '{"projects": 10, "storage_mb": 5000}'),
  ('Team', 'team', 4999, '["All Pro features", "Team collaboration", "API access"]', '{"projects": -1, "storage_mb": 50000}');

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (basic - will be refined in Module 7)
CREATE POLICY "Users can read own role" ON user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON user_roles FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Anyone can read plans" ON plans FOR SELECT USING (is_active = true);
CREATE POLICY "Users can read own subscription" ON user_subscriptions FOR SELECT USING (auth.uid() = user_id);
```

---

## Next Steps

Once you have completed steps 1-3 (project created, pushed to GitHub, deployed to Vercel), come back here and we'll implement each module together:

1. **Module 1**: Foundation (shadcn/ui, theme, landing page)
2. **Module 2**: Authentication (Supabase auth, protected routes)
3. **Module 3**: Admin Features (dashboard, user management, settings)
4. **Module 4**: Plan System (Free/Pro/Team gating)
5. **Module 5**: Stripe Billing (checkout, webhooks, subscriptions)

---

## Quick Reference

### Key Commands
| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (localhost:3000) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `git push` | Deploy to Vercel (auto-deploy on push) |

### Important URLs
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Google Cloud Console](https://console.cloud.google.com)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [GitHub](https://github.com)

---

*Last updated: December 29, 2025*
