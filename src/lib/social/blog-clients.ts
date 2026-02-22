import crypto from 'crypto'

export interface BlogClientResult {
  success: boolean
  error?: string
}

export interface BlogValidationResult extends BlogClientResult {
  siteTitle?: string
  username?: string
}

export interface BlogPublishResult extends BlogClientResult {
  postId?: string
  url?: string
  slug?: string
}

export interface BlogClient {
  validateConnection(siteUrl: string, credential: string): Promise<BlogValidationResult>
  publishPost(siteUrl: string, credential: string, post: BlogPostPayload): Promise<BlogPublishResult>
  updatePost(siteUrl: string, credential: string, postId: string, post: BlogPostPayload): Promise<BlogPublishResult>
  deletePost(siteUrl: string, credential: string, postId: string): Promise<BlogClientResult>
}

export interface BlogPostPayload {
  title: string
  content: string
  excerpt?: string
  slug?: string
  status?: 'draft' | 'publish' | 'published'
  tags?: string[]
  coverImageUrl?: string
}

function normalizeUrl(url: string): string {
  let normalized = url.trim().replace(/\/+$/, '')
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = `https://${normalized}`
  }
  return normalized
}

export class WordPressClient implements BlogClient {
  async validateConnection(siteUrl: string, applicationPassword: string): Promise<BlogValidationResult> {
    const base = normalizeUrl(siteUrl)

    try {
      const parts = applicationPassword.trim().split(':')
      if (parts.length !== 2) {
        return { success: false, error: 'Application Password must be in the format "username:password". Generate one from your WordPress admin under Users > Profile > Application Passwords.' }
      }

      const [username, password] = parts
      const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`

      const response = await fetch(`${base}/wp-json/wp/v2/users/me?context=edit`, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(15000),
      })

      if (response.status === 401 || response.status === 403) {
        return { success: false, error: 'Invalid credentials. Make sure you\'re using a valid Application Password (Users > Profile in WordPress admin).' }
      }

      if (response.status === 404) {
        return { success: false, error: 'WordPress REST API not found. Make sure your site has the REST API enabled (it\'s enabled by default in WordPress 4.7+).' }
      }

      if (!response.ok) {
        const text = await response.text().catch(() => '')
        return { success: false, error: `WordPress returned status ${response.status}: ${text.substring(0, 200)}` }
      }

      const userData = await response.json()

      let siteTitle = ''
      try {
        const siteRes = await fetch(`${base}/wp-json`, { signal: AbortSignal.timeout(10000) })
        if (siteRes.ok) {
          const siteData = await siteRes.json()
          siteTitle = siteData.name || ''
        }
      } catch {}

      return {
        success: true,
        siteTitle: siteTitle || base,
        username: userData.slug || userData.username || username,
      }
    } catch (error) {
      const msg = (error as Error).message
      if (msg.includes('timeout') || msg.includes('abort')) {
        return { success: false, error: `Could not reach ${base}. Make sure the URL is correct and the site is accessible.` }
      }
      if (msg.includes('ENOTFOUND') || msg.includes('getaddrinfo')) {
        return { success: false, error: `Domain not found: ${base}. Check the URL for typos.` }
      }
      return { success: false, error: `Connection failed: ${msg}` }
    }
  }

  async publishPost(siteUrl: string, applicationPassword: string, post: BlogPostPayload): Promise<BlogPublishResult> {
    const base = normalizeUrl(siteUrl)
    const parts = applicationPassword.trim().split(':')
    if (parts.length !== 2) {
      return { success: false, error: 'Invalid Application Password format' }
    }

    const [username, password] = parts
    const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`

    try {
      const wpStatus = post.status === 'publish' || post.status === 'published' ? 'publish' : 'draft'

      const body: Record<string, any> = {
        title: post.title,
        content: post.content,
        status: wpStatus,
      }
      if (post.excerpt) body.excerpt = post.excerpt
      if (post.slug) body.slug = post.slug

      if (post.tags && post.tags.length > 0) {
        const tagIds = await this.resolveTagIds(base, authHeader, post.tags)
        if (tagIds.length > 0) body.tags = tagIds
      }

      if (post.coverImageUrl) {
        const mediaId = await this.uploadFeaturedImage(base, authHeader, post.coverImageUrl)
        if (mediaId) body.featured_media = mediaId
      }

      const response = await fetch(`${base}/wp-json/wp/v2/posts`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30000),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        return { success: false, error: `WordPress publish failed (${response.status}): ${errorText.substring(0, 200)}` }
      }

      const data = await response.json()
      return {
        success: true,
        postId: String(data.id),
        url: data.link || `${base}/?p=${data.id}`,
        slug: data.slug,
      }
    } catch (error) {
      return { success: false, error: `Publish failed: ${(error as Error).message}` }
    }
  }

