'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Loader2, ChevronLeft, ChevronRight, CalendarDays, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { SocialUpgradeBanner } from '@/components/social-upgrade-banner'
import Link from 'next/link'

interface CalendarPost {
  id: string
  platform: string
  content: string
  status: string
  scheduled_at: string | null
  posted_at: string | null
  created_at: string
}

const PLATFORM_COLORS: Record<string, string> = {
  twitter: '#1DA1F2',
  linkedin: '#0A66C2',
  facebook: '#1877F2',
}

const PLATFORM_NAMES: Record<string, string> = {
  twitter: 'Twitter/X',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  instagram: 'Instagram',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  reddit: 'Reddit',
  pinterest: 'Pinterest',
  snapchat: 'Snapchat',
  discord: 'Discord',
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  scheduled: 'default',
  posted: 'secondary',
  draft: 'outline',
  failed: 'destructive',
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

export default function SocialCalendarPage() {
  const [posts, setPosts] = useState<CalendarPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [platformFilter, setPlatformFilter] = useState<string | null>(null)
  const { toast } = useToast()

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/social/posts?limit=200')
      if (!res.ok) { setPosts([]); setLoading(false); return }
      let data
      try { data = await res.json() } catch { data = {} }
      setPosts(data.posts || [])
    } catch {
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const scheduledPosts = useMemo(() => posts.filter(p => p.scheduled_at), [posts])

  const availablePlatforms = useMemo(() => {
    const platforms = new Set(scheduledPosts.map(p => p.platform))
    return Array.from(platforms).sort()
  }, [scheduledPosts])

  const postsByDate = useMemo(() => {
    const filtered = platformFilter
      ? posts.filter(p => p.platform === platformFilter)
      : posts
    const map: Record<string, CalendarPost[]> = {}
    for (const post of filtered) {
      if (!post.scheduled_at) continue
      const date = new Date(post.scheduled_at)
      const key = toDateKey(date)
      if (!map[key]) map[key] = []
      map[key].push(post)
    }
    return map
  }, [posts, platformFilter])

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth)
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
    const prevMonthDays = getDaysInMonth(currentYear, currentMonth - 1)

    const days: { date: Date; isCurrentMonth: boolean }[] = []

    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(currentYear, currentMonth - 1, prevMonthDays - i),
        isCurrentMonth: false,
      })
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(currentYear, currentMonth, i),
        isCurrentMonth: true,
      })
    }

    const remaining = 7 - (days.length % 7)
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        days.push({
          date: new Date(currentYear, currentMonth + 1, i),
          isCurrentMonth: false,
        })
      }
    }

    return days
  }, [currentYear, currentMonth])

  const todayKey = toDateKey(new Date())

  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(todayKey)
  }

  const selectedDayPosts = selectedDate ? (postsByDate[selectedDate] || []) : []

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-testid="loading-spinner">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Card data-testid="error-state-calendar">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Something went wrong</h3>
            <p className="text-muted-foreground mt-1">{error}</p>
            <Button className="mt-4" onClick={() => { setError(null); setLoading(true); fetchPosts() }} data-testid="button-retry-calendar">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
    <SocialUpgradeBanner />
    <div className="container max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Post Calendar</h1>
        <p className="text-muted-foreground mt-1" data-testid="text-page-description">
          View your scheduled social media posts on a calendar
        </p>
      </div>

      {scheduledPosts.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap" data-testid="filter-platforms">
          <Button
            variant={platformFilter === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPlatformFilter(null)}
            data-testid="button-filter-all"
          >
            All
          </Button>
          {availablePlatforms.map(platform => (
            <Button
              key={platform}
              variant={platformFilter === platform ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPlatformFilter(platformFilter === platform ? null : platform)}
              data-testid={`button-filter-${platform}`}
            >
              {PLATFORM_NAMES[platform] || platform}
            </Button>
          ))}
        </div>
      )}

      {scheduledPosts.length === 0 ? (
        <Card data-testid="empty-state-calendar">
          <CardContent className="py-12 text-center">
            <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium" data-testid="text-empty-calendar">No scheduled posts</h3>
            <p className="text-muted-foreground mt-1">
              You have no posts with a scheduled date. Create a post with a scheduled time to see it here.
            </p>
            <Button className="mt-4" asChild data-testid="button-create-scheduled-post">
              <Link href="/dashboard/social/posts">Create a Post</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPrevMonth}
                  data-testid="button-prev-month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg" data-testid="text-current-month">{monthName}</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToToday}
                    data-testid="button-today"
                  >
                    Today
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToNextMonth}
                  data-testid="button-next-month"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <TooltipProvider delayDuration={300}>
              <div className="grid grid-cols-7 gap-px" data-testid="calendar-grid">
                {DAYS_OF_WEEK.map(day => (
                  <div
                    key={day}
                    className="text-center text-xs font-medium text-muted-foreground py-2"
                    data-testid={`text-day-header-${day}`}
                  >
                    {day}
                  </div>
                ))}

                {calendarDays.map(({ date, isCurrentMonth }, index) => {
                  const dateKey = toDateKey(date)
                  const dayPosts = postsByDate[dateKey] || []
                  const isToday = dateKey === todayKey
                  const isSelected = dateKey === selectedDate

                  const uniquePlatforms = [...new Set(dayPosts.map(p => p.platform))]

                  const dayCell = (
                    <button
                      onClick={() => setSelectedDate(dateKey)}
                      className={`
                        relative min-h-[60px] p-1 text-left rounded-md transition-colors
                        ${isCurrentMonth ? '' : 'opacity-40'}
                        ${isToday ? 'ring-2 ring-primary' : ''}
                        ${isSelected ? 'bg-accent' : ''}
                        ${!isSelected ? 'hover-elevate' : ''}
                      `}
                      data-testid={`button-day-${dateKey}`}
                    >
                      <span className={`text-xs font-medium ${isToday ? 'text-primary-600 dark:text-primary-400' : ''}`}>
                        {date.getDate()}
                      </span>
                      {uniquePlatforms.length > 0 && (
                        <div className="flex gap-0.5 mt-1 flex-wrap">
                          {uniquePlatforms.slice(0, 4).map(platform => (
                            <span
                              key={platform}
                              className="block h-2 w-2 rounded-full"
                              style={{ backgroundColor: PLATFORM_COLORS[platform] || 'hsl(var(--muted-foreground))' }}
                              data-testid={`dot-platform-${dateKey}-${platform}`}
                            />
                          ))}
                          {uniquePlatforms.length > 4 && (
                            <span className="text-[9px] text-muted-foreground leading-none">
                              +{uniquePlatforms.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  )

                  if (dayPosts.length === 0) {
                    return <div key={index}>{dayCell}</div>
                  }

                  return (
                    <Tooltip key={index}>
                      <TooltipTrigger asChild>{dayCell}</TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[240px] space-y-1.5 text-xs">
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 pb-1 border-b border-border/50">
                          {Object.entries(
                            dayPosts.reduce<Record<string, number>>((acc, p) => {
                              acc[p.platform] = (acc[p.platform] || 0) + 1
                              return acc
                            }, {})
                          ).map(([platform, count]) => (
                            <div key={platform} className="flex items-center gap-1">
                              <span
                                className="block h-1.5 w-1.5 flex-shrink-0 rounded-full"
                                style={{ backgroundColor: PLATFORM_COLORS[platform] || 'hsl(var(--muted-foreground))' }}
                              />
                              <span>{count} {PLATFORM_NAMES[platform] || platform}</span>
                            </div>
                          ))}
                        </div>
                        {dayPosts.slice(0, 3).map(post => (
                          <div key={post.id} className="flex items-start gap-1.5">
                            <span
                              className="mt-1 block h-1.5 w-1.5 flex-shrink-0 rounded-full"
                              style={{ backgroundColor: PLATFORM_COLORS[post.platform] || 'hsl(var(--muted-foreground))' }}
                            />
                            <span className="line-clamp-1">{post.content}</span>
                          </div>
                        ))}
                        {dayPosts.length > 3 && (
                          <p className="text-muted-foreground">+{dayPosts.length - 3} more</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
              </TooltipProvider>
            </CardContent>
          </Card>

          {selectedDate && (
            <Card data-testid="card-selected-day">
              <CardHeader>
                <CardTitle className="text-base" data-testid="text-selected-date">
                  Posts for {new Date(selectedDate + 'T00:00:00').toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDayPosts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4" data-testid="text-no-posts-day">
                    No posts scheduled for this day
                  </p>
                ) : (
                  <div className="space-y-3" data-testid="list-day-posts">
                    {selectedDayPosts.map(post => (
                      <div
                        key={post.id}
                        className="flex items-start gap-3 p-3 rounded-md border"
                        data-testid={`card-post-${post.id}`}
                      >
                        <Badge
                          variant="outline"
                          className="shrink-0"
                          style={{
                            borderColor: PLATFORM_COLORS[post.platform] || undefined,
                            color: PLATFORM_COLORS[post.platform] || undefined,
                          }}
                          data-testid={`badge-platform-${post.id}`}
                        >
                          {PLATFORM_NAMES[post.platform] || post.platform}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm" data-testid={`text-content-${post.id}`}>
                            {post.content.length > 100
                              ? post.content.slice(0, 100) + '...'
                              : post.content}
                          </p>
                          {post.scheduled_at && (
                            <p className="text-xs text-muted-foreground mt-1" data-testid={`text-time-${post.id}`}>
                              {new Date(post.scheduled_at).toLocaleTimeString('default', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          )}
                        </div>
                        <Badge
                          variant={STATUS_VARIANT[post.status] || 'outline'}
                          className="shrink-0"
                          data-testid={`badge-status-${post.id}`}
                        >
                          {post.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
    </>
  )
}
