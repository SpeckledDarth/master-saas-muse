import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { chatCompletion } from '@/lib/ai/provider'
import type { AISettings } from '@/types/settings'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()

    const { data: affiliates, error: affErr } = await admin
      .from('referral_links')
      .select('user_id, ref_code, clicks, signups, total_earnings_cents')
      .eq('is_affiliate', true)

    if (affErr) {
      console.error('Failed to fetch affiliates:', affErr)
      return NextResponse.json({ error: 'Failed to fetch affiliates' }, { status: 500 })
    }

    if (!affiliates || affiliates.length === 0) {
      return NextResponse.json({ processed: 0, message: 'No active affiliates found' })
    }

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

    if (!xaiKey && !openaiKey) {
      return NextResponse.json({ error: 'No AI provider configured' }, { status: 503 })
    }

    let processed = 0
    let errors = 0
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

    for (const aff of affiliates) {
      try {
        const [referralsRes, commissionsRes] = await Promise.all([
          admin
            .from('affiliate_referrals')
            .select('status, source_tag, created_at')
            .eq('affiliate_user_id', aff.user_id),
          admin
            .from('affiliate_commissions')
            .select('commission_amount_cents, status, created_at')
            .eq('affiliate_user_id', aff.user_id),
        ])

        const referrals = referralsRes.data || []
        const commissions = commissionsRes.data || []

        const totalClicks = aff.clicks || 0
        const totalSignups = aff.signups || 0
        const totalEarnings = aff.total_earnings_cents || 0
        const conversionRate = totalClicks > 0 ? Math.round((totalSignups / totalClicks) * 100) : 0

        const recentEarnings7d = commissions
          .filter((c: any) => new Date(c.created_at) >= new Date(sevenDaysAgo))
          .reduce((sum: number, c: any) => sum + (c.commission_amount_cents || 0), 0)

        const recentEarnings30d = commissions
          .filter((c: any) => new Date(c.created_at) >= new Date(thirtyDaysAgo))
          .reduce((sum: number, c: any) => sum + (c.commission_amount_cents || 0), 0)

        const recentSignups7d = referrals.filter((r: any) => new Date(r.created_at) >= new Date(sevenDaysAgo)).length

        const sourceMap: Record<string, number> = {}
        referrals.forEach((r: any) => {
          const src = r.source_tag || 'direct'
          sourceMap[src] = (sourceMap[src] || 0) + 1
        })
        const topSources = Object.entries(sourceMap)
          .map(([source, count]) => `${source} (${count})`)
          .sort()
          .slice(0, 5)
          .join(', ') || 'none'

        const statusMap: Record<string, number> = {}
        referrals.forEach((r: any) => {
          statusMap[r.status] = (statusMap[r.status] || 0) + 1
        })
        const statusBreakdown = Object.entries(statusMap)
          .map(([status, count]) => `${status}: ${count}`)
          .join(', ') || 'none'

        const dataSummary = `
Affiliate Performance:
- Clicks: ${totalClicks}, Signups: ${totalSignups}, Conversion: ${conversionRate}%
- Total earnings: $${(totalEarnings / 100).toFixed(2)}
- Last 7 days: $${(recentEarnings7d / 100).toFixed(2)} earned, ${recentSignups7d} new signups
- Last 30 days: $${(recentEarnings30d / 100).toFixed(2)} earned
- Sources: ${topSources}
- Referral status: ${statusBreakdown}
`.trim()

        const prompt = `You are an affiliate marketing coach. Analyze this affiliate's data and provide 3-5 specific, actionable tips for improving earnings this week.

${dataSummary}

Return a valid JSON array with objects: {"title": "short title", "description": "2-3 actionable sentences", "priority": "high|medium|low"}.
Do NOT use emoji. Return ONLY the JSON array.`

        const result = await chatCompletion(aiSettings, [
          { role: 'user', content: prompt }
        ])

        let tips: any[] = []
        try {
          const jsonMatch = result.content.trim().match(/\[[\s\S]*\]/)
          if (jsonMatch) {
            tips = JSON.parse(jsonMatch[0])
          }
        } catch {}

        if (!Array.isArray(tips) || tips.length === 0) {
          tips = [{ title: 'Keep promoting', description: 'Continue sharing your referral link regularly.', priority: 'medium' }]
        }

        await admin
          .from('activities')
          .insert({
            user_id: aff.user_id,
            performed_by: aff.user_id,
            activity_type: 'note',
            subject: 'Weekly AI Coaching Tips',
            body: JSON.stringify(tips.slice(0, 5)),
            related_entity_type: 'coaching',
            related_entity_id: null,
          })

        processed++
      } catch (err: any) {
        console.error(`Failed to generate coaching for affiliate ${aff.user_id}:`, err.message)
        errors++
      }
    }

    return NextResponse.json({
      processed,
      errors,
      total: affiliates.length,
      message: `Generated coaching tips for ${processed}/${affiliates.length} affiliates`,
    })
  } catch (error: any) {
    console.error('Weekly coach cron error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
