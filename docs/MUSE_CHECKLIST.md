# New Muse Quick-Start Checklist

This checklist guides you through setting up a new project from the Master SaaS Muse Template.

**Estimated time: 15-30 minutes**

**Template Status: MVP COMPLETE (January 2026)**

---

## Pre-requisites

- [ ] Replit account (for development)
- [ ] Supabase account (free tier works)
- [ ] Stripe account (for payments)
- [ ] Vercel account (for deployment)
- [ ] Google Cloud account (optional, for OAuth)
- [ ] Plausible account (optional, for analytics)
- [ ] Resend account (for transactional emails)

---

## Step 1: Clone the Template (2 min)

- [ ] Fork/clone the GitHub repository
- [ ] Import to Vercel OR clone to Replit
- [ ] Rename the project to your new muse name
- [ ] Update `config/muse.config.json` with your project details:
  - `project.name`
  - `project.tagline`
  - `branding.companyName`
  - `branding.supportEmail`

---

## Step 2: Create Supabase Project (5 min)

- [ ] Go to [supabase.com](https://supabase.com) and create a new project
- [ ] Wait for project to initialize (~2 minutes)
- [ ] Go to **Project Settings > API**
- [ ] Copy **Project URL** and **anon public key**
- [ ] Add environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon public key
  - `SUPABASE_SERVICE_ROLE_KEY` = service_role key (keep secret!)

---

## Step 3: Configure Supabase Auth (3 min)

- [ ] In Supabase, go to **Authentication > URL Configuration**
- [ ] Set **Site URL** to your Vercel URL (e.g., `https://your-app.vercel.app`)
- [ ] Add to **Redirect URLs**:
  - `https://your-app.vercel.app/*`
  - `http://localhost:3000/*` (for local dev)
- [ ] Save changes

---

## Step 4: Create Database Tables (5 min)

Run the SQL from `docs/SETUP_GUIDE.md` in Supabase SQL Editor:
- [ ] Create `user_roles` table
- [ ] Create `organization_settings` table
- [ ] Create `audit_logs` table
- [ ] Create `profiles` table (with stripe fields)
- [ ] Enable Row Level Security on all tables
- [ ] Create RLS policies

---

## Step 5: Create Storage Bucket (3 min)

- [ ] In Supabase, go to **Storage**
- [ ] Click **New bucket**, name it `avatars`, make it **Public**
- [ ] Go to **Policies** tab and add these 3 policies:

**Policy 1: INSERT (authenticated)**
- Name: `Allow authenticated uploads`
- Operation: INSERT
- Target roles: authenticated
- WITH CHECK: `bucket_id = 'avatars'`

**Policy 2: UPDATE (authenticated)**
- Name: `Allow authenticated updates`
- Operation: UPDATE
- Target roles: authenticated
- USING: `bucket_id = 'avatars'`
- WITH CHECK: `bucket_id = 'avatars'`

**Policy 3: SELECT (public)**
- Name: `Allow public reads`
- Operation: SELECT
- Target roles: public
- USING: `bucket_id = 'avatars'`

---

## Step 6: Configure Stripe (5 min)

- [ ] Go to [Stripe Dashboard](https://dashboard.stripe.com)
- [ ] Create products/prices for your plans (Pro $29/mo, Team $99/mo)
- [ ] Copy API keys to environment variables:
  - `STRIPE_SECRET_KEY`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] Set up webhook endpoint:
  - URL: `https://your-app.vercel.app/api/stripe/webhook`
  - Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`
- [ ] Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

---

## Step 7: Configure Email (Resend) (3 min)

- [ ] Go to [Resend Dashboard](https://resend.com/api-keys)
- [ ] Create an API key
- [ ] Add environment variables:
  - `RESEND_API_KEY` = your API key
  - `RESEND_FROM_EMAIL` = your verified sender email

---

## Step 8: Google OAuth (Optional, 10 min)

Skip this if you only need email/password authentication.

- [ ] Go to [Google Cloud Console](https://console.cloud.google.com)
- [ ] Create a new project or select existing
- [ ] Configure OAuth Consent Screen (External)
- [ ] Create OAuth Credentials (Web application)
- [ ] Add Authorized JavaScript origin: `https://your-app.vercel.app`
- [ ] Add Authorized redirect URI: (get from Supabase > Auth > Providers > Google)
- [ ] In Supabase, enable Google provider and paste Client ID + Secret

---

## Step 9: Configure Analytics (Optional, 2 min)

### Plausible Analytics
- [ ] Go to [Plausible](https://plausible.io) and add your domain
- [ ] Add environment variable: `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` = your domain

### Sentry Error Tracking (Deferred)
- Sentry integration is deferred until `@sentry/nextjs` supports Next.js 16
- Environment variables ready for when supported:
  - `NEXT_PUBLIC_SENTRY_DSN`
  - `SENTRY_ORG`
  - `SENTRY_PROJECT`

---

## Step 10: Deploy to Vercel (5 min)

- [ ] Connect GitHub repository to Vercel
- [ ] Add all environment variables in Vercel Project Settings
- [ ] Deploy
- [ ] Verify deployment at your Vercel URL

---

## Step 11: Bootstrap Admin (2 min)

- [ ] Start the application
- [ ] Sign up with your admin email
- [ ] Confirm your email via the link
- [ ] Call the bootstrap endpoint: `POST /api/admin/bootstrap`
- [ ] Verify admin access at `/admin`

---

## Step 12: Configure Your SaaS (Setup Dashboard)

This is the key step that makes each clone unique! Go to `/admin/setup` and configure:

### Branding Tab
- [ ] **App Name** - Your SaaS product name (e.g., "ExtrusionCalc Pro")
- [ ] **Tagline** - Short description (e.g., "Professional extrusion calculations")
- [ ] **Company Name** - Your business name
- [ ] **Support Email** - Where users contact you
- [ ] **Primary Color** - Main brand color (use color picker)
- [ ] **Accent Color** - Secondary brand color

### Pricing Tab
- [ ] Update plan names if needed
- [ ] Set your prices (Pro: $29/mo default, Team: $99/mo default)
- [ ] Add Stripe Price IDs from your Stripe Dashboard
- [ ] Customize feature lists for each plan

### Social Tab
- [ ] Add your Twitter/X link
- [ ] Add your LinkedIn link
- [ ] Add your GitHub link (optional)
- [ ] Add your company website

### Features Tab
- [ ] Toggle Email Authentication (on/off)
- [ ] Toggle Google OAuth (on/off)
- [ ] Toggle Avatar Upload (on/off)
- [ ] Set Allow New Signups (on for launch)
- [ ] Maintenance Mode (off for launch)

**Click "Save Changes" when done!**

---

## Step 13: Verify Everything Works

- [ ] Landing page loads with your branding
- [ ] App name displays correctly in header
- [ ] Sign up works (email confirmation sent)
- [ ] Login works
- [ ] Google OAuth works (if configured)
- [ ] Profile page loads with avatar upload
- [ ] Admin panel accessible at `/admin`
- [ ] Setup Dashboard works at `/admin/setup`
- [ ] Settings save successfully
- [ ] Pricing page shows your customized plans at `/pricing`
- [ ] Stripe checkout works (test mode)
- [ ] Billing page shows subscription at `/billing`

---

## Environment Variables Summary

### Required
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM_EMAIL` | Verified sender email |

### Optional
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Plausible analytics domain |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN (when supported) |

---

## What's Included in the Template

### Authentication
- Email/password signup with confirmation
- Email/password login
- Google OAuth (optional)
- Password reset flow
- Protected routes
- Session persistence

### User Features
- Profile page with avatar upload
- Billing management page
- Subscription status display

### Admin Features
- Admin dashboard with metrics
- **Setup Dashboard** (configure branding, pricing, features)
- User management (view, edit roles)
- Organization settings
- Audit logging

### Billing (Stripe)
- Subscription checkout (Pro $29/mo, Team $99/mo)
- Customer portal for subscription management
- Webhook handling for subscription events
- Feature gating based on plan

### Email (Resend)
- Welcome email on signup
- Subscription confirmation email
- Cancellation notification email

### Security
- Supabase Row Level Security (RLS)
- Zod input validation
- Rate limiting (in-memory, upgrade to Redis for production)
- Security headers (HSTS, X-Frame-Options, etc.)

### Analytics & Monitoring
- Plausible analytics (privacy-friendly)
- Structured logging utility
- Sentry error tracking (deferred until Next.js 16 support)

---

## Pre-Production Checklist

Before launching with live customer data:

- [ ] Upgrade rate limiting from in-memory to Upstash Redis
- [ ] Enable Sentry when Next.js 16 support is available
- [ ] Set up uptime monitoring
- [ ] Configure custom domain
- [ ] Switch Stripe to live mode
- [ ] Verify email deliverability

---

*Last Updated: January 26, 2026*
