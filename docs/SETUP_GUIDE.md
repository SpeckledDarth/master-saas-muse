# Master SaaS Muse Template - Setup Guide

This guide provides step-by-step instructions for setting up a production-ready SaaS application using the Master SaaS Muse Template.

---

## Table of Contents

1. [Module 1: Foundation](#module-1-foundation)
2. [Module 2: Authentication](#module-2-authentication)
3. [Module 3: Admin Features](#module-3-admin-features) *(Pending)*

---

## Prerequisites

Before starting, ensure you have:
- A Replit account
- A Supabase account (free tier works)
- A Google Cloud account (for OAuth - optional but recommended)
- Basic familiarity with web applications

---

## Quick Start (Cloning for a New Muse)

If you're cloning this template for a new project, see:
- **[MUSE_CHECKLIST.md](./MUSE_CHECKLIST.md)** - 15-minute step-by-step setup guide
- **`.env.template`** - Copy to `.env` and fill in your credentials
- **`config/muse.config.json`** - Update project name, branding, and settings

---

## Configuration Files

| File | Purpose |
|------|---------|
| `.env.template` | Template for all environment variables and secrets |
| `config/muse.config.json` | Project-specific settings (name, branding, features) |
| `docs/MUSE_CHECKLIST.md` | Quick-start checklist for cloning |
| `docs/SETUP_GUIDE.md` | This detailed setup guide |

---

## Module 1: Foundation

### Overview
Module 1 establishes the core application structure including the landing page, navigation, dark/light mode toggle, and basic styling.

### What Gets Built
- Landing page with Hero section
- Header with navigation links
- Footer component
- Dark/light mode toggle
- Responsive design with Tailwind CSS

### Key Files Created/Modified

| File | Purpose |
|------|---------|
| `client/src/pages/home.tsx` | Landing page with Hero |
| `client/src/components/layout/Header.tsx` | Navigation header |
| `client/src/components/layout/Footer.tsx` | Page footer |
| `client/src/components/layout/ThemeToggle.tsx` | Dark/light mode switch |
| `client/src/components/landing/Hero.tsx` | Hero section component |

### Setup Steps

1. **Create a new Replit project** using the Vite + React + TypeScript template

2. **Install core dependencies** (if not already included):
   - `@tanstack/react-query` - Server state management
   - `next-themes` - Theme management
   - `framer-motion` - Animations
   - `wouter` - Lightweight routing
   - `tailwindcss` - Utility-first CSS
   - shadcn/ui components

3. **Configure Tailwind CSS** with dark mode support:
   - Set `darkMode: ["class"]` in `tailwind.config.ts`
   - Define color variables in `:root` and `.dark` classes in `index.css`

4. **Create the layout components**:
   - Header with logo, navigation links, and theme toggle
   - Footer with copyright and links
   - ThemeToggle using next-themes

5. **Create the landing page**:
   - Hero section with headline, description, and CTA buttons
   - Responsive design for mobile and desktop

### Verification Checklist
- [ ] Landing page displays correctly
- [ ] Navigation links work
- [ ] Dark/light mode toggle functions
- [ ] Responsive design works on mobile
- [ ] No console errors

[Screenshot: Landing page in light mode]
[Screenshot: Landing page in dark mode]

---

## Module 2: Authentication

### Overview
Module 2 implements user authentication using Supabase, including email/password signup, login, Google OAuth, protected routes, and user profile management with avatar uploads.

### What Gets Built
- Email/password signup with email confirmation
- Email/password login
- Google OAuth integration
- Protected routes (redirect unauthenticated users)
- User profile page with avatar upload
- Session persistence across page refreshes
- Webhook endpoint for new user signups
- Multi-tenancy middleware stub

### Key Files Created/Modified

| File | Purpose |
|------|---------|
| `client/src/lib/supabase.ts` | Supabase client initialization |
| `client/src/contexts/AuthContext.tsx` | Authentication state management |
| `client/src/pages/auth/login.tsx` | Login page |
| `client/src/pages/auth/signup.tsx` | Signup page |
| `client/src/pages/dashboard/profile.tsx` | User profile with avatar |
| `client/src/App.tsx` | Route definitions and ProtectedRoute |
| `server/routes.ts` | Webhook endpoint |
| `server/index.ts` | Multi-tenancy middleware |

---

### Part 1: Supabase Project Setup

#### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Enter project name (e.g., "Master SaaS Muse")
4. Set a secure database password (save this!)
5. Select your region
6. Click **Create new project**
7. Wait for project to initialize (~2 minutes)

[Screenshot: Supabase new project form]

#### Step 2: Get API Credentials
1. In Supabase dashboard, go to **Project Settings** (gear icon)
2. Click **API** in the left sidebar
3. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (under Project API keys)

[Screenshot: Supabase API settings page]

#### Step 3: Add Credentials to Replit
1. In Replit, open the **Secrets** tab (lock icon)
2. Add these secrets:
   - `VITE_SUPABASE_URL` = your Project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon public key

[Screenshot: Replit secrets panel]

---

### Part 2: Email Authentication Setup

#### Step 1: Configure Site URL
1. In Supabase, go to **Authentication** > **URL Configuration**
2. Set **Site URL** to your Replit app URL (e.g., `https://your-app.replit.app`)
3. Add to **Redirect URLs**: `https://your-app.replit.app/*`
4. Click **Save**

[Screenshot: Supabase URL Configuration]

#### Step 2: Configure Email Templates (Optional)
1. Go to **Authentication** > **Email Templates**
2. Customize the confirmation email if desired
3. The default template works fine for development

#### Step 3: Test Email Signup
1. Navigate to your app's `/signup` page
2. Enter a valid email and password
3. Click **Sign Up**
4. Check your email for confirmation link
5. Click the confirmation link
6. You should be redirected to the app and logged in

### Troubleshooting Email Confirmation
- If the confirmation link shows an error, check that your **Site URL** matches your Replit app URL exactly
- The URL must include `https://` and should NOT have a trailing slash

---

### Part 3: Google OAuth Setup

#### Step 1: Create Google Cloud Project
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click the project dropdown at the top > **New Project**
3. Name it (e.g., "Master SaaS Muse") > **Create**
4. Make sure this project is selected

[Screenshot: Google Cloud new project]

#### Step 2: Configure OAuth Consent Screen
1. Search for **"OAuth consent screen"** in the search bar
2. Select **External** > Click **Create**
3. Fill in:
   - **App name**: Your app name
   - **User support email**: Your email
   - **Developer contact email**: Your email
4. Click **Save and Continue** through the remaining steps
5. Click **Back to Dashboard**

[Screenshot: OAuth consent screen configuration]

#### Step 3: Create OAuth Credentials
1. Go to **Credentials** in the left sidebar (or search for it)
2. Click **+ Create Credentials** > **OAuth client ID**
3. Choose **Web application**
4. Set **Name**: "Supabase Auth"
5. Under **Authorized JavaScript origins**, add:
   - Your Replit app URL (e.g., `https://your-app.replit.app`)
6. Under **Authorized redirect URIs**, add:
   - Get this from Supabase (see next step)

[Screenshot: Google OAuth client configuration]

#### Step 4: Get Supabase Callback URL
1. In Supabase, go to **Authentication** > **Providers**
2. Click on **Google**
3. Copy the **Callback URL** shown (format: `https://xxxxx.supabase.co/auth/v1/callback`)
4. Paste this into Google's **Authorized redirect URIs**
5. Click **Create** in Google Console
6. Copy the **Client ID** and **Client Secret** shown

[Screenshot: Supabase Google provider showing callback URL]

#### Step 5: Configure Supabase Google Provider
1. In Supabase **Authentication** > **Providers** > **Google**
2. Toggle **Enable Sign in with Google** ON
3. Paste your **Client ID**
4. Paste your **Client Secret**
5. Click **Save**

[Screenshot: Supabase Google provider with credentials]

#### Step 6: Test Google OAuth
1. Navigate to your app's `/login` page
2. Click **Continue with Google**
3. Select your Google account
4. You should be logged in and redirected to the dashboard

---

### Part 4: Avatar Upload Setup (Supabase Storage)

#### Step 1: Create Storage Bucket
1. In Supabase, go to **Storage** in the left sidebar
2. Click **New bucket**
3. Name it: `avatars`
4. Toggle **Public bucket** ON
5. Click **Create bucket**

[Screenshot: Create new bucket dialog]

#### Step 2: Add Storage Policies
Navigate to **Storage** > **Policies** tab, then add these three policies:

**Policy 1: Allow authenticated uploads (INSERT)**
1. Click **New Policy** > **For full customization**
2. Policy name: `Allow authenticated uploads`
3. Allowed operation: **INSERT**
4. Target roles: **authenticated**
5. WITH CHECK expression: `bucket_id = 'avatars'`
6. Click **Review** > **Save policy**

**Policy 2: Allow authenticated updates (UPDATE)**
1. Click **New Policy** > **For full customization**
2. Policy name: `Allow authenticated updates`
3. Allowed operation: **UPDATE**
4. Target roles: **authenticated**
5. USING expression: `bucket_id = 'avatars'`
6. WITH CHECK expression: `bucket_id = 'avatars'`
7. Click **Review** > **Save policy**

**Policy 3: Allow public reads (SELECT)**
1. Click **New Policy** > **For full customization**
2. Policy name: `Allow public reads`
3. Allowed operation: **SELECT**
4. Target roles: **public** (leave as default)
5. USING expression: `bucket_id = 'avatars'`
6. Click **Review** > **Save policy**

[Screenshot: Storage policies list showing all three policies]

#### Step 3: Test Avatar Upload
1. Log in to your app
2. Navigate to the Profile page
3. Click the avatar area to upload an image
4. Select an image file
5. The avatar should update and display

---

### Part 5: Protected Routes

The app includes a `ProtectedRoute` component that:
- Checks if the user is authenticated
- Shows a loading state while checking
- Redirects to `/login` if not authenticated
- Renders the protected content if authenticated

#### Usage in App.tsx
```tsx
<Route path="/dashboard/profile">
  <ProtectedRoute>
    <Profile />
  </ProtectedRoute>
</Route>
```

---

### Part 6: Webhook & Multi-Tenancy Stubs

#### Webhook Endpoint
A stub endpoint exists at `/api/webhooks/user.created` for handling new user registrations. This can be configured in Supabase to trigger when users sign up.

#### Multi-Tenancy Middleware
The server includes middleware that logs the hostname and extracts potential `app_id` from subdomain patterns. This prepares the app for future multi-tenant implementations where each customer could have their own subdomain.

---

### Module 2 Verification Checklist
- [ ] Email signup works and sends confirmation
- [ ] Email confirmation link works
- [ ] Email login works
- [ ] Google OAuth login works
- [ ] Protected routes redirect when not logged in
- [ ] Session persists after page refresh
- [ ] Avatar upload works
- [ ] Avatar displays correctly
- [ ] Logout works
- [ ] No console errors

---

## Module 3: Admin Features

*Coming soon - this section will be updated when Module 3 is implemented.*

### Planned Features
- Admin dashboard
- User management
- Settings management

---

## Quick Reference

### Environment Variables
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |

### Key Commands
| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run db:push` | Push database schema changes |

### Important URLs
- Supabase Dashboard: https://supabase.com/dashboard
- Google Cloud Console: https://console.cloud.google.com
- Replit: https://replit.com

---

## Changelog

| Date | Module | Changes |
|------|--------|---------|
| 2024-12-29 | 1 | Initial foundation complete |
| 2024-12-29 | 2 | Authentication complete with Google OAuth |

---

*Last updated: December 29, 2024*
