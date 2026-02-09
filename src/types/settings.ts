export interface ThemeColors {
  background: string
  foreground: string
  card: string
  border: string
}

export interface BrandingSettings {
  appName: string
  tagline: string
  logoUrl: string | null
  logoWidth?: number
  logoHeight?: number
  logoHoverEffect?: boolean
  brandNameGradient?: boolean
  brandNameAnimated?: boolean
  faviconUrl: string | null
  heroImageUrl: string | null
  heroImagePosition: string
  heroImagePositionX: number
  heroImagePositionY: number
  heroImageSize: string
  primaryColor: string
  accentColor: string
  companyName: string
  supportEmail: string
  lightTheme: ThemeColors
  darkTheme: ThemeColors
  heroVideoUrl?: string | null
  heroPatternUrl?: string | null
  heroPatternOpacity?: number
  heroFloatingImageUrl?: string | null
}

export interface PricingPlan {
  id: string
  name: string
  price: number
  interval: 'month' | 'year'
  features: string[]
  stripePriceId: string
  highlighted: boolean
}

export interface PricingSettings {
  currency: string
  plans: PricingPlan[]
  showFreePlan?: boolean
  freePlanName?: string
  freePlanDescription?: string
  freePlanFeatures?: string[]
  cardLayout?: 'auto' | '2' | '3' | '4'
}

export interface SocialLinks {
  twitter: string
  linkedin: string
  github: string
  website: string
}

export interface FeatureToggles {
  googleOAuth: boolean
  githubOAuth: boolean
  appleOAuth: boolean
  twitterOAuth: boolean
  magicLink: boolean
  emailAuth: boolean
  avatarUpload: boolean
  adminPanel: boolean
  auditLogs: boolean
  maintenanceMode: boolean
  allowNewSignups: boolean
  waitlistMode: boolean
  feedbackWidget: boolean
  aiEnabled: boolean
  ssoEnabled: boolean
}

export type AIProvider = 'xai' | 'openai' | 'anthropic'

export interface AISettings {
  provider: AIProvider
  model: string
  maxTokens: number
  temperature: number
  systemPrompt: string
}

export interface FeatureCard {
  id: string
  icon: string
  title: string
  description: string
}

export interface Testimonial {
  id: string
  name: string
  role: string
  company: string
  quote: string
  avatarUrl?: string
  companyLogoUrl?: string
}

export interface FAQItem {
  id: string
  question: string
  answer: string
}

export interface CTAContent {
  headline: string
  description: string
  buttonText: string
  buttonLink: string
}

export interface NavItem {
  id: string
  label: string
  href: string
  enabled: boolean
  badge?: 'new' | 'beta' | 'coming-soon' | null
  children?: NavItem[]
}

export interface NavigationSettings {
  items: NavItem[]
}

export interface AnnouncementBar {
  enabled: boolean
  text: string
  linkText?: string
  linkUrl?: string
  backgroundColor?: string
  textColor?: string
  dismissible?: boolean
}

export interface CustomerStory {
  id: string
  companyName: string
  companyLogoUrl?: string
  personName?: string
  personRole?: string
  personPhotoUrl?: string
  quote?: string
  storyUrl?: string
  backgroundImageUrl?: string
}

export interface TrustedLogo {
  id: string
  name: string
  imageUrl?: string
  imagePositionX?: number
  imagePositionY?: number
}

export interface ProcessStep {
  id: string
  number: number
  title: string
  description: string
}

export interface Metric {
  id: string
  value: number
  suffix?: string
  prefix?: string
  label: string
  iconUrl?: string
  iconPositionX?: number
  iconPositionY?: number
}

export interface ImageTextBlock {
  id: string
  headline: string
  description: string
  imageUrl: string
  imageAlt?: string
  buttonText?: string
  buttonLink?: string
  imagePosition: 'left' | 'right'
  imagePositionX?: number
  imagePositionY?: number
}

