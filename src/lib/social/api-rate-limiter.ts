interface RateLimitConfig {
  limit: number
  windowMs: number
}

interface RateLimitCheck {
  allowed: boolean
  retryAfterMs?: number
}

const PLATFORM_LIMITS: Record<string, Record<string, RateLimitConfig>> = {
  twitter: {
    post: { limit: 300, windowMs: 3 * 60 * 60 * 1000 },
    read: { limit: 300, windowMs: 15 * 60 * 1000 },
  },
  linkedin: {
    post: { limit: 100, windowMs: 24 * 60 * 60 * 1000 },
    read: { limit: 1000, windowMs: 24 * 60 * 60 * 1000 },
  },
  facebook: {
    post: { limit: 200, windowMs: 60 * 60 * 1000 },
    read: { limit: 200, windowMs: 60 * 60 * 1000 },
  },
  instagram: {
    post: { limit: 25, windowMs: 24 * 60 * 60 * 1000 },
    read: { limit: 200, windowMs: 60 * 60 * 1000 },
  },
  youtube: {
    post: { limit: 100, windowMs: 24 * 60 * 60 * 1000 },
    read: { limit: 10000, windowMs: 24 * 60 * 60 * 1000 },
  },
  tiktok: {
    post: { limit: 50, windowMs: 24 * 60 * 60 * 1000 },
    read: { limit: 1000, windowMs: 24 * 60 * 60 * 1000 },
  },
  reddit: {
    post: { limit: 100, windowMs: 24 * 60 * 60 * 1000 },
    read: { limit: 600, windowMs: 10 * 60 * 1000 },
  },
  pinterest: {
    post: { limit: 50, windowMs: 24 * 60 * 60 * 1000 },
    read: { limit: 1000, windowMs: 60 * 60 * 1000 },
  },
  snapchat: {
    post: { limit: 100, windowMs: 24 * 60 * 60 * 1000 },
    read: { limit: 1000, windowMs: 24 * 60 * 60 * 1000 },
  },
  discord: {
    post: { limit: 50, windowMs: 60 * 60 * 1000 },
    read: { limit: 1000, windowMs: 60 * 60 * 1000 },
  },
}

const callTimestamps = new Map<string, number[]>()

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000
let lastCleanup = Date.now()

function getKey(platform: string, action: string): string {
  return `${platform}:${action}`
}

function cleanupOldEntries(): void {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now

  for (const [key, timestamps] of callTimestamps.entries()) {
    const parts = key.split(':')
    const platform = parts[0]
    const action = parts[1]
    const config = PLATFORM_LIMITS[platform]?.[action]
    if (!config) {
      callTimestamps.delete(key)
      continue
    }
    const cutoff = now - config.windowMs
    const filtered = timestamps.filter((t) => t > cutoff)
    if (filtered.length === 0) {
      callTimestamps.delete(key)
    } else {
      callTimestamps.set(key, filtered)
    }
  }
}

export function checkApiRateLimit(platform: string, action: 'post' | 'read'): RateLimitCheck {
  cleanupOldEntries()

  const config = PLATFORM_LIMITS[platform]?.[action]
  if (!config) {
    return { allowed: true }
  }

  const key = getKey(platform, action)
  const now = Date.now()
  const cutoff = now - config.windowMs
  const timestamps = callTimestamps.get(key) || []
  const recentCalls = timestamps.filter((t) => t > cutoff)

  if (recentCalls.length >= config.limit) {
    const oldestInWindow = recentCalls[0]
    const retryAfterMs = oldestInWindow + config.windowMs - now
    return { allowed: false, retryAfterMs: Math.max(retryAfterMs, 1000) }
  }

  return { allowed: true }
}

export function recordApiCall(platform: string, action: 'post' | 'read'): void {
  const key = getKey(platform, action)
  const timestamps = callTimestamps.get(key) || []
  timestamps.push(Date.now())
  callTimestamps.set(key, timestamps)
}
