# Master SaaS Muse Template

## Overview

This is a full-stack SaaS starter template built with React, Express, and PostgreSQL. It provides a foundation for building production-ready SaaS applications with modern UI components, authentication via Supabase, and a clean monorepo structure. The template includes a landing page, authentication flows (login/signup), and a protected dashboard area.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with CSS variables for theming
- **UI Components**: shadcn/ui component library (Radix UI primitives)
- **Theme**: next-themes for dark/light mode toggle
- **Animations**: Framer Motion for UI transitions

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful endpoints defined in `shared/routes.ts`
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Schema Location**: `shared/schema.ts` (shared between client and server)

### Project Structure
```
├── client/           # React frontend
│   └── src/
│       ├── components/   # UI components (shadcn/ui + custom)
│       ├── contexts/     # React contexts (AuthContext)
│       ├── hooks/        # Custom hooks
│       ├── lib/          # Utilities (queryClient, supabase)
│       └── pages/        # Route pages
├── server/           # Express backend
│   ├── db.ts         # Database connection
│   ├── routes.ts     # API route handlers
│   └── storage.ts    # Data access layer
├── shared/           # Shared code between client/server
│   ├── routes.ts     # API contract definitions with Zod
│   └── schema.ts     # Drizzle database schema
└── migrations/       # Database migrations (Drizzle Kit)
```

### Authentication
- **Provider**: Supabase Auth (email/password and Google OAuth)
- **Client Integration**: `@supabase/supabase-js` with React context
- **Protected Routes**: Client-side route guards via `ProtectedRoute` component
- **Webhook Stub**: `/api/webhooks/user.created` for handling new user signups

### Multi-Tenancy Stub
The server includes middleware that extracts potential `app_id` from subdomain patterns (e.g., `{app_id}.yourdomain.com`), preparing for future multi-tenant implementations.

### Database
- **Type**: PostgreSQL (via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with Zod schema validation
- **Migrations**: Drizzle Kit (`db:push` command)
- **Current Schema**: Minimal `settings` table as placeholder

### Build System
- **Development**: `tsx` for running TypeScript directly
- **Production Build**: Custom build script using esbuild (server) and Vite (client)
- **Output**: `dist/` directory with bundled server and static client files

## External Dependencies

### Required Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

### Third-Party Services
- **Supabase**: Authentication and user management
- **PostgreSQL**: Primary database (provision via Replit or external provider)

### Key NPM Packages
- `@supabase/supabase-js` - Supabase client
- `drizzle-orm` / `drizzle-kit` - Database ORM and migrations
- `@tanstack/react-query` - Server state management
- `next-themes` - Theme management
- `framer-motion` - Animations
- Full shadcn/ui component set via Radix UI primitives