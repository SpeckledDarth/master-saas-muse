export type SocialModuleTier = string

export type SocialPlatform = 'twitter' | 'linkedin' | 'instagram' | 'youtube' | 'facebook' | 'tiktok' | 'reddit' | 'pinterest' | 'snapchat' | 'discord'

export interface SocialAccountConfig {
  enabled: boolean
  apiKeyConfigured: boolean
}

export interface TierLimits {
  dailyAiGenerations: number
  dailyPosts: number
  monthlyPosts?: number
  maxPlatforms?: number
}

export interface TierDefinition {
  id: string
  displayName: string
  stripeMetadataValue: string
  limits: TierLimits
}

export const DEFAULT_TIER_DEFINITIONS: TierDefinition[] = [
  {
    id: 'tier_1',
    displayName: 'Starter',
    stripeMetadataValue: 'tier_1',
    limits: { dailyAiGenerations: 5, dailyPosts: 1, monthlyPosts: 15, maxPlatforms: 2 },
  },
  {
    id: 'tier_2',
    displayName: 'Basic',
    stripeMetadataValue: 'tier_2',
    limits: { dailyAiGenerations: 10, dailyPosts: 2, monthlyPosts: 30, maxPlatforms: 3 },
  },
  {
    id: 'tier_3',
    displayName: 'Premium',
    stripeMetadataValue: 'tier_3',
    limits: { dailyAiGenerations: 100, dailyPosts: 10000, monthlyPosts: 999999, maxPlatforms: 10 },
  },
]

export interface NicheGuidanceEntry {
  key: string
  label: string
  guidance: string
}

export interface SocialModuleSettings {
  tier: SocialModuleTier
  tierLimits: Record<string, TierLimits>
  tierDefinitions?: TierDefinition[]
  platforms: Record<SocialPlatform, SocialAccountConfig>
  nicheGuidance?: NicheGuidanceEntry[]
  posting: {
    defaultBrandVoice: string
    requireApproval: boolean
  }
  monitoring: {
    trendCheckInterval: number
    mentionAlerts: boolean
    autoReply: boolean
  }
  statusChecker: {
    enabled: boolean
    alertOnRepeatedFailures: boolean
    failureThreshold: number
  }
  engagementPull?: {
    intervalHours: number
    lookbackHours: number
  }
}

export const defaultSocialModuleSettings: SocialModuleSettings = {
  tier: 'tier_1',
  tierDefinitions: DEFAULT_TIER_DEFINITIONS,
  tierLimits: {
    tier_1: { dailyAiGenerations: 5, dailyPosts: 1, monthlyPosts: 15, maxPlatforms: 2 },
    tier_2: { dailyAiGenerations: 10, dailyPosts: 2, monthlyPosts: 30, maxPlatforms: 3 },
    tier_3: { dailyAiGenerations: 100, dailyPosts: 10000, monthlyPosts: 999999, maxPlatforms: 10 },
  },
  platforms: {
    twitter: { enabled: false, apiKeyConfigured: false },
    linkedin: { enabled: false, apiKeyConfigured: false },
    instagram: { enabled: false, apiKeyConfigured: false },
    youtube: { enabled: false, apiKeyConfigured: false },
    facebook: { enabled: false, apiKeyConfigured: false },
    tiktok: { enabled: false, apiKeyConfigured: false },
    reddit: { enabled: false, apiKeyConfigured: false },
    pinterest: { enabled: false, apiKeyConfigured: false },
    snapchat: { enabled: false, apiKeyConfigured: false },
    discord: { enabled: false, apiKeyConfigured: false },
  },
  nicheGuidance: [
    { key: 'plumbing', label: 'Plumbing', guidance: 'Keep it casual and local. Talk like a neighbor who happens to fix pipes. Mention common household problems people relate to.' },
    { key: 'hvac', label: 'HVAC', guidance: 'Keep it casual and local. Talk like the trusted tech who keeps homes comfortable. Reference seasonal concerns.' },
    { key: 'electrical', label: 'Electrical', guidance: 'Keep it casual and local. Emphasize safety and reliability. Reference common home electrical concerns.' },
    { key: 'landscaping', label: 'Landscaping', guidance: 'Keep it visual and seasonal. Talk about curb appeal and outdoor living. Reference local weather and seasons.' },
    { key: 'cleaning', label: 'Cleaning', guidance: 'Keep it friendly and relatable. Talk about the relief of coming home to a clean space. Reference busy schedules.' },
    { key: 'real_estate', label: 'Real Estate', guidance: 'Be market-savvy but approachable. Share local insights and neighborhood knowledge. Reference market trends without jargon.' },
    { key: 'rideshare', label: 'Rideshare', guidance: 'Keep it real and relatable. Talk about the hustle, tips for riders, and city life. Be down-to-earth.' },
    { key: 'freelance', label: 'Freelance', guidance: 'Be authentic about the freelance life. Share lessons learned and wins. Connect with other independents.' },
    { key: 'photography', label: 'Photography', guidance: 'Be visual and passionate. Talk about capturing moments and telling stories. Share behind-the-scenes insights.' },
    { key: 'fitness', label: 'Fitness', guidance: 'Be motivating without being preachy. Share practical tips and real results. Keep it encouraging.' },
    { key: 'food', label: 'Food & Restaurant', guidance: 'Be warm and inviting. Talk about flavors, community, and the story behind the food. Make people hungry.' },
    { key: 'beauty', label: 'Beauty', guidance: 'Be confident and inclusive. Share tips, transformations, and self-care moments. Celebrate individuality.' },
    { key: 'tutoring', label: 'Tutoring', guidance: 'Be encouraging and knowledgeable. Share study tips, success stories, and learning moments. Keep it supportive.' },
    { key: 'pet_care', label: 'Pet Care', guidance: 'Be warm and playful. Talk about the bond between pets and their people. Share practical care tips.' },
  ],
  posting: {
    defaultBrandVoice: '',
    requireApproval: true,
  },
  monitoring: {
    trendCheckInterval: 24,
    mentionAlerts: false,
    autoReply: false,
  },
  statusChecker: {
    enabled: true,
    alertOnRepeatedFailures: true,
    failureThreshold: 3,
  },
  engagementPull: {
    intervalHours: 24,
    lookbackHours: 24,
  },
}