  async updatePost(siteUrl: string, applicationPassword: string, postId: string, post: BlogPostPayload): Promise<BlogPublishResult> {
    const base = normalizeUrl(siteUrl)
    const parts = applicationPassword.trim().split(':')
    if (parts.length !== 2) {
      return { success: false, error: 'Invalid Application Password format' }
    }

    const [username, password] = parts
    const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`

    try {
      const body: Record<string, any> = {
        title: post.title,
        content: post.content,
      }
      if (post.status) body.status = post.status === 'publish' || post.status === 'published' ? 'publish' : 'draft'
      if (post.excerpt) body.excerpt = post.excerpt
      if (post.slug) body.slug = post.slug

      const response = await fetch(`${base}/wp-json/wp/v2/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30000),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        return { success: false, error: `WordPress update failed (${response.status}): ${errorText.substring(0, 200)}` }
      }

      const data = await response.json()
      return {
        success: true,
        postId: String(data.id),
        url: data.link || `${base}/?p=${data.id}`,
        slug: data.slug,
      }
    } catch (error) {
      return { success: false, error: `Update failed: ${(error as Error).message}` }
    }
  }

  async deletePost(siteUrl: string, applicationPassword: string, postId: string): Promise<BlogClientResult> {
    const base = normalizeUrl(siteUrl)
    const parts = applicationPassword.trim().split(':')
    if (parts.length !== 2) {
      return { success: false, error: 'Invalid Application Password format' }
    }

    const [username, password] = parts
    const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`

    try {
      const response = await fetch(`${base}/wp-json/wp/v2/posts/${postId}?force=true`, {
        method: 'DELETE',
        headers: { 'Authorization': authHeader },
        signal: AbortSignal.timeout(15000),
      })

      if (!response.ok) {
        return { success: false, error: `WordPress delete failed (${response.status})` }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: `Delete failed: ${(error as Error).message}` }
    }
  }

  private async resolveTagIds(base: string, authHeader: string, tags: string[]): Promise<number[]> {
    const ids: number[] = []
    for (const tag of tags) {
      try {
        const searchRes = await fetch(`${base}/wp-json/wp/v2/tags?search=${encodeURIComponent(tag)}`, {
          headers: { 'Authorization': authHeader },
          signal: AbortSignal.timeout(10000),
        })
        if (searchRes.ok) {
          const existing = await searchRes.json()
          const match = existing.find((t: any) => t.name.toLowerCase() === tag.toLowerCase())
          if (match) {
            ids.push(match.id)
            continue
          }
        }

        const createRes = await fetch(`${base}/wp-json/wp/v2/tags`, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: tag }),
          signal: AbortSignal.timeout(10000),
        })
        if (createRes.ok) {
          const created = await createRes.json()
          ids.push(created.id)
        }
      } catch {}
    }
    return ids
  }

  private async uploadFeaturedImage(base: string, authHeader: string, imageUrl: string): Promise<number | null> {
    try {
      const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(15000) })
      if (!imgRes.ok) return null
      const buffer = await imgRes.arrayBuffer()
      const contentType = imgRes.headers.get('content-type') || 'image/jpeg'
      const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg'
      const filename = `cover-${Date.now()}.${ext}`

      const uploadRes = await fetch(`${base}/wp-json/wp/v2/media`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Type': contentType,
        },
        body: Buffer.from(buffer),
        signal: AbortSignal.timeout(30000),
      })

      if (uploadRes.ok) {
        const media = await uploadRes.json()
        return media.id
      }
      return null
    } catch {
      return null
    }
  }
}

export class GhostClient implements BlogClient {
  private createGhostToken(adminApiKey: string): string {
    const [id, secret] = adminApiKey.split(':')
    if (!id || !secret) {
      throw new Error('Ghost Admin API key must be in the format "id:secret". Find it in Ghost admin under Settings > Integrations > Custom Integration.')
    }

    const iat = Math.floor(Date.now() / 1000)
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT', kid: id })).toString('base64url')
    const payload = Buffer.from(JSON.stringify({
      iat,
      exp: iat + 300,
      aud: '/admin/',
    })).toString('base64url')

    const hmac = crypto.createHmac('sha256', Buffer.from(secret, 'hex'))
    hmac.update(`${header}.${payload}`)
    const signature = hmac.digest('base64url')

    return `${header}.${payload}.${signature}`
  }

  async validateConnection(siteUrl: string, adminApiKey: string): Promise<BlogValidationResult> {
    const base = normalizeUrl(siteUrl)

    try {
      const token = this.createGhostToken(adminApiKey)

      const response = await fetch(`${base}/ghost/api/admin/site/`, {
        headers: {
          'Authorization': `Ghost ${token}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(15000),
      })

      if (response.status === 401 || response.status === 403) {
        return { success: false, error: 'Invalid API key. Make sure you\'re using the Admin API key from Settings > Integrations in Ghost admin.' }
      }

      if (response.status === 404) {
        return { success: false, error: 'Ghost Admin API not found. Make sure the URL points to your Ghost site (e.g., https://myblog.ghost.io).' }
      }

      if (!response.ok) {
        const text = await response.text().catch(() => '')
        return { success: false, error: `Ghost returned status ${response.status}: ${text.substring(0, 200)}` }
      }

      const data = await response.json()
      const site = data.site || {}

      return {
        success: true,
        siteTitle: site.title || base,
        username: site.title || 'Ghost Blog',
      }
    } catch (error) {
      const msg = (error as Error).message
      if (msg.includes('Ghost Admin API key must be')) {
        return { success: false, error: msg }
      }
      if (msg.includes('timeout') || msg.includes('abort')) {
        return { success: false, error: `Could not reach ${base}. Make sure the URL is correct and the site is accessible.` }
      }
      if (msg.includes('ENOTFOUND') || msg.includes('getaddrinfo')) {
        return { success: false, error: `Domain not found: ${base}. Check the URL for typos.` }
      }
      return { success: false, error: `Connection failed: ${msg}` }
    }
  }

  async publishPost(siteUrl: string, adminApiKey: string, post: BlogPostPayload): Promise<BlogPublishResult> {
    const base = normalizeUrl(siteUrl)

    try {
      const token = this.createGhostToken(adminApiKey)
      const ghostStatus = post.status === 'publish' || post.status === 'published' ? 'published' : 'draft'

      const ghostPost: Record<string, any> = {
        title: post.title,
        html: post.content,
        status: ghostStatus,
      }
      if (post.excerpt) ghostPost.custom_excerpt = post.excerpt
      if (post.slug) ghostPost.slug = post.slug
      if (post.tags && post.tags.length > 0) {
        ghostPost.tags = post.tags.map(t => ({ name: t }))
      }
      if (post.coverImageUrl) {
        ghostPost.feature_image = post.coverImageUrl
      }

      const response = await fetch(`${base}/ghost/api/admin/posts/?source=html`, {
        method: 'POST',
        headers: {
          'Authorization': `Ghost ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ posts: [ghostPost] }),
        signal: AbortSignal.timeout(30000),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        return { success: false, error: `Ghost publish failed (${response.status}): ${errorText.substring(0, 200)}` }
      }

      const data = await response.json()
      const created = data.posts?.[0]
      if (!created) {
        return { success: false, error: 'Ghost returned no post data' }
      }

      return {
        success: true,
        postId: created.id,
        url: created.url || `${base}/${created.slug}/`,
        slug: created.slug,
      }
    } catch (error) {
      return { success: false, error: `Publish failed: ${(error as Error).message}` }
    }
  }

  async updatePost(siteUrl: string, adminApiKey: string, postId: string, post: BlogPostPayload): Promise<BlogPublishResult> {
    const base = normalizeUrl(siteUrl)

    try {
      const token = this.createGhostToken(adminApiKey)

      const getRes = await fetch(`${base}/ghost/api/admin/posts/${postId}/`, {
        headers: {
          'Authorization': `Ghost ${token}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(15000),
      })

      if (!getRes.ok) {
        return { success: false, error: `Could not fetch existing post (${getRes.status})` }
      }

      const existing = await getRes.json()
      const updatedAt = existing.posts?.[0]?.updated_at

      const ghostPost: Record<string, any> = {
        title: post.title,
        html: post.content,
        updated_at: updatedAt,
      }
      if (post.status) ghostPost.status = post.status === 'publish' || post.status === 'published' ? 'published' : 'draft'
      if (post.excerpt) ghostPost.custom_excerpt = post.excerpt
      if (post.slug) ghostPost.slug = post.slug
      if (post.tags && post.tags.length > 0) {
        ghostPost.tags = post.tags.map(t => ({ name: t }))
      }

      const updateToken = this.createGhostToken(adminApiKey)
      const response = await fetch(`${base}/ghost/api/admin/posts/${postId}/?source=html`, {
        method: 'PUT',
        headers: {
          'Authorization': `Ghost ${updateToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ posts: [ghostPost] }),
        signal: AbortSignal.timeout(30000),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        return { success: false, error: `Ghost update failed (${response.status}): ${errorText.substring(0, 200)}` }
      }

      const data = await response.json()
      const updated = data.posts?.[0]
      return {
        success: true,
        postId: updated?.id || postId,
        url: updated?.url || `${base}/${updated?.slug || postId}/`,
        slug: updated?.slug,
      }
    } catch (error) {
      return { success: false, error: `Update failed: ${(error as Error).message}` }
    }
  }

  async deletePost(siteUrl: string, adminApiKey: string, postId: string): Promise<BlogClientResult> {
    const base = normalizeUrl(siteUrl)

    try {
      const token = this.createGhostToken(adminApiKey)

      const response = await fetch(`${base}/ghost/api/admin/posts/${postId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Ghost ${token}`,
        },
        signal: AbortSignal.timeout(15000),
      })

      if (!response.ok && response.status !== 204) {
        return { success: false, error: `Ghost delete failed (${response.status})` }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: `Delete failed: ${(error as Error).message}` }
    }
  }
}

export function getBlogClient(platform: string): BlogClient | null {
  switch (platform) {
    case 'wordpress': return new WordPressClient()
    case 'ghost': return new GhostClient()
    default: return null
  }
}
