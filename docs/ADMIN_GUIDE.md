# MuseKit Admin Guide

A complete guide for managing your MuseKit-powered application. Written for team members who manage the platform day-to-day — no coding knowledge required.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard](#dashboard)
3. [Onboarding Wizard](#onboarding-wizard)
4. [Setup Dashboard](#setup-dashboard)
   - [Branding](#branding)
   - [Content](#content)
   - [Pages](#pages)
   - [Pricing](#pricing)
   - [Social Links](#social-links)
   - [Features & Integrations](#features--integrations)
5. [User Management](#user-management)
   - [Customer Service Tools](#customer-service-tools)
6. [Team Management](#team-management)
7. [Blog & Changelog](#blog--changelog)
8. [Analytics](#analytics)
9. [Feedback](#feedback)
10. [Waitlist](#waitlist)
11. [Email Templates](#email-templates)
12. [Job Queue](#job-queue)
13. [SSO / SAML](#sso--saml)
14. [Billing & Subscriptions](#billing--subscriptions)
15. [Webhooks & Automation](#webhooks--automation)
16. [AI Features](#ai-features)
17. [Feature Toggles Reference](#feature-toggles-reference)
18. [Public Pages Your Visitors See](#public-pages-your-visitors-see)

---

## Getting Started

### How to Access the Admin Dashboard

Navigate to `/admin` on your site (e.g., `https://yoursite.com/admin`). You must be logged in with an account that has Owner or Admin permissions.

### Who Can Access What

MuseKit uses a role-based permission system with four levels:

| Role | What They Can Do |
|------|-----------------|
| **Owner** | Full access to everything, including billing and deleting the organization |
| **Admin** | Full access to the admin dashboard, user management, and all settings |
| **Manager** | Can manage team members, view analytics, and edit content |
| **Member** | Can view the dashboard but cannot change settings |
| **Viewer** | Read-only access to basic information |

### First-Time Setup

When you first access the admin area, you'll be guided through the **Onboarding Wizard** to set up the essentials: branding, payment processing, content, and launch settings.

---

## Dashboard

**Where:** `/admin`

The Dashboard is your home base. It shows at-a-glance numbers about your platform:

- **Total Users** — How many people have signed up
- **Admins** — How many users have admin access
- **Members** — How many regular members you have

It also provides quick links to jump into Setup, User Management, and other areas.

---

## Onboarding Wizard

**Where:** `/admin/onboarding`

A step-by-step guide that walks you through initial setup. It covers four stages:

1. **Branding** — Set your app name, logo, and brand colors
2. **Stripe** — Connect your payment processing (enter your Stripe keys)
3. **Content** — Set up your homepage headline, description, and call-to-action
4. **Launch** — Final checks before going live

You only need to complete this once. After that, use the Setup Dashboard for ongoing changes.

---

## Setup Dashboard

**Where:** `/admin/setup`

The Setup Dashboard is your master control panel for configuring every aspect of your site. It's split into six focused sub-pages, each accessible from a sidebar navigation menu. Each sub-page handles only its own section, making it faster to load and easier to navigate.

### Branding

**Where:** `/admin/setup/branding`

Controls the visual identity of your site:

- **App Name & Company Name** — The name displayed in the header and throughout the site
- **Tagline** — A short phrase that appears below your app name
- **Support Email** — Where customer inquiries are directed
- **Logo** — Upload your company logo (appears in the header)
- **Hero Image** — The large background image on your landing page

**Hero Layout Styles** — Choose how your landing page hero section looks:
- **Full Width Background** — Image fills the entire hero area (default)
- **Split Layout** — Image on one side, text on the other
- **Video Background** — A looping video replaces the static image
- **Pattern/Texture** — A repeating pattern overlaid on a gradient
- **Floating Mockup** — A product image that appears to float over a gradient

**Theme Colors** — Customize colors for both light and dark modes:
- Primary Color — Your main brand color (buttons, links)
- Accent Color — Secondary brand color (highlights, badges)
- Light/Dark Mode — Separate background, text, card, and border colors for each mode

**Announcement Bar** — A top banner you can enable for promotions or important messages. Set the text, link, colors, and whether visitors can dismiss it.

**Navigation Menu** — Add, remove, and reorder links in your site's top navigation bar. You can add badges like "New" or "Beta" to highlight specific links.

### Content

**Where:** `/admin/setup/content`

Controls the homepage sections. Each section can be independently turned on or off:

- **Features Section** — Highlight what your product does. Add cards with icons, titles, and descriptions.
- **Testimonials** — Customer quotes. Display as a grid or carousel.
- **FAQ** — Frequently asked questions with expandable answers.
- **Call to Action (CTA)** — The final prompt on the page encouraging signups. Set the headline, description, and button text/link.
- **Trusted By / Logo Marquee** — Scrolling logos of companies that use your product.
- **Metrics / Counters** — Animated numbers (e.g., "10,000+ Users"). Set value, prefix, and suffix.
- **Process Steps** — A numbered sequence showing how your product works.
- **Customer Stories** — Longer-form testimonials with photos.
- **Image + Text Blocks** — Alternating image and text sections for detailed feature explanations.
- **Section Backgrounds** — Choose a background style (transparent, muted, gradient, mesh) for each section independently.

**Section order on the homepage:**
Hero > Logo Marquee > Metrics > Features > Testimonials > Process Steps > Customer Stories > Image+Text Blocks > FAQ > CTA

### Pages

**Where:** `/admin/setup/pages`

Configure the content for individual pages on your site:

- **About Page** — Company story, mission, values, and team member bios
- **Contact Page** — Contact information (email, phone, address) and contact form settings
- **Terms of Service** — Your legal terms (supports Markdown formatting)
- **Privacy Policy** — Your privacy policy (supports Markdown formatting)
- **Pricing Page** — Headline and hero image for the pricing page
- **FAQ Page** — Headline and hero image for the standalone FAQ page
- **Custom Pages** — Create up to 4 additional pages with custom URLs, headlines, and Markdown content

### Pricing

**Where:** `/admin/setup/pricing`

Configure your pricing plans:

- **Free Plan** — Toggle whether a free tier is displayed. Set its name, description, and feature list.
- **Paid Plans** — Managed through your Stripe Dashboard. Create products and prices in Stripe, and they automatically appear on your pricing page.

### Social Links

**Where:** `/admin/setup/social`

Add links to your social media profiles. These appear in your site's footer:

- Twitter/X
- LinkedIn
- GitHub
- Website

### Features & Integrations

**Where:** `/admin/setup/features`

Toggle features on and off, and configure AI and webhook integrations. See [Feature Toggles Reference](#feature-toggles-reference) for details on each toggle.

---

## User Management

**Where:** `/admin/users`

View and manage all users who have signed up for your platform:

- **View user list** — See email, role, subscription status (Plan column), and signup date for every user
- **Search and filter** — Find specific users quickly
- **Change roles** — Promote or demote users (Member, Manager, Admin)
- **Delete users** — Remove accounts (cannot be undone)
- **Invite new users** — Send email invitations to bring people onto the platform
- **Export CSV** — Download the full user list as a spreadsheet

### Customer Service Tools

Click the **eye icon** on any user row to open their detailed profile. The detail panel has three tabs:

**Overview Tab:**
- Full user profile (name, email, avatar, provider, phone, join date, last login)
- Subscription details (plan tier, status, renewal date, cancel status)
- Quick actions:
  - **Manage in Stripe** — Opens the Stripe Customer Portal for that user (manage their subscription, payment method, invoices)
  - **Send Email** — Opens your email client pre-addressed to that user

**Invoices Tab:**
- Shows the user's recent payment history from Stripe
- Each invoice shows date, amount, payment status, and a link to view the full invoice

**Notes Tab:**
- Internal notes visible only to admin team members — the user never sees these
- Add notes about customer interactions, support tickets, or special arrangements
- Delete notes you no longer need
- Each note shows who wrote it and when

---

## Team Management

**Where:** `/admin/team`

Manage your internal team and their permissions:

- **View team members** — See who has access and their current role
- **Invite new members** — Send invitations via email
- **Change roles** — Adjust permissions (Owner, Manager, Member, Viewer)
- **Remove members** — Revoke access for team members
- **View pending invitations** — See which invites haven't been accepted yet

**Role hierarchy:** Owner > Admin > Manager > Member > Viewer

---

## Blog & Changelog

**Where:** `/admin/blog`

Publish content for your users:

**Blog Posts:**
- Create, edit, and delete blog posts
- Write content in Markdown
- Preview posts before publishing
- Toggle posts between published and draft status
- Posts appear publicly at `/blog`

**Changelog Entries:**
- Document product updates and new features
- Similar to blog posts but specifically for product changes
- Appear publicly at `/changelog`

Each post has: title, slug (URL path), content (Markdown), publish status, and dates.

---

## Analytics

**Where:** `/admin/analytics`

Your key business metrics at a glance:

- **Total Users** — Overall signups
- **New Users This Month** — Recent growth
- **Active Subscriptions** — How many paying customers you have
- **Feedback Count** — Total feedback submissions
- **Waitlist Count** — People waiting for access (when waitlist mode is on)
- **Recent Signups** — The latest users who signed up

---

## Feedback

**Where:** `/admin/feedback`

Read and manage feedback from your users:

- **View all feedback** — See messages, the page they were submitted from, and timestamps
- **Filter by status** — New, Reviewed, or Resolved
- **Update status** — Mark feedback as reviewed or resolved
- **Delete feedback** — Remove entries you no longer need

The feedback widget appears on your site when the "Feedback Widget" feature toggle is enabled. Users can submit feedback from any page.

---

## Waitlist

**Where:** `/admin/waitlist`

When waitlist mode is enabled, visitors can sign up to be notified when your product launches:

- **View entries** — See who signed up and when
- **Export** — Download the waitlist as a file
- **Delete entries** — Remove individual entries
- **Turn off waitlist mode** — In Features settings, disable waitlist mode to switch to normal signups

---

## Email Templates

**Where:** `/admin/email-templates`

Customize the automated emails your platform sends:

- **Welcome Email** — Sent when a new user signs up
- **Subscription Email** — Sent when someone subscribes to a paid plan
- **Team Invitation** — Sent when inviting someone to join your team

For each template, you can:
- Edit the subject line
- Customize the email body (supports variables like `{{name}}`, `{{email}}`)
- Preview the email before saving
- Send a test email to yourself

Emails are sent through Resend and are processed through the background job queue for reliability.

---

## Job Queue

**Where:** `/admin/queue`

Monitor the background job processing system. Jobs are tasks that run behind the scenes so your site stays fast:

**What gets queued:**
- **Email jobs** — Sending emails (welcome, subscription, team invites)
- **Webhook retry jobs** — Retrying failed webhook deliveries
- **Report jobs** — Generating reports and analytics

**Dashboard shows:**
- **Redis status** — Whether the job queue is connected (green = connected)
- **Worker status** — Whether jobs are being processed (started/stopped)
- **Job counts** — Waiting, Active, Completed, Failed, Delayed, Paused
- **Recent jobs** — View individual job details and status

**Actions you can take:**
- **Retry failed jobs** — Attempt to process failed jobs again
- **Clear failed jobs** — Remove all failed jobs from the queue
- **Refresh** — Update the dashboard with current numbers

**Note:** The worker needs a long-running process to operate. On Vercel, the worker runs separately (e.g., in Replit or another hosting service). Jobs are still queued from Vercel; they're just processed elsewhere.

---

## SSO / SAML

**Where:** `/admin/sso`

Enterprise Single Sign-On allows large organizations to use their existing login systems (Okta, Azure AD, Google Workspace, etc.) to access your platform.

**How it works:**
1. You add an Identity Provider (IdP) by providing their SAML metadata URL
2. You associate it with one or more email domains (e.g., `company.com`)
3. When a user with that email domain tries to log in, they're automatically redirected to their company's login page
4. After authenticating with their company credentials, they're redirected back to your platform

**Setting up SSO:**
1. Go to `/admin/sso`
2. Copy the **SP Metadata URL** and **ACS URL** — you'll need to give these to the company's IT team
3. Click **Add Identity Provider**
4. Enter the IdP's SAML metadata URL (provided by their IT team)
5. Enter the email domain(s) this provider covers
6. Click **Add Provider**

**Requirements:**
- SSO requires the "Enterprise SSO / SAML" feature toggle to be enabled (in Setup > Features)
- SAML support requires Supabase Pro plan or above
- The company's IT team needs to configure their IdP with your SP Metadata URL and ACS URL

---

## Billing & Subscriptions

Billing is powered by Stripe. Here's how the pieces fit together:

**How subscriptions work:**
1. You create **Products** and **Prices** in your Stripe Dashboard
2. Those plans automatically appear on your pricing page (`/pricing`)
3. When a visitor clicks "Subscribe," they're taken to Stripe Checkout
4. After payment, they're redirected back and their subscription is activated
5. Stripe sends webhook events to keep your platform in sync

**What happens automatically:**
- New subscriptions are recorded in your database
- Cancellations update the user's access
- Plan changes (upgrades/downgrades) are reflected immediately
- Failed payments trigger Stripe's built-in retry logic

**Customer management:**
- Customers can manage their own subscription (upgrade, downgrade, cancel, update payment method) through the Stripe Customer Portal, accessible from their billing page (`/billing`)
- You can view and manage all subscriptions in your Stripe Dashboard

**Webhook events:**
- `subscription.created` — Fired when someone subscribes
- `subscription.updated` — Fired when a plan changes
- `subscription.cancelled` — Fired when someone cancels

---

## Webhooks & Automation

**Where:** Setup > Features (scroll to Webhook / n8n Integration)

Webhooks let you connect your platform to automation tools like n8n, Zapier, or Make. When something happens on your platform, it sends a notification to a URL you specify.

**Setup:**
1. Go to Setup > Features
2. Enable Webhooks
3. Enter your Webhook URL (the URL where notifications should be sent)
4. Optionally set a Webhook Secret (used to verify the notifications are genuine)
5. Toggle on the specific events you want to be notified about

**Available events:**

| Event | When It Fires |
|-------|--------------|
| Feedback Submitted | A user submits feedback through the widget |
| Waitlist Entry | Someone signs up for the waitlist |
| Subscription Created | A new paid subscription starts |
| Subscription Updated | A subscription plan changes |
| Subscription Cancelled | A subscription is cancelled |
| Team Member Invited | An invitation email is sent |
| Team Member Joined | Someone accepts a team invitation |
| Contact Form Submitted | Someone submits the contact form |

**Testing:** Click "Test Webhook" to send a test notification (`test.ping` event) to verify your setup is working.

**Security:** Each webhook delivery is signed with HMAC-SHA256 using your webhook secret. This lets the receiving service verify the notification came from your platform. Failed deliveries are automatically retried up to 3 times with increasing delays.

---

## AI Features

**Where:** Setup > Features (scroll to AI Configuration)

When AI Features are enabled, your platform includes an AI chat assistant. The AI system supports multiple providers:

**Supported Providers:**
- **xAI (Grok)** — xAI's Grok models
- **OpenAI** — GPT models
- **Anthropic** — Claude models

**Configuration:**
1. Enable "AI Features" in the Feature Toggles
2. Select your AI Provider
3. Choose a specific model
4. Adjust Temperature (0 = very focused/predictable, 1 = more creative/varied)
5. Set Max Tokens (maximum length of AI responses)
6. Write a System Prompt (instructions that guide the AI's behavior)

**API Keys:** Each provider requires its own API key, set as an environment variable on your hosting platform (not in the admin dashboard for security).

---

## Feature Toggles Reference

Here's what each feature toggle does:

| Toggle | What It Controls |
|--------|-----------------|
| **Email Authentication** | Allow users to sign up with email and password |
| **Magic Link Login** | Allow passwordless login via email link |
| **Google OAuth** | Allow "Sign in with Google" |
| **GitHub OAuth** | Allow "Sign in with GitHub" |
| **Apple OAuth** | Allow "Sign in with Apple" |
| **Twitter/X OAuth** | Allow "Sign in with X" |
| **Avatar Upload** | Allow users to upload profile pictures |
| **Admin Panel** | Enable the admin dashboard (should always be on) |
| **Audit Logs** | Track administrative actions for compliance |
| **Allow New Signups** | When off, no new accounts can be created |
| **Maintenance Mode** | Shows a maintenance page to all visitors |
| **Waitlist Mode** | Replace signup with a waitlist form (for pre-launch) |
| **Feedback Widget** | Show a feedback button on all pages |
| **AI Features** | Enable the AI chat assistant |
| **Enterprise SSO / SAML** | Enable SAML-based single sign-on for enterprise users |

---

## Public Pages Your Visitors See

These are the pages your customers and visitors can access:

| Page | URL | Description |
|------|-----|-------------|
| **Home** | `/` | Landing page with hero, features, testimonials, CTA |
| **Pricing** | `/pricing` | Subscription plans pulled from Stripe |
| **About** | `/about` | Company story, mission, and team |
| **Contact** | `/contact` | Contact form and company details |
| **Features** | `/features` | Detailed feature descriptions |
| **FAQ** | `/faq` | Frequently asked questions |
| **Blog** | `/blog` | Published blog posts |
| **Changelog** | `/changelog` | Product updates |
| **Docs** | `/docs` | Documentation hub |
| **Privacy** | `/privacy` | Privacy policy |
| **Terms** | `/terms` | Terms of service |
| **Login** | `/login` | User login (email, OAuth, Magic Link, SSO) |
| **Signup** | `/signup` | New account registration |
| **Billing** | `/billing` | Subscription management (logged-in users) |
| **Profile** | `/profile` | User profile settings (logged-in users) |
| **Custom Pages** | `/p/{slug}` | Up to 4 custom pages you create |

All pages automatically support dark/light mode and are responsive on mobile devices.

---

## Tips & Best Practices

- **Always click Save** — Changes in Setup Dashboard aren't applied until you click the "Save Changes" button
- **Test after changes** — After saving, visit your public pages to verify changes look correct
- **Use the onboarding wizard first** — If this is a new setup, complete the onboarding wizard before diving into the Setup Dashboard
- **Keep your Stripe Dashboard in sync** — Pricing plans are managed in Stripe, not in MuseKit. If plans look wrong, check Stripe first.
- **Monitor the Job Queue** — If emails aren't being sent, check the Queue dashboard for failed jobs
- **Test webhooks** — Use the "Test Webhook" button before relying on webhook integrations
- **Backup before major changes** — The platform supports checkpoints, but it's good practice to note your current settings before making sweeping changes
