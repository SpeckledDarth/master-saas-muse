# Module 2: Authentication - Setup Instructions

## Overview
This module adds Supabase authentication to your Next.js SaaS template including:
- Email/password signup with confirmation
- Email/password login
- Google OAuth
- Password reset flow
- Protected route middleware
- Profile page with avatar upload

## Step 1: Install Required Packages

In your local `master-saas-muse` folder, run:

```bash
npm install @supabase/ssr @supabase/supabase-js react-icons
```

## Step 2: Add Environment Variables

Create or update `.env.local` in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ghlrvygpbexawddahixa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Get your anon key from:** https://supabase.com/dashboard/project/ghlrvygpbexawddahixa/settings/api

## Step 3: Copy Files

Copy these files/folders to your project:

```
nextjs-module2/
├── middleware.ts                    → /middleware.ts (project root)
├── src/
│   ├── lib/supabase/
│   │   ├── client.ts               → /src/lib/supabase/client.ts
│   │   ├── server.ts               → /src/lib/supabase/server.ts
│   │   └── middleware.ts           → /src/lib/supabase/middleware.ts
│   ├── app/(auth)/
│   │   ├── login/page.tsx          → /src/app/(auth)/login/page.tsx
│   │   ├── signup/page.tsx         → /src/app/(auth)/signup/page.tsx
│   │   ├── reset-password/page.tsx → /src/app/(auth)/reset-password/page.tsx
│   │   └── auth/callback/route.ts  → /src/app/(auth)/auth/callback/route.ts
│   ├── app/(dashboard)/
│   │   └── profile/page.tsx        → /src/app/(dashboard)/profile/page.tsx
│   ├── components/auth/
│   │   └── UserNav.tsx             → /src/components/auth/UserNav.tsx
│   └── components/layout/
│       └── header.tsx              → Replace your existing header.tsx
```

## Step 4: Configure Supabase Dashboard

### 4a. Enable Google OAuth

1. Go to: https://supabase.com/dashboard/project/ghlrvygpbexawddahixa/auth/providers
2. Click on **Google**
3. Toggle **Enable Google provider**
4. Follow the instructions to create a Google OAuth app:
   - Go to https://console.cloud.google.com/apis/credentials
   - Create OAuth 2.0 Client ID
   - Add authorized redirect URI: `https://ghlrvygpbexawddahixa.supabase.co/auth/v1/callback`
5. Enter your Google Client ID and Client Secret in Supabase

### 4b. Configure Redirect URLs

1. Go to: https://supabase.com/dashboard/project/ghlrvygpbexawddahixa/auth/url-configuration
2. Add these to **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `https://master-saas-muse.vercel.app/auth/callback`
   - `https://*.vercel.app/auth/callback` (for preview deployments)

### 4c. Create Avatars Storage Bucket

1. Go to: https://supabase.com/dashboard/project/ghlrvygpbexawddahixa/storage/buckets
2. Click **New bucket**
3. Name: `avatars`
4. Toggle **Public bucket** ON
5. Click **Create bucket**
6. Go to **Policies** tab
7. Add policy for authenticated uploads:
   - Name: `Allow authenticated uploads`
   - Operation: INSERT
   - Policy: `(auth.role() = 'authenticated'::text)`
8. Add policy for public reads:
   - Name: `Allow public reads`
   - Operation: SELECT
   - Policy: `true`

## Step 5: Add Environment Variables to Vercel

1. Go to: https://vercel.com/chris-projects-00cd1eb7/master-saas-muse/settings/environment-variables
2. Add:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://ghlrvygpbexawddahixa.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `your_anon_key`

## Step 6: Test Locally

```bash
npm run dev
```

Then visit:
- http://localhost:3000/signup - Create account
- http://localhost:3000/login - Login
- http://localhost:3000/profile - Profile page (protected)

## Step 7: Deploy

```bash
git add .
git commit -m "Add Module 2: Authentication"
git push
```

Vercel will auto-deploy!

## File Structure After Setup

```
master-saas-muse/
├── middleware.ts                    # Auth middleware (protected routes)
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   ├── reset-password/page.tsx
│   │   │   └── auth/callback/route.ts
│   │   ├── (dashboard)/
│   │   │   └── profile/page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── auth/
│   │   │   └── UserNav.tsx
│   │   ├── layout/
│   │   │   ├── header.tsx          # Updated with UserNav
│   │   │   ├── footer.tsx
│   │   │   └── theme-toggle.tsx
│   │   └── ui/
│   └── lib/
│       └── supabase/
│           ├── client.ts           # Browser client
│           ├── server.ts           # Server client
│           └── middleware.ts       # Session handling
```

## Troubleshooting

### "Invalid API key" error
- Make sure `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set correctly
- Restart dev server after changing env vars

### Google login not working
- Check redirect URL is added in Supabase dashboard
- Verify Google OAuth credentials are correct

### Avatar upload fails
- Ensure `avatars` bucket exists in Supabase Storage
- Check bucket is public
- Verify RLS policies are set up

### Protected routes not working
- Ensure `middleware.ts` is in project root (not src/)
- Check middleware matcher pattern
