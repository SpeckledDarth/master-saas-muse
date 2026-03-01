import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAuditEvent } from '@/lib/affiliate/audit'
import { createAssetUploadNotification } from '@/lib/affiliate/notifications'

export async function GET(request: NextRequest) {
  try {
    const admin = createAdminClient()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const assetType = searchParams.get('asset_type')
    const search = searchParams.get('search')

    let query = admin
      .from('affiliate_assets')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true })

    if (category) {
      query = query.eq('category', category)
    }
    if (assetType) {
      query = query.eq('asset_type', assetType)
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      if (error.code === '42P01') return NextResponse.json({ assets: [] })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    let assets = data || []

    let usageStats: Record<string, { downloads: number; copies: number; views: number; shares: number; total: number }> = {}
    try {
      const assetIds = assets.map((a: any) => a.id)
      if (assetIds.length > 0) {
        const { data: usageData } = await admin
          .from('affiliate_asset_usage')
          .select('asset_id, action')
          .in('asset_id', assetIds)

        if (usageData) {
          for (const row of usageData) {
            if (!usageStats[row.asset_id]) {
              usageStats[row.asset_id] = { downloads: 0, copies: 0, views: 0, shares: 0, total: 0 }
            }
            const stat = usageStats[row.asset_id]
            if (row.action === 'download') stat.downloads++
            else if (row.action === 'copy') stat.copies++
            else if (row.action === 'view') stat.views++
            else if (row.action === 'share') stat.shares++
            stat.total++
          }
        }
      }
    } catch {}

    const topPerformerThreshold = 10
    const allTotals = Object.values(usageStats).map(s => s.total)
    const maxUsage = allTotals.length > 0 ? Math.max(...allTotals) : 0

    assets = assets.map((asset: any) => {
      const stats = usageStats[asset.id] || { downloads: 0, copies: 0, views: 0, shares: 0, total: 0 }
      const isTopPerformer = stats.total >= topPerformerThreshold && maxUsage > 0 && stats.total >= maxUsage * 0.7
      return {
        ...asset,
        usage_stats: stats,
        is_top_performer: isTopPerformer,
      }
    })

    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: link } = await admin
          .from('referral_links')
          .select('ref_code')
          .eq('user_id', user.id)
          .maybeSingle()

        if (link?.ref_code) {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://master-saas-muse-u7ga.vercel.app'
          const shareUrl = `${baseUrl}?ref=${link.ref_code}`
          assets = assets.map((asset: any) => {
            if (asset.content && typeof asset.content === 'string') {
              let content = asset.content
              content = content.replace(/\{\{REF_CODE\}\}/gi, link.ref_code)
              content = content.replace(/\{\{REF_LINK\}\}/gi, shareUrl)
              content = content.replace(/\{\{REFERRAL_CODE\}\}/gi, link.ref_code)
              content = content.replace(/\{\{REFERRAL_LINK\}\}/gi, shareUrl)
              content = content.replace(/\{\{AFFILIATE_CODE\}\}/gi, link.ref_code)
              content = content.replace(/\{\{AFFILIATE_LINK\}\}/gi, shareUrl)
              return { ...asset, content }
            }
            return asset
          })
        }
      }
    } catch {}

    const categories = [...new Set(assets.map((a: any) => a.category).filter(Boolean))]
    const assetTypes = [...new Set(assets.map((a: any) => a.asset_type).filter(Boolean))]

    return NextResponse.json({ assets, categories, asset_types: assetTypes })
  } catch (err) {
    console.error('Affiliate assets GET error:', err)
    return NextResponse.json({ error: 'Failed to load assets' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: userRole } = await admin.from('user_roles').select('role').eq('user_id', user.id).maybeSingle()
    if (userRole?.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await request.json()
    const { title, description, asset_type, content, file_url, file_name, file_size, file_type, sort_order, category } = body

    if (!title || !asset_type) {
      return NextResponse.json({ error: 'Title and asset type required' }, { status: 400 })
    }

    const insertData: any = { title, description, asset_type, content, file_url, file_name, sort_order: sort_order || 0 }
    if (category) insertData.category = category
    if (file_size) insertData.file_size = file_size
    if (file_type) insertData.file_type = file_type

    const { data, error } = await admin
      .from('affiliate_assets')
      .insert(insertData)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    logAuditEvent({ admin_user_id: user.id, admin_email: user.email!, action: 'create', entity_type: 'asset', entity_id: data.id, entity_name: title, details: { asset_type, description, file_url, file_name, category } })

    createAssetUploadNotification(title, asset_type, {
      description: description || null,
      category: body.category || null,
      file_url: file_url || null,
      file_name: file_name || null,
    }).catch(() => {})

    return NextResponse.json({ asset: data })
  } catch (err) {
    console.error('Affiliate assets POST error:', err)
    return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: userRole } = await admin.from('user_roles').select('role').eq('user_id', user.id).maybeSingle()
    if (userRole?.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await request.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'Asset ID required' }, { status: 400 })

    updates.updated_at = new Date().toISOString()

    const { error } = await admin.from('affiliate_assets').update(updates).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    logAuditEvent({ admin_user_id: user.id, admin_email: user.email!, action: 'update', entity_type: 'asset', entity_id: id, details: updates })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Affiliate assets PUT error:', err)
    return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: userRole } = await admin.from('user_roles').select('role').eq('user_id', user.id).maybeSingle()
    if (userRole?.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Asset ID required' }, { status: 400 })

    const { error } = await admin.from('affiliate_assets').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    logAuditEvent({ admin_user_id: user.id, admin_email: user.email!, action: 'delete', entity_type: 'asset', entity_id: id })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Affiliate assets DELETE error:', err)
    return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 })
  }
}
