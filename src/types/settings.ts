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
}
