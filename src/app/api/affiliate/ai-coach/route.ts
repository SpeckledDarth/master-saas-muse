import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { chatCompletion } from '@/lib/ai/provider'
import type { AISettings } from '@/types/settings'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    const { data: link } = await admin
      .from('referral_links')
      .select('ref_code, is_affiliate, clicks, signups, total_earnings_cents')
      .eq('user_id', user.id)
      .eq('is_affiliate', true)
      .maybeSingle()

    if (!link) {
      return NextResponse.json({ error: 'No active affiliate link found' }, { status: 404 })
    }

    const performanceData = await gatherPerformanceData(admin, user.id, link)

    const tips = await generateCoachingTips(performanceData)

    return NextResponse.json({
      tips,
      generatedAt: new Date().toISOString(),
      performanceSummary: {
        totalClicks: performanceData.totalClicks,
        totalSignups: performanceData.totalSignups,
        totalEarnings: performanceData.totalEarnings,
        conversionRate: performanceData.conversionRate,
      },
    })
  } catch (error: any) {
    console.error('AI Coach error:', error)

    if (error.message?.includes('not configured') || error.message?.includes('environment variable')) {
      return NextResponse.json(
        { error: 'AI provider is not configured. Please contact the admin to set up an AI API key.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate coaching tips. Please try again.' },
      { status: 500 }
    )
  }
}

interface PerformanceData {
  totalClicks: number
  totalSignups: number
  totalEarnings: number
  conversionRate: number
  recentEarnings7d: number
  recentEarnings30d: number
  recentClicks7d: number
  recentSignups7d: number
  pendingEarnings: number
  approvedEarnings: number
  paidEarnings: number
  topSources: { source: string; count: number }[]
  recentReferralStatuses: { status: string; count: number }[]
  earningsTrend: string
  daysActive: number
}

async function gatherPerformanceData(admin: any, userId: string, link: any): Promise<PerformanceData> {
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [referralsRes, commissionsRes, recentCommissionsRes] = await Promise.all([
    admin
      .from('affiliate_referrals')
      .select('status, source_tag, created_at')
      .eq('affiliate_user_id', userId),
    admin
      .from('affiliate_commissions')
      .select('commission_amount_cents, status, created_at')
      .eq('affiliate_user_id', userId),
    admin
      .from('affiliate_commissions')
      .select('commission_amount_cents, created_at')
      .eq('affiliate_user_id', userId)
      .gte('created_at', thirtyDaysAgo),
  ])

  const referrals = referralsRes.data || []
  const commissions = commissionsRes.data || []
  const recentCommissions = recentCommissionsRes.data || []

  const totalClicks = link.clicks || 0
  const totalSignups = link.signups || 0
  const totalEarnings = link.total_earnings_cents || 0
  const conversionRate = totalClicks > 0 ? Math.round((totalSignups / totalClicks) * 100) : 0

  const recentEarnings7d = recentCommissions
    .filter((c: any) => new Date(c.created_at) >= new Date(sevenDaysAgo))
    .reduce((sum: number, c: any) => sum + (c.commission_amount_cents || 0), 0)

  const recentEarnings30d = recentCommissions
    .reduce((sum: number, c: any) => sum + (c.commission_amount_cents || 0), 0)

  const recentSignups7d = referrals.filter((r: any) => new Date(r.created_at) >= new Date(sevenDaysAgo)).length
  const recentClicks7d = 0

  const pendingEarnings = commissions
    .filter((c: any) => c.status === 'pending')
    .reduce((sum: number, c: any) => sum + (c.commission_amount_cents || 0), 0)
  const approvedEarnings = commissions
    .filter((c: any) => c.status === 'approved')
    .reduce((sum: number, c: any) => sum + (c.commission_amount_cents || 0), 0)
  const paidEarnings = commissions
    .filter((c: any) => c.status === 'paid')
    .reduce((sum: number, c: any) => sum + (c.commission_amount_cents || 0), 0)

  const sourceMap: Record<string, number> = {}
  referrals.forEach((r: any) => {
    const src = r.source_tag || 'direct'
    sourceMap[src] = (sourceMap[src] || 0) + 1
  })
  const topSources = Object.entries(sourceMap)
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const statusMap: Record<string, number> = {}
  referrals.forEach((r: any) => {
    statusMap[r.status] = (statusMap[r.status] || 0) + 1
  })
  const recentReferralStatuses = Object.entries(statusMap)
    .map(([status, count]) => ({ status, count }))

  const firstCommission = commissions.length > 0
    ? new Date(commissions[commissions.length - 1].created_at)
    : now
  const daysActive = Math.max(1, Math.ceil((now.getTime() - firstCommission.getTime()) / (1000 * 60 * 60 * 24)))

  const prevWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const prevWeekEnd = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const prevWeekEarnings = commissions
    .filter((c: any) => {
      const d = new Date(c.created_at)
      return d >= prevWeekStart && d < prevWeekEnd
    })
    .reduce((sum: number, c: any) => sum + (c.commission_amount_cents || 0), 0)

  let earningsTrend = 'stable'
  if (recentEarnings7d > prevWeekEarnings * 1.1) earningsTrend = 'growing'
  else if (recentEarnings7d < prevWeekEarnings * 0.9) earningsTrend = 'declining'

  return {
    totalClicks,
    totalSignups,
    totalEarnings,
    conversionRate,
    recentEarnings7d,
    recentEarnings30d,
    recentClicks7d,
    recentSignups7d,
    pendingEarnings,
    approvedEarnings,
    paidEarnings,
    topSources,
    recentReferralStatuses,
    earningsTrend,
    daysActive,
  }
}

