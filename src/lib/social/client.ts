export type SocialPlatform = 'twitter' | 'linkedin' | 'instagram'

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
  status: 'draft' | 'scheduled' | 'posting' | 'posted' | 'failed'
  scheduled_at: string | null
  posted_at: string | null
  platform_post_id: string | null
  engagement_data: Record<string, any>
  error_message: string | null
  ai_generated: boolean
  brand_voice: string | null
  created_at: string
}

export interface PlatformClient {
  validateToken(accessToken: string): Promise<{ valid: boolean; error?: string }>
  getUserProfile(accessToken: string): Promise<{ id: string; username: string; displayName: string } | null>
  createPost(accessToken: string, content: string, mediaUrls?: string[]): Promise<{ postId: string; url: string } | null>
  getPostEngagement(accessToken: string, postId: string): Promise<Record<string, number>>
  checkHealth(): Promise<{ healthy: boolean; latencyMs: number }>
}

export class TwitterClient implements PlatformClient {
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
    return null
  }

  async getPostEngagement(accessToken: string, postId: string): Promise<Record<string, number>> {
    return { likes: 0, retweets: 0, replies: 0, impressions: 0 }
  }

  async checkHealth(): Promise<{ healthy: boolean; latencyMs: number }> {
    const start = Date.now()
    try {
      const response = await fetch('https://api.twitter.com/2/openapi.json', { method: 'HEAD', signal: AbortSignal.timeout(5000) })
      return { healthy: response.ok, latencyMs: Date.now() - start }
    } catch {
      return { healthy: false, latencyMs: Date.now() - start }
    }
  }
}

export class LinkedInClient implements PlatformClient {
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
    return null
  }

  async getPostEngagement(accessToken: string, postId: string): Promise<Record<string, number>> {
    return { likes: 0, comments: 0, shares: 0, impressions: 0 }
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

export class InstagramClient implements PlatformClient {
  async validateToken(accessToken: string): Promise<{ valid: boolean; error?: string }> {
    return { valid: false, error: 'Instagram integration coming soon' }
  }

  async getUserProfile(accessToken: string) { return null }
  async createPost(accessToken: string, content: string) { return null }
  async getPostEngagement(accessToken: string, postId: string) { return {} }
  async checkHealth(): Promise<{ healthy: boolean; latencyMs: number }> {
    return { healthy: false, latencyMs: 0 }
  }
}

export function getPlatformClient(platform: SocialPlatform): PlatformClient {
  switch (platform) {
    case 'twitter': return new TwitterClient()
    case 'linkedin': return new LinkedInClient()
    case 'instagram': return new InstagramClient()
  }
}
