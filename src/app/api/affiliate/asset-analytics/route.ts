import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { searchParams } = new URL(request.url)
    const assetId = searchParams.get('asset_id')
    const scope = searchParams.get('scope') || 'personal'

    if (scope === 'conversions') {
      const { data: usageData, error: usageError } = await admin
        .from('affiliate_asset_usage')
        .select('asset_id, action, created_at')
        .eq('affiliate_id', user.id)

      if (usageError) {
        if (usageError.code === '42P01' || usageError.code === 'PGRST205') return NextResponse.json({ conversions: [] })
        return NextResponse.json({ error: usageError.message }, { status: 500 })
      }

      const { data: commissions, error: commError } = await admin
        .from('affiliate_commissions')
        .select('id, amount, created_at, status')
        .eq('affiliate_id', user.id)
        .order('created_at', { ascending: false })

      if (commError && commError.code !== '42P01' && commError.code !== 'PGRST205') {
        return NextResponse.json({ error: commError.message }, { status: 500 })
      }

      const assetUsageMap: Record<string, { asset_id: string; uses: number; first_used: string; last_used: string }> = {}
      for (const u of (usageData || [])) {
        if (!assetUsageMap[u.asset_id]) {
          assetUsageMap[u.asset_id] = { asset_id: u.asset_id, uses: 0, first_used: u.created_at, last_used: u.created_at }
        }
        assetUsageMap[u.asset_id].uses++
        if (u.created_at < assetUsageMap[u.asset_id].first_used) assetUsageMap[u.asset_id].first_used = u.created_at
        if (u.created_at > assetUsageMap[u.asset_id].last_used) assetUsageMap[u.asset_id].last_used = u.created_at
      }

      const commissionList = commissions || []
      const conversionData = Object.values(assetUsageMap).map(assetUsage => {
        const commissionsAfterUse = commissionList.filter(
          (c: any) => c.created_at >= assetUsage.first_used
        )
        return {
          asset_id: assetUsage.asset_id,
          total_uses: assetUsage.uses,
          first_used: assetUsage.first_used,
          last_used: assetUsage.last_used,
          conversions_after_use: commissionsAfterUse.length,
          revenue_after_use: commissionsAfterUse.reduce((sum: number, c: any) => sum + (parseFloat(c.amount) || 0), 0),
        }
      })

      conversionData.sort((a, b) => b.revenue_after_use - a.revenue_after_use)

      return NextResponse.json({ conversions: conversionData })
    }

    let usageQuery = admin
      .from('affiliate_asset_usage')
      .select('*')
      .order('created_at', { ascending: false })

    if (scope === 'personal') {
      usageQuery = usageQuery.eq('affiliate_id', user.id)
    }

    if (assetId) {
      usageQuery = usageQuery.eq('asset_id', assetId)
    }

    usageQuery = usageQuery.limit(100)

    const { data: usage, error } = await usageQuery

    if (error) {
      if (error.code === '42P01') return NextResponse.json({ usage: [], summary: {} })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const summary: Record<string, number> = {}
    for (const row of (usage || [])) {
      summary[row.action] = (summary[row.action] || 0) + 1
    }

    return NextResponse.json({ usage: usage || [], summary })
  } catch (err) {
    console.error('Asset analytics GET error:', err)
    return NextResponse.json({ error: 'Failed to load asset analytics' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { asset_id, action, metadata } = body

    if (!asset_id || !action) {
      return NextResponse.json({ error: 'asset_id and action are required' }, { status: 400 })
    }

    const validActions = ['download', 'copy', 'view', 'share']
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: `Invalid action. Must be one of: ${validActions.join(', ')}` }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('affiliate_asset_usage')
      .insert({
        asset_id,
        affiliate_id: user.id,
        action,
        metadata: metadata || {},
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ tracked: data })
  } catch (err) {
    console.error('Asset analytics POST error:', err)
    return NextResponse.json({ error: 'Failed to track asset usage' }, { status: 500 })
  }
}
