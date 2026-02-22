'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, BarChart3, TrendingUp, Users, Sparkles, AlertCircle, RefreshCw, Heart, MessageSquare, Share2, Eye } from 'lucide-react'
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
import { ThemedChartTooltip } from '@/components/ui/chart-tooltip'
import { HelpTooltip } from '@/components/social/help-tooltip'

interface EngagementSummary {
  week: {
    likes: number
    comments: number
    shares: number
    impressions: number
    totalEngagement: number
    postCount: number
    engagementRate: string | null
  }
  month: {
    likes: number
    comments: number
    shares: number
    impressions: number
    totalEngagement: number
    postCount: number
  }
  platformBreakdown: Record<string, { posts: number; likes: number; comments: number; shares: number; impressions: number }>
  topPost: { platform: string; content: string; engagement: number; postedAt: string } | null
  dailyTrend: { date: string; posts: number; engagement: number }[]
}

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

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toLocaleString()
}

const PLATFORM_COLORS: Record<string, string> = {
  twitter: 'hsl(var(--chart-1))',
  linkedin: 'hsl(var(--chart-2))',
  facebook: 'hsl(var(--chart-3))',
  instagram: 'hsl(var(--chart-4))',
  youtube: 'hsl(var(--chart-5))',
}

export default function EngagementAnalyticsPage() {
  const [summary, setSummary] = useState<EngagementSummary | null>(null)
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)
  const [pulling, setPulling] = useState(false)
  const [pullMessage, setPullMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [summaryRes, postsRes] = await Promise.all([
        fetch('/api/social/engagement/summary'),
        fetch('/api/social/posts?limit=200'),
      ])

      if (summaryRes.ok) {
        const data = await summaryRes.json()
        setSummary(data)
      }

      if (postsRes.ok) {
        const data = await postsRes.json().catch(() => ({}))
        setPosts(data.posts || [])
      }
    } catch (err) {
      setError('Failed to load engagement data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRefreshMetrics = async () => {
    setPulling(true)
    setPullMessage(null)
    try {
      const res = await fetch('/api/social/engagement/pull', { method: 'POST' })
      const data = await res.json()
      setPullMessage(data.message || 'Metrics refresh started')
      setTimeout(() => {
        fetchData()
        setPullMessage(null)
      }, 5000)
    } catch {
      setPullMessage('Failed to trigger metrics refresh')
    } finally {
      setPulling(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-testid="loading-spinner">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card data-testid="error-state-engagement">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Something went wrong</h3>
            <p className="text-muted-foreground mt-1">{error}</p>
            <Button className="mt-4" onClick={() => { setError(null); setLoading(true); fetchData() }} data-testid="button-retry-engagement">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const hasData = (summary?.week.postCount || 0) > 0 || posts.length > 0

  if (!hasData) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Engagement Analytics</h1>
            <p className="text-muted-foreground mt-1">Track your social media performance and engagement metrics.</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-16 text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No engagement data yet</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              Once you start publishing posts to your connected social accounts, your engagement metrics will appear here automatically.
            </p>
            <div className="flex gap-2 justify-center mt-6">
              <Link href="/dashboard/social/posts">
                <Button data-testid="button-go-to-posts">Create Your First Post</Button>
              </Link>
              <Link href="/dashboard/social">
                <Button variant="outline" data-testid="button-connect-accounts">Connect Accounts</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const weekMetrics = summary?.week || { likes: 0, comments: 0, shares: 0, impressions: 0, totalEngagement: 0, postCount: 0, engagementRate: null }
  const monthMetrics = summary?.month || { likes: 0, comments: 0, shares: 0, impressions: 0, totalEngagement: 0, postCount: 0 }
  const platformBreakdown = summary?.platformBreakdown || {}
  const topPost = summary?.topPost
  const dailyTrend = summary?.dailyTrend || []

  const totalPosts = posts.length
  const totalEngagement = posts.reduce((sum, p) => sum + getEngagementTotal(p.engagement_data), 0)
  const aiGeneratedCount = posts.filter(p => p.ai_generated).length
  const aiPercent = totalPosts > 0 ? Math.round((aiGeneratedCount / totalPosts) * 100) : 0
  const avgEngagement = totalPosts > 0 ? Math.round(totalEngagement / totalPosts) : 0

  const sortedByDate = [...posts].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  const monthMap = new Map<string, number>()
  for (const post of sortedByDate) {
    const key = getMonthKey(post.created_at)
    monthMap.set(key, (monthMap.get(key) || 0) + 1)
  }
  const postsPerMonth = Array.from(monthMap.entries()).map(([month, count]) => ({ month, count }))

  const platformData = Object.entries(platformBreakdown).map(([platform, data]) => ({
    platform,
    posts: data.posts,
    likes: data.likes,
    comments: data.comments,
    shares: data.shares,
    impressions: data.impressions,
    avgEngagement: data.posts > 0 ? Math.round((data.likes + data.comments + data.shares) / data.posts) : 0,
  })).sort((a, b) => b.avgEngagement - a.avgEngagement)

  const aiPosts = posts.filter(p => p.ai_generated)
  const manualPosts = posts.filter(p => !p.ai_generated)
  const aiAvgEng = aiPosts.length > 0 ? Math.round(aiPosts.reduce((s, p) => s + getEngagementTotal(p.engagement_data), 0) / aiPosts.length) : 0
  const manualAvgEng = manualPosts.length > 0 ? Math.round(manualPosts.reduce((s, p) => s + getEngagementTotal(p.engagement_data), 0) / manualPosts.length) : 0
  const winner = aiAvgEng > manualAvgEng ? 'ai' : manualAvgEng > aiAvgEng ? 'manual' : 'tie'

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Engagement Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track your social media performance and engagement metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pullMessage && (
            <span className="text-sm text-muted-foreground">{pullMessage}</span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshMetrics}
            disabled={pulling}
            data-testid="button-refresh-metrics"
          >
            {pulling ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh Metrics
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-week-likes">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Likes (7d) <HelpTooltip text="Total likes across all platforms in the last 7 days." /></CardTitle>
            <Heart className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-week-likes">{formatNumber(weekMetrics.likes)}</div>
            <p className="text-xs text-muted-foreground">{formatNumber(monthMetrics.likes)} this month</p>
          </CardContent>
        </Card>

        <Card data-testid="card-week-comments">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comments (7d) <HelpTooltip text="Total comments and replies across all platforms in the last 7 days." /></CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-week-comments">{formatNumber(weekMetrics.comments)}</div>
            <p className="text-xs text-muted-foreground">{formatNumber(monthMetrics.comments)} this month</p>
          </CardContent>
        </Card>

        <Card data-testid="card-week-shares">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shares (7d) <HelpTooltip text="Total shares and retweets across all platforms in the last 7 days." /></CardTitle>
            <Share2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-week-shares">{formatNumber(weekMetrics.shares)}</div>
            <p className="text-xs text-muted-foreground">{formatNumber(monthMetrics.shares)} this month</p>
          </CardContent>
        </Card>

        <Card data-testid="card-week-impressions">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impressions (7d) <HelpTooltip text="Total times your posts were shown to people in the last 7 days." /></CardTitle>
            <Eye className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-week-impressions">{formatNumber(weekMetrics.impressions)}</div>
            {weekMetrics.engagementRate && (
              <p className="text-xs text-muted-foreground">{weekMetrics.engagementRate}% engagement rate</p>
            )}
          </CardContent>
        </Card>
      </div>

      {topPost && (
        <Card data-testid="card-top-post">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top Performing Post This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="capitalize shrink-0">{topPost.platform}</Badge>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{topPost.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {topPost.engagement} total interactions &middot; {new Date(topPost.postedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-total-posts">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts <HelpTooltip text="The total number of posts you've published across all connected platforms." /></CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-posts">{totalPosts}</div>
          </CardContent>
        </Card>

        <Card data-testid="card-total-engagement">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Engagement <HelpTooltip text="Combined likes, shares, comments, and clicks across all your published posts." /></CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-engagement">
              {formatNumber(totalEngagement)}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-ai-generated">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI-Generated <HelpTooltip text="The percentage of your posts that were written by AI versus ones you wrote manually." /></CardTitle>
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
            <CardTitle className="text-sm font-medium">Avg Engagement <HelpTooltip text="The average number of interactions (likes, shares, comments) each post receives." /></CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-avg-engagement">{avgEngagement}</div>
            <p className="text-xs text-muted-foreground">per post</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {dailyTrend.length > 0 && (
          <Card data-testid="card-daily-engagement-trend">
            <CardHeader>
              <CardTitle className="text-base">Daily Engagement (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 12 }} tickFormatter={(v) => new Date(v + 'T00:00:00').toLocaleDateString('default', { weekday: 'short' })} />
                    <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                    <Tooltip content={<ThemedChartTooltip valueLabel="engagement" />} cursor={false} />
                    <Bar dataKey="engagement" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {postsPerMonth.length > 0 && (
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
                    <Tooltip content={<ThemedChartTooltip valueLabel="count" />} cursor={false} />
                    <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {platformData.length > 0 && (
        <Card data-testid="card-platform-breakdown">
          <CardHeader>
            <CardTitle className="text-base">Performance by Platform (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Platform</th>
                    <th className="text-right py-2 font-medium">Posts</th>
                    <th className="text-right py-2 font-medium">Likes</th>
                    <th className="text-right py-2 font-medium">Comments</th>
                    <th className="text-right py-2 font-medium">Shares</th>
                    <th className="text-right py-2 font-medium">Impressions</th>
                    <th className="text-right py-2 font-medium">Avg Eng.</th>
                  </tr>
                </thead>
                <tbody>
                  {platformData.map((p) => (
                    <tr key={p.platform} className="border-b last:border-0" data-testid={`row-platform-${p.platform}`}>
                      <td className="py-2 capitalize font-medium">{p.platform}</td>
                      <td className="py-2 text-right">{p.posts}</td>
                      <td className="py-2 text-right">{formatNumber(p.likes)}</td>
                      <td className="py-2 text-right">{formatNumber(p.comments)}</td>
                      <td className="py-2 text-right">{formatNumber(p.shares)}</td>
                      <td className="py-2 text-right">{formatNumber(p.impressions)}</td>
                      <td className="py-2 text-right font-medium">{p.avgEngagement}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card data-testid="card-ai-vs-manual">
        <CardHeader>
          <CardTitle className="text-base">AI vs. Manual Performance <HelpTooltip text="Compares how AI-written posts perform against ones you wrote yourself, so you can see which approach gets more engagement." /></CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={`p-4 rounded-md border ${winner === 'ai' ? 'ring-2 ring-primary' : ''}`} data-testid="section-ai-performance">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">AI-Generated</span>
                {winner === 'ai' && <Badge variant="default" className="text-xs">Top Performer</Badge>}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">Posts</span>
                  <span className="text-sm font-medium" data-testid="text-ai-post-count">{aiPosts.length}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">Avg. Engagement</span>
                  <span className="text-sm font-medium" data-testid="text-ai-avg-engagement">{aiAvgEng.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className={`p-4 rounded-md border ${winner === 'manual' ? 'ring-2 ring-primary' : ''}`} data-testid="section-manual-performance">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Manually Written</span>
                {winner === 'manual' && <Badge variant="default" className="text-xs">Top Performer</Badge>}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">Posts</span>
                  <span className="text-sm font-medium" data-testid="text-manual-post-count">{manualPosts.length}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">Avg. Engagement</span>
                  <span className="text-sm font-medium" data-testid="text-manual-avg-engagement">{manualAvgEng.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
