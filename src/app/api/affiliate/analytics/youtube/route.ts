import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    const { data: socialAccounts, error: accountsError } = await admin
      .from('social_accounts')
      .select('id, platform, platform_user_id, platform_username, display_name, is_valid, connected_at')
      .eq('user_id', user.id)
      .eq('platform', 'youtube')
      .limit(1)

    if (accountsError) {
      if (accountsError.code === '42P01' || accountsError.message?.includes('does not exist')) {
        return NextResponse.json({
          connected: false,
          message: 'Social accounts not configured yet',
          videos: [],
          channelStats: null,
          attribution: null,
        })
      }
      return NextResponse.json({ error: accountsError.message }, { status: 500 })
    }

    const youtubeAccount = socialAccounts?.[0]
    if (!youtubeAccount) {
      return NextResponse.json({
        connected: false,
        message: 'No YouTube account connected',
        videos: [],
        channelStats: null,
        attribution: null,
      })
    }

    const { data: referrals } = await admin
      .from('affiliate_referrals')
      .select('id, status, source_tag, created_at')
      .eq('affiliate_user_id', user.id)

    const { data: clicks } = await admin
      .from('affiliate_clicks')
      .select('id, source_tag, created_at')
      .eq('affiliate_user_id', user.id)

    const totalClicks = clicks?.length || 0
    const totalReferrals = referrals?.length || 0
    const convertedReferrals = referrals?.filter(r => r.status === 'converted')?.length || 0

    const youtubeClicks = clicks?.filter(c =>
      c.source_tag?.toLowerCase()?.includes('youtube') ||
      c.source_tag?.toLowerCase()?.includes('yt')
    )?.length || 0

    const youtubeReferrals = referrals?.filter(r =>
      r.source_tag?.toLowerCase()?.includes('youtube') ||
      r.source_tag?.toLowerCase()?.includes('yt')
    )?.length || 0

    const youtubeConverted = referrals?.filter(r =>
      (r.source_tag?.toLowerCase()?.includes('youtube') || r.source_tag?.toLowerCase()?.includes('yt')) &&
      r.status === 'converted'
    )?.length || 0

    const { data: posts } = await admin
      .from('social_posts')
      .select('id, content, platform, status, published_at, created_at, engagement_data')
      .eq('user_id', user.id)
      .eq('platform', 'youtube')
      .order('created_at', { ascending: false })
      .limit(20)

    const videos = (posts || []).map(post => {
      const engagement = post.engagement_data as Record<string, any> || {}
      return {
        id: post.id,
        title: (post.content || '').substring(0, 100) || 'Untitled Video',
        status: post.status,
        publishedAt: post.published_at || post.created_at,
        views: engagement.views || engagement.view_count || 0,
        likes: engagement.likes || engagement.like_count || 0,
        comments: engagement.comments || engagement.comment_count || 0,
        shares: engagement.shares || engagement.share_count || 0,
      }
    })

    const totalViews = videos.reduce((sum, v) => sum + v.views, 0)
    const totalLikes = videos.reduce((sum, v) => sum + v.likes, 0)
    const totalComments = videos.reduce((sum, v) => sum + v.comments, 0)

    const viewsToClickRatio = totalViews > 0 && youtubeClicks > 0
      ? (youtubeClicks / totalViews * 100).toFixed(2)
      : null

    const viewsToReferralRatio = totalViews > 0 && youtubeReferrals > 0
      ? (youtubeReferrals / totalViews * 100).toFixed(4)
      : null

    return NextResponse.json({
      connected: true,
      account: {
        username: youtubeAccount.platform_username,
        displayName: youtubeAccount.display_name,
        connectedAt: youtubeAccount.connected_at,
        isValid: youtubeAccount.is_valid,
      },
      channelStats: {
        totalVideos: videos.length,
        totalViews,
        totalLikes,
        totalComments,
      },
      videos,
      attribution: {
        totalClicks,
        totalReferrals,
        convertedReferrals,
        youtubeClicks,
        youtubeReferrals,
        youtubeConverted,
        viewsToClickRate: viewsToClickRatio,
        viewsToReferralRate: viewsToReferralRatio,
      },
    })
  } catch (err: any) {
    console.error('YouTube analytics error:', err)
    return NextResponse.json({ error: 'Failed to fetch YouTube analytics' }, { status: 500 })
  }
}
