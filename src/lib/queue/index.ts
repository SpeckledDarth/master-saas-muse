import { Queue, Worker, Job, QueueEvents } from 'bullmq'
import { getIORedisConnection, createNewIORedisConnection } from '@/lib/redis/connection'
import type { QueueJobData, EmailJobData, WebhookRetryJobData, ReportJobData, MetricsReportJobData, MetricsAlertJobData, TokenRotationJobData, QueueMetrics, JobStatus } from './types'

const QUEUE_NAME = 'musekit-jobs'

let queue: Queue | null = null
let worker: Worker | null = null
let queueEvents: QueueEvents | null = null

function isQueueConfigured(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
}

export function getQueue(): Queue | null {
  if (!isQueueConfigured()) return null

  if (!queue) {
    const connection = getIORedisConnection()
    queue = new Queue(QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 200 },
      },
    })
  }

  return queue
}

async function processEmailJob(job: Job<EmailJobData>): Promise<void> {
  const { getEmailClient } = await import('@/lib/email/client')

  try {
    const { client, fromEmail } = await getEmailClient()

    const { data: result, error } = await client.emails.send({
      from: fromEmail,
      to: Array.isArray(job.data.to) ? job.data.to : [job.data.to],
      subject: job.data.subject,
      html: job.data.html,
      text: job.data.text,
      replyTo: job.data.replyTo,
    })

    if (error) {
      throw new Error(`Email send failed: ${error.message}`)
    }

    console.log(`[Queue] Email sent successfully: ${result?.id} (${job.data.emailType} to ${job.data.to})`)
  } catch (err) {
    console.error(`[Queue] Email job failed:`, (err as Error).message)
    throw err
  }
}

async function processWebhookRetryJob(job: Job<WebhookRetryJobData>): Promise<void> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Webhook-Event': job.data.event,
    'X-Webhook-Timestamp': new Date().toISOString(),
  }

  if (job.data.secret) {
    const crypto = await import('crypto')
    const signature = crypto.createHmac('sha256', job.data.secret).update(job.data.payload).digest('hex')
    headers['X-Webhook-Signature'] = `sha256=${signature}`
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const response = await fetch(job.data.url, {
      method: 'POST',
      headers,
      body: job.data.payload,
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (response.status >= 500) {
      throw new Error(`Webhook delivery failed with status ${response.status}`)
    }

    console.log(`[Queue] Webhook retry delivered: ${job.data.event} (${response.status})`)
  } catch (err) {
    clearTimeout(timeout)
    console.error(`[Queue] Webhook retry failed:`, (err as Error).message)
    throw err
  }
}

async function processReportJob(job: Job<ReportJobData>): Promise<void> {
  console.log(`[Queue] Processing ${job.data.reportType} report requested by ${job.data.requestedBy}`)
  await job.updateProgress(100)
  console.log(`[Queue] Report ${job.data.reportType} completed`)
}

async function processMetricsReportJob(job: Job<MetricsReportJobData>): Promise<void> {
  console.log(`[Queue] Processing ${job.data.reportType} metrics report for ${job.data.recipientEmail}`)
  
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    
    const { getEmailClient } = await import('@/lib/email/client')
    const { client, fromEmail } = await getEmailClient()
    
    const periodLabel = job.data.reportType === 'weekly' ? 'Weekly' : 'Monthly'
    
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">${periodLabel} Metrics Report</h2>
        <p>Your scheduled ${periodLabel.toLowerCase()} metrics report is ready.</p>
        <p style="margin-top: 16px;">
          <a href="${baseUrl}/admin/metrics" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Full Dashboard
          </a>
        </p>
        <p style="color: #666; font-size: 12px; margin-top: 24px;">
          This is an automated report. Visit your admin dashboard for detailed metrics.
        </p>
      </div>
    `
    
    await client.emails.send({
      from: fromEmail,
      to: [job.data.recipientEmail],
      subject: `${periodLabel} Metrics Report`,
      html,
    })
    
    console.log(`[Queue] Metrics report sent to ${job.data.recipientEmail}`)
  } catch (err) {
    console.error(`[Queue] Metrics report job failed:`, (err as Error).message)
    throw err
  }
}

async function processMetricsAlertJob(job: Job<MetricsAlertJobData>): Promise<void> {
  console.log(`[Queue] Processing metrics alert: ${job.data.alertType}`)
  
  try {
    const { getEmailClient } = await import('@/lib/email/client')
    const { client, fromEmail } = await getEmailClient()
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    
    const alertLabels: Record<string, string> = {
      'churn-threshold': 'Churn Rate Alert',
      'revenue-drop': 'Revenue Drop Alert',
      'user-growth-stall': 'User Growth Stall Alert',
    }
    
    const alertDescriptions: Record<string, string> = {
      'churn-threshold': `Your churn rate has reached ${job.data.currentValue.toFixed(1)}%, exceeding your threshold of ${job.data.threshold}%.`,
      'revenue-drop': `Your MRR has dropped to $${(job.data.currentValue / 100).toFixed(2)}, which is below your alert threshold.`,
      'user-growth-stall': `User growth has stalled at ${job.data.currentValue} new users this month, below your threshold of ${job.data.threshold}.`,
    }
    
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">${alertLabels[job.data.alertType] || 'Metrics Alert'}</h2>
        <p>${alertDescriptions[job.data.alertType] || 'A metric has exceeded its configured threshold.'}</p>
        <p style="margin-top: 16px;">
          <a href="${baseUrl}/admin/metrics" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Dashboard
          </a>
        </p>
        <p style="color: #666; font-size: 12px; margin-top: 24px;">
          You can configure alert thresholds in Admin &gt; Setup &gt; Security.
        </p>
      </div>
    `
    
    await client.emails.send({
      from: fromEmail,
      to: [job.data.recipientEmail],
      subject: `Alert: ${alertLabels[job.data.alertType] || 'Metrics Threshold Exceeded'}`,
      html,
    })
    
    console.log(`[Queue] Alert email sent for ${job.data.alertType}`)
  } catch (err) {
    console.error(`[Queue] Metrics alert job failed:`, (err as Error).message)
    throw err
  }
}

