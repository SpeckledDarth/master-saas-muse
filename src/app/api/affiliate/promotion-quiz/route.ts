import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { chatCompletion } from '@/lib/ai/provider'
import type { AISettings } from '@/types/settings'

interface QuizAnswers {
  content_style: string
  audience_type: string
  platforms: string[]
  goals: string[]
  experience_level: string
  weekly_hours: string
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    const { data: profile } = await admin
      .from('affiliate_profiles')
      .select('quiz_results')
      .eq('user_id', user.id)
      .maybeSingle()

    return NextResponse.json({
      quiz_results: profile?.quiz_results || null,
      questions: getQuizQuestions(),
    })
  } catch (err: any) {
    console.error('Promotion quiz GET error:', err)
    return NextResponse.json({ error: 'Failed to load quiz data' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { answers } = body as { answers: QuizAnswers }

    if (!answers || !answers.content_style || !answers.audience_type || !answers.platforms?.length || !answers.goals?.length) {
      return NextResponse.json({ error: 'All quiz questions must be answered' }, { status: 400 })
    }

    const admin = createAdminClient()

    const [linkRes, commissionsRes, socialAccountsRes, calendarRes, swipeRes] = await Promise.all([
      admin
        .from('referral_links')
        .select('clicks, signups, total_earnings_cents')
        .eq('user_id', user.id)
        .eq('is_affiliate', true)
        .maybeSingle(),
      admin
        .from('affiliate_commissions')
        .select('commission_amount_cents, status, created_at')
        .eq('affiliate_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30),
      admin
        .from('social_accounts')
        .select('platform, username')
        .eq('user_id', user.id),
      admin
        .from('promotional_calendar')
        .select('title, campaign_type, start_date, end_date, content_suggestions')
        .eq('is_published', true)
        .gte('end_date', new Date().toISOString().split('T')[0])
        .order('start_date', { ascending: true })
        .limit(5),
      admin
        .from('affiliate_assets')
        .select('title, asset_type, category')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    const link = linkRes.data
    const commissions = commissionsRes.data || []
    const socialAccounts = socialAccountsRes.data || []
    const upcomingEvents = calendarRes.data || []
    const availableAssets = swipeRes.data || []

    const totalEarnings = link?.total_earnings_cents || 0
    const totalClicks = link?.clicks || 0
    const totalSignups = link?.signups || 0
    const conversionRate = totalClicks > 0 ? Math.round((totalSignups / totalClicks) * 100) : 0

    const recentEarnings = commissions
      .filter((c: any) => {
        const d = new Date(c.created_at)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        return d >= thirtyDaysAgo
      })
      .reduce((sum: number, c: any) => sum + (c.commission_amount_cents || 0), 0)

    const connectedPlatforms = socialAccounts.map((a: any) => a.platform).join(', ') || 'none'

    const topContentTypes = commissions.length > 0
      ? `${commissions.length} commissions in recent history`
      : 'No commission history yet'

    const calendarInfo = upcomingEvents.length > 0
      ? upcomingEvents.map((e: any) => `"${e.title}" (${e.campaign_type}, starts ${e.start_date})`).join('; ')
      : 'No upcoming promotional events'

    const assetInfo = availableAssets.length > 0
      ? availableAssets.map((a: any) => `${a.title} (${a.asset_type}/${a.category})`).join('; ')
      : 'No assets available'

    const playbook = await generatePlaybook(answers, {
      totalEarnings,
      totalClicks,
      totalSignups,
      conversionRate,
      recentEarnings,
      connectedPlatforms,
      topContentTypes,
      calendarInfo,
      assetInfo,
    })

    const quizResults = {
      answers,
      playbook,
      generated_at: new Date().toISOString(),
    }

    try {
      const { data: existing } = await admin
        .from('affiliate_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (existing) {
        await admin
          .from('affiliate_profiles')
          .update({ quiz_results: quizResults, updated_at: new Date().toISOString() })
          .eq('user_id', user.id)
      }
    } catch {}

    return NextResponse.json({
      playbook,
      answers,
      generated_at: quizResults.generated_at,
    })
  } catch (error: any) {
    console.error('Promotion quiz POST error:', error)

    if (error.message?.includes('not configured') || error.message?.includes('environment variable')) {
      return NextResponse.json(
        { error: 'AI provider is not configured. Please contact the admin to set up an AI API key.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate promotion playbook. Please try again.' },
      { status: 500 }
    )
  }
}

function getQuizQuestions() {
  return [
    {
      id: 'content_style',
      question: 'What best describes your content creation style?',
      type: 'single',
      options: [
        { value: 'educational', label: 'Educational — I teach and explain things' },
        { value: 'entertaining', label: 'Entertaining — I create fun, engaging content' },
        { value: 'personal', label: 'Personal stories — I share experiences and journeys' },
        { value: 'professional', label: 'Professional — I focus on industry insights and analysis' },
        { value: 'mixed', label: 'Mixed — I do a bit of everything' },
      ],
    },
    {
      id: 'audience_type',
      question: 'Who is your primary audience?',
      type: 'single',
      options: [
        { value: 'creators', label: 'Content creators and influencers' },
        { value: 'small_business', label: 'Small business owners' },
        { value: 'marketers', label: 'Marketing professionals' },
        { value: 'freelancers', label: 'Freelancers and solopreneurs' },
        { value: 'general', label: 'General audience / mixed' },
      ],
    },
    {
      id: 'platforms',
      question: 'Which platforms do you actively use? (Select all that apply)',
      type: 'multiple',
      options: [
        { value: 'twitter', label: 'X / Twitter' },
        { value: 'instagram', label: 'Instagram' },
        { value: 'youtube', label: 'YouTube' },
        { value: 'tiktok', label: 'TikTok' },
        { value: 'linkedin', label: 'LinkedIn' },
        { value: 'facebook', label: 'Facebook' },
        { value: 'blog', label: 'Blog / Newsletter' },
        { value: 'podcast', label: 'Podcast' },
      ],
    },
    {
      id: 'goals',
      question: 'What are your top promotion goals? (Select up to 3)',
      type: 'multiple',
      max_selections: 3,
      options: [
        { value: 'more_clicks', label: 'Get more clicks on my referral link' },
        { value: 'better_conversion', label: 'Improve my click-to-signup conversion rate' },
        { value: 'passive_income', label: 'Build consistent passive income' },
        { value: 'grow_audience', label: 'Grow my audience while promoting' },
        { value: 'content_ideas', label: 'Get fresh content ideas for promotion' },
        { value: 'scale_earnings', label: 'Scale my current earnings to the next level' },
      ],
    },
    {
      id: 'experience_level',
      question: 'How would you describe your affiliate marketing experience?',
      type: 'single',
      options: [
        { value: 'beginner', label: 'Beginner — just getting started' },
        { value: 'intermediate', label: 'Intermediate — some experience and earnings' },
        { value: 'advanced', label: 'Advanced — consistent earnings, looking to scale' },
      ],
    },
    {
      id: 'weekly_hours',
      question: 'How many hours per week can you dedicate to promotion?',
      type: 'single',
      options: [
        { value: '1-2', label: '1-2 hours' },
        { value: '3-5', label: '3-5 hours' },
        { value: '5-10', label: '5-10 hours' },
        { value: '10+', label: '10+ hours' },
      ],
    },
  ]
}

interface AffiliateContext {
  totalEarnings: number
  totalClicks: number
  totalSignups: number
  conversionRate: number
  recentEarnings: number
  connectedPlatforms: string
  topContentTypes: string
  calendarInfo: string
  assetInfo: string
}

async function generatePlaybook(
  answers: QuizAnswers,
  context: AffiliateContext
): Promise<{
  summary: string
  weeks: { week: number; theme: string; tasks: { day: string; action: string; platform: string; tip: string }[] }[]
  quick_wins: string[]
  content_templates: { title: string; template: string; platform: string }[]
}> {
  const aiSettings: AISettings = {
    provider: 'xai',
    model: 'grok-3-mini-fast',
    maxTokens: 4096,
    temperature: 0.7,
    systemPrompt: '',
  }

  const xaiKey = process.env.XAI_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY
  if (!xaiKey && openaiKey) {
    aiSettings.provider = 'openai'
    aiSettings.model = 'gpt-4o-mini'
  }

  const prompt = `You are an affiliate marketing strategist. Based on the quiz answers and real performance data below, create a personalized 30-day promotion playbook.

QUIZ ANSWERS:
- Content style: ${answers.content_style}
- Target audience: ${answers.audience_type}
- Active platforms: ${answers.platforms.join(', ')}
- Goals: ${answers.goals.join(', ')}
- Experience level: ${answers.experience_level}
- Available hours/week: ${answers.weekly_hours}

REAL PERFORMANCE DATA:
- Total clicks: ${context.totalClicks}
- Total signups: ${context.totalSignups}
- Conversion rate: ${context.conversionRate}%
- Lifetime earnings: $${(context.totalEarnings / 100).toFixed(2)}
- Last 30 days earnings: $${(context.recentEarnings / 100).toFixed(2)}
- Connected social platforms: ${context.connectedPlatforms}
- Commission history: ${context.topContentTypes}
- Upcoming promotional events: ${context.calendarInfo}
- Available swipe files/assets: ${context.assetInfo}

RULES:
- Create a 4-week plan with specific daily actions tailored to their platforms and goals
- Each week should have a theme and 3-5 daily tasks
- Include 3 quick wins they can do TODAY
- Include 3 ready-to-use content templates for their preferred platforms
- Reference available assets and upcoming events when relevant
- Tailor advice to their experience level
- Consider their time constraints (${answers.weekly_hours} hours/week)
- If conversion rate is low, focus on improving quality over quantity
- If clicks are low, focus on visibility and reach
- Do NOT use any emoji
- Be specific and actionable — no generic advice

Return ONLY valid JSON in this exact format:
{
  "summary": "A 2-3 sentence personalized strategy overview",
  "weeks": [
    {
      "week": 1,
      "theme": "Week theme name",
      "tasks": [
        {"day": "Monday", "action": "Specific action to take", "platform": "platform_name", "tip": "Pro tip for this action"}
      ]
    }
  ],
  "quick_wins": ["Quick win 1", "Quick win 2", "Quick win 3"],
  "content_templates": [
    {"title": "Template name", "template": "Ready-to-use content with {referral_link} placeholder", "platform": "platform_name"}
  ]
}

Return ONLY the JSON, no other text.`

  const result = await chatCompletion(aiSettings, [
    { role: 'user', content: prompt }
  ])

  try {
    const content = result.content.trim()
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        summary: String(parsed.summary || 'Your personalized 30-day promotion playbook is ready.'),
        weeks: Array.isArray(parsed.weeks) ? parsed.weeks.slice(0, 4).map((w: any, i: number) => ({
          week: w.week || i + 1,
          theme: String(w.theme || `Week ${i + 1}`),
          tasks: Array.isArray(w.tasks) ? w.tasks.slice(0, 5).map((t: any) => ({
            day: String(t.day || ''),
            action: String(t.action || ''),
            platform: String(t.platform || ''),
            tip: String(t.tip || ''),
          })) : [],
        })) : [],
        quick_wins: Array.isArray(parsed.quick_wins) ? parsed.quick_wins.slice(0, 5).map(String) : [],
        content_templates: Array.isArray(parsed.content_templates) ? parsed.content_templates.slice(0, 5).map((t: any) => ({
          title: String(t.title || ''),
          template: String(t.template || ''),
          platform: String(t.platform || ''),
        })) : [],
      }
    }
  } catch (parseErr) {
    console.error('Failed to parse AI playbook response:', parseErr)
  }

  return getFallbackPlaybook(answers)
}

function getFallbackPlaybook(answers: QuizAnswers) {
  const primaryPlatform = answers.platforms[0] || 'twitter'

  return {
    summary: `Based on your ${answers.content_style} content style and focus on ${answers.audience_type}, here is a structured 30-day plan to boost your affiliate earnings using ${answers.platforms.join(', ')}.`,
    weeks: [
      {
        week: 1,
        theme: 'Foundation and Quick Wins',
        tasks: [
          { day: 'Monday', action: 'Update your bio/profile to mention the product naturally', platform: primaryPlatform, tip: 'Frame it as a tool you use, not an ad' },
          { day: 'Wednesday', action: 'Share a genuine testimonial about using the product', platform: primaryPlatform, tip: 'Include a specific result or time saved' },
          { day: 'Friday', action: 'Create a comparison post showing before/after using the tool', platform: primaryPlatform, tip: 'Use real screenshots or data if possible' },
        ],
      },
      {
        week: 2,
        theme: 'Content Diversification',
        tasks: [
          { day: 'Monday', action: 'Create a tutorial or how-to post featuring the product', platform: primaryPlatform, tip: 'Solve a real problem your audience has' },
          { day: 'Wednesday', action: 'Share on a second platform to expand reach', platform: answers.platforms[1] || primaryPlatform, tip: 'Repurpose your best performing content' },
          { day: 'Friday', action: 'Engage with comments and questions about your posts', platform: primaryPlatform, tip: 'Personal replies convert better than broadcast messages' },
        ],
      },
      {
        week: 3,
        theme: 'Engagement and Community',
        tasks: [
          { day: 'Monday', action: 'Reply to relevant conversations with helpful advice mentioning the tool', platform: primaryPlatform, tip: 'Be helpful first, promotional second' },
          { day: 'Wednesday', action: 'Share a user success story or case study', platform: primaryPlatform, tip: 'Tag the user if appropriate for social proof' },
          { day: 'Friday', action: 'Create a thread or carousel breaking down a workflow using the product', platform: primaryPlatform, tip: 'Step-by-step content gets saved and shared more' },
        ],
      },
      {
        week: 4,
        theme: 'Scale and Optimize',
        tasks: [
          { day: 'Monday', action: 'Review your analytics and double down on what worked', platform: primaryPlatform, tip: 'Look at which posts drove the most clicks' },
          { day: 'Wednesday', action: 'Try a new content format (video, thread, story)', platform: primaryPlatform, tip: 'Different formats reach different audience segments' },
          { day: 'Friday', action: 'Plan next month based on this month\'s results', platform: primaryPlatform, tip: 'Set a specific earnings goal for next month' },
        ],
      },
    ],
    quick_wins: [
      'Add your referral link to your social media bio right now',
      'Send the product link to 3 people you know would benefit from it today',
      'Pin your best-performing promotional post to your profile',
    ],
    content_templates: [
      {
        title: 'Problem-Solution Post',
        template: `Struggling with [common problem]? I switched to [product] and it solved that completely.\n\nHere is what changed:\n- [Benefit 1]\n- [Benefit 2]\n- [Benefit 3]\n\nTry it yourself: {referral_link}`,
        platform: primaryPlatform,
      },
      {
        title: 'Behind-the-Scenes Post',
        template: `Here is my actual workflow using [product]:\n\n1. [Step 1]\n2. [Step 2]\n3. [Step 3]\n\nSaves me [time/effort] every week. Check it out: {referral_link}`,
        platform: primaryPlatform,
      },
      {
        title: 'Quick Tip Post',
        template: `Quick tip: Use [product feature] to [achieve result].\n\nMost people miss this but it makes a huge difference.\n\nLink in bio or here: {referral_link}`,
        platform: primaryPlatform,
      },
    ],
  }
}
