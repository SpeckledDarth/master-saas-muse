# New Muse Quick-Start Checklist

This checklist guides you through setting up a new project from the Master SaaS Muse Template.

**Estimated time: 15-30 minutes**

**Template Status: MVP COMPLETE + AI + Webhooks + Testing (February 2026)**

---

## Pre-requisites

- [ ] Replit account (for development)
- [ ] Supabase account (free tier works)
- [ ] Stripe account (for payments)
- [ ] Vercel account (for deployment)
- [ ] Resend account (for transactional emails)
- [ ] Google Cloud account (optional, for Google OAuth)
- [ ] Plausible account (optional, for analytics)
- [ ] Sentry account (optional, for error tracking)
- [ ] xAI/OpenAI/Anthropic API key (optional, for AI features)

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
- [ ] Create `profiles` table (with stripe fields)
- [ ] Create `user_roles` table
- [ ] Create `organization_settings` table
- [ ] Create `audit_logs` table
- [ ] Create `organizations` table
- [ ] Create `organization_members` table
- [ ] Create `invitations` table
- [ ] Enable Row Level Security on all tables
- [ ] Create RLS policies

---

## Step 5: Create Storage Buckets (5 min)

- [ ] In Supabase, go to **Storage**
- [ ] Click **New bucket**, name it `avatars`, make it **Public**
- [ ] Click **New bucket**, name it `branding`, make it **Public**
- [ ] Go to **Policies** tab and add these policies for **both buckets**:

**Policy 1: INSERT (authenticated)**
- Name: `Allow authenticated uploads`
- Operation: INSERT
- Target roles: authenticated
- WITH CHECK: `bucket_id = 'avatars' OR bucket_id = 'branding'`

**Policy 2: UPDATE (authenticated)**
- Name: `Allow authenticated updates`
- Operation: UPDATE
- Target roles: authenticated
- USING: `bucket_id = 'avatars' OR bucket_id = 'branding'`
- WITH CHECK: `bucket_id = 'avatars' OR bucket_id = 'branding'`

**Policy 3: SELECT (anon/public)**
- Name: `Allow public reads`
- Operation: SELECT
- Target roles: anon
- USING: `bucket_id = 'avatars' OR bucket_id = 'branding'`

> Note: The `branding` bucket stores logos and hero images uploaded via Setup Dashboard

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

### Configure Product Metadata (Important!)

Stripe is the **single source of truth** for pricing. Your website automatically displays whatever you configure in Stripe - no code changes needed!

**For each product (Pro, Team), add metadata:**

1. Click on a product in Stripe Dashboard
2. Scroll to the **Metadata** section
3. Click **"+ Add metadata"**
4. Add these key-value pairs:

| Key | Value | Purpose |
|-----|-------|---------|
| `features` | `["Feature 1", "Feature 2", "Feature 3"]` | Shows as bullet points on pricing page |
| `tier` | `pro` | Adds "Popular" badge (use on one plan only) |

**Example for Pro plan:**
- Key: `features`
- Value: `["All Free features", "Priority support", "Advanced analytics", "Unlimited projects"]`
- Key: `tier`
- Value: `pro`

**Example for Team plan:**
- Key: `features`
- Value: `["All Pro features", "Team collaboration", "Admin dashboard", "API access", "Custom integrations"]`

5. Click **Save**
6. Refresh your pricing page - changes appear instantly!

> **Note:** The Free tier is hardcoded (no Stripe product needed) since free users don't go through checkout.

---

## Step 7: Configure Email (Resend) (3 min)

