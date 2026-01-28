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

export interface PagesSettings {
  about: AboutPageSettings
  contact: ContactPageSettings
  legal: LegalPageSettings
}

export interface SiteSettings {
  branding: BrandingSettings
  pricing: PricingSettings
  social: SocialLinks
  features: FeatureToggles
  content: ContentSettings
  pages: PagesSettings
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
  pages: {
    about: {
      headline: 'About Us',
      subheadline: 'Learn more about our mission and team',
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
  },
}
