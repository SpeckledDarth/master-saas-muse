import { checkApiRateLimit, recordApiCall } from '@/lib/social/api-rate-limiter'

export type SocialPlatform = 'twitter' | 'linkedin' | 'instagram' | 'youtube' | 'facebook' | 'tiktok' | 'reddit' | 'pinterest' | 'snapchat' | 'discord'

export interface SocialAccount {
  id: string
  user_id: string
  platform: SocialPlatform
  platform_user_id: string | null
  platform_username: string | null
  display_name: string | null
  is_valid: boolean
  last_validated_at: string | null
  last_error: string | null
  connected_at: string
}

export interface SocialPost {
  id: string
  user_id: string
  platform: SocialPlatform
  content: string
  media_urls: string[]
  status: 'draft' | 'scheduled' | 'posting' | 'posted' | 'failed' | 'queued' | 'approved' | 'ignored'
  scheduled_at: string | null
  posted_at: string | null
  platform_post_id: string | null
  engagement_data: Record<string, any>
  error_message: string | null
  ai_generated: boolean
  brand_voice: string | null
  trend_source: string | null
  niche_triggered: string | null
  created_at: string
}

export interface PlatformClient {
  validateToken(accessToken: string): Promise<{ valid: boolean; error?: string }>
  getUserProfile(accessToken: string): Promise<{ id: string; username: string; displayName: string } | null>
  createPost(accessToken: string, content: string, mediaUrls?: string[]): Promise<{ postId: string; url: string } | null>
  getPostEngagement(accessToken: string, postId: string): Promise<Record<string, number>>
  checkHealth(): Promise<{ healthy: boolean; latencyMs: number }>
}

export class LinkedInClient implements PlatformClient {
  private baseUrl = 'https://api.linkedin.com'

