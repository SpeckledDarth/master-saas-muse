export interface BrandingSettings {
  appName: string
  tagline: string
  logoUrl: string | null
  faviconUrl: string | null
  heroImageUrl: string | null
  heroImagePosition: string
  heroImageSize: string
  primaryColor: string
  accentColor: string
  companyName: string
  supportEmail: string
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

export interface SiteSettings {
  branding: BrandingSettings
  pricing: PricingSettings
  social: SocialLinks
  features: FeatureToggles
}

export const defaultSettings: SiteSettings = {
  branding: {
    appName: 'My SaaS',
    tagline: 'Build something amazing',
    logoUrl: null,
    faviconUrl: null,
    heroImageUrl: null,
    heroImagePosition: 'center',
    heroImageSize: 'cover',
    primaryColor: '#6366f1',
    accentColor: '#8b5cf6',
    companyName: 'Your Company',
    supportEmail: 'support@example.com',
  },
  pricing: {
    currency: 'USD',
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
}
