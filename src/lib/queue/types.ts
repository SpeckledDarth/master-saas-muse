export type JobType = 'email' | 'webhook-retry' | 'report' | 'metrics-report' | 'metrics-alert' | 'token-rotation' | 'social-post' | 'social-health-check' | 'social-trend-monitor'

export interface EmailJobData {
  type: 'email'
  emailType: 'welcome' | 'subscription-confirmed' | 'subscription-cancelled' | 'team-invite' | 'generic'
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
  metadata?: Record<string, unknown>
}

export interface WebhookRetryJobData {
  type: 'webhook-retry'
  url: string
  event: string
  payload: string
  secret: string
  attempt: number
  maxAttempts: number
}

export interface ReportJobData {
  type: 'report'
  reportType: 'usage' | 'analytics' | 'audit'
  parameters: Record<string, unknown>
  requestedBy: string
}

export interface MetricsReportJobData {
  type: 'metrics-report'
  reportType: 'weekly' | 'monthly'
  recipientEmail: string
  requestedBy: string
}

export interface MetricsAlertJobData {
  type: 'metrics-alert'
  alertType: 'churn-threshold' | 'revenue-drop' | 'user-growth-stall'
  threshold: number
  currentValue: number
  recipientEmail: string
}

export interface TokenRotationJobData {
  type: 'token-rotation'
  rotationType: 'webhook-secret' | 'api-key'
  resourceId: string
  requestedBy: string
}

export interface SocialPostJobData {
  type: 'social-post'
  postId: string
  userId: string
  platform: string
  content: string
  mediaUrls?: string[]
  scheduledAt?: string
}

export interface SocialHealthCheckJobData {
  type: 'social-health-check'
  platforms: string[]
  alertEmail?: string
  failureThreshold: number
}

export interface SocialTrendMonitorJobData {
  type: 'social-trend-monitor'
  platform: string
  keywords: string[]
  userId: string
}

export type QueueJobData = EmailJobData | WebhookRetryJobData | ReportJobData | MetricsReportJobData | MetricsAlertJobData | TokenRotationJobData | SocialPostJobData | SocialHealthCheckJobData | SocialTrendMonitorJobData

export interface JobStatus {
  id: string
  name: string
  data: QueueJobData
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed'
  progress: number
  attemptsMade: number
  failedReason?: string
  createdAt: number
  processedAt?: number
  finishedAt?: number
}

export interface QueueMetrics {
  waiting: number
  active: number
  completed: number
  failed: number
  delayed: number
  paused: number
}