  async validateToken(accessToken: string): Promise<{ valid: boolean; error?: string }> {
    try {
      if (!accessToken || accessToken.length < 10) {
        return { valid: false, error: 'Invalid token format' }
      }
      const response = await fetch(`${this.baseUrl}/v2/userinfo`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(10000),
      })
      if (response.ok) {
        return { valid: true }
      }
      const errorText = await response.text().catch(() => 'Unknown error')
      return { valid: false, error: `LinkedIn token invalid (${response.status}): ${errorText}` }
    } catch (error) {
      return { valid: false, error: (error as Error).message }
    }
  }

  async getUserProfile(accessToken: string): Promise<{ id: string; username: string; displayName: string } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/v2/userinfo`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(10000),
      })
      if (!response.ok) return null
      const data = await response.json()
      return {
        id: data.sub,
        username: data.email || data.sub,
        displayName: data.name || `${data.given_name || ''} ${data.family_name || ''}`.trim(),
      }
    } catch {
      return null
    }
  }

  async createPost(accessToken: string, content: string, mediaUrls?: string[]): Promise<{ postId: string; url: string } | null> {
    const rateLimitCheck = checkApiRateLimit('linkedin', 'post')
    if (!rateLimitCheck.allowed) {
      throw new Error(`Platform API rate limit reached. Retry after ${rateLimitCheck.retryAfterMs}ms`)
    }

    try {
      const profile = await this.getUserProfile(accessToken)
      if (!profile) return null

      const authorUrn = `urn:li:person:${profile.id}`

      const shareMedia: any[] = []
      if (mediaUrls && mediaUrls.length > 0) {
        for (const url of mediaUrls) {
          shareMedia.push({
            status: 'READY',
            originalUrl: url,
          })
        }
      }

      const body: any = {
        author: authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: content },
            shareMediaCategory: shareMedia.length > 0 ? 'ARTICLE' : 'NONE',
            ...(shareMedia.length > 0 ? { media: shareMedia } : {}),
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      }

      const response = await fetch(`${this.baseUrl}/v2/ugcPosts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error(`LinkedIn createPost failed (${response.status}):`, errorText)
        return null
      }

      const postUrn = response.headers.get('x-restli-id') || ''
      const postId = postUrn.replace('urn:li:ugcPost:', '')

      recordApiCall('linkedin', 'post')

      return {
        postId: postUrn || postId,
        url: `https://www.linkedin.com/feed/update/${encodeURIComponent(postUrn)}`,
      }
    } catch (error) {
      console.error('LinkedIn createPost error:', error)
      return null
    }
  }

  async getPostEngagement(accessToken: string, postId: string): Promise<Record<string, number>> {
    const rateLimitCheck = checkApiRateLimit('linkedin', 'read')
    if (!rateLimitCheck.allowed) {
      throw new Error(`Platform API rate limit reached. Retry after ${rateLimitCheck.retryAfterMs}ms`)
    }

    try {
      const encodedUrn = encodeURIComponent(postId)
      const response = await fetch(
        `${this.baseUrl}/v2/socialActions/${encodedUrn}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
          signal: AbortSignal.timeout(10000),
        }
      )
      if (!response.ok) {
        return { likes: 0, comments: 0, shares: 0, impressions: 0 }
      }
      const data = await response.json()

      recordApiCall('linkedin', 'read')

      return {
        likes: data.likesSummary?.totalLikes || 0,
        comments: data.commentsSummary?.totalFirstLevelComments || 0,
        shares: data.sharesSummary?.totalShares || 0,
        impressions: 0,
      }
    } catch {
      return { likes: 0, comments: 0, shares: 0, impressions: 0 }
    }
  }

  async checkHealth(): Promise<{ healthy: boolean; latencyMs: number }> {
    const start = Date.now()
    try {
      const response = await fetch('https://api.linkedin.com/v2/me', { method: 'HEAD', signal: AbortSignal.timeout(5000) })
      return { healthy: response.status !== 500, latencyMs: Date.now() - start }
    } catch {
      return { healthy: false, latencyMs: Date.now() - start }
    }
  }
}

export class TwitterClient implements PlatformClient {
  private baseUrl = 'https://api.x.com/2'

  async validateToken(accessToken: string): Promise<{ valid: boolean; error?: string }> {
    try {
      if (!accessToken || accessToken.length < 10) {
        return { valid: false, error: 'Invalid token format' }
      }
      const response = await fetch(`${this.baseUrl}/users/me`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(10000),
      })
      if (response.ok) {
        return { valid: true }
      }
      const errorData = await response.json().catch(() => ({}))
      return { valid: false, error: `X/Twitter token invalid (${response.status}): ${errorData.detail || errorData.title || 'Unknown error'}` }
    } catch (error) {
      return { valid: false, error: (error as Error).message }
    }
  }

  async getUserProfile(accessToken: string): Promise<{ id: string; username: string; displayName: string } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/users/me?user.fields=name,username,profile_image_url`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(10000),
      })
      if (!response.ok) return null
      const json = await response.json()
      const data = json.data
      if (!data) return null
      return {
        id: data.id,
        username: data.username,
        displayName: data.name,
      }
    } catch {
      return null
    }
  }

  async createPost(accessToken: string, content: string, mediaUrls?: string[]): Promise<{ postId: string; url: string } | null> {
    const rateLimitCheck = checkApiRateLimit('twitter', 'post')
    if (!rateLimitCheck.allowed) {
      throw new Error(`Platform API rate limit reached. Retry after ${rateLimitCheck.retryAfterMs}ms`)
    }

    try {
      const body: any = { text: content }

      const response = await fetch(`${this.baseUrl}/tweets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error(`X/Twitter createPost failed (${response.status}):`, errorText)
        return null
      }

      const json = await response.json()
      const tweetId = json.data?.id

      if (!tweetId) return null

      const profile = await this.getUserProfile(accessToken)
      const username = profile?.username || 'i'

      recordApiCall('twitter', 'post')

      return {
        postId: tweetId,
        url: `https://x.com/${username}/status/${tweetId}`,
      }
    } catch (error) {
      console.error('X/Twitter createPost error:', error)
      return null
    }
  }

  async getPostEngagement(accessToken: string, postId: string): Promise<Record<string, number>> {
    const rateLimitCheck = checkApiRateLimit('twitter', 'read')
    if (!rateLimitCheck.allowed) {
      throw new Error(`Platform API rate limit reached. Retry after ${rateLimitCheck.retryAfterMs}ms`)
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/tweets/${postId}?tweet.fields=public_metrics`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` },
          signal: AbortSignal.timeout(10000),
        }
      )
      if (!response.ok) {
        return { likes: 0, retweets: 0, replies: 0, impressions: 0 }
      }
      const json = await response.json()
      const metrics = json.data?.public_metrics
      if (!metrics) return { likes: 0, retweets: 0, replies: 0, impressions: 0 }

      recordApiCall('twitter', 'read')

      return {
        likes: metrics.like_count || 0,
        retweets: metrics.retweet_count || 0,
        replies: metrics.reply_count || 0,
        impressions: metrics.impression_count || 0,
      }
    } catch {
      return { likes: 0, retweets: 0, replies: 0, impressions: 0 }
    }
  }

  async checkHealth(): Promise<{ healthy: boolean; latencyMs: number }> {
    const start = Date.now()
    try {
      const response = await fetch('https://api.x.com/2/openapi.json', { method: 'HEAD', signal: AbortSignal.timeout(5000) })
      return { healthy: response.ok, latencyMs: Date.now() - start }
    } catch {
      return { healthy: false, latencyMs: Date.now() - start }
    }
  }
}

