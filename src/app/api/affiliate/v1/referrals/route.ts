import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateApiKey } from '@/lib/affiliate/api-auth'

export async function GET(request: NextRequest) {
  const result = await validateApiKey(request)
  if (!result.success) return result.response

  const { auth, headers } = result

  try {
    const admin = createAdminClient()
    const { searchParams } = new URL(request.url)

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))
    const offset = (page - 1) * limit
    const status = searchParams.get('status')

    let query = admin
      .from('affiliate_referrals')
      .select('id, status, source_tag, created_at', { count: 'exact' })
      .eq('affiliate_user_id', auth.affiliateUserId)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: referrals, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ referrals: [], total: 0, page, limit }, { headers })
      }
      return NextResponse.json({ error: error.message }, { status: 500, headers })
    }

    return NextResponse.json({
      referrals: referrals || [],
      total: count || 0,
      page,
      limit,
      has_more: (count || 0) > offset + limit,
    }, { headers })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ referrals: [], total: 0, page: 1, limit: 50 }, { headers })
    }
    console.error('v1/referrals error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers })
  }
}
