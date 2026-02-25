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

    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200)
    const includeItems = searchParams.get('includeItems') === 'true'
    const format = searchParams.get('format')

    let query = admin
      .from('affiliate_payouts')
      .select('*', { count: 'exact' })
      .eq('affiliate_user_id', user.id)
      .order('created_at', { ascending: false })

    if (startDate) {
      query = query.gte('created_at', new Date(startDate).toISOString())
    }
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      query = query.lte('created_at', end.toISOString())
    }
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: payouts, error: payoutsErr, count } = await query

    if (payoutsErr) {
      if (payoutsErr.code === '42P01') {
        return NextResponse.json({
          payouts: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
          summary: { totalPaid: 0, totalPending: 0, totalCount: 0 },
        })
      }
      return NextResponse.json({ error: payoutsErr.message }, { status: 500 })
    }

    const payoutList = payouts || []

    let payoutsWithItems = payoutList
    if (includeItems && payoutList.length > 0) {
      const payoutIds = payoutList.map((p: any) => p.id)

      try {
        const { data: items } = await admin
          .from('affiliate_payout_items')
          .select('*')
          .in('payout_id', payoutIds)

        if (items && items.length > 0) {
          const itemsByPayout: Record<string, any[]> = {}
          for (const item of items) {
            if (!itemsByPayout[item.payout_id]) itemsByPayout[item.payout_id] = []
            itemsByPayout[item.payout_id].push(item)
          }

          const commissionIds = items
            .map((i: any) => i.commission_id)
            .filter(Boolean)

          let commissionDetails: Record<string, any> = {}
          if (commissionIds.length > 0) {
            const { data: commissions } = await admin
              .from('affiliate_commissions')
              .select('id, type, description, commission_amount_cents, created_at, status')
              .in('id', commissionIds)

            if (commissions) {
              for (const c of commissions) {
                commissionDetails[c.id] = c
              }
            }
          }

          payoutsWithItems = payoutList.map((p: any) => ({
            ...p,
            items: (itemsByPayout[p.id] || []).map((item: any) => ({
              ...item,
              commission: item.commission_id ? commissionDetails[item.commission_id] || null : null,
            })),
          }))
        } else {
          payoutsWithItems = payoutList.map((p: any) => ({ ...p, items: [] }))
        }
      } catch (itemsErr: any) {
        if (itemsErr?.code !== '42P01' && !itemsErr?.message?.includes('does not exist')) {
          console.warn('Failed to fetch payout items:', itemsErr)
        }
        payoutsWithItems = payoutList.map((p: any) => ({ ...p, items: [] }))
      }
    }

    let allPayoutsQuery = admin
      .from('affiliate_payouts')
      .select('amount_cents, status')
      .eq('affiliate_user_id', user.id)

    if (startDate) {
      allPayoutsQuery = allPayoutsQuery.gte('created_at', new Date(startDate).toISOString())
    }
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      allPayoutsQuery = allPayoutsQuery.lte('created_at', end.toISOString())
    }

    const { data: allPayoutsForSummary } = await allPayoutsQuery
    const summaryData = allPayoutsForSummary || []

    const totalPaid = summaryData
      .filter((p: any) => p.status === 'paid')
      .reduce((sum: number, p: any) => sum + (p.amount_cents || 0), 0)
    const totalPending = summaryData
      .filter((p: any) => p.status === 'pending' || p.status === 'approved')
      .reduce((sum: number, p: any) => sum + (p.amount_cents || 0), 0)

    const totalPages = Math.ceil((count || 0) / limit)

    if (format === 'csv') {
      const csvRows: Record<string, string>[] = payoutsWithItems.map((p: any) => ({
        'Payout ID': p.id,
        'Date': new Date(p.created_at).toLocaleDateString(),
        'Amount': `$${((p.amount_cents || 0) / 100).toFixed(2)}`,
        'Status': p.status || 'unknown',
        'Method': p.method || 'N/A',
        'Processed Date': p.processed_at ? new Date(p.processed_at).toLocaleDateString() : 'N/A',
        'Notes': p.notes || '',
        'Items Count': includeItems ? String((p.items || []).length) : 'N/A',
      }))

      return NextResponse.json({
        payouts: payoutsWithItems,
        csvData: csvRows,
        total: count || 0,
        page,
        limit,
        totalPages,
        summary: {
          totalPaid,
          totalPending,
          totalCount: summaryData.length,
        },
      })
    }

    return NextResponse.json({
      payouts: payoutsWithItems,
      total: count || 0,
      page,
      limit,
      totalPages,
      summary: {
        totalPaid,
        totalPending,
        totalCount: summaryData.length,
      },
    })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({
        payouts: [],
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 0,
        summary: { totalPaid: 0, totalPending: 0, totalCount: 0 },
      })
    }
    console.error('Payout history GET error:', err)
    return NextResponse.json({ error: 'Failed to load payout history' }, { status: 500 })
  }
}