export class FacebookClient implements PlatformClient {
  private graphUrl = 'https://graph.facebook.com/v19.0'

  async validateToken(accessToken: string): Promise<{ valid: boolean; error?: string }> {
    try {
      if (!accessToken || accessToken.length < 10) {
        return { valid: false, error: 'Invalid token format' }
      }
      const response = await fetch(`${this.graphUrl}/me?fields=id,name&access_token=${accessToken}`, {
        signal: AbortSignal.timeout(10000),
      })
      if (response.ok) {
        return { valid: true }
      }
      const errorData = await response.json().catch(() => ({}))
      return { valid: false, error: `Facebook token invalid (${response.status}): ${errorData.error?.message || 'Unknown error'}` }
    } catch (error) {
      return { valid: false, error: (error as Error).message }
    }
  }

  async getUserProfile(accessToken: string): Promise<{ id: string; username: string; displayName: string } | null> {
    try {
      const response = await fetch(`${this.graphUrl}/me?fields=id,name,email&access_token=${accessToken}`, {
        signal: AbortSignal.timeout(10000),
      })
      if (!response.ok) return null
      const data = await response.json()
      return {
        id: data.id,
        username: data.email || data.id,
        displayName: data.name,
      }
    } catch {
      return null
    }
  }

  async createPost(accessToken: string, content: string, mediaUrls?: string[]): Promise<{ postId: string; url: string } | null> {
    const rateLimitCheck = checkApiRateLimit('facebook', 'post')
    if (!rateLimitCheck.allowed) {
      throw new Error(`Platform API rate limit reached. Retry after ${rateLimitCheck.retryAfterMs}ms`)
    }

    try {
      const pagesResponse = await fetch(
        `${this.graphUrl}/me/accounts?fields=id,name,access_token&access_token=${accessToken}`,
        { signal: AbortSignal.timeout(10000) }
      )

      if (!pagesResponse.ok) {
        console.error('Facebook: Failed to fetch pages')
        return null
      }

      const pagesData = await pagesResponse.json()
      const pages = pagesData.data

      if (!pages || pages.length === 0) {
        console.error('Facebook: No pages found. Users must have a Facebook Page to post.')
        return null
      }

      const page = pages[0]
      const pageId = page.id
      const pageToken = page.access_token

      const body: Record<string, string> = {
        message: content,
        access_token: pageToken,
      }

      if (mediaUrls && mediaUrls.length > 0) {
        body.link = mediaUrls[0]
      }

      const response = await fetch(`${this.graphUrl}/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error(`Facebook createPost failed (${response.status}):`, errorText)
        return null
      }

      const data = await response.json()
      const postId = data.id

      recordApiCall('facebook', 'post')

      return {
        postId: postId || '',
        url: `https://www.facebook.com/${postId?.replace('_', '/posts/')}`,
      }
    } catch (error) {
      console.error('Facebook createPost error:', error)
      return null
    }
  }

