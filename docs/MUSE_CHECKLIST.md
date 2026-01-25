# New Muse Quick-Start Checklist

This checklist guides you through setting up a new project from the Master SaaS Muse Template.

**Estimated time: 15-30 minutes**

---

## Pre-requisites

- [ ] Replit account
- [ ] Supabase account (free tier works)
- [ ] Google Cloud account (optional, for OAuth)

---

## Step 1: Clone the Template (2 min)

- [ ] Fork/clone this Replit project
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
- [ ] In Replit, add these as Secrets:
  - `VITE_SUPABASE_URL` = Project URL
  - `VITE_SUPABASE_ANON_KEY` = anon public key

---

## Step 3: Configure Supabase Auth (3 min)

- [ ] In Supabase, go to **Authentication > URL Configuration**
- [ ] Set **Site URL** to your Replit app URL (e.g., `https://your-app.replit.app`)
- [ ] Add to **Redirect URLs**: `https://your-app.replit.app/*`
- [ ] Save changes

---

## Step 4: Create Storage Bucket (5 min)

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

## Step 5: Google OAuth (Optional, 10 min)

Skip this if you only need email/password authentication.

- [ ] Go to [Google Cloud Console](https://console.cloud.google.com)
- [ ] Create a new project or select existing
- [ ] Configure OAuth Consent Screen (External)
- [ ] Create OAuth Credentials (Web application)
- [ ] Add Authorized JavaScript origin: `https://your-app.replit.app`
- [ ] Add Authorized redirect URI: (get from Supabase > Auth > Providers > Google)
- [ ] In Supabase, enable Google provider and paste Client ID + Secret

---

## Step 6: Initialize Database (2 min)

- [ ] In Replit, open the Shell
- [ ] Run: `npm run db:push`
- [ ] Verify no errors

---

## Step 7: Bootstrap Admin (2 min)

- [ ] Start the application (click Run)
- [ ] Sign up with your email
- [ ] Confirm your email via the link
- [ ] The first admin needs to be created via API:
  - Open browser console (F12)
  - Run: `fetch('/api/admin/bootstrap', { method: 'POST', headers: { 'x-user-id': 'YOUR_USER_ID' } })`
  - Or we'll add a UI button for this

---

## Step 8: Verify Everything Works

- [ ] Landing page loads
- [ ] Sign up works
- [ ] Login works
- [ ] Google OAuth works (if configured)
- [ ] Avatar upload works
- [ ] Admin panel accessible (once bootstrapped)

---

## Update muse.config.json

After setup, update `config/muse.config.json`:

```json
{
  "external_services": {
    "supabase": {
      "projectRef": "your-project-ref",
      "region": "your-region"
    },
    "googleCloud": {
      "projectId": "your-gcp-project",
      "oauthConfigured": true
    }
  }
}
```

---

## Step 9: Configure Monitoring (5 min)

### Sentry Error Tracking (Recommended)
- [ ] Create account at [sentry.io](https://sentry.io)
- [ ] Create a new Next.js project
- [ ] Copy the DSN from Project Settings > Client Keys
- [ ] Add to Vercel environment variables:
  - `NEXT_PUBLIC_SENTRY_DSN` = your DSN
  - `SENTRY_ORG` = your organization slug
  - `SENTRY_PROJECT` = your project slug

### Plausible Analytics (Recommended)
- [ ] Create account at [plausible.io](https://plausible.io)
- [ ] Add your domain
- [ ] Add to Vercel environment variables:
  - `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` = your domain (e.g., `myapp.com`)

---

## Step 10: Configure Stripe (10 min)

- [ ] Create Stripe account at [stripe.com](https://stripe.com)
- [ ] Get API keys from Dashboard > Developers > API keys
- [ ] Add to Vercel environment variables:
  - `STRIPE_SECRET_KEY` = sk_live_xxx or sk_test_xxx
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = pk_live_xxx or pk_test_xxx
- [ ] Create webhook endpoint: Dashboard > Developers > Webhooks
  - Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
  - Events: `checkout.session.completed`, `customer.subscription.*`
- [ ] Add webhook secret to Vercel:
  - `STRIPE_WEBHOOK_SECRET` = whsec_xxx

---

## Step 11: Configure Email (5 min)

- [ ] Create Resend account at [resend.com](https://resend.com)
- [ ] Create API key
- [ ] Add to Vercel environment variables:
  - `RESEND_API_KEY` = re_xxx
  - `RESEND_FROM_EMAIL` = noreply@yourdomain.com
- [ ] (Optional) Verify your domain for better deliverability

---

## Troubleshooting

**Email confirmation link doesn't work?**
- Check that Site URL in Supabase matches your Replit app URL exactly

**Avatar upload fails?**
- Verify storage bucket policies are configured correctly

**Google OAuth doesn't redirect properly?**
- Check Authorized redirect URI matches Supabase callback URL

---

*Last updated: January 25, 2026*
