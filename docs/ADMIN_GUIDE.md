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
   - [API Keys & Integrations](#api-keys--integrations)
   - [PassivePost](#passivepost)
5. [User Management](#user-management)
   - [Customer Service Tools](#customer-service-tools)
   - [User Impersonation](#user-impersonation)
6. [Team Management](#team-management)
7. [Blog & Changelog](#blog--changelog)
8. [Metrics Dashboard](#metrics-dashboard)
   - [KPI Cards](#kpi-cards)
   - [NPS Score](#nps-score)
   - [Alert Thresholds](#alert-thresholds)
   - [Action Buttons](#action-buttons)
9. [Analytics](#analytics)
10. [Feedback](#feedback)
    - [NPS Score Tracking](#nps-score-tracking)
11. [Waitlist](#waitlist)
12. [Email Templates](#email-templates)
13. [Job Queue](#job-queue)
14. [SSO / SAML](#sso--saml)
15. [Billing & Subscriptions](#billing--subscriptions)
16. [Webhooks & Automation](#webhooks--automation)
17. [AI Features](#ai-features)
18. [Help Widget (Support Chatbot)](#help-widget-support-chatbot)
19. [In-App Notifications](#in-app-notifications)
20. [Audit Log Viewer](#audit-log-viewer)
21. [Legal & Compliance Pages](#legal--compliance-pages)
22. [Landing Page Components](#landing-page-components)
23. [Header & Footer Styling](#header--footer-styling)
24. [Section Ordering](#section-ordering)
25. [PassivePost (Social Media Management)](#passivepost-social-media-management)
26. [Feature Toggles Reference](#feature-toggles-reference)
27. [Public Pages Your Visitors See](#public-pages-your-visitors-see)

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

It also provides quick links to jump into Setup, User Management, Metrics, and other areas.

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

The Setup Dashboard is your master control panel for configuring every aspect of your site. It's split into 11 focused sub-pages, each accessible from a sidebar navigation menu. Each sub-page handles only its own section, making it faster to load and easier to navigate.

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

**Header Styling** — Configure header background color, text color, background opacity, sticky/relative positioning, transparent mode, and bottom border toggle. Colors use color pickers and opacity sliders. Default behavior uses your branding primary color with auto-computed contrast text.

**Footer Styling** — Configure footer background color, text color, optional background image (with automatic dark gradient overlay), and layout mode. Three layout modes: default (4-column grid), minimal (single-row), or centered (stacked). Background image can be uploaded via the image upload component.

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

**Section Ordering** — Homepage sections can be reordered from this page. Use the arrow buttons next to each section to move it up or down. New sections are automatically added to the end of the order. Each section can also have a custom background color via the color picker.

**Default section order:**
Hero > Logo Marquee > Metrics > Features > Testimonials > Process Steps > Customer Stories > Founder Letter > Comparison Bars > Product Showcase > Bottom Hero CTA > Image Collage > Image + Text Blocks > FAQ > CTA

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

Toggle features on and off, and configure AI and webhook integrations. This page also includes:

- **Security settings** — Configure metrics alert thresholds (churn rate, minimum new users), API token rotation intervals, and database backup preferences
- **Compliance settings** — Enable/disable legal pages (Cookie Policy, Acceptable Use, etc.) and configure the cookie consent banner
- **Support settings** — Configure the floating support chatbot widget, set the fallback email, and customize the chatbot's system prompt

See [Feature Toggles Reference](#feature-toggles-reference) for details on each toggle.

### API Keys & Integrations

**Where:** `/admin/setup/integrations`

Manage all your third-party service API keys from one centralized page. Keys are organized into collapsible groups by service:

- **Supabase** (Required) — Project URL, Anon Key, Service Role Key
- **Stripe** (Required) — Secret Key, Publishable Key
- **Resend** (Required) — API Key, From Email
- **AI Providers** (Optional) — xAI API Key, OpenAI API Key, Anthropic API Key
- **Upstash Redis** (Optional) — REST URL, REST Token
- **Sentry** (Optional) — DSN, Org, Project
- **Plausible** (Optional) — Domain

**How it works:**
- Each group is collapsed by default — click the group header to expand
- Colored dots next to each key show its status: green (configured), red (required but missing), gray (optional and missing)
- Summary cards at the top show how many keys are configured overall and how many required keys are set
- Click the pencil icon or the masked value to edit a key inline
- Click the eye icon to reveal a key's value temporarily
- Click the trash icon to delete a key
- **Source badges** indicate whether a key is stored in the Dashboard (database) or comes from an Environment Variable on your hosting platform
- Format validation catches common errors when saving (e.g., Stripe keys must start with `sk_`)

**Note:** Social platform API keys are managed on the PassivePost setup page instead, so they only appear when the social module is enabled.

### PassivePost

**Where:** `/admin/setup/passivepost`

Configure the PassivePost social media management module. See [PassivePost Module](#passivepost-module) for full details.

This page also includes:

- **Niche Guidance** — Admin-editable entries for AI prompt customization (key/label/guidance triplets). Empty entries are automatically filtered on save.
- **Engagement Pull Configuration** — Set the interval (1-168 hours) for how often the system fetches engagement metrics from platform APIs, and the lookback window for which posts to check.
- **API Health Checker** — Configure status monitoring for social platform API connections, with alerts for repeated failures.

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

### User Impersonation

Admins can temporarily impersonate any user for debugging purposes. This lets you see exactly what the user sees without needing their password.

- **How it works:** Click the impersonate button on a user's profile to view the app as that user
- **Safety:** Impersonation sessions expire after 30 minutes automatically
- **Visual indicator:** A yellow warning banner appears at the top of the screen while impersonating
- **Stop anytime:** Click "Stop Impersonation" to return to your admin account
- **Audit trail:** All impersonation sessions are logged in the audit log

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

## Metrics Dashboard

**Where:** `/admin/metrics`

A comprehensive dashboard showing your key business performance indicators with charts and alert monitoring.

### KPI Cards

The dashboard displays 10 KPI cards in a responsive grid:

| KPI | What It Shows |
|-----|--------------|
| **Total Users** | Overall signups |
| **New Users This Month** | Recent growth (with alert threshold) |
| **Active Subscriptions** | How many paying customers you have |
| **MRR** | Monthly Recurring Revenue in dollars |
| **ARPU** | Average Revenue Per User |
| **LTV** | Customer Lifetime Value |
| **Churn Rate** | Percentage of users leaving (with alert threshold) |
| **Conversion Rate** | Free-to-paid conversion percentage |
| **Feedback Count** | Total feedback submissions |
| **Waitlist Count** | People waiting for access |

### NPS Score

A dedicated card shows your **Net Promoter Score** — a measure of how likely users are to recommend your product. The NPS is calculated from optional ratings (0-10) that users can submit through the feedback widget and help widget.

- Color-coded display: green (good, 50+), yellow (average, 0-49), red (needs attention, below 0)
- Score ranges from -100 to +100

### Alert Thresholds

Configurable alerts let you know when key metrics need attention:

- **Churn Rate Alert** — Set a maximum churn rate threshold. When exceeded, you'll see a warning on the card and can receive email alerts.
- **Minimum New Users Alert** — Set a minimum number of new users per month. If growth drops below this, you'll be notified.

Configure alert thresholds in Admin > Setup > Features > Security section.

### Action Buttons

- **Email Report** — Send a KPI summary email to yourself or your team. Uses the scheduled report system to compile and deliver key metrics.
- **Check Alerts** — Manually trigger an alert check against your configured thresholds. Shows a notification if any thresholds are exceeded.

The dashboard also includes **User Growth** and **Revenue Growth** line charts showing trends over time.

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

For more detailed metrics and KPIs, use the [Metrics Dashboard](#metrics-dashboard).

---

## Feedback

**Where:** `/admin/feedback`

Read and manage feedback from your users:

- **View all feedback** — See messages, the page they were submitted from, and timestamps
- **Filter by status** — New, Reviewed, or Resolved
- **Update status** — Mark feedback as reviewed or resolved
- **Delete feedback** — Remove entries you no longer need

The feedback widget appears on your site when the "Feedback Widget" feature toggle is enabled. Users can submit feedback from any page.

### NPS Score Tracking

Each feedback submission can include an optional **NPS rating** (0-10). When users submit feedback:

- They see 11 buttons (0 through 10) labeled "Not likely" to "Very likely"
- The rating is stored alongside their feedback message
- Feedback entries with NPS scores display a colored **NPS badge** in the admin feedback list
- All NPS scores are aggregated into the Net Promoter Score displayed on the Metrics Dashboard

NPS ratings can also be submitted through the [Help Widget](#help-widget-support-chatbot) after a support conversation.

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
- **Report jobs** — Generating and emailing scheduled KPI summary reports
- **Token rotation jobs** — Automated webhook secret rotation at configured intervals
- **Social post jobs** — Delivering scheduled social media posts to platforms
- **Social health check jobs** — Monitoring social platform API connectivity
- **Social trend monitor jobs** — Tracking trends across platforms (Power tier)
- **Social engagement pull jobs** — Fetching likes, shares, and comments from platform APIs

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

**API Token Rotation:** You can configure automated webhook secret rotation at a set interval (e.g., every 30 days) via Admin > Setup > Security. This is processed as a background job through the queue system.

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

## Help Widget (Support Chatbot)

The Help Widget is a floating chat button that appears in the bottom corner of your site (separate from the Feedback Widget). When enabled, it provides AI-powered support to your visitors.

**How it works:**
1. Visitors click the help button to open a chat panel
2. They type a question and receive an AI-generated response using your configured AI provider and system prompt
3. After receiving a response, they're shown an optional NPS rating (0-10) to rate their experience
4. A fallback email link is displayed in case the AI can't answer their question

**Configuration (Admin > Setup > Features > Support):**
- Toggle the support chatbot on/off
- Set the fallback email address for unresolved questions
- Customize the chatbot's system prompt (instructions that guide its responses)

**NPS ratings** submitted through the help widget are included in the overall NPS score on the Metrics Dashboard.

---

## In-App Notifications

MuseKit includes an in-app notification system for keeping users informed:

- **Bell icon** in the header shows an unread notification count badge
- **Notification popover** lists recent notifications with type-specific icons
- **Auto-polling** checks for new notifications periodically
- **Mark all as read** button clears the unread count
- **Server-side utility** allows creating notifications programmatically from any API route

---

## Audit Log Viewer

**Where:** `/admin/audit-logs`

A dedicated page for reviewing all administrative actions taken on the platform:

- **Paginated table** of audit log entries showing user, action, timestamp, and details
- **Filterable** by action type and user
- Captures all admin operations including settings changes, user role updates, impersonation sessions, and more

This is essential for compliance and tracking who made what changes and when.

---

## Legal & Compliance Pages

MuseKit includes a comprehensive set of legal pages that are automatically available at public URLs. These pages use dynamic variable replacement so your company name, support email, and other details are inserted automatically.

**Available legal pages:**

| Page | URL |
|------|-----|
| Terms of Service | `/terms` |
| Privacy Policy | `/privacy` |
| Cookie Policy | `/cookie-policy` |
| Acceptable Use | `/acceptable-use` |
| Accessibility | `/accessibility` |
| Data Handling | `/data-handling` |
| DMCA | `/dmca` |
| AI Data Usage | `/ai-data-usage` |
| Security Policy | `/security-policy` |

**Cookie Consent Banner:** A configurable cookie consent banner can be enabled via Admin > Setup > Features > Compliance. When enabled, visitors see a banner at the bottom of the page asking them to accept or decline cookies.

**Configuration:** Legal and compliance settings are managed in Admin > Setup > Features, including toggles for individual legal pages, cookie consent, MFA requirements, and password requirements.

---

## Landing Page Components

The landing page is built from 16 reusable components, all configurable from the Content settings page:

- **Hero** — Main banner with 6 style options (full-width, split, video, pattern, floating mockup, photo collage)
- **Logo Marquee** — Scrolling partner/client logos
- **Animated Counters** — Key metrics with counting animation
- **Feature Cards** — Product feature highlights with icons
- **Testimonial Carousel** — Customer quotes in a rotating carousel
- **Customer Stories** — Longer-form testimonials with photos
- **Process Steps** — Numbered how-it-works sequence
- **FAQ Section** — Expandable question/answer pairs
- **Founder Letter** — Long-form narrative with portrait, signature, and background banner
- **Comparison Bars** — Animated horizontal progress bars with entrance animation
- **Product Showcase** — App screenshot with shadow/border over background image or gradient
- **Bottom Hero CTA** — Closing call-to-action section matching hero visual weight
- **Image Collage** — Fan-style overlapping images (up to 5) with hover animation
- **Image + Text Blocks** — Alternating image and text sections for detailed features
- **Gradient Text** — Animated gradient text effect for headlines
- **Announcement Bar** — Top banner for promotions or important messages

Each component can be toggled on/off independently. Toggle names follow the pattern `{componentName}Enabled` in the Content settings.

**Feature Sub-Pages** — Create dedicated pages for individual features at `/features/{slug}`. Each page can have a hero section with background image and screenshot, alternating image/text blocks, and a closing CTA.

---

## PassivePost (Social Media Management)

PassivePost is a separate product built on MuseKit. For complete documentation including dashboard pages, tier system, API routes, OAuth flows, and admin configuration, see `docs/PASSIVEPOST.md`.

**Quick reference for admins:**
- Admin config page: `/admin/setup/passivepost`
- User dashboard: `/dashboard/social/overview`
- 3 tiers: Starter, Basic, Premium (configurable)
- 10 social platforms supported
- AI post generation with 15 niche-specific prompts

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
| **Support Chatbot** | Show a floating AI-powered help chat widget |
| **AI Features** | Enable the AI chat assistant |
| **Enterprise SSO / SAML** | Enable SAML-based single sign-on for enterprise users |
| **PassivePost Module** | Enable social media management (posting, scheduling, AI content generation) |

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
| **Cookie Policy** | `/cookie-policy` | Cookie usage policy |
| **Acceptable Use** | `/acceptable-use` | Acceptable use policy |
| **Accessibility** | `/accessibility` | Accessibility statement |
| **Data Handling** | `/data-handling` | Data handling practices |
| **DMCA** | `/dmca` | DMCA takedown policy |
| **AI Data Usage** | `/ai-data-usage` | AI data usage policy |
| **Security Policy** | `/security-policy` | Security practices |
| **Login** | `/login` | User login (email, OAuth, Magic Link, SSO) |
| **Signup** | `/signup` | New account registration |
| **Billing** | `/billing` | Subscription management (logged-in users) |
| **Profile** | `/profile` | User profile settings (logged-in users) |
| **Custom Pages** | `/p/{slug}` | Up to 4 custom pages you create |
| **Social Dashboard** | `/dashboard/social/*` | Social media management (when PassivePost is enabled) |

All pages automatically support dark/light mode and are responsive on mobile devices.

---

## Tips & Best Practices

- **Always click Save** — Changes in Setup Dashboard aren't applied until you click the "Save Changes" button
- **Changes take effect immediately** — After saving, settings are applied on the next page load (no caching delay)
- **Test after changes** — After saving, visit your public pages to verify changes look correct
- **Use the onboarding wizard first** — If this is a new setup, complete the onboarding wizard before diving into the Setup Dashboard
- **Keep your Stripe Dashboard in sync** — Pricing plans are managed in Stripe, not in MuseKit. If plans look wrong, check Stripe first.
- **Monitor the Job Queue** — If emails aren't being sent or engagement data isn't updating, check the Queue dashboard for failed jobs
- **Test webhooks** — Use the "Test Webhook" button before relying on webhook integrations
- **Check the Metrics Dashboard regularly** — Monitor KPIs and set up alert thresholds to catch issues early
- **Review the Audit Log** — Periodically check the audit log for unexpected admin actions
- **Backup before major changes** — The platform supports checkpoints, but it's good practice to note your current settings before making sweeping changes
- **API Keys page first** — After initial setup, configure your required API keys on the Integrations page to ensure all services are connected
- **PassivePost setup** — If using social features, enable the module first, then configure platforms and API keys on the same page
- **PassivePost tiers** — Set up Stripe products with metadata key `muse_tier` and values (`tier_1`, `tier_2`, `tier_3`) to enable per-user tier resolution. Tier definitions are admin-configurable from the PassivePost setup page
- **Engagement pull settings** — Adjust the engagement pull interval based on your API rate limits and how frequently you need updated metrics

---

*Last Updated: February 19, 2026*
