# Module 3: Admin Features - Setup Instructions

## Overview
This module adds admin functionality to your SaaS template including:
- Admin dashboard with user metrics
- User management (view users, change roles)
- Organization settings with feature flags
- Audit logging for admin actions
- Bootstrap admin for new installations
- Role-based access control

## Step 1: Run Database Schema in Supabase

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new
2. Copy and paste the contents of `supabase/schema.sql`
3. Click **Run** to create the tables and policies

This creates:
- `user_roles` - Stores admin/member roles for each user
- `organization_settings` - App-wide settings and feature flags
- `audit_logs` - Records admin actions

## Step 2: Install Required Packages

In your local project folder, run:

```bash
npm install @radix-ui/react-select @radix-ui/react-switch
```

## Step 3: Add Service Role Key (Required for User Management)

The user management feature requires the Supabase service role key to fetch user emails.

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api
2. Copy the **service_role** key (keep this secret!)
3. Add to your `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

4. Add to Vercel Environment Variables:
   - Go to your Vercel project settings
   - Add `SUPABASE_SERVICE_ROLE_KEY` with the same value
   - **Important**: Do NOT prefix with `NEXT_PUBLIC_` - this key must stay server-side only

## Step 4: Copy Files

Copy these files/folders to your project:

```
nextjs-module2/
├── src/
│   ├── app/(dashboard)/admin/
│   │   ├── page.tsx              → /src/app/(dashboard)/admin/page.tsx
│   │   ├── users/page.tsx        → /src/app/(dashboard)/admin/users/page.tsx
│   │   ├── settings/page.tsx     → /src/app/(dashboard)/admin/settings/page.tsx
│   │   └── audit/page.tsx        → /src/app/(dashboard)/admin/audit/page.tsx
│   ├── app/api/admin/
│   │   ├── bootstrap/route.ts    → /src/app/api/admin/bootstrap/route.ts
│   │   └── users/route.ts        → /src/app/api/admin/users/route.ts
│   ├── lib/types/
│   │   └── admin.ts              → /src/lib/types/admin.ts
│   ├── lib/admin/
│   │   └── actions.ts            → /src/lib/admin/actions.ts (optional server actions)
│   ├── lib/supabase/
│   │   └── admin.ts              → /src/lib/supabase/admin.ts (service role client)
│   └── components/ui/
│       ├── select.tsx            → /src/components/ui/select.tsx
│       ├── switch.tsx            → /src/components/ui/switch.tsx
│       └── badge.tsx             → /src/components/ui/badge.tsx
```

## Step 5: Bootstrap Your First Admin

After deploying, you need to make yourself an admin:

1. Sign up or login to your app
2. Open browser console (F12)
3. Run this command:

```javascript
fetch('/api/admin/bootstrap', { method: 'POST' })
  .then(r => r.json())
  .then(console.log)
```

This only works when **no admins exist**. After bootstrapping, the endpoint is disabled.

## Step 6: Test Admin Features

Visit these pages:
- `/admin` - Dashboard with metrics
- `/admin/users` - Manage user roles
- `/admin/settings` - Configure feature flags
- `/admin/audit` - View action history

## File Structure After Setup

```
master-saas-muse/
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── admin/
│   │   │   │   ├── page.tsx          # Admin dashboard
│   │   │   │   ├── users/page.tsx    # User management
│   │   │   │   ├── settings/page.tsx # Feature settings
│   │   │   │   └── audit/page.tsx    # Audit logs
│   │   │   └── profile/page.tsx
│   │   └── api/
│   │       └── admin/
│   │           └── bootstrap/route.ts
│   ├── components/ui/
│   │   ├── select.tsx
│   │   ├── switch.tsx
│   │   └── badge.tsx
│   └── lib/
│       ├── types/admin.ts
│       └── admin/actions.ts
└── supabase/
    └── schema.sql
```

## Database Schema Details

### user_roles Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | References auth.users |
| role | VARCHAR | 'admin' or 'member' |
| app_id | VARCHAR | For multi-tenancy (default: 'default') |
| created_at | TIMESTAMP | When role was created |
| updated_at | TIMESTAMP | Last update time |

### organization_settings Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| app_id | VARCHAR | Unique per app |
| organization_name | VARCHAR | Display name |
| support_email | VARCHAR | Support contact |
| allow_signups | BOOLEAN | Enable/disable signups |
| maintenance_mode | BOOLEAN | Show maintenance page |
| require_email_verification | BOOLEAN | Require email confirm |
| enable_google_signin | BOOLEAN | Show Google button |

### audit_logs Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Who performed action |
| action | VARCHAR | Action type |
| target_type | VARCHAR | What was affected |
| target_id | VARCHAR | ID of target |
| details | JSONB | Additional info |
| created_at | TIMESTAMP | When it happened |

## Troubleshooting

### "Permission denied" when accessing admin pages
- Make sure you ran the bootstrap endpoint first
- Check that your user has admin role in user_roles table

### Bootstrap returns "An admin already exists"
- This is expected after first admin is created
- Check user_roles table to see who is admin

### Settings not saving
- Check RLS policies are in place
- Verify you're logged in as admin
- Check browser console for errors

### Users list is empty
- The trigger for auto-registering users may not have fired for existing users
- Manually insert entries into user_roles for existing users

## Notes

- New users are automatically assigned 'member' role via database trigger
- The last admin cannot be demoted (protection built-in)
- All admin actions are logged to audit_logs table
- Settings changes take effect immediately
