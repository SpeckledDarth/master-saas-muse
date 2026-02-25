import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()

    let postsThisMonth: any = { count: 0 }
    let postsLastMonth: any = { count: 0 }
    let ticketsRes: any = { count: 0 }
    let activitiesRes: any = { count: 0 }
    try {
      [postsThisMonth, postsLastMonth, ticketsRes, activitiesRes] = await Promise.all([
        admin.from('social_posts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', thisMonthStart),
        admin.from('social_posts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', lastMonthStart)
          .lte('created_at', lastMonthEnd),
        admin.from('support_tickets')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        admin.from('activities')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', thisMonthStart),
      ])
    } catch {
      // Tables may not exist yet
    }

    const postsThisMonthCount = (postsThisMonth as any)?.count || 0
    const postsLastMonthCount = (postsLastMonth as any)?.count || 0
    const ticketsCount = (ticketsRes as any)?.count || 0
    const activitiesCount = (activitiesRes as any)?.count || 0

    const postsDelta = postsThisMonthCount - postsLastMonthCount

    return NextResponse.json({
      insights: {
        postsThisMonth: postsThisMonthCount,
        postsLastMonth: postsLastMonthCount,
        postsDelta,
        ticketsTotal: ticketsCount,
        activitiesThisMonth: activitiesCount,
        monthName: now.toLocaleString('en-US', { month: 'long' }),
        lastMonthName: new Date(now.getFullYear(), now.getMonth() - 1).toLocaleString('en-US', { month: 'long' }),
      },
    })
  } catch (err) {
    console.error('Usage insights error:', err)
    return NextResponse.json({
      insights: {
        postsThisMonth: 0,
        postsLastMonth: 0,
        postsDelta: 0,
        ticketsTotal: 0,
        activitiesThisMonth: 0,
        monthName: new Date().toLocaleString('en-US', { month: 'long' }),
        lastMonthName: new Date(new Date().getFullYear(), new Date().getMonth() - 1).toLocaleString('en-US', { month: 'long' }),
      },
    })
  }
}
