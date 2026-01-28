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
  emailAuth: boolean
  avatarUpload: boolean
  adminPanel: boolean
  auditLogs: boolean
  maintenanceMode: boolean
  allowNewSignups: boolean
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
}

export interface SiteSettings {
  branding: BrandingSettings
  pricing: PricingSettings
  social: SocialLinks
  features: FeatureToggles
  content: ContentSettings
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
    emailAuth: true,
    avatarUpload: true,
    adminPanel: true,
    auditLogs: true,
    maintenanceMode: false,
    allowNewSignups: true,
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
  },
}
