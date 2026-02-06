import IORedis from 'ioredis'

let ioRedisClient: IORedis | null = null

function parseUpstashUrl(restUrl: string): { host: string; port: number; password: string } {
  const url = new URL(restUrl)
  return {
    host: url.hostname,
    port: parseInt(url.port || '6379', 10),
    password: process.env.UPSTASH_REDIS_REST_TOKEN || '',
  }
}

export function getIORedisConnection(): IORedis {
  if (!ioRedisClient) {
    const restUrl = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN

    if (!restUrl || !token) {
      throw new Error(
        'Redis not configured: Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables'
      )
    }

    const parsed = parseUpstashUrl(restUrl)

    ioRedisClient = new IORedis({
      host: parsed.host,
      port: 6379,
      password: token,
      tls: { rejectUnauthorized: false },
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    })
  }

  return ioRedisClient
}

export function createNewIORedisConnection(): IORedis {
  const restUrl = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!restUrl || !token) {
    throw new Error('Redis not configured')
  }

  const parsed = parseUpstashUrl(restUrl)

  return new IORedis({
    host: parsed.host,
    port: 6379,
    password: token,
    tls: { rejectUnauthorized: false },
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
  })
}
