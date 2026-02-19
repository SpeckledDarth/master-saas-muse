const now = Date.now()
const DAY = 86400000
const HOUR = 3600000

export interface DemoPost {
  id: string
  user_id: string
  platform: string
  content: string
  media_urls: string[]
  status: 'draft' | 'scheduled' | 'posted' | 'failed'
  scheduled_at: string | null
  posted_at: string | null
  platform_post_id: string | null
  error_message: string | null
  ai_generated: boolean
  created_at: string
  engagement_likes?: number
  engagement_shares?: number
  engagement_comments?: number
  engagement_clicks?: number
}

function d(offset: number): string {
  return new Date(now - offset).toISOString()
}

function future(offset: number): string {
  return new Date(now + offset).toISOString()
}

export const DEMO_POSTS: DemoPost[] = [
  {
    id: 'demo-01', user_id: 'demo', platform: 'facebook',
    content: 'Spring is here! Time to check your HVAC filters and schedule that annual tune-up before the summer heat hits. Book your appointment today and save 15% on seasonal maintenance.',
    media_urls: [], status: 'posted', scheduled_at: null, posted_at: d(2 * HOUR),
    platform_post_id: 'fb_001', error_message: null, ai_generated: false, created_at: d(1 * DAY),
    engagement_likes: 47, engagement_shares: 12, engagement_comments: 8, engagement_clicks: 134,
  },
  {
    id: 'demo-02', user_id: 'demo', platform: 'twitter',
    content: 'Pro tip: Clean your dryer vents at least once a year to prevent fires and improve efficiency. A clogged vent can increase drying time by 3x! #HomeSafety #ProTip',
    media_urls: [], status: 'posted', scheduled_at: null, posted_at: d(4 * HOUR),
    platform_post_id: 'tw_002', error_message: null, ai_generated: true, created_at: d(1 * DAY + 2 * HOUR),
    engagement_likes: 89, engagement_shares: 34, engagement_comments: 15, engagement_clicks: 267,
  },
  {
    id: 'demo-03', user_id: 'demo', platform: 'linkedin',
    content: 'We\'re proud to announce our expansion into residential solar panel installation. Green energy for a better tomorrow. Our certified technicians are now offering free energy audits for homeowners in the tri-state area.',
    media_urls: [], status: 'posted', scheduled_at: null, posted_at: d(1 * DAY),
    platform_post_id: 'li_003', error_message: null, ai_generated: false, created_at: d(2 * DAY),
    engagement_likes: 156, engagement_shares: 42, engagement_comments: 23, engagement_clicks: 389,
  },
  {
    id: 'demo-04', user_id: 'demo', platform: 'facebook',
    content: 'Customer spotlight: The Johnson family saved 30% on their energy bill after our insulation upgrade. "We couldn\'t believe the difference it made!" Read their full story on our blog.',
    media_urls: [], status: 'posted', scheduled_at: null, posted_at: d(2 * DAY),
    platform_post_id: 'fb_004', error_message: null, ai_generated: true, created_at: d(3 * DAY),
    engagement_likes: 73, engagement_shares: 19, engagement_comments: 11, engagement_clicks: 201,
  },
  {
    id: 'demo-05', user_id: 'demo', platform: 'twitter',
    content: 'Did you know? A programmable thermostat can save you up to $180/year on heating and cooling costs. Ask us about smart home upgrades! #EnergyEfficiency #SmartHome',
    media_urls: [], status: 'posted', scheduled_at: null, posted_at: d(3 * DAY),
    platform_post_id: 'tw_005', error_message: null, ai_generated: true, created_at: d(4 * DAY),
    engagement_likes: 112, engagement_shares: 28, engagement_comments: 7, engagement_clicks: 156,
  },
  {
    id: 'demo-06', user_id: 'demo', platform: 'linkedin',
    content: 'Hiring alert: We\'re looking for experienced HVAC technicians to join our growing team. Competitive pay, benefits, and training provided. DM us or visit our careers page to apply.',
    media_urls: [], status: 'posted', scheduled_at: null, posted_at: d(4 * DAY),
    platform_post_id: 'li_006', error_message: null, ai_generated: false, created_at: d(5 * DAY),
    engagement_likes: 201, engagement_shares: 67, engagement_comments: 31, engagement_clicks: 445,
  },
  {
    id: 'demo-07', user_id: 'demo', platform: 'facebook',
    content: 'Weekend project idea: Check your home\'s weather stripping around doors and windows. Worn seals can let in drafts and raise your energy bill by up to 20%. Easy DIY fix!',
    media_urls: [], status: 'posted', scheduled_at: null, posted_at: d(5 * DAY),
    platform_post_id: 'fb_007', error_message: null, ai_generated: false, created_at: d(6 * DAY),
    engagement_likes: 34, engagement_shares: 8, engagement_comments: 5, engagement_clicks: 89,
  },
  {
    id: 'demo-08', user_id: 'demo', platform: 'twitter',
    content: 'Exciting news! We just completed our 500th solar installation. Thank you to all our customers for trusting us with their energy future. Here\'s to the next 500!',
    media_urls: [], status: 'posted', scheduled_at: null, posted_at: d(7 * DAY),
    platform_post_id: 'tw_008', error_message: null, ai_generated: false, created_at: d(8 * DAY),
    engagement_likes: 234, engagement_shares: 56, engagement_comments: 42, engagement_clicks: 512,
  },
  {
    id: 'demo-09', user_id: 'demo', platform: 'facebook',
    content: 'Before and after: Check out this amazing bathroom renovation we completed last week. From outdated to outstanding in just 5 days. Contact us for your free estimate!',
    media_urls: [], status: 'posted', scheduled_at: null, posted_at: d(10 * DAY),
    platform_post_id: 'fb_009', error_message: null, ai_generated: false, created_at: d(11 * DAY),
    engagement_likes: 189, engagement_shares: 45, engagement_comments: 28, engagement_clicks: 367,
  },
  {
    id: 'demo-10', user_id: 'demo', platform: 'linkedin',
    content: 'Industry insight: The home services market is projected to grow 18% this year. We\'re investing in training and technology to stay ahead. Here\'s our strategy for sustainable growth.',
    media_urls: [], status: 'posted', scheduled_at: null, posted_at: d(12 * DAY),
    platform_post_id: 'li_010', error_message: null, ai_generated: true, created_at: d(13 * DAY),
    engagement_likes: 98, engagement_shares: 23, engagement_comments: 14, engagement_clicks: 178,
  },
  {
    id: 'demo-11', user_id: 'demo', platform: 'twitter',
    content: 'Summer prep checklist: 1) Service your AC unit 2) Clean gutters 3) Inspect roof shingles 4) Test sump pump 5) Seal deck/patio. Need help? We\'ve got you covered!',
    media_urls: [], status: 'posted', scheduled_at: null, posted_at: d(14 * DAY),
    platform_post_id: 'tw_011', error_message: null, ai_generated: true, created_at: d(15 * DAY),
    engagement_likes: 67, engagement_shares: 31, engagement_comments: 9, engagement_clicks: 145,
  },
  {
    id: 'demo-12', user_id: 'demo', platform: 'facebook',
    content: 'Meet our team! This week we\'re spotlighting Maria, our lead electrician with 12 years of experience. She specializes in smart home wiring and EV charger installations.',
    media_urls: [], status: 'posted', scheduled_at: null, posted_at: d(16 * DAY),
    platform_post_id: 'fb_012', error_message: null, ai_generated: false, created_at: d(17 * DAY),
    engagement_likes: 124, engagement_shares: 18, engagement_comments: 22, engagement_clicks: 203,
  },
  {
    id: 'demo-13', user_id: 'demo', platform: 'linkedin',
    content: 'We\'re thrilled to be named "Best Home Services Company" by the Local Business Awards for the third year running. Thank you to our incredible team and loyal customers.',
    media_urls: [], status: 'posted', scheduled_at: null, posted_at: d(20 * DAY),
    platform_post_id: 'li_013', error_message: null, ai_generated: false, created_at: d(21 * DAY),
    engagement_likes: 312, engagement_shares: 89, engagement_comments: 47, engagement_clicks: 678,
  },
  {
    id: 'demo-14', user_id: 'demo', platform: 'twitter',
    content: 'Quick reminder: Carbon monoxide detectors should be replaced every 5-7 years. Check the date on yours today. Your family\'s safety is worth it. #SafetyFirst',
    media_urls: [], status: 'posted', scheduled_at: null, posted_at: d(22 * DAY),
    platform_post_id: 'tw_014', error_message: null, ai_generated: true, created_at: d(23 * DAY),
    engagement_likes: 78, engagement_shares: 41, engagement_comments: 6, engagement_clicks: 112,
  },
  {
    id: 'demo-15', user_id: 'demo', platform: 'facebook',
    content: 'New service alert: We now offer whole-home water filtration systems. Enjoy cleaner, better-tasting water from every tap. Schedule your free water quality test today!',
    media_urls: [], status: 'posted', scheduled_at: null, posted_at: d(25 * DAY),
    platform_post_id: 'fb_015', error_message: null, ai_generated: false, created_at: d(26 * DAY),
    engagement_likes: 56, engagement_shares: 14, engagement_comments: 19, engagement_clicks: 234,
  },
  {
    id: 'demo-16', user_id: 'demo', platform: 'twitter',
    content: 'Happy to partner with @LocalFoodBank for their annual drive! We\'re donating $1 for every service call booked this month. Let\'s make a difference together!',
    media_urls: [], status: 'posted', scheduled_at: null, posted_at: d(28 * DAY),
    platform_post_id: 'tw_016', error_message: null, ai_generated: false, created_at: d(29 * DAY),
    engagement_likes: 167, engagement_shares: 53, engagement_comments: 25, engagement_clicks: 289,
  },
  {
    id: 'demo-17', user_id: 'demo', platform: 'facebook',
    content: '5-star review from Tom H.: "Acme Home Services replaced our ancient furnace in one day. The team was professional, clean, and explained everything. Highly recommend!" Thank you, Tom!',
    media_urls: [], status: 'posted', scheduled_at: null, posted_at: d(30 * DAY),
    platform_post_id: 'fb_017', error_message: null, ai_generated: false, created_at: d(31 * DAY),
    engagement_likes: 93, engagement_shares: 11, engagement_comments: 16, engagement_clicks: 178,
  },
  {
    id: 'demo-18', user_id: 'demo', platform: 'linkedin',
    content: 'Case study: How we helped a 50-unit apartment complex reduce energy costs by 35% with a comprehensive HVAC upgrade. ROI achieved in under 18 months.',
    media_urls: [], status: 'posted', scheduled_at: null, posted_at: d(35 * DAY),
    platform_post_id: 'li_018', error_message: null, ai_generated: true, created_at: d(36 * DAY),
    engagement_likes: 187, engagement_shares: 64, engagement_comments: 29, engagement_clicks: 423,
  },
  {
    id: 'demo-19', user_id: 'demo', platform: 'twitter',
    content: 'Storm damage? We offer 24/7 emergency repairs. Roof leaks, fallen trees, flooding \u2014 our team is ready to help. Call us anytime. #EmergencyRepairs #StormDamage',
    media_urls: [], status: 'scheduled', scheduled_at: future(1 * DAY), posted_at: null,
    platform_post_id: null, error_message: null, ai_generated: true, created_at: d(1 * HOUR),
    engagement_likes: 0, engagement_shares: 0, engagement_comments: 0, engagement_clicks: 0,
  },
  {
    id: 'demo-20', user_id: 'demo', platform: 'facebook',
    content: 'This week only: Free AC diagnostic with any service call. Don\'t wait until the heat wave hits \u2014 make sure your system is running at peak performance. Book now!',
    media_urls: [], status: 'scheduled', scheduled_at: future(2 * DAY), posted_at: null,
    platform_post_id: null, error_message: null, ai_generated: false, created_at: d(2 * HOUR),
    engagement_likes: 0, engagement_shares: 0, engagement_comments: 0, engagement_clicks: 0,
  },
  {
    id: 'demo-21', user_id: 'demo', platform: 'linkedin',
    content: 'Thought leadership: 5 trends shaping the future of home services in 2026. From AI-powered diagnostics to sustainable materials, here\'s what every homeowner should know.',
    media_urls: [], status: 'scheduled', scheduled_at: future(3 * DAY), posted_at: null,
    platform_post_id: null, error_message: null, ai_generated: true, created_at: d(3 * HOUR),
    engagement_likes: 0, engagement_shares: 0, engagement_comments: 0, engagement_clicks: 0,
  },
  {
    id: 'demo-22', user_id: 'demo', platform: 'twitter',
    content: 'Energy saving tip of the week: Use ceiling fans counter-clockwise in summer to create a cooling breeze. Clockwise in winter to push warm air down. Simple! #EnergySaving',
    media_urls: [], status: 'scheduled', scheduled_at: future(4 * DAY), posted_at: null,
    platform_post_id: null, error_message: null, ai_generated: true, created_at: d(4 * HOUR),
    engagement_likes: 0, engagement_shares: 0, engagement_comments: 0, engagement_clicks: 0,
  },
  {
    id: 'demo-23', user_id: 'demo', platform: 'facebook',
    content: 'Behind the scenes: Our warehouse team preparing for tomorrow\'s big commercial HVAC installation. 3 rooftop units, 12 zones, one amazing team making it happen.',
    media_urls: [], status: 'scheduled', scheduled_at: future(5 * DAY), posted_at: null,
    platform_post_id: null, error_message: null, ai_generated: false, created_at: d(5 * HOUR),
    engagement_likes: 0, engagement_shares: 0, engagement_comments: 0, engagement_clicks: 0,
  },
  {
    id: 'demo-24', user_id: 'demo', platform: 'linkedin',
    content: 'Investing in our people: We just enrolled 8 technicians in advanced heat pump certification. As the industry evolves, we make sure our team stays at the cutting edge.',
    media_urls: [], status: 'scheduled', scheduled_at: future(7 * DAY), posted_at: null,
    platform_post_id: null, error_message: null, ai_generated: false, created_at: d(6 * HOUR),
    engagement_likes: 0, engagement_shares: 0, engagement_comments: 0, engagement_clicks: 0,
  },
  {
    id: 'demo-25', user_id: 'demo', platform: 'twitter',
    content: 'Fun fact Friday: The average home has about 2 miles of electrical wiring. That\'s a lot of potential for things to go wrong! Schedule an electrical inspection today.',
    media_urls: [], status: 'draft', scheduled_at: null, posted_at: null,
    platform_post_id: null, error_message: null, ai_generated: true, created_at: d(30 * 60000),
    engagement_likes: 0, engagement_shares: 0, engagement_comments: 0, engagement_clicks: 0,
  },
  {
    id: 'demo-26', user_id: 'demo', platform: 'facebook',
    content: 'Looking for weekend warriors! Join our referral program and earn $50 for every friend who books a service. There\'s no limit to how many people you can refer.',
    media_urls: [], status: 'draft', scheduled_at: null, posted_at: null,
    platform_post_id: null, error_message: null, ai_generated: false, created_at: d(45 * 60000),
    engagement_likes: 0, engagement_shares: 0, engagement_comments: 0, engagement_clicks: 0,
  },
  {
    id: 'demo-27', user_id: 'demo', platform: 'linkedin',
    content: 'Q1 results: Revenue up 22%, customer satisfaction at 4.8/5, and zero safety incidents. Proud of what our team has accomplished this quarter.',
    media_urls: [], status: 'draft', scheduled_at: null, posted_at: null,
    platform_post_id: null, error_message: null, ai_generated: false, created_at: d(60 * 60000),
    engagement_likes: 0, engagement_shares: 0, engagement_comments: 0, engagement_clicks: 0,
  },
  {
    id: 'demo-28', user_id: 'demo', platform: 'facebook',
    content: 'Thinking about a kitchen remodel? Here are the top 5 ROI-boosting upgrades: 1) Quartz countertops 2) Soft-close cabinets 3) Under-cabinet lighting 4) Tile backsplash 5) Energy-efficient appliances',
    media_urls: [], status: 'draft', scheduled_at: null, posted_at: null,
    platform_post_id: null, error_message: null, ai_generated: true, created_at: d(90 * 60000),
    engagement_likes: 0, engagement_shares: 0, engagement_comments: 0, engagement_clicks: 0,
  },
  {
    id: 'demo-29', user_id: 'demo', platform: 'twitter',
    content: 'Radon is the #1 cause of lung cancer in non-smokers. Most homes have never been tested. We offer affordable radon testing \u2014 peace of mind for your family.',
    media_urls: [], status: 'failed', scheduled_at: d(3 * DAY), posted_at: null,
    platform_post_id: null, error_message: 'Twitter API rate limit exceeded. Will retry automatically.', ai_generated: true, created_at: d(4 * DAY),
    engagement_likes: 0, engagement_shares: 0, engagement_comments: 0, engagement_clicks: 0,
  },
]