- [ ] Go to [Resend Dashboard](https://resend.com/api-keys)
- [ ] Create an API key
- [ ] Add environment variables:
  - `RESEND_API_KEY` = your API key
  - `RESEND_FROM_EMAIL` = your verified sender email

---

## Step 8: OAuth Providers (Optional, 10-30 min)

Skip this if you only need email/password authentication. Configure only the providers you want to offer.

### Google OAuth
- [ ] Go to [Google Cloud Console](https://console.cloud.google.com)
- [ ] Create a new project or select existing
- [ ] Configure OAuth Consent Screen (External)
- [ ] Create OAuth Credentials (Web application)
- [ ] Add Authorized JavaScript origin: `https://your-app.vercel.app`
- [ ] Add Authorized redirect URI: (get from Supabase > Auth > Providers > Google)
- [ ] In Supabase, enable Google provider and paste Client ID + Secret

### GitHub OAuth
- [ ] Go to [GitHub Developer Settings](https://github.com/settings/developers)
- [ ] Create new OAuth App
- [ ] Set Homepage URL: `https://your-app.vercel.app`
- [ ] Set Authorization callback URL: (get from Supabase > Auth > Providers > GitHub)
- [ ] In Supabase, enable GitHub provider and paste Client ID + Secret

### Apple OAuth
- [ ] Go to [Apple Developer Portal](https://developer.apple.com)
- [ ] Create a new App ID with Sign in with Apple capability
- [ ] Create a Services ID for web authentication
- [ ] Configure the callback URL from Supabase
- [ ] In Supabase, enable Apple provider with your credentials

### X (Twitter) OAuth
- [ ] Go to [Twitter Developer Portal](https://developer.twitter.com)
- [ ] Create a new project and app
- [ ] Enable OAuth 2.0 with "Read users" scope
- [ ] Set callback URL from Supabase
- [ ] In Supabase, enable Twitter provider and paste Client ID + Secret

### Magic Link (Passwordless)
- [ ] Magic Link uses Supabase's built-in email system
- [ ] No additional configuration needed if Resend is set up
- [ ] Users receive a login link via email instead of entering a password

---

## Step 9: Configure Analytics (Optional, 2 min)

### Plausible Analytics
- [ ] Go to [Plausible](https://plausible.io) and add your domain
- [ ] Add environment variable: `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` = your domain

### Sentry Error Tracking (Now Available!)
- [ ] Create a Sentry project at [sentry.io](https://sentry.io)
- [ ] Add environment variables in Vercel:
  - `NEXT_PUBLIC_SENTRY_DSN` = Your Sentry DSN
  - `SENTRY_ORG` = Your organization slug
  - `SENTRY_PROJECT` = Your project slug
  - `SENTRY_AUTH_TOKEN` = Auth token for source maps (optional)
- [ ] Deploy and verify errors appear in Sentry dashboard

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
- [ ] **Logo** - Upload or paste URL for your logo (square recommended)
- [ ] **Hero Image** - Upload or paste URL for landing page hero
- [ ] **Primary Color** - Main brand color (use color picker)
- [ ] **Accent Color** - Secondary brand color

### Pricing Tab
- [ ] Click "Manage Products in Stripe" button to open Stripe Dashboard
- [ ] Pricing is managed directly in Stripe (see Step 6 for metadata setup)
- [ ] Changes in Stripe automatically appear on your pricing page

### Social Tab
- [ ] Add your Twitter/X link
- [ ] Add your LinkedIn link
- [ ] Add your GitHub link (optional)
- [ ] Add your company website

### Features Tab

**Authentication Controls:**
- [ ] Toggle Email Authentication (on/off)
- [ ] Toggle Google OAuth (on/off) - enabled by default
- [ ] Toggle GitHub OAuth (on/off) - disabled by default
- [ ] Toggle Apple OAuth (on/off) - disabled by default
- [ ] Toggle X (Twitter) OAuth (on/off) - disabled by default
- [ ] Toggle Magic Link (on/off) - enabled by default

> **Note:** These toggles control which OAuth buttons appear on the login/signup pages. You must also configure the actual OAuth providers in Supabase Dashboard for them to work.

**Other Features:**
- [ ] Toggle Avatar Upload (on/off)
- [ ] Set Allow New Signups (on for launch)
- [ ] Maintenance Mode (off for launch)
- [ ] Toggle Feedback Widget (on/off)

**AI Settings (Optional):**
- [ ] Toggle AI Enabled (on/off)
- [ ] Select AI Provider (xAI Grok, OpenAI, or Anthropic)
- [ ] Select Model (e.g., grok-3, gpt-4o, claude-3-sonnet)
- [ ] Configure Temperature (0-1)
- [ ] Set Max Tokens
- [ ] Write System Prompt (instructions for the AI)
- [ ] Add the corresponding API key to Vercel environment variables:
  - xAI: `XAI_API_KEY`
  - OpenAI: `OPENAI_API_KEY`
  - Anthropic: `ANTHROPIC_API_KEY`

**Webhook/n8n Configuration (Optional):**
- [ ] Toggle Webhooks Enabled (on/off)
- [ ] Enter Webhook URL (your n8n, Zapier, or Make endpoint)
- [ ] Enter Webhook Secret (for HMAC payload signing)
- [ ] Toggle individual events on/off:
  - Feedback Submitted
  - Waitlist Entry
  - Subscription Created/Updated/Cancelled
  - Team Invited / Team Member Joined
  - Contact Submitted
- [ ] Click "Test Webhook" to verify connectivity

**Click "Save Changes" when done!**

---

## Step 13: Set Up Your Team (Optional)

If you want to invite team members to help manage the SaaS:

- [ ] Go to `/admin/team` in your Admin Dashboard
- [ ] Click **"Invite Team Member"**
- [ ] Enter their email address
- [ ] Select a role:
  - **Owner**: Full access including billing and settings (only one per organization)
  - **Manager**: Can manage users and send invitations (no settings or billing)
  - **Member**: Can view dashboard and analytics
  - **Viewer**: Read-only access (no analytics or team list)
- [ ] Click **"Send Invitation"**
- [ ] Invited user receives email with acceptance link

### Invitation Flow for Invitees
1. Click the link in the invitation email
2. Sign up or log in with the invited email address
3. Click "Accept Invitation" on the invite page
4. Access Admin Dashboard via avatar dropdown menu

> **Note**: The app admin who bootstrapped the system is automatically added as the organization Owner.

> **Email Confirmation**: If Supabase email confirmation is enabled, new users must verify their email before they can accept invitations. If disabled, users can accept immediately after signup.

---

## Step 14: Run E2E Tests (Optional, 5 min)

```bash
# Install Playwright browsers (first time only)
npx playwright install chromium

# Run all tests against your Vercel deployment
TEST_USER_EMAIL=your-admin@email.com \
TEST_USER_PASSWORD='your-password' \
TEST_BASE_URL=https://your-app.vercel.app \
npx playwright test
```

Tests cover: Blog CRUD, Waitlist, Feedback, Email Templates, Public Waitlist.

---

## Step 15: Verify Everything Works

- [ ] Landing page loads with your branding
- [ ] App name displays correctly in header
- [ ] Sign up works (email confirmation sent)
- [ ] Login works
- [ ] Google OAuth works (if configured and enabled in Features)
- [ ] Other OAuth providers work (GitHub, Apple, X - if configured)
- [ ] Magic Link passwordless login works
- [ ] OAuth toggles in Setup Dashboard control which buttons appear
- [ ] Profile page loads with avatar upload
- [ ] Admin panel accessible at `/admin`
- [ ] Setup Dashboard works at `/admin/setup`
- [ ] Settings save successfully
- [ ] Pricing page shows your customized plans at `/pricing`
- [ ] Stripe checkout works (test mode)
- [ ] Billing page shows subscription at `/billing`
- [ ] AI chat works (if AI enabled and API key configured)
- [ ] Webhook test delivers (if webhook URL configured)
- [ ] Blog posts can be created and published at `/admin/blog`
- [ ] Feedback widget appears on pages (if enabled)
- [ ] Waitlist mode works (if enabled)
- [ ] Sentry captures errors (if configured)

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
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN |
| `SENTRY_ORG` | Sentry organization slug |
| `SENTRY_PROJECT` | Sentry project slug |
| `SENTRY_AUTH_TOKEN` | Sentry auth token (for source maps) |
| `XAI_API_KEY` | xAI/Grok API key (for AI features) |
| `OPENAI_API_KEY` | OpenAI API key (alternative AI provider) |
| `ANTHROPIC_API_KEY` | Anthropic API key (alternative AI provider) |

---

## What's Included in the Template

### Authentication
- Email/password signup with confirmation
- **5 OAuth Providers** (configurable via Admin Dashboard):
  - Google OAuth (enabled by default)
  - GitHub OAuth
  - Apple OAuth
  - X (Twitter) OAuth
  - Magic Link passwordless login (enabled by default)
- Password reset flow
- Protected routes and session persistence
- Profile page with connected providers management
- **Admin-controlled OAuth toggles** (show/hide providers on login page)

### User Features
- Profile page with avatar upload
- Billing management page
- Subscription status display

### Admin Features
- Admin dashboard with metrics
- **Setup Dashboard** (configure branding, pricing, social, features)
- User management (view, edit roles, search)
- Organization settings
- Audit logging
- **Team Management** (invite members, assign roles)
- Role-based permissions (Owner/Manager/Member/Viewer)
- **Onboarding Wizard** (4-step guided setup)
- **Blog/Changelog** management
- **Email Template** editor with preview and test sending
- **Waitlist** management with CSV export
- **Feedback** management with status filters

### Billing (Stripe)
- Subscription checkout (Pro $29/mo, Team $99/mo)
- Customer portal for subscription management
- Webhook handling for subscription events
- Feature gating based on plan

### Email (Resend)
- Welcome email on signup
- Subscription confirmation email
- Cancellation notification email
- Team invitation email
- Admin-editable templates

### AI Integration
- Pluggable provider system (xAI Grok, OpenAI, Anthropic)
- Admin-configurable model, temperature, system prompt
- Chat completion API with streaming support
- Feature toggle to enable/disable

### Webhook/n8n Automation
- Event-driven webhook system (8 events)
- HMAC-SHA256 payload signing
- Fire-and-forget delivery with retry
- Admin-configurable URL, secret, per-event toggles
- Compatible with n8n, Zapier, Make

### Content & Marketing
- Blog/changelog system (markdown with live preview)
- Waitlist mode for pre-launch
- Feedback widget (logged-in and anonymous)
- SEO-optimized pages with sitemap
- Custom pages system
- Announcement bar

### Security
- Supabase Row Level Security (RLS)
- Zod input validation
- Rate limiting (in-memory, upgrade to Redis for production)
- Security headers (HSTS, X-Frame-Options, etc.)
- HMAC-SHA256 webhook signature verification

### Analytics, Monitoring & Testing
- Plausible analytics (privacy-friendly)
- Sentry error tracking (server + browser)
- Structured logging utility
- 38 Playwright E2E tests across 5 suites

---

## Pre-Production Checklist

Before launching with live customer data:

- [ ] Upgrade rate limiting from in-memory to Upstash Redis
- [ ] Configure Sentry with your DSN and project details
- [ ] Set up uptime monitoring
- [ ] Configure custom domain
- [ ] Switch Stripe to live mode
- [ ] Verify email deliverability (verify your own domain in Resend)
- [ ] Run full E2E test suite against production
- [ ] Verify AI API key is set (if using AI features)
- [ ] Test webhook delivery to your n8n/Zapier endpoint (if using)

---

*Last Updated: February 6, 2026*
