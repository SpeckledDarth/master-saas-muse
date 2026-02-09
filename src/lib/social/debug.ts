import type { SocialPlatform, SocialPost } from './client'

export function isDebugMode(): boolean {
  return process.env.SOCIO_DEBUG_MODE === 'true'
}

export interface MockTrend {
  trend_text: string
  platform: SocialPlatform
  engagement_score: number
  discovered_at: string
}

export interface MockAlert {
  user_email: string
  trend_text: string
  platform: SocialPlatform
  suggested_content: string
  post_id: string
}

const NICHE_TRENDS: Record<string, string[]> = {
  plumbing: [
    'Tankless water heater installations are surging this winter',
    'DIY drain cleaning mistakes homeowners keep making',
    'Smart leak detectors are changing the game for property managers',
    'Emergency plumbing calls spike after freeze warnings',
  ],
  'real estate': [
    'First-time buyer programs see record applications in Q1',
    'Staging tips that actually move listings faster',
    'Interest rate changes are shifting buyer behavior this month',
    'Virtual tours now expected as standard for new listings',
    'Local zoning updates could affect your next flip',
  ],
  rideshare: [
    'Peak hour strategies that maximize driver earnings',
    'Rider tipping trends shift after app update',
    'Airport pickup regulations changing in major metros',
    'EV drivers report lower operating costs per mile',
  ],
  freelance: [
    'Upwork algorithm changes affecting proposal visibility',
    'Retainer contracts gaining popularity over hourly billing',
    'AI-assisted proposals are getting mixed reception from clients',
    'Niche specialization outperforms generalist profiles this quarter',
    'Cold outreach on LinkedIn converting better than job boards',
  ],
}

const DEFAULT_TRENDS: string[] = [
  'Small business owners are automating social media posting',
  'Consistent posting schedules outperform sporadic viral attempts',
  'Short-form video content driving engagement for service businesses',
  'Local hashtag strategies outperforming broad tags for SMBs',
]

export function getMockTrends(niche: string, platform: string): MockTrend[] {
  const normalizedNiche = niche.toLowerCase().trim()
  const trends = NICHE_TRENDS[normalizedNiche] || DEFAULT_TRENDS
  const validPlatform = (['twitter', 'linkedin', 'facebook'] as SocialPlatform[]).includes(platform as SocialPlatform)
    ? (platform as SocialPlatform)
    : 'twitter'

  const now = Date.now()
  return trends.map((text, i) => ({
    trend_text: text,
    platform: validPlatform,
    engagement_score: Math.round(72 + (i * 6.3)),
    discovered_at: new Date(now - i * 3600000).toISOString(),
  }))
}

export function getMockAlert(userId: string, platform: string): MockAlert {
  const validPlatform = (['twitter', 'linkedin', 'facebook'] as SocialPlatform[]).includes(platform as SocialPlatform)
    ? (platform as SocialPlatform)
    : 'twitter'

  return {
    user_email: `user-${userId.slice(0, 8)}@example.com`,
    trend_text: 'Tankless water heater installations are surging this winter',
    platform: validPlatform,
    suggested_content: `As a local service pro, here is what I am seeing on the ground: tankless water heater demand is way up. If you are considering one, get quotes now before the spring rush. Happy to answer questions.`,
    post_id: `debug-post-${Date.now()}`,
  }
}

export function getMockEngagementData(): SocialPost[] {
  const now = Date.now()
  const DAY_MS = 86400000
  const platforms: SocialPlatform[] = ['twitter', 'linkedin', 'facebook']
  const statuses: SocialPost['status'][] = ['posted', 'posted', 'posted', 'scheduled', 'draft']

  const contentTemplates = [
    'Quick tip for homeowners: check your water pressure gauge monthly to catch issues early.',
    'Just wrapped up a kitchen remodel plumbing job. Clean copper lines make all the difference.',
    'New listing alert: 3BR/2BA in Maplewood. Updated kitchen and fresh paint throughout.',
    'Open house this Saturday from 10am to 2pm. Stop by and see the renovated master suite.',
    'Drove 847 miles this week. Best earnings came from the airport route on Thursday evening.',
    'Rider feedback matters. Keeping the car clean and offering phone chargers boosts your rating.',
    'Finished a branding project for a local bakery. Clean design helps small businesses stand out.',
    'Freelancers: track every expense. Tax season is easier when you stay organized year-round.',
    'Water heater maintenance saves money long term. Flush your tank once a year at minimum.',
    'Market update: inventory is tight in the downtown core. Buyers should act fast on new listings.',
    'Pro tip for new drivers: learn the surge patterns in your city. Consistency beats chasing hotspots.',
    'Completed a logo and website package this week. Referrals from happy clients are the best leads.',
    'Sump pump season is here. Test yours before the spring thaw to avoid basement flooding.',
    'Sold above asking price in 6 days. Proper staging and photography make a real difference.',
    'Weekend earnings report: Friday night and Sunday morning are the most profitable shifts.',
    'Client communication is everything. A simple weekly update email keeps projects on track.',
    'Backflow preventer inspections are required annually. Schedule yours before the deadline.',
    'Just closed on a duplex investment property. Cash flow positive from month one.',
    'Gas prices up this month but ride volume is steady. Adjusting routes to stay efficient.',
    'Proposal tip: lead with results, not credentials. Clients want to know what you will deliver.',
    'Pipe insulation is cheap insurance against frozen lines. Ten minutes of work saves thousands.',
    'Hosted a first-time homebuyer seminar last night. Great turnout and solid questions from attendees.',
    'Dashboard camera is a smart investment for any rideshare driver. Safety and documentation in one.',
    'Raised my rates this quarter. Lost two clients but gained three better ones. Know your worth.',
    'Garbage disposal replacement is one of the fastest ROI upgrades for a rental property.',
  ]

  return contentTemplates.map((content, i) => {
    const platform = platforms[i % platforms.length]
    const status = statuses[i % statuses.length]
    const daysAgo = Math.floor((i / contentTemplates.length) * 90)
    const createdAt = new Date(now - daysAgo * DAY_MS).toISOString()
    const isPosted = status === 'posted'

    return {
      id: `debug-${(1000 + i).toString(36)}-${i}`,
      user_id: 'debug-user',
      platform,
      content,
      media_urls: [],
      status,
      scheduled_at: status === 'scheduled' ? new Date(now + (i + 1) * DAY_MS).toISOString() : null,
      posted_at: isPosted ? new Date(now - daysAgo * DAY_MS + 3600000).toISOString() : null,
      platform_post_id: isPosted ? `${platform}-${Date.now()}-${i}` : null,
      engagement_data: isPosted
        ? {
            likes: Math.floor(12 + Math.random() * 180),
            shares: Math.floor(2 + Math.random() * 45),
            comments: Math.floor(1 + Math.random() * 30),
            impressions: Math.floor(200 + Math.random() * 4800),
          }
        : {},
      error_message: null,
      ai_generated: i % 4 === 0,
      brand_voice: null,
      trend_source: i % 5 === 0 ? 'debug-trend-monitor' : null,
      niche_triggered: i % 5 === 0 ? 'plumbing' : null,
      created_at: createdAt,
    }
  })
}
