import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: userRole } = await admin.from('user_roles').select('role').eq('user_id', user.id).maybeSingle()
    if (userRole?.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))
    const format = searchParams.get('format') || 'json'
    const thresholdCents = 60000

    const startOfYear = `${year}-01-01`
    const endOfYear = `${year}-12-31T23:59:59.999Z`

    const { data: commissions, error: commError } = await admin
      .from('affiliate_commissions')
      .select('affiliate_user_id, commission_amount_cents, status, created_at')
      .gte('created_at', startOfYear)
      .lte('created_at', endOfYear)

    if (commError) {
      if (commError.code === '42P01' || commError.message?.includes('schema cache')) {
        return format === 'csv'
          ? createCsvResponse([], year)
          : NextResponse.json({ year, affiliates: [], total: 0 })
      }
      return NextResponse.json({ error: commError.message }, { status: 500 })
    }

    const earningsByAffiliate: Record<string, number> = {}
    for (const c of (commissions || [])) {
      const uid = c.affiliate_user_id
      if (!uid) continue
      earningsByAffiliate[uid] = (earningsByAffiliate[uid] || 0) + (c.commission_amount_cents || 0)
    }

    const qualifiedUserIds = Object.entries(earningsByAffiliate)
      .filter(([, total]) => total >= thresholdCents)
      .map(([uid]) => uid)

    if (qualifiedUserIds.length === 0) {
      return format === 'csv'
        ? createCsvResponse([], year)
        : NextResponse.json({ year, affiliates: [], total: 0 })
    }

    let taxInfoMap: Record<string, any> = {}
    try {
      const { data: taxInfos } = await admin
        .from('affiliate_tax_info')
        .select('affiliate_user_id, legal_name, tax_id_type, tax_id_last4, address_line1, address_city, address_state, address_zip, address_country, form_type, verified, submitted_at')
        .in('affiliate_user_id', qualifiedUserIds)

      if (taxInfos) {
        for (const t of taxInfos) {
          taxInfoMap[t.affiliate_user_id] = t
        }
      }
    } catch {
      taxInfoMap = {}
    }

    let profileMap: Record<string, any> = {}
    try {
      const { data: profiles } = await admin
        .from('affiliate_profiles')
        .select('user_id, display_name, legal_name, email')
        .in('user_id', qualifiedUserIds)

      if (profiles) {
        for (const p of profiles) {
          profileMap[p.user_id] = p
        }
      }
    } catch {
      profileMap = {}
    }

    let payoutTotals: Record<string, number> = {}
    try {
      const { data: payouts } = await admin
        .from('affiliate_payouts')
        .select('affiliate_user_id, amount_cents, status, created_at')
        .in('affiliate_user_id', qualifiedUserIds)
        .gte('created_at', startOfYear)
        .lte('created_at', endOfYear)
        .in('status', ['completed', 'paid', 'processed'])

      if (payouts) {
        for (const p of payouts) {
          const uid = p.affiliate_user_id
          if (!uid) continue
          payoutTotals[uid] = (payoutTotals[uid] || 0) + (p.amount_cents || 0)
        }
      }
    } catch {
      payoutTotals = {}
    }

    const affiliates = qualifiedUserIds.map((uid) => {
      const tax = taxInfoMap[uid]
      const profile = profileMap[uid]
      const grossEarningsCents = earningsByAffiliate[uid] || 0
      const totalPaidCents = payoutTotals[uid] || 0

      const legalName = tax?.legal_name || profile?.legal_name || profile?.display_name || ''
      const email = profile?.email || ''
      const taxIdType = tax?.tax_id_type || ''
      const taxIdLast4 = tax?.tax_id_last4 || ''
      const address = [
        tax?.address_line1,
        tax?.address_city,
        tax?.address_state,
        tax?.address_zip,
        tax?.address_country,
      ].filter(Boolean).join(', ')
      const formType = tax?.form_type || ''
      const verified = tax?.verified || false
      const taxInfoSubmitted = !!tax?.submitted_at
      const status = !taxInfoSubmitted ? 'missing' : verified ? 'verified' : 'pending'

      return {
        userId: uid,
        legalName,
        email,
        taxIdType,
        taxIdLast4,
        address,
        formType,
        grossEarningsCents,
        grossEarnings: (grossEarningsCents / 100).toFixed(2),
        totalPaidCents,
        totalPaid: (totalPaidCents / 100).toFixed(2),
        taxInfoStatus: status,
        verified,
      }
    })

    affiliates.sort((a, b) => b.grossEarningsCents - a.grossEarningsCents)

    if (format === 'csv') {
      return createCsvResponse(affiliates, year)
    }

    return NextResponse.json({
      year,
      threshold: (thresholdCents / 100).toFixed(2),
      total: affiliates.length,
      affiliates,
    })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ year: new Date().getFullYear(), affiliates: [], total: 0 })
    }
    console.error('Admin tax export error:', err)
    return NextResponse.json({ error: 'Failed to generate tax export' }, { status: 500 })
  }
}

function createCsvResponse(affiliates: any[], year: number) {
  const headers = [
    'Legal Name',
    'Email',
    'Tax ID Type',
    'Tax ID Last 4',
    'Address',
    'Form Type',
    'Gross Earnings',
    'Total Paid',
    'Tax Info Status',
    'Verified',
  ]

  const escCsv = (val: string) => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`
    }
    return val
  }

  const rows = affiliates.map((a) =>
    [
      escCsv(a.legalName),
      escCsv(a.email),
      escCsv(a.taxIdType),
      escCsv(a.taxIdLast4),
      escCsv(a.address),
      escCsv(a.formType),
      a.grossEarnings,
      a.totalPaid,
      escCsv(a.taxInfoStatus),
      a.verified ? 'Yes' : 'No',
    ].join(',')
  )

  const csv = [headers.join(','), ...rows].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="1099-tax-export-${year}.csv"`,
    },
  })
}
