'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, RefreshCw, Trash2, RotateCcw, Activity, Clock, CheckCircle2, XCircle, Pause, Zap } from 'lucide-react'

interface QueueMetrics {
  waiting: number
  active: number
  completed: number
  failed: number
  delayed: number
  paused: number
}

interface QueueHealth {
  connected: boolean
  workerRunning: boolean
  queueName: string
}

interface JobInfo {
  id: string
  name: string
  data: {
    type: string
    emailType?: string
    event?: string
    reportType?: string
    to?: string | string[]
    subject?: string
  }
  status: string
  progress: number
  attemptsMade: number
  failedReason?: string
  createdAt: number
  processedAt?: number
  finishedAt?: number
}

export default function QueueDashboard() {
  const [metrics, setMetrics] = useState<QueueMetrics | null>(null)
  const [health, setHealth] = useState<QueueHealth | null>(null)
  const [jobs, setJobs] = useState<JobInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [jobFilter, setJobFilter] = useState<string>('completed')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/queue?action=metrics')
      if (res.ok) {
        const data = await res.json()
        setMetrics(data.metrics)
        setHealth(data.health)
      }
    } catch (err) {
      console.error('Failed to fetch queue metrics:', err)
    }
  }, [])

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/queue?action=jobs&status=${jobFilter}`)
      if (res.ok) {
        const data = await res.json()
        setJobs(data.jobs || [])
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err)
    }
  }, [jobFilter])

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      await Promise.all([fetchMetrics(), fetchJobs()])
      setLoading(false)
    }
    loadData()
  }, [fetchMetrics, fetchJobs])

  const handleRetry = async (jobId: string) => {
    setActionLoading(jobId)
    try {
      await fetch('/api/admin/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'retry', jobId }),
      })
      await fetchJobs()
    } finally {
      setActionLoading(null)
    }
  }

  const handleClearFailed = async () => {
    setActionLoading('clear')
    try {
      await fetch('/api/admin/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-failed' }),
      })
      await Promise.all([fetchMetrics(), fetchJobs()])
    } finally {
      setActionLoading(null)
    }
  }

  const handleRefresh = async () => {
    setActionLoading('refresh')
    await Promise.all([fetchMetrics(), fetchJobs()])
    setActionLoading(null)
  }

  function formatTime(ms: number | undefined): string {
    if (!ms) return '-'
    return new Date(ms).toLocaleString()
  }

  function getJobDescription(job: JobInfo): string {
    switch (job.data.type) {
      case 'email':
        return `${job.data.emailType || 'generic'} email to ${Array.isArray(job.data.to) ? job.data.to.join(', ') : job.data.to}`
      case 'webhook-retry':
        return `Webhook retry: ${job.data.event}`
      case 'report':
        return `${job.data.reportType || 'unknown'} report`
      default:
        return job.name
    }
  }

  const statusFilters = [
    { key: 'completed', label: 'Completed', icon: CheckCircle2 },
    { key: 'failed', label: 'Failed', icon: XCircle },
    { key: 'active', label: 'Active', icon: Activity },
    { key: 'waiting', label: 'Waiting', icon: Clock },
    { key: 'delayed', label: 'Delayed', icon: Pause },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-queue-title">Job Queue</h1>
          <p className="text-sm text-muted-foreground">Background job processing powered by BullMQ + Upstash Redis</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={actionLoading === 'refresh'}
            data-testid="button-refresh-queue"
          >
            {actionLoading === 'refresh' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
          {metrics && metrics.failed > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFailed}
              disabled={actionLoading === 'clear'}
              data-testid="button-clear-failed"
            >
              {actionLoading === 'clear' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Clear Failed
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6">
        {health && (
          <>
            <Badge variant={health.connected ? 'default' : 'destructive'} data-testid="badge-redis-status">
              <Zap className="h-3 w-3 mr-1" />
              Redis: {health.connected ? 'Connected' : 'Disconnected'}
            </Badge>
            <Badge variant={health.workerRunning ? 'default' : 'secondary'} data-testid="badge-worker-status">
              <Activity className="h-3 w-3 mr-1" />
              Worker: {health.workerRunning ? 'Running' : 'Stopped'}
            </Badge>
          </>
        )}
        {!health?.connected && (
          <p className="text-sm text-muted-foreground">Queue not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.</p>
        )}
      </div>

      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: 'Waiting', value: metrics.waiting, icon: Clock, color: 'text-yellow-500' },
            { label: 'Active', value: metrics.active, icon: Activity, color: 'text-blue-500' },
            { label: 'Completed', value: metrics.completed, icon: CheckCircle2, color: 'text-green-500' },
            { label: 'Failed', value: metrics.failed, icon: XCircle, color: 'text-red-500' },
            { label: 'Delayed', value: metrics.delayed, icon: Pause, color: 'text-orange-500' },
            { label: 'Paused', value: metrics.paused, icon: Pause, color: 'text-gray-500' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${color}`} />
                  <span className="text-sm text-muted-foreground">{label}</span>
                </div>
                <p className="text-2xl font-bold mt-1" data-testid={`text-queue-${label.toLowerCase()}`}>{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="text-lg">Recent Jobs</CardTitle>
            <div className="flex items-center gap-1 flex-wrap">
              {statusFilters.map(({ key, label, icon: Icon }) => (
                <Button
                  key={key}
                  variant={jobFilter === key ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setJobFilter(key)}
                  data-testid={`button-filter-${key}`}
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8" data-testid="text-no-jobs">
              No {jobFilter} jobs found
            </p>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between gap-4 p-3 rounded-md border flex-wrap"
                  data-testid={`row-job-${job.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{job.data.type}</Badge>
                      <span className="text-sm font-medium truncate">{getJobDescription(job)}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span>ID: {job.id}</span>
                      <span>Created: {formatTime(job.createdAt)}</span>
                      {job.finishedAt && <span>Finished: {formatTime(job.finishedAt)}</span>}
                      <span>Attempts: {job.attemptsMade}</span>
                    </div>
                    {job.failedReason && (
                      <p className="text-xs text-red-500 mt-1 truncate">{job.failedReason}</p>
                    )}
                  </div>
                  {jobFilter === 'failed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRetry(job.id)}
                      disabled={actionLoading === job.id}
                      data-testid={`button-retry-${job.id}`}
                    >
                      {actionLoading === job.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                      Retry
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