export interface ContentSettings {
  featuresEnabled: boolean
  featuresHeadline: string
  featuresSubheadline: string
  featureCards: FeatureCard[]
  testimonialsEnabled: boolean
  testimonialsHeadline: string
  testimonials: Testimonial[]
  faqEnabled: boolean
  faqHeadline: string
  faqItems: FAQItem[]
  ctaEnabled: boolean
  cta: CTAContent
  trustedByEnabled?: boolean
  trustedByHeadline?: string
  trustedLogos?: TrustedLogo[]
  metricsEnabled?: boolean
  metricsHeadline?: string
  metrics?: Metric[]
  processEnabled?: boolean
  processHeadline?: string
  processSubheadline?: string
  processSteps?: ProcessStep[]
  testimonialStyle?: 'cards' | 'carousel'
  imageTextEnabled?: boolean
  imageTextBlocks?: ImageTextBlock[]
  heroStyle?: 'fullWidth' | 'split' | 'video' | 'pattern' | 'floating'
  splitHeroImagePosition?: 'left' | 'right'
  splitHeroImageUrl?: string
  splitHeroBackground?: 'transparent' | 'muted' | 'gradient' | 'accent'
  splitHeroGap?: number
  splitHeroImageHeight?: number
  floatingHeroGap?: number
  floatingHeroImageHeight?: number
  sectionBackgrounds?: {
    features?: 'default' | 'muted' | 'gradient' | 'mesh'
    testimonials?: 'default' | 'muted' | 'gradient' | 'mesh'
    faq?: 'default' | 'muted' | 'gradient' | 'mesh'
    cta?: 'default' | 'muted' | 'gradient' | 'mesh'
    customerStories?: 'default' | 'muted' | 'gradient' | 'mesh'
  }
  heroAnimatedWords?: string[]
  customerStoriesEnabled?: boolean
  customerStoriesHeadline?: string
  customerStories?: CustomerStory[]
}

export interface TeamMember {
  id: string
  name: string
  role: string
  bio: string
  imageUrl: string | null
}

export interface AboutPageSettings {
  headline: string
  subheadline: string
  heroImageUrl: string | null
  heroImagePositionX: number
  heroImagePositionY: number
  story: string
  mission: string
  values: string[]
  showTeam: boolean
  teamHeadline: string
  team: TeamMember[]
}

export interface ContactPageSettings {
  headline: string
  subheadline: string
  heroImageUrl: string | null
  heroImagePositionX: number
  heroImagePositionY: number
  email: string
  phone: string
  address: string
  showContactForm: boolean
  formSuccessMessage: string
}

export interface LegalPageSettings {
  termsOfService: string
  termsLastUpdated: string
  privacyPolicy: string
  privacyLastUpdated: string
  acceptableUse: string
  acceptableUseLastUpdated: string
  cookiePolicy: string
  cookiePolicyLastUpdated: string
  accessibilityStatement: string
  accessibilityLastUpdated: string
  dmcaPolicy: string
  dmcaLastUpdated: string
  dataHandling: string
  dataHandlingLastUpdated: string
  aiDataUsage: string
  aiDataUsageLastUpdated: string
  securityPolicy: string
  securityPolicyLastUpdated: string
}

export interface ComplianceSettings {
  acceptableUseEnabled: boolean
  cookiePolicyEnabled: boolean
  accessibilityEnabled: boolean
  dmcaEnabled: boolean
  dataHandlingEnabled: boolean
  aiDataUsageEnabled: boolean
  securityPolicyEnabled: boolean
  cookieConsentEnabled: boolean
  cookieConsentText: string
  cookieConsentCategories: {
    necessary: boolean
    analytics: boolean
    marketing: boolean
  }
}

export interface SupportSettings {
  enabled: boolean
  widgetPosition: 'bottom-right' | 'bottom-left'
  widgetColor: string
  widgetIcon: string
  systemPrompt: string
  fallbackEmail: string
  welcomeMessage: string
  logChats: boolean
}

export interface SecuritySettings {
  mfaEnabled: boolean
  mfaRequired: boolean
  passwordMinLength: number
  passwordRequireUppercase: boolean
  passwordRequireNumbers: boolean
  passwordRequireSpecial: boolean
  sessionTimeoutMinutes: number
  dataExportEnabled: boolean
  accountDeletionEnabled: boolean
  captchaEnabled: boolean
  backupEnabled: boolean
  backupFrequency: 'daily' | 'weekly' | 'monthly'
  backupRetentionDays: number
  tokenRotationEnabled: boolean
  tokenRotationIntervalDays: number
  alertsEnabled: boolean
  alertRecipientEmail: string
  alertChurnThreshold: number
  alertMinMonthlyUsers: number
  weeklyReportEnabled: boolean
  monthlyReportEnabled: boolean
}

export interface MetricsSettings {
  alerts: {
    enabled: boolean
    recipientEmail: string
    churnThreshold: number
    minMonthlyUsers: number
    weeklyReportEnabled: boolean
    monthlyReportEnabled: boolean
  }
}

