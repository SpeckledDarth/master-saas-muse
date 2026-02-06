import { startWorker } from './index'

let initialized = false

export function initializeWorker(): void {
  if (initialized) return
  initialized = true

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.log('[Queue] Redis not configured, worker not started')
    return
  }

  try {
    const worker = startWorker()
    if (worker) {
      console.log('[Queue] Worker started successfully')
    }
  } catch (err) {
    console.error('[Queue] Failed to start worker:', (err as Error).message)
  }
}
