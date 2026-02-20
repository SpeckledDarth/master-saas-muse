import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const adminClient = createAdminClient()

    const [usersResult, postsResult, accountsResult, testimonialsResult] = await Promise.all([
      adminClient.auth.admin.listUsers({ page: 1, perPage: 1 }),
      adminClient.from('social_posts').select('id', { count: 'exact', head: true }),
      adminClient.from('social_accounts').select('id', { count: 'exact', head: true }).eq('is_valid', true),
      adminClient.from('testimonials').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    ])

    let totalUsers = 0
    if (!usersResult.error) {
      let page = 1
      const perPage = 100
      let counted = 0
      while (true) {
        const { data } = await adminClient.auth.admin.listUsers({ page, perPage })
        if (!data?.users || data.users.length === 0) break
        counted += data.users.length
        if (data.users.length < perPage) break
        page++
      }
      totalUsers = counted
    }

    const stats = {
      totalUsers,
      totalPosts: postsResult.count || 0,
      connectedAccounts: accountsResult.count || 0,
      totalTestimonials: testimonialsResult.count || 0,
    }

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('Public stats error:', error)
    return NextResponse.json(
      { totalUsers: 0, totalPosts: 0, connectedAccounts: 0, totalTestimonials: 0 },
      { status: 200 }
    )
  }
}