export interface PricingPageSettings {
  headline: string
  subheadline: string
  heroImageUrl: string | null
  heroImagePositionX: number
  heroImagePositionY: number
}

export interface FAQPageSettings {
  headline: string
  subheadline: string
  heroImageUrl: string | null
  heroImagePositionX: number
  heroImagePositionY: number
}

export interface CustomPageSection {
  id: string
  type: 'text' | 'image-left' | 'image-right' | 'cards'
  headline: string
  content: string
  imageUrl: string | null
  cards: { id: string; title: string; description: string; icon: string }[]
}

export interface CustomPage {
  id: string
  enabled: boolean
  name: string
  slug: string
  headline: string
  subheadline: string
  heroImageUrl: string | null
  heroImagePositionX: number
  heroImagePositionY: number
  content: string
  sections: CustomPageSection[]
}

export interface PagesSettings {
  about: AboutPageSettings
  contact: ContactPageSettings
  legal: LegalPageSettings
  pricing: PricingPageSettings
  faq: FAQPageSettings
  customPages: CustomPage[]
}

export interface WebhookSettings {
  enabled: boolean
  url: string
  secret: string
  events: {
    feedbackSubmitted: boolean
    waitlistEntry: boolean
    subscriptionCreated: boolean
    subscriptionUpdated: boolean
    subscriptionCancelled: boolean
    teamInvited: boolean
    teamMemberJoined: boolean
    contactSubmitted: boolean
  }
}

export interface SiteSettings {
  branding: BrandingSettings
  pricing: PricingSettings
  social: SocialLinks
  features: FeatureToggles
  content: ContentSettings
  pages: PagesSettings
  navigation?: NavigationSettings
  announcement?: AnnouncementBar
  ai?: AISettings
  webhooks?: WebhookSettings
  compliance?: ComplianceSettings
  support?: SupportSettings
  security?: SecuritySettings
  metrics?: MetricsSettings
}

export const defaultLightTheme: ThemeColors = {
  background: '#ffffff',
  foreground: '#0a0a0a',
  card: '#ffffff',
  border: '#e5e5e5',
}

export const defaultDarkTheme: ThemeColors = {
  background: '#0a0a1a',
  foreground: '#fafafa',
  card: '#0a0a1a',
  border: '#2a2a3e',
}