async function generateCoachingTips(data: PerformanceData): Promise<{ title: string; description: string; priority: 'high' | 'medium' | 'low' }[]> {
  const aiSettings: AISettings = {
    provider: 'xai',
    model: 'grok-3-mini-fast',
    maxTokens: 1024,
    temperature: 0.7,
    systemPrompt: '',
  }

  const xaiKey = process.env.XAI_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY
  if (!xaiKey && openaiKey) {
    aiSettings.provider = 'openai'
    aiSettings.model = 'gpt-4o-mini'
  }

  const dataSummary = `
Affiliate Performance Summary:
- Total link clicks: ${data.totalClicks}
- Total signups from referrals: ${data.totalSignups}
- Click-to-signup conversion rate: ${data.conversionRate}%
- Total lifetime earnings: $${(data.totalEarnings / 100).toFixed(2)}
- Last 7 days earnings: $${(data.recentEarnings7d / 100).toFixed(2)}
- Last 30 days earnings: $${(data.recentEarnings30d / 100).toFixed(2)}
- Last 7 days new signups: ${data.recentSignups7d}
- Pending earnings (awaiting approval): $${(data.pendingEarnings / 100).toFixed(2)}
- Approved earnings (awaiting payout): $${(data.approvedEarnings / 100).toFixed(2)}
- Paid out total: $${(data.paidEarnings / 100).toFixed(2)}
- Days active as affiliate: ${data.daysActive}
- Earnings trend (vs prior week): ${data.earningsTrend}
- Top referral sources: ${data.topSources.map(s => `${s.source} (${s.count})`).join(', ') || 'none tracked'}
- Referral status breakdown: ${data.recentReferralStatuses.map(s => `${s.status}: ${s.count}`).join(', ') || 'none'}
`.trim()

  const prompt = `You are an affiliate marketing coach. Analyze this affiliate's performance data and provide 3-5 specific, actionable tips for improving their earnings this week.

${dataSummary}

Rules:
- Each tip must be specific and actionable based on the data
- Consider the affiliate's current performance level
- If their conversion rate is low, suggest ways to improve it
- If they have few clicks, suggest promotion strategies
- If earnings are declining, suggest re-engagement tactics
- If they're doing well, suggest scaling strategies
- Do NOT use any emoji
- Prioritize tips as "high", "medium", or "low" based on potential impact

Return your response as a valid JSON array with objects containing "title" (short, 5-10 words), "description" (2-3 actionable sentences), and "priority" ("high", "medium", or "low").

Example format:
[
  {"title": "Diversify your traffic sources", "description": "You are currently relying on a single traffic source. Try sharing your link on at least 2 new platforms this week. Consider LinkedIn, Twitter, or relevant forums.", "priority": "high"}
]

Return ONLY the JSON array, no other text.`

  const result = await chatCompletion(aiSettings, [
    { role: 'user', content: prompt }
  ])

  try {
    const content = result.content.trim()
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const tips = JSON.parse(jsonMatch[0])
      if (Array.isArray(tips)) {
        return tips.map((tip: any) => ({
          title: String(tip.title || 'Tip'),
          description: String(tip.description || ''),
          priority: ['high', 'medium', 'low'].includes(tip.priority) ? tip.priority : 'medium',
        })).slice(0, 5)
      }
    }
  } catch (parseErr) {
    console.error('Failed to parse AI coach response:', parseErr)
  }

  return [
    {
      title: 'Share your link more often',
      description: 'Consistency is key. Try sharing your referral link at least once per day across your active channels.',
      priority: 'high' as const,
    },
    {
      title: 'Engage with your audience',
      description: 'Respond to comments and questions about the product. Personal recommendations convert better than generic posts.',
      priority: 'medium' as const,
    },
    {
      title: 'Track your sources',
      description: 'Use source tags on your referral links to identify which channels drive the most conversions.',
      priority: 'medium' as const,
    },
  ]
}

export { gatherPerformanceData, generateCoachingTips }