  async getPostEngagement(accessToken: string, postId: string): Promise<Record<string, number>> {
    const rateLimitCheck = checkApiRateLimit('facebook', 'read')
    if (!rateLimitCheck.allowed) {
      throw new Error(`Platform API rate limit reached. Retry after ${rateLimitCheck.retryAfterMs}ms`)
    }

    try {
      const response = await fetch(
        `${this.graphUrl}/${postId}?fields=likes.summary(true),comments.summary(true),shares&access_token=${accessToken}`,
        { signal: AbortSignal.timeout(10000) }
      )
      if (!response.ok) {
        return { likes: 0, comments: 0, shares: 0, reach: 0 }
      }
      const data = await response.json()

      recordApiCall('facebook', 'read')

      return {
        likes: data.likes?.summary?.total_count || 0,
        comments: data.comments?.summary?.total_count || 0,
        shares: data.shares?.count || 0,
        reach: 0,
      }
    } catch {
      return { likes: 0, comments: 0, shares: 0, reach: 0 }
    }
  }

  async checkHealth(): Promise<{ healthy: boolean; latencyMs: number }> {
    const start = Date.now()
    try {
      const response = await fetch('https://graph.facebook.com/v19.0/', { method: 'HEAD', signal: AbortSignal.timeout(5000) })
      return { healthy: response.status !== 500, latencyMs: Date.now() - start }
    } catch {
      return { healthy: false, latencyMs: Date.now() - start }
    }
  }
}

export class InstagramClient implements PlatformClient {
  private graphUrl = 'https://graph.instagram.com'

  async validateToken(accessToken: string): Promise<{ valid: boolean; error?: string }> {
    try {
      if (!accessToken || accessToken.length < 10) {
        return { valid: false, error: 'Invalid token format' }
      }
      const response = await fetch(`${this.graphUrl}/me?fields=id,username&access_token=${accessToken}`, {
        signal: AbortSignal.timeout(10000),
      })
      if (response.ok) {
        return { valid: true }
      }
      const errorData = await response.json().catch(() => ({}))
      return { valid: false, error: `Instagram token invalid (${response.status}): ${errorData.error?.message || 'Unknown error'}` }
    } catch (error) {
      return { valid: false, error: (error as Error).message }
    }
  }

  async getUserProfile(accessToken: string): Promise<{ id: string; username: string; displayName: string } | null> {
    try {
      const response = await fetch(`${this.graphUrl}/me?fields=id,username,name,account_type&access_token=${accessToken}`, {
        signal: AbortSignal.timeout(10000),
      })
      if (!response.ok) return null
      const data = await response.json()
      return {
        id: data.id,
        username: data.username || data.id,
        displayName: data.name || data.username || 'Instagram User',
      }
    } catch {
      return null
    }
  }

  async createPost(accessToken: string, content: string, mediaUrls?: string[]): Promise<{ postId: string; url: string } | null> {
    const rateLimitCheck = checkApiRateLimit('instagram', 'post')
    if (!rateLimitCheck.allowed) {
      throw new Error(`Platform API rate limit reached. Retry after ${rateLimitCheck.retryAfterMs}ms`)
    }
    return null
  }

  async getPostEngagement(accessToken: string, postId: string): Promise<Record<string, number>> {
    const rateLimitCheck = checkApiRateLimit('instagram', 'read')
    if (!rateLimitCheck.allowed) {
      throw new Error(`Platform API rate limit reached. Retry after ${rateLimitCheck.retryAfterMs}ms`)
    }
    return { likes: 0, comments: 0, reach: 0, impressions: 0 }
  }

  async checkHealth(): Promise<{ healthy: boolean; latencyMs: number }> {
    const start = Date.now()
    try {
      const response = await fetch('https://graph.instagram.com/', { method: 'HEAD', signal: AbortSignal.timeout(5000) })
      return { healthy: response.status !== 500, latencyMs: Date.now() - start }
    } catch {
      return { healthy: false, latencyMs: Date.now() - start }
    }
  }
}