export const defaultSettings: SiteSettings = {
  branding: {
    appName: 'My SaaS',
    tagline: 'Build something amazing',
    logoUrl: null,
    logoWidth: 32,
    logoHeight: 32,
    logoHoverEffect: true,
    brandNameGradient: false,
    brandNameAnimated: false,
    faviconUrl: null,
    heroImageUrl: null,
    heroImagePosition: 'center',
    heroImagePositionX: 50,
    heroImagePositionY: 50,
    heroImageSize: 'cover',
    primaryColor: '#6366f1',
    accentColor: '#8b5cf6',
    companyName: 'Your Company',
    supportEmail: 'support@example.com',
    lightTheme: defaultLightTheme,
    darkTheme: defaultDarkTheme,
  },
  pricing: {
    currency: 'USD',
    showFreePlan: true,
    freePlanName: 'Free',
    freePlanDescription: 'Perfect for getting started',
    freePlanFeatures: ['Basic features', 'Up to 100 items', 'Community support'],
    plans: [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        interval: 'month',
        features: ['Basic features', 'Community support'],
        stripePriceId: '',
        highlighted: false,
      },
      {
        id: 'pro',
        name: 'Pro',
        price: 29,
        interval: 'month',
        features: ['All Free features', 'Priority support', 'Advanced analytics'],
        stripePriceId: '',
        highlighted: true,
      },
      {
        id: 'team',
        name: 'Team',
        price: 99,
        interval: 'month',
        features: ['All Pro features', 'Team collaboration', 'API access'],
        stripePriceId: '',
        highlighted: false,
      },
    ],
  },
  social: {
    twitter: '',
    linkedin: '',
    github: '',
    website: '',
  },
  features: {
    googleOAuth: true,
    githubOAuth: false,
    appleOAuth: false,
    twitterOAuth: false,
    magicLink: true,
    emailAuth: true,
    avatarUpload: true,
    adminPanel: true,
    auditLogs: true,
    maintenanceMode: false,
    allowNewSignups: true,
    waitlistMode: false,
    feedbackWidget: true,
    aiEnabled: false,
    ssoEnabled: false,
  },
  ai: {
    provider: 'xai',
    model: 'grok-3-mini-fast',
    maxTokens: 1024,
    temperature: 0.7,
    systemPrompt: 'You are a helpful AI assistant.',
  },
  content: {
    featuresEnabled: true,
    featuresHeadline: 'Everything you need',
    featuresSubheadline: 'Powerful features to help you build faster',
    featureCards: [
      {
        id: '1',
        icon: 'Zap',
        title: 'Lightning Fast',
        description: 'Built for speed with modern technologies',
      },
      {
        id: '2',
        icon: 'Shield',
        title: 'Secure by Default',
        description: 'Enterprise-grade security out of the box',
      },
      {
        id: '3',
        icon: 'Sparkles',
        title: 'Easy to Use',
        description: 'Intuitive interface that anyone can master',
      },
    ],
    testimonialsEnabled: true,
    testimonialsHeadline: 'What our customers say',
    testimonials: [
      {
        id: '1',
        name: 'Sarah Johnson',
        role: 'CEO',
        company: 'TechStart',
        quote: 'This product transformed how we work. Highly recommended!',
      },
      {
        id: '2',
        name: 'Mike Chen',
        role: 'Developer',
        company: 'BuildCo',
        quote: 'The best tool I\'ve used in years. Simple and powerful.',
      },
    ],
    faqEnabled: true,
    faqHeadline: 'Frequently asked questions',
    faqItems: [
      {
        id: '1',
        question: 'How do I get started?',
        answer: 'Simply sign up for a free account and follow our quick start guide.',
      },
      {
        id: '2',
        question: 'Can I cancel anytime?',
        answer: 'Yes, you can cancel your subscription at any time with no questions asked.',
      },
      {
        id: '3',
        question: 'Is there a free trial?',
        answer: 'Yes, we offer a 14-day free trial on all paid plans.',
      },
    ],
    ctaEnabled: true,
    cta: {
      headline: 'Ready to get started?',
      description: 'Join thousands of satisfied customers today.',
      buttonText: 'Start Free Trial',
      buttonLink: '/signup',
    },
    trustedByEnabled: false,
    trustedByHeadline: 'Trusted by industry leaders',
    trustedLogos: [
      { id: '1', name: 'Acme Corp' },
      { id: '2', name: 'TechStart' },
      { id: '3', name: 'GlobalTech' },
      { id: '4', name: 'InnovateCo' },
      { id: '5', name: 'FutureLabs' },
    ],
    metricsEnabled: false,
    metricsHeadline: 'Results that speak for themselves',
    metrics: [
      { id: '1', value: 10000, suffix: '+', label: 'Happy Customers' },
      { id: '2', value: 99, suffix: '%', label: 'Uptime' },
      { id: '3', value: 24, suffix: '/7', label: 'Support' },
    ],
    processEnabled: false,
    processHeadline: 'How it works',
    processSubheadline: 'Get started in just a few simple steps',
    processSteps: [
      { id: '1', number: 1, title: 'Sign Up', description: 'Create your free account in seconds' },
      { id: '2', number: 2, title: 'Configure', description: 'Set up your preferences and connect your tools' },
      { id: '3', number: 3, title: 'Launch', description: 'Start using the platform and see results' },
    ],
    testimonialStyle: 'cards',
    imageTextEnabled: false,
    imageTextBlocks: [
      { id: '1', headline: 'Built for scale', description: 'Our platform grows with your business, handling everything from small projects to enterprise workloads.', imageUrl: '', imagePosition: 'left' },
      { id: '2', headline: 'Security first', description: 'Enterprise-grade security with encryption at rest and in transit, plus SOC 2 compliance.', imageUrl: '', imagePosition: 'right' },
    ],
    heroStyle: 'fullWidth',
    splitHeroImagePosition: 'right',
    splitHeroImageUrl: '',
    splitHeroBackground: 'transparent',
    splitHeroGap: 12,
    floatingHeroGap: 8,
  },
  pages: {
    about: {
      headline: 'About Us',
      subheadline: 'Learn more about our mission and team',
      heroImageUrl: null,
      heroImagePositionX: 50,
      heroImagePositionY: 50,
      story: 'We started with a simple idea: make powerful tools accessible to everyone. What began as a small project has grown into a platform trusted by thousands of users worldwide.',
      mission: 'Our mission is to empower businesses and individuals with intuitive, powerful software that helps them achieve their goals faster.',
      values: ['Innovation', 'Simplicity', 'Customer Focus', 'Integrity'],
      showTeam: false,
      teamHeadline: 'Meet Our Team',
      team: [],
    },
    contact: {
      headline: 'Contact Us',
      subheadline: 'We\'d love to hear from you',
      heroImageUrl: null,
      heroImagePositionX: 50,
      heroImagePositionY: 50,
      email: 'support@example.com',
      phone: '',
      address: '',
      showContactForm: true,
      formSuccessMessage: 'Thank you for your message! We\'ll get back to you within 24 hours.',
    },
    legal: {
      termsOfService: `# Terms of Service

## 1. Acceptance of Terms
By accessing and using this service, you accept and agree to be bound by the terms and conditions of this agreement.

## 2. Use of Service
You agree to use this service only for lawful purposes and in accordance with these Terms.

## 3. User Accounts
You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.

## 4. Intellectual Property
All content, features, and functionality of this service are owned by us and are protected by copyright, trademark, and other intellectual property laws.

## 5. Limitation of Liability
In no event shall we be liable for any indirect, incidental, special, consequential, or punitive damages.

## 6. Changes to Terms
We reserve the right to modify these terms at any time. We will notify users of any material changes.

## 7. Contact
If you have any questions about these Terms, please contact us.`,
      termsLastUpdated: new Date().toISOString().split('T')[0],
      privacyPolicy: `# Privacy Policy

## 1. Information We Collect
We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support.

## 2. How We Use Your Information
We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.

## 3. Information Sharing
We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.

## 4. Data Security
We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

## 5. Cookies
We use cookies and similar tracking technologies to track activity on our service and hold certain information.

## 6. Your Rights
You have the right to access, update, or delete your personal information at any time.

## 7. Changes to This Policy
We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.

## 8. Contact Us
If you have any questions about this Privacy Policy, please contact us.`,
      privacyLastUpdated: new Date().toISOString().split('T')[0],
      acceptableUse: `# Acceptable Use Policy

## 1. Purpose
This Acceptable Use Policy outlines the rules and guidelines for using {appName}. By using our service, you agree to comply with this policy.

## 2. Prohibited Activities
You may not use {appName} to:
- Violate any applicable laws or regulations
- Send spam, unsolicited messages, or bulk communications
- Distribute malware, viruses, or other harmful software
- Attempt to gain unauthorized access to other users' accounts or our systems
- Engage in any activity that disrupts or interferes with our services
- Scrape, mine, or collect data from our platform without permission
- Impersonate another person or entity

## 3. API and Integration Usage
When using our APIs or third-party integrations:
- Respect rate limits and usage quotas
- Do not share API credentials with unauthorized parties
- Use integrations only for their intended purposes
- Comply with third-party service terms of use

## 4. Content Guidelines
Users are responsible for content they create or share through {appName}. Content must not be illegal, offensive, defamatory, or infringe on intellectual property rights.

## 5. Enforcement
We reserve the right to suspend or terminate accounts that violate this policy. Repeated violations may result in permanent account removal.

## 6. Reporting Violations
If you become aware of any violations of this policy, please report them to us immediately via our contact page.

## 7. Changes
We may update this policy at any time. Continued use of {appName} after changes constitutes acceptance of the updated policy.`,
      acceptableUseLastUpdated: new Date().toISOString().split('T')[0],
      cookiePolicy: `# Cookie Policy

## 1. What Are Cookies
Cookies are small text files stored on your device when you visit {appName}. They help us provide you with a better experience by remembering your preferences and understanding how you use our service.

## 2. Types of Cookies We Use

### Necessary Cookies
These cookies are essential for {appName} to function properly. They enable core features like authentication, security, and session management. You cannot opt out of these cookies.

### Analytics Cookies
We use privacy-friendly analytics to understand how visitors interact with {appName}. These cookies help us improve our service by tracking anonymous usage patterns. No personal data is collected through analytics cookies.

### Marketing Cookies
If enabled, these cookies may be used to deliver relevant information about {appName} to you. We do not sell your data to third-party advertisers.

## 3. Managing Cookies
You can control cookie preferences through our cookie consent banner. You can also manage cookies through your browser settings. Note that disabling certain cookies may affect the functionality of {appName}.

## 4. Third-Party Cookies
Some features of {appName} may use third-party services that set their own cookies. These include authentication providers and analytics services. Please refer to their respective privacy policies for more information.

## 5. Data Retention
Cookies are retained for varying periods depending on their purpose. Session cookies are deleted when you close your browser. Persistent cookies may be retained for up to 12 months.

## 6. Updates to This Policy
We may update this Cookie Policy from time to time. We will notify you of any significant changes.

## 7. Contact
If you have questions about our use of cookies, please contact us.`,
      cookiePolicyLastUpdated: new Date().toISOString().split('T')[0],
      accessibilityStatement: `# Accessibility Statement

## Our Commitment
{appName} is committed to ensuring digital accessibility for people of all abilities. We strive to meet WCAG 2.2 Level AA standards to provide an inclusive experience for everyone.

## Accessibility Features
- **Keyboard Navigation**: All interactive elements are accessible via keyboard
- **Screen Reader Support**: Content is structured with semantic HTML and ARIA labels
- **Color Contrast**: We maintain sufficient color contrast ratios for readability
- **Responsive Design**: Our interface adapts to different screen sizes and zoom levels
- **Focus Indicators**: Clear visual indicators show which element has keyboard focus
- **Alt Text**: Images include descriptive alternative text

## Known Limitations
While we strive for full accessibility, some areas may have limitations that we are actively working to address. We continuously test and improve our accessibility.

## Feedback
We welcome your feedback on the accessibility of {appName}. If you encounter any accessibility barriers or have suggestions for improvement, please contact us:
- Email: {supportEmail}
- Use our contact form on the website

## Remediation
We take accessibility reports seriously and will investigate and address issues promptly. Our goal is to respond to accessibility feedback within 5 business days.

## Compliance
This statement was last reviewed and updated on the date shown below. We regularly review our accessibility practices to ensure ongoing compliance.`,
      accessibilityLastUpdated: new Date().toISOString().split('T')[0],
      dmcaPolicy: `# DMCA Policy

## 1. Overview
{appName} respects the intellectual property rights of others and expects users to do the same. This policy outlines our procedures for handling copyright infringement claims under the Digital Millennium Copyright Act (DMCA).

## 2. Reporting Copyright Infringement
If you believe your copyrighted work has been used on {appName} in a way that constitutes infringement, please submit a DMCA takedown notice containing:

1. Your physical or electronic signature
2. Identification of the copyrighted work claimed to be infringed
3. Identification of the material to be removed, with enough information for us to locate it
4. Your contact information (address, phone number, email)
5. A statement that you have a good faith belief the use is not authorized
6. A statement, under penalty of perjury, that the information in your notice is accurate and that you are the copyright owner or authorized to act on their behalf

## 3. Where to Send Notices
Please send DMCA takedown notices to: {supportEmail}

## 4. Counter-Notification
If you believe your content was wrongly removed, you may file a counter-notification containing:
1. Your physical or electronic signature
2. Identification of the removed material and its former location
3. A statement under penalty of perjury that you believe the material was removed by mistake
4. Your name, address, phone number, and consent to jurisdiction

## 5. Repeat Infringers
{appName} may terminate accounts of users who are repeat copyright infringers.

## 6. Good Faith
We process all DMCA notices in good faith and will act promptly to remove infringing content upon receiving valid notices.`,
      dmcaLastUpdated: new Date().toISOString().split('T')[0],
      dataHandling: `# Data Handling Policy

## 1. Overview
This policy describes how {appName} handles, stores, and protects your data, including data from third-party integrations and APIs.

## 2. Data Collection
We collect data that you provide directly, including:
- Account information (name, email, profile details)
- Content you create within the platform
- Payment information (processed securely via Stripe)
- Communications with our support team

## 3. Third-Party API Data
When you connect third-party services (such as social media accounts or other integrations):
- **OAuth Tokens**: Stored encrypted in our database with restricted access
- **API Data**: Retrieved on-demand and not permanently stored unless you explicitly save it
- **Consent**: You control which services are connected and can revoke access at any time from your profile settings
- **Scope**: We only request the minimum permissions necessary for the features you use

## 4. Data Storage and Security
- All data is stored in secure, encrypted databases
- API tokens and sensitive credentials are encrypted at rest
- We use Row Level Security (RLS) to ensure users can only access their own data
- Regular security audits and monitoring are performed

## 5. Data Retention
- Active account data is retained while your account is active
- Deleted data is permanently removed within 30 days
- Backups are retained for disaster recovery and automatically expire

## 6. Your Data Rights
You have the right to:
- **Access**: Request a copy of all your personal data
- **Correction**: Update or correct your information
- **Deletion**: Request permanent deletion of your account and data
- **Portability**: Export your data in a standard format
- **Restriction**: Limit how we process your data

## 7. Data Deletion
To request data deletion, use the account deletion feature in your profile settings or contact us at {supportEmail}. We will process deletion requests within 30 days.

## 8. Contact
For questions about data handling, contact us at {supportEmail}.`,
      dataHandlingLastUpdated: new Date().toISOString().split('T')[0],
      aiDataUsage: `# AI Data Usage Policy

## 1. Overview
{appName} integrates AI capabilities to enhance your experience. This policy explains how your data interacts with AI systems and how we protect your privacy.

## 2. AI Providers
We use the following AI providers (configurable by administrators):
- **xAI (Grok)**: For intelligent chat and content generation
- **OpenAI**: For natural language processing
- **Anthropic (Claude)**: For advanced reasoning and assistance

## 3. How AI Uses Your Data
- **Prompts**: Text you send to the AI assistant is forwarded to the configured AI provider for processing
- **No Training**: Your conversations are NOT used to train AI models. We use API access only, which providers have confirmed does not use for training
- **Context**: The AI may receive system-level context (configured by administrators) to provide relevant responses
- **No Storage by Providers**: AI providers process requests in real-time and do not permanently store your conversations

## 4. What Data is Shared
- Only the text of your current conversation is sent to the AI provider
- Personal account information is NOT sent to AI providers
- Payment details are NEVER shared with AI systems

## 5. Data Minimization
- We send only the minimum data needed for AI responses
- System prompts are configured by administrators to keep AI focused and relevant
- Conversation history is session-based and not persisted beyond your current session

## 6. Opt-Out
AI features are optional. If you prefer not to use AI:
- Simply don't interact with the AI assistant
- Administrators can disable AI features entirely from the admin dashboard

## 7. Changes
We will update this policy if we change AI providers or significantly alter how AI processes data. You will be notified of material changes.

## 8. Contact
For questions about AI data usage, contact us at {supportEmail}.`,
      aiDataUsageLastUpdated: new Date().toISOString().split('T')[0],
      securityPolicy: `# Security Policy

## 1. Our Commitment
{appName} takes the security of your data seriously. This page outlines the security measures we implement to protect your information.

## 2. Infrastructure Security
- **Encryption in Transit**: All data transmitted to and from {appName} is encrypted using TLS/SSL
- **Encryption at Rest**: Sensitive data is encrypted in our databases
- **Hosting**: Our infrastructure is hosted on enterprise-grade platforms with SOC 2 compliance
- **CDN**: Content is delivered via a global CDN with built-in DDoS protection

## 3. Authentication Security
- **Password Hashing**: Passwords are hashed using industry-standard algorithms
- **Multi-Factor Authentication**: MFA is available for additional account security
- **OAuth Integration**: We support secure OAuth 2.0 authentication with trusted providers
- **Session Management**: Sessions have configurable timeouts and are securely managed

## 4. Application Security
- **Input Validation**: All user inputs are validated and sanitized to prevent injection attacks
- **Rate Limiting**: API endpoints are protected against abuse with rate limiting
- **CSRF Protection**: Cross-site request forgery protection is built into all forms
- **Row Level Security**: Database-level access controls ensure users can only access their own data

## 5. Monitoring and Logging
- **Error Tracking**: We use real-time error monitoring to detect and respond to issues quickly
- **Audit Logging**: Administrative actions are logged for accountability
- **Anomaly Detection**: Unusual activity patterns trigger alerts for investigation

## 6. Incident Response
In the event of a security incident:
1. We will investigate and contain the issue immediately
2. Affected users will be notified within 72 hours as required by applicable regulations
3. We will implement remediation measures to prevent recurrence
4. A post-incident report will be made available to affected parties

## 7. Responsible Disclosure
If you discover a security vulnerability, please report it to {supportEmail}. We ask that you:
- Do not exploit the vulnerability
- Allow us reasonable time to address the issue
- Do not disclose the vulnerability publicly until we have resolved it

## 8. Updates
We regularly review and update our security practices. This page reflects our current security posture.`,
      securityPolicyLastUpdated: new Date().toISOString().split('T')[0],
    },
    pricing: {
      headline: 'Simple, Transparent Pricing',
      subheadline: 'Choose the plan that works for you',
      heroImageUrl: null,
      heroImagePositionX: 50,
      heroImagePositionY: 50,
    },
    faq: {
      headline: 'Frequently Asked Questions',
      subheadline: 'Find answers to common questions about our product',
      heroImageUrl: null,
      heroImagePositionX: 50,
      heroImagePositionY: 50,
    },
    customPages: [
      {
        id: 'page-1',
        enabled: false,
        name: 'Features',
        slug: 'features',
        headline: 'Our Features',
        subheadline: 'Discover what makes us different',
        heroImageUrl: null,
        heroImagePositionX: 50,
        heroImagePositionY: 50,
        content: '',
        sections: [],
      },
      {
        id: 'page-2',
        enabled: false,
        name: 'Products',
        slug: 'products',
        headline: 'Our Products',
        subheadline: 'Explore our product lineup',
        heroImageUrl: null,
        heroImagePositionX: 50,
        heroImagePositionY: 50,
        content: '',
        sections: [],
      },
      {
        id: 'page-3',
        enabled: false,
        name: 'Solutions',
        slug: 'solutions',
        headline: 'Our Solutions',
        subheadline: 'Solutions tailored to your needs',
        heroImageUrl: null,
        heroImagePositionX: 50,
        heroImagePositionY: 50,
        content: '',
        sections: [],
      },
      {
        id: 'page-4',
        enabled: false,
        name: 'Resources',
        slug: 'resources',
        headline: 'Resources',
        subheadline: 'Helpful resources and guides',
        heroImageUrl: null,
        heroImagePositionX: 50,
        heroImagePositionY: 50,
        content: '',
        sections: [],
      },
    ],
  },
  webhooks: {
    enabled: false,
    url: '',
    secret: '',
    events: {
      feedbackSubmitted: true,
      waitlistEntry: true,
      subscriptionCreated: true,
      subscriptionUpdated: true,
      subscriptionCancelled: true,
      teamInvited: true,
      teamMemberJoined: true,
      contactSubmitted: true,
    },
  },
  announcement: {
    enabled: false,
    text: 'Introducing our new feature!',
    linkText: 'Learn more',
    linkUrl: '/features',
    backgroundColor: '#7c3aed',
    textColor: '#ffffff',
    dismissible: true,
  },
  navigation: {
    items: [
      { id: 'nav-1', label: 'Pricing', href: '/pricing', enabled: true },
      { id: 'nav-2', label: 'About', href: '/about', enabled: true },
      { id: 'nav-3', label: 'Contact', href: '/contact', enabled: true },
      { id: 'nav-4', label: 'FAQ', href: '/faq', enabled: false },
    ],
  },
  compliance: {
    acceptableUseEnabled: false,
    cookiePolicyEnabled: false,
    accessibilityEnabled: false,
    dmcaEnabled: false,
    dataHandlingEnabled: false,
    aiDataUsageEnabled: false,
    securityPolicyEnabled: false,
    cookieConsentEnabled: false,
    cookieConsentText: 'We use cookies to improve your experience. By continuing to use our site, you agree to our use of cookies.',
    cookieConsentCategories: {
      necessary: true,
      analytics: false,
      marketing: false,
    },
  },
  support: {
    enabled: false,
    widgetPosition: 'bottom-right',
    widgetColor: '#6366f1',
    widgetIcon: 'MessageCircle',
    systemPrompt: 'You are a helpful customer support assistant for {appName}. Answer questions about the product, help with common issues, and guide users. If you cannot help with something, suggest they email support. Be friendly, concise, and professional.',
    fallbackEmail: '',
    welcomeMessage: 'Hi there! How can I help you today?',
    logChats: false,
  },
  security: {
    mfaEnabled: false,
    mfaRequired: false,
    passwordMinLength: 8,
    passwordRequireUppercase: false,
    passwordRequireNumbers: false,
    passwordRequireSpecial: false,
    sessionTimeoutMinutes: 0,
    dataExportEnabled: true,
    accountDeletionEnabled: true,
    captchaEnabled: false,
    backupEnabled: false,
    backupFrequency: 'daily',
    backupRetentionDays: 30,
    tokenRotationEnabled: false,
    tokenRotationIntervalDays: 90,
    alertsEnabled: false,
    alertRecipientEmail: '',
    alertChurnThreshold: 5,
    alertMinMonthlyUsers: 10,
    weeklyReportEnabled: false,
    monthlyReportEnabled: false,
  },
}