async function processTokenRotationJob(job: Job<TokenRotationJobData>): Promise<void> {
  console.log(`[Queue] Processing token rotation: ${job.data.rotationType} for resource ${job.data.resourceId}`)
  
  try {
    const crypto = await import('crypto')
    const newSecret = crypto.randomBytes(32).toString('hex')
    
    if (job.data.rotationType === 'webhook-secret') {
      const { createAdminClient } = await import('@/lib/supabase/admin')
      const adminClient = createAdminClient()
      
      const { data: orgSettings } = await adminClient
        .from('organization_settings')
        .select('settings')
        .eq('organization_id', 1)
        .maybeSingle()
      
      if (orgSettings?.settings) {
        const settings = orgSettings.settings as any
        if (settings.webhooks) {
          settings.webhooks.secret = newSecret
          await adminClient
            .from('organization_settings')
            .update({ settings })
            .eq('organization_id', 1)
        }
      }
      
      console.log(`[Queue] Webhook secret rotated successfully`)
    }
    
    await job.updateProgress(100)
    console.log(`[Queue] Token rotation completed: ${job.data.rotationType}`)
  } catch (err) {
    console.error(`[Queue] Token rotation job failed:`, (err as Error).message)
    throw err
  }
}

async function processJob(job: Job<QueueJobData>): Promise<void> {
  console.log(`[Queue] Processing job ${job.id}: ${job.data.type}`)

  switch (job.data.type) {
    case 'email':
      return processEmailJob(job as Job<EmailJobData>)
    case 'webhook-retry':
      return processWebhookRetryJob(job as Job<WebhookRetryJobData>)
    case 'report':
      return processReportJob(job as Job<ReportJobData>)
    case 'metrics-report':
      return processMetricsReportJob(job as Job<MetricsReportJobData>)
    case 'metrics-alert':
      return processMetricsAlertJob(job as Job<MetricsAlertJobData>)
    case 'token-rotation':
      return processTokenRotationJob(job as Job<TokenRotationJobData>)
    default:
      throw new Error(`Unknown job type: ${(job.data as QueueJobData).type}`)
  }
}