export class YouTubeClient implements PlatformClient {
  async validateToken(accessToken: string): Promise<{ valid: boolean; error?: string }> {
    try {
      if (!accessToken || accessToken.length < 10) {
        return { valid: false, error: 'Invalid token format' }
      }
      return { valid: true }
    } catch (error) {
      return { valid: false, error: (error as Error).message }
    }
  }

  async getUserProfile(accessToken: string): Promise<{ id: string; username: string; displayName: string } | null> {
    return null
  }

  async createPost(accessToken: string, content: string, mediaUrls?: string[]): Promise<{ postId: string; url: string } | null> {
    const rateLimitCheck = checkApiRateLimit('youtube', 'post')
    if (!rateLimitCheck.allowed) {
      throw new Error(`Platform API rate limit reached. Retry after ${rateLimitCheck.retryAfterMs}ms`)
    }
    return null
  }

  async getPostEngagement(accessToken: string, postId: string): Promise<Record<string, number>> {
    const rateLimitCheck = checkApiRateLimit('youtube', 'read')
    if (!rateLimitCheck.allowed) {
      throw new Error(`Platform API rate limit reached. Retry after ${rateLimitCheck.retryAfterMs}ms`)
    }
    return { views: 0, likes: 0, comments: 0, shares: 0 }
  }

  async checkHealth(): Promise<{ healthy: boolean; latencyMs: number }> {
    const start = Date.now()
    try {
      const response = await fetch('https://www.googleapis.com/youtube/v3', { method: 'HEAD', signal: AbortSignal.timeout(5000) })
      return { healthy: response.status !== 500, latencyMs: Date.now() - start }
    } catch {
      return { healthy: false, latencyMs: Date.now() - start }
    }
  }
}

export class TikTokClient implements PlatformClient {
  async validateToken(accessToken: string): Promise<{ valid: boolean; error?: string }> {
    try {
      if (!accessToken || accessToken.length < 10) {
        return { valid: false, error: 'Invalid token format' }
      }
      return { valid: true }
    } catch (error) {
      return { valid: false, error: (error as Error).message }
    }
  }

  async getUserProfile(accessToken: string): Promise<{ id: string; username: string; displayName: string } | null> {
    return null
  }

  async createPost(accessToken: string, content: string, mediaUrls?: string[]): Promise<{ postId: string; url: string } | null> {
    const rateLimitCheck = checkApiRateLimit('tiktok', 'post')
    if (!rateLimitCheck.allowed) {
      throw new Error(`Platform API rate limit reached. Retry after ${rateLimitCheck.retryAfterMs}ms`)
    }
    return null
  }

  async getPostEngagement(accessToken: string, postId: string): Promise<Record<string, number>> {
    const rateLimitCheck = checkApiRateLimit('tiktok', 'read')
    if (!rateLimitCheck.allowed) {
      throw new Error(`Platform API rate limit reached. Retry after ${rateLimitCheck.retryAfterMs}ms`)
    }
    return { views: 0, likes: 0, comments: 0, shares: 0 }
  }

  async checkHealth(): Promise<{ healthy: boolean; latencyMs: number }> {
    const start = Date.now()
    try {
      const response = await fetch('https://open.tiktokapis.com/v2/', { method: 'HEAD', signal: AbortSignal.timeout(5000) })
      return { healthy: response.status !== 500, latencyMs: Date.now() - start }
    } catch {
      return { healthy: false, latencyMs: Date.now() - start }
    }
  }
}

export class RedditClient implements PlatformClient {
  private baseUrl = 'https://oauth.reddit.com'

