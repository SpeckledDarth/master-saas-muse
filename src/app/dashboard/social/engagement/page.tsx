'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, BarChart3, TrendingUp, Users, Sparkles, AlertCircle } from 'lucide-react'
import { SocialUpgradeBanner } from '@/components/social-upgrade-banner'
import Link from 'next/link'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface SocialPost {
  id: string
  platform: string
  content: string
  status: string
  ai_generated: boolean
  engagement_data: Record<string, number>
  posted_at: string | null
  created_at: string
}

function getWeekKey(dateStr: string): string {
  const date = new Date(dateStr)
  const startOfYear = new Date(date.getFullYear(), 0, 1)
  const diff = date.getTime() - startOfYear.getTime()
  const weekNum = Math.ceil((diff / 86400000 + startOfYear.getDay() + 1) / 7)
  const month = date.toLocaleString('default', { month: 'short' })
  const day = date.getDate()
  return `${month} ${day}`
}

function getMonthKey(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString('default', { month: 'short', year: 'numeric' })
}

function getEngagementTotal(data: Record<string, number> | null | undefined): number {
  if (!data || typeof data !== 'object') return 0
  return Object.values(data).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0)
}

function getEngagementCore(data: Record<string, number> | null | undefined): number {
  if (!data || typeof data !== 'object') return 0
  return (data.likes || 0) + (data.shares || 0) + (data.comments || 0)
}

export default function EngagementAnalyticsPage() {
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/social/posts?limit=200')
      if (res.status === 403) {
        setPosts([])
        setLoading(false)
        return
      }
      const data = await res.json()
      if (!res.ok && !data.posts) {
        setError('Could not load engagement data. Please try again.')
        setLoading(false)
        return
      }
      setPosts(data.posts || [])
    } catch {
      setError('Could not load engagement data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-testid="loading-spinner">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container max-w-5xl mx-auto py-8 px-4">
        <Card data-testid="error-state-engagement">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Something went wrong</h3>
            <p className="text-muted-foreground mt-1">{error}</p>
            <Button className="mt-4" onClick={() => { setError(null); setLoading(true); fetchPosts() }} data-testid="button-retry-engagement">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="container max-w-5xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-2" data-testid="text-page-title">Engagement Analytics</h1>
        <p className="text-muted-foreground mb-6">Track your social media performance and engagement metrics.</p>
        <Card data-testid="empty-state-engagement">
          <CardContent className="py-12 text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium" data-testid="text-empty-state">No engagement data</h3>
            <p className="text-muted-foreground mt-1">
              Create and publish social media posts to start tracking engagement analytics.
            </p>
            <Button className="mt-4" asChild data-testid="button-create-post-engagement">
              <Link href="/dashboard/social/posts">Create Your First Post</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalPosts = posts.length
  const totalEngagement = posts.reduce((sum, p) => sum + getEngagementTotal(p.engagement_data), 0)
  const aiGeneratedCount = posts.filter(p => p.ai_generated).length
  const aiPercent = totalPosts > 0 ? Math.round((aiGeneratedCount / totalPosts) * 100) : 0
  const avgEngagement = totalPosts > 0 ? Math.round(totalEngagement / totalPosts) : 0

  const monthMap = new Map<string, number>()
  const sortedByDate = [...posts].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  for (const post of sortedByDate) {
    const key = getMonthKey(post.created_at)
    monthMap.set(key, (monthMap.get(key) || 0) + 1)
  }
  const postsPerMonth = Array.from(monthMap.entries()).map(([month, count]) => ({ month, count }))

  const weekMap = new Map<string, number>()
  for (const post of sortedByDate) {
    const key = getWeekKey(post.created_at)
    const engagement = getEngagementCore(post.engagement_data)
    weekMap.set(key, (weekMap.get(key) || 0) + engagement)
  }
  const engagementOverTime = Array.from(weekMap.entries()).map(([week, engagement]) => ({ week, engagement }))

  const platformCountMap = new Map<string, number>()
  const platformEngagementMap = new Map<string, { total: number; count: number }>()
  for (const post of posts) {
    const p = post.platform
    platformCountMap.set(p, (platformCountMap.get(p) || 0) + 1)
    const eng = getEngagementTotal(post.engagement_data)
    const existing = platformEngagementMap.get(p) || { total: 0, count: 0 }
    platformEngagementMap.set(p, { total: existing.total + eng, count: existing.count + 1 })
  }
  const platformBreakdown = Array.from(platformCountMap.entries())
    .map(([platform, count]) => ({ platform, count }))
    .sort((a, b) => b.count - a.count)

  const engagementByPlatform = Array.from(platformEngagementMap.entries())
    .map(([platform, data]) => ({
      platform,
      avg: data.count > 0 ? Math.round(data.total / data.count) : 0,
    }))
    .sort((a, b) => b.avg - a.avg)

  return (
    <>
    <SocialUpgradeBanner />
    <div className="container max-w-5xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Engagement Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Track your social media performance and engagement metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-total-posts">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-posts">{totalPosts}</div>
          </CardContent>
        </Card>

        <Card data-testid="card-total-engagement">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-engagement">
              {totalEngagement.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-ai-generated">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI-Generated</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-ai-percent">{aiPercent}%</div>
            <p className="text-xs text-muted-foreground" data-testid="text-ai-count">
              {aiGeneratedCount} of {totalPosts} posts
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-avg-engagement">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-avg-engagement">{avgEngagement}</div>
            <p className="text-xs text-muted-foreground">per post</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-posts-per-month">
          <CardHeader>
            <CardTitle className="text-base">Posts per Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={postsPerMonth}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 12 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-engagement-over-time">
          <CardHeader>
            <CardTitle className="text-base">Engagement over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={engagementOverTime}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="week" className="text-xs" tick={{ fontSize: 12 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="engagement" stroke="#6366f1" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-platform-breakdown">
          <CardHeader>
            <CardTitle className="text-base">Platform Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={platformBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="platform" className="text-xs" tick={{ fontSize: 12 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-engagement-by-platform">
          <CardHeader>
            <CardTitle className="text-base">Engagement by Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={engagementByPlatform}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="platform" className="text-xs" tick={{ fontSize: 12 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="avg" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  )
}
