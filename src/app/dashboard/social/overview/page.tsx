'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  Loader2,
  FileText,
  Sparkles,
  Link2,
  Shield,
  CalendarDays,
  BarChart3,
  Clock,
  Palette,
  Bell,
} from 'lucide-react'

interface SocialPost {
  id: string
  platform: string
  content: string
  status: string
  ai_generated: boolean
  created_at: string
}

interface SocialAccount {
  id: string
  platform: string
}

interface TierInfo {
  tier: string
  limits: {
    dailyAiGenerations: number
    dailyPosts: number
    monthlyPosts?: number
    maxPlatforms?: number
  }
}

const TIER_DISPLAY: Record<string, string> = {
  starter: 'Starter',
  basic: 'Basic',
  premium: 'Premium',
  universal: 'Universal',
  power: 'Power',
}

const QUICK_LINKS = [
  { label: 'Calendar', href: '/dashboard/social/calendar', icon: CalendarDays },
  { label: 'Engagement', href: '/dashboard/social/engagement', icon: BarChart3 },
  { label: 'Post Queue', href: '/dashboard/social/queue', icon: Clock },
  { label: 'Brand Preferences', href: '/dashboard/social/brand', icon: Palette },
]

function isCurrentMonth(dateStr: string): boolean {
  const date = new Date(dateStr)
  const now = new Date()
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
}

function isToday(dateStr: string): boolean {
  const date = new Date(dateStr)
  const now = new Date()
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

export default function SocialOverviewPage() {
  const [loading, setLoading] = useState(true)
  const [postsThisMonth, setPostsThisMonth] = useState(0)
  const [aiGensToday, setAiGensToday] = useState(0)
  const [connectedPlatforms, setConnectedPlatforms] = useState(0)
  const [tierName, setTierName] = useState('Starter')
  const { toast } = useToast()

  const fetchData = useCallback(async () => {
    const results = await Promise.allSettled([
      fetch('/api/social/posts?limit=200').then(r => r.ok ? r.json() : Promise.reject()),
      fetch('/api/social/accounts').then(r => r.ok ? r.json() : Promise.reject()),
      fetch('/api/social/tier').then(r => r.ok ? r.json() : Promise.reject()),
    ])

    if (results[0].status === 'fulfilled') {
      const posts: SocialPost[] = results[0].value.posts || []
      setPostsThisMonth(posts.filter(p => isCurrentMonth(p.created_at)).length)
      setAiGensToday(posts.filter(p => p.ai_generated && isToday(p.created_at)).length)
    }

    if (results[1].status === 'fulfilled') {
      const accounts: SocialAccount[] = results[1].value.accounts || []
      setConnectedPlatforms(accounts.length)
    }

    if (results[2].status === 'fulfilled') {
      const tierInfo: TierInfo = results[2].value
      setTierName(TIER_DISPLAY[tierInfo.tier] || tierInfo.tier)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-testid="loading-spinner">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Social Dashboard</h1>
        <p className="text-muted-foreground mt-1" data-testid="text-page-subtitle">
          Your social media overview at a glance
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-posts-this-month">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posts This Month</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-posts-this-month">{postsThisMonth}</div>
          </CardContent>
        </Card>

        <Card data-testid="card-ai-generations-today">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Generations Today</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-ai-generations-today">{aiGensToday}</div>
          </CardContent>
        </Card>

        <Card data-testid="card-connected-platforms">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Platforms</CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-connected-platforms">{connectedPlatforms}</div>
          </CardContent>
        </Card>

        <Card data-testid="card-current-tier">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Tier</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" data-testid="badge-current-tier">{tierName}</Badge>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-alerts">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-base">Trend Alerts</CardTitle>
          <Bell className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="py-6 text-center">
            <Bell className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-medium" data-testid="text-no-alerts">No alerts yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              When AI detects trending topics in your niche, alerts will appear here for quick action.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-quick-links">
        <CardHeader>
          <CardTitle className="text-base">Quick Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {QUICK_LINKS.map(link => {
              const Icon = link.icon
              return (
                <Button
                  key={link.href}
                  variant="outline"
                  asChild
                  data-testid={`link-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <Link href={link.href} className="flex flex-col items-center gap-2 h-auto py-4">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm">{link.label}</span>
                  </Link>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