  async validateToken(accessToken: string): Promise<{ valid: boolean; error?: string }> {
    try {
      if (!accessToken || accessToken.length < 10) {
        return { valid: false, error: 'Invalid token format' }
      }
      const response = await fetch(`${this.baseUrl}/api/v1/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'PassivePost/1.0',
        },
        signal: AbortSignal.timeout(10000),
      })
      if (response.ok) {
        return { valid: true }
      }
      const errorText = await response.text().catch(() => 'Unknown error')
      return { valid: false, error: `Reddit token invalid (${response.status}): ${errorText}` }
    } catch (error) {
      return { valid: false, error: (error as Error).message }
    }
  }

  async getUserProfile(accessToken: string): Promise<{ id: string; username: string; displayName: string } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'PassivePost/1.0',
        },
        signal: AbortSignal.timeout(10000),
      })
      if (!response.ok) return null
      const data = await response.json()
      return {
        id: data.id,
        username: data.name,
        displayName: data.subreddit?.title || data.name,
      }
    } catch {
      return null
    }
  }

  async createPost(accessToken: string, content: string, mediaUrls?: string[]): Promise<{ postId: string; url: string } | null> {
    const rateLimitCheck = checkApiRateLimit('reddit', 'post')
    if (!rateLimitCheck.allowed) {
      throw new Error(`Platform API rate limit reached. Retry after ${rateLimitCheck.retryAfterMs}ms`)
    }
    return null
  }

  async getPostEngagement(accessToken: string, postId: string): Promise<Record<string, number>> {
    const rateLimitCheck = checkApiRateLimit('reddit', 'read')
    if (!rateLimitCheck.allowed) {
      throw new Error(`Platform API rate limit reached. Retry after ${rateLimitCheck.retryAfterMs}ms`)
    }
    return { upvotes: 0, downvotes: 0, comments: 0, awards: 0 }
  }

  async checkHealth(): Promise<{ healthy: boolean; latencyMs: number }> {
    const start = Date.now()
    try {
      const response = await fetch('https://oauth.reddit.com/api/v1/me', { method: 'HEAD', signal: AbortSignal.timeout(5000) })
      return { healthy: response.status !== 500, latencyMs: Date.now() - start }
    } catch {
      return { healthy: false, latencyMs: Date.now() - start }
    }
  }
}

export class PinterestClient implements PlatformClient {
  async validateToken(accessToken: string): Promise<{ valid: boolean; error?: string }> {
    try {
      if (!accessToken || accessToken.length < 10) {
        return { valid: false, error: 'Invalid token format' }
      }
      return { valid: true }
    } catch (error) {
      return { valid: false, error: (error as Error).message }
    }
  }

  async getUserProfile(accessToken: string): Promise<{ id: string; username: string; displayName: string } | null> {
    return null
  }

  async createPost(accessToken: string, content: string, mediaUrls?: string[]): Promise<{ postId: string; url: string } | null> {
    const rateLimitCheck = checkApiRateLimit('pinterest', 'post')
    if (!rateLimitCheck.allowed) {
      throw new Error(`Platform API rate limit reached. Retry after ${rateLimitCheck.retryAfterMs}ms`)
    }
    return null
  }

  async getPostEngagement(accessToken: string, postId: string): Promise<Record<string, number>> {
    const rateLimitCheck = checkApiRateLimit('pinterest', 'read')
    if (!rateLimitCheck.allowed) {
      throw new Error(`Platform API rate limit reached. Retry after ${rateLimitCheck.retryAfterMs}ms`)
    }
    return { saves: 0, clicks: 0, impressions: 0, closeups: 0 }
  }

  async checkHealth(): Promise<{ healthy: boolean; latencyMs: number }> {
    const start = Date.now()
    try {
      const response = await fetch('https://api.pinterest.com/v5/', { method: 'HEAD', signal: AbortSignal.timeout(5000) })
      return { healthy: response.status !== 500, latencyMs: Date.now() - start }
    } catch {
      return { healthy: false, latencyMs: Date.now() - start }
    }
  }
}

export class SnapchatClient implements PlatformClient {
  async validateToken(accessToken: string): Promise<{ valid: boolean; error?: string }> {
    try {
      if (!accessToken || accessToken.length < 10) {
        return { valid: false, error: 'Invalid token format' }
      }
      return { valid: true }
    } catch (error) {
      return { valid: false, error: (error as Error).message }
    }
  }

  async getUserProfile(accessToken: string): Promise<{ id: string; username: string; displayName: string } | null> {
    return null
  }

  async createPost(accessToken: string, content: string, mediaUrls?: string[]): Promise<{ postId: string; url: string } | null> {
    const rateLimitCheck = checkApiRateLimit('snapchat', 'post')
    if (!rateLimitCheck.allowed) {
      throw new Error(`Platform API rate limit reached. Retry after ${rateLimitCheck.retryAfterMs}ms`)
    }
    return null
  }

  async getPostEngagement(accessToken: string, postId: string): Promise<Record<string, number>> {
    const rateLimitCheck = checkApiRateLimit('snapchat', 'read')
    if (!rateLimitCheck.allowed) {
      throw new Error(`Platform API rate limit reached. Retry after ${rateLimitCheck.retryAfterMs}ms`)
    }
    return { views: 0, screenshots: 0, replies: 0 }
  }

  async checkHealth(): Promise<{ healthy: boolean; latencyMs: number }> {
    const start = Date.now()
    try {
      const response = await fetch('https://adsapi.snapchat.com/v1/', { method: 'HEAD', signal: AbortSignal.timeout(5000) })
      return { healthy: response.status !== 500, latencyMs: Date.now() - start }
    } catch {
      return { healthy: false, latencyMs: Date.now() - start }
    }
  }
}

export class DiscordClient implements PlatformClient {
  private baseUrl = 'https://discord.com/api/v10'

  async validateToken(accessToken: string): Promise<{ valid: boolean; error?: string }> {
    try {
      if (!accessToken || accessToken.length < 10) {
        return { valid: false, error: 'Invalid token format' }
      }
      const response = await fetch(`${this.baseUrl}/users/@me`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(10000),
      })
      if (response.ok) {
        return { valid: true }
      }
      const errorText = await response.text().catch(() => 'Unknown error')
      return { valid: false, error: `Discord token invalid (${response.status}): ${errorText}` }
    } catch (error) {
      return { valid: false, error: (error as Error).message }
    }
  }

  async getUserProfile(accessToken: string): Promise<{ id: string; username: string; displayName: string } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/users/@me`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(10000),
      })
      if (!response.ok) return null
      const data = await response.json()
      return {
        id: data.id,
        username: data.username,
        displayName: data.global_name || data.username,
      }
    } catch {
      return null
    }
  }

  async createPost(accessToken: string, content: string, mediaUrls?: string[]): Promise<{ postId: string; url: string } | null> {
    const rateLimitCheck = checkApiRateLimit('discord', 'post')
    if (!rateLimitCheck.allowed) {
      throw new Error(`Platform API rate limit reached. Retry after ${rateLimitCheck.retryAfterMs}ms`)
    }
    return null
  }

  async getPostEngagement(accessToken: string, postId: string): Promise<Record<string, number>> {
    const rateLimitCheck = checkApiRateLimit('discord', 'read')
    if (!rateLimitCheck.allowed) {
      throw new Error(`Platform API rate limit reached. Retry after ${rateLimitCheck.retryAfterMs}ms`)
    }
    return { reactions: 0, replies: 0, pins: 0 }
  }

  async checkHealth(): Promise<{ healthy: boolean; latencyMs: number }> {
    const start = Date.now()
    try {
      const response = await fetch('https://discord.com/api/v10/gateway', { method: 'GET', signal: AbortSignal.timeout(5000) })
      return { healthy: response.ok, latencyMs: Date.now() - start }
    } catch {
      return { healthy: false, latencyMs: Date.now() - start }
    }
  }
}

export function getPlatformClient(platform: SocialPlatform): PlatformClient {
  switch (platform) {
    case 'twitter': return new TwitterClient()
    case 'linkedin': return new LinkedInClient()
    case 'instagram': return new InstagramClient()
    case 'youtube': return new YouTubeClient()
    case 'facebook': return new FacebookClient()
    case 'tiktok': return new TikTokClient()
    case 'reddit': return new RedditClient()
    case 'pinterest': return new PinterestClient()
    case 'snapchat': return new SnapchatClient()
    case 'discord': return new DiscordClient()
  }
}