export function startWorker(): Worker | null {
  if (!isQueueConfigured()) return null

  if (!worker) {
    const connection = createNewIORedisConnection()
    worker = new Worker(QUEUE_NAME, processJob, {
      connection,
      concurrency: 5,
      limiter: {
        max: 10,
        duration: 1000,
      },
    })

    worker.on('completed', (job) => {
      console.log(`[Queue] Job ${job.id} completed: ${job.data.type}`)
    })

    worker.on('failed', (job, err) => {
      console.error(`[Queue] Job ${job?.id} failed: ${err.message}`)
    })

    worker.on('error', (err) => {
      console.error('[Queue] Worker error:', err.message)
    })
  }

  return worker
}

export async function addEmailJob(data: Omit<EmailJobData, 'type'>): Promise<string | null> {
  const q = getQueue()
  if (!q) {
    console.warn('[Queue] Queue not configured, running email inline')
    return null
  }

  const job = await q.add('email', { type: 'email' as const, ...data }, {
    priority: data.emailType === 'team-invite' ? 1 : 2,
  })

  return job.id || null
}

export async function addWebhookRetryJob(data: Omit<WebhookRetryJobData, 'type'>): Promise<string | null> {
  const q = getQueue()
  if (!q) return null

  const job = await q.add('webhook-retry', { type: 'webhook-retry' as const, ...data }, {
    priority: 3,
    delay: 2000 * data.attempt,
  })

  return job.id || null
}

export async function addReportJob(data: Omit<ReportJobData, 'type'>): Promise<string | null> {
  const q = getQueue()
  if (!q) return null

  const job = await q.add('report', { type: 'report' as const, ...data }, {
    priority: 5,
  })

  return job.id || null
}

export async function addMetricsReportJob(data: Omit<MetricsReportJobData, 'type'>): Promise<string | null> {
  const q = getQueue()
  if (!q) return null

  const job = await q.add('metrics-report', { type: 'metrics-report' as const, ...data }, {
    priority: 4,
  })

  return job.id || null
}

export async function addMetricsAlertJob(data: Omit<MetricsAlertJobData, 'type'>): Promise<string | null> {
  const q = getQueue()
  if (!q) return null

  const job = await q.add('metrics-alert', { type: 'metrics-alert' as const, ...data }, {
    priority: 1,
  })

  return job.id || null
}

export async function addTokenRotationJob(data: Omit<TokenRotationJobData, 'type'>): Promise<string | null> {
  const q = getQueue()
  if (!q) return null

  const job = await q.add('token-rotation', { type: 'token-rotation' as const, ...data }, {
    priority: 3,
  })

  return job.id || null
}

export async function getQueueMetrics(): Promise<QueueMetrics | null> {
  const q = getQueue()
  if (!q) return null

  const [waiting, active, completed, failed, delayed] = await Promise.all([
    q.getWaitingCount(),
    q.getActiveCount(),
    q.getCompletedCount(),
    q.getFailedCount(),
    q.getDelayedCount(),
  ])

  return { waiting, active, completed, failed, delayed, paused: 0 }
}

export async function getRecentJobs(status: 'completed' | 'failed' | 'waiting' | 'active' | 'delayed' = 'completed', start = 0, end = 19): Promise<JobStatus[]> {
  const q = getQueue()
  if (!q) return []

  const jobs = await q.getJobs([status], start, end)

  return jobs.map(job => ({
    id: job.id || '',
    name: job.name,
    data: job.data as QueueJobData,
    status,
    progress: typeof job.progress === 'number' ? job.progress : 0,
    attemptsMade: job.attemptsMade,
    failedReason: job.failedReason,
    createdAt: job.timestamp,
    processedAt: job.processedOn,
    finishedAt: job.finishedOn,
  }))
}

export async function retryFailedJob(jobId: string): Promise<boolean> {
  const q = getQueue()
  if (!q) return false

  try {
    const job = await q.getJob(jobId)
    if (job) {
      await job.retry()
      return true
    }
    return false
  } catch {
    return false
  }
}

export async function clearFailedJobs(): Promise<number> {
  const q = getQueue()
  if (!q) return 0

  const failed = await q.getJobs(['failed'])
  let cleared = 0
  for (const job of failed) {
    await job.remove()
    cleared++
  }
  return cleared
}

export async function getQueueHealth(): Promise<{ connected: boolean; workerRunning: boolean; queueName: string }> {
  return {
    connected: isQueueConfigured() && !!queue,
    workerRunning: !!worker && !worker.closing,
    queueName: QUEUE_NAME,
  }
}
