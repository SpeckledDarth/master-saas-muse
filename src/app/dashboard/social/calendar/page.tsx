'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Loader2, ChevronLeft, ChevronRight, CalendarDays, AlertCircle, List, Clock, Send, LayoutGrid } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { DEMO_POSTS } from '@/lib/social/demo-data'
import { PostDetailDialog, PostDetailData } from '@/components/social/post-detail-dialog'
import { PlatformIconCircle } from '@/components/social/platform-icon'
import { HelpTooltip } from '@/components/social/help-tooltip'

interface CalendarPost {
  id: string
  platform: string
  content: string
  status: string
  scheduled_at: string | null
  posted_at: string | null
  created_at: string
}

function getPlatformDotClass(platform: string): string {
  if (platform === 'twitter') return 'bg-chart-1'
  if (platform === 'linkedin') return 'bg-chart-2'
  if (platform === 'facebook') return 'bg-chart-3'
  if (platform === 'blog') return 'bg-chart-4'
  return 'bg-muted-foreground'
}

function getPlatformBadgeClass(platform: string): string {
  if (platform === 'twitter') return 'text-chart-1 border-chart-1'
  if (platform === 'linkedin') return 'text-chart-2 border-chart-2'
  if (platform === 'facebook') return 'text-chart-3 border-chart-3'
  if (platform === 'blog') return 'text-chart-4 border-chart-4'
  return ''
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
  blog: 'Blog Article',
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
  const [selectedDate, setSelectedDate] = useState<string | null>(() => toDateKey(new Date()))
  const [platformFilter, setPlatformFilter] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'quarter'>('quarter')
  const [detailPost, setDetailPost] = useState<PostDetailData | null>(null)
  const { toast } = useToast()

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()

  const fetchPosts = useCallback(async () => {
    try {
      const [socialRes, blogRes] = await Promise.all([
        fetch('/api/social/posts?limit=200'),
        fetch('/api/social/blog/posts?limit=200').catch(() => null),
      ])

      let socialPosts: CalendarPost[] = []
      if (socialRes.ok) {
        let data
        try { data = await socialRes.json() } catch { data = {} }
        socialPosts = data.posts || []
      }

      let blogPosts: CalendarPost[] = []
      if (blogRes && blogRes.ok) {
        try {
          const blogData = await blogRes.json()
          const statusMap: Record<string, string> = { published: 'posted', publishing: 'posting' }
          blogPosts = (blogData.posts || []).map((bp: any) => ({
            id: bp.id,
            platform: 'blog',
            content: bp.title || 'Untitled Article',
            status: statusMap[bp.status] || bp.status,
            scheduled_at: bp.scheduled_at,
            posted_at: bp.published_at,
            created_at: bp.created_at,
          }))
        } catch {}
      }

      const allPosts = [...socialPosts, ...blogPosts]
      setPosts(allPosts.length > 0 ? allPosts : DEMO_POSTS as unknown as CalendarPost[])
    } catch {
      setPosts(DEMO_POSTS as unknown as CalendarPost[])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const calendarPosts = useMemo(() => posts.filter(p => p.scheduled_at || p.posted_at), [posts])

  const availablePlatforms = useMemo(() => {
    const platforms = new Set(calendarPosts.map(p => p.platform))
    return Array.from(platforms).sort()
  }, [calendarPosts])

  const postsByDate = useMemo(() => {
    const filtered = platformFilter
      ? calendarPosts.filter(p => p.platform === platformFilter)
      : calendarPosts
    const map: Record<string, CalendarPost[]> = {}
    for (const post of filtered) {
      const dateStr = post.scheduled_at || post.posted_at
      if (!dateStr) continue
      const date = new Date(dateStr)
      const key = toDateKey(date)
      if (!map[key]) map[key] = []
      map[key].push(post)
    }
    return map
  }, [calendarPosts, platformFilter])

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

  const weekDays = useMemo(() => {
    const start = new Date(currentDate)
    start.setDate(start.getDate() - start.getDay())
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [currentDate])

  const quarterMonths = useMemo(() => {
    return [-1, 0, 1].map(offset => {
      const year = currentYear + Math.floor((currentMonth + offset) / 12)
      const month = ((currentMonth + offset) % 12 + 12) % 12
      const daysInMonth = getDaysInMonth(year, month)
      const firstDay = getFirstDayOfMonth(year, month)
      const prevMonthDays = getDaysInMonth(year, month - 1)

      const days: { date: Date; isCurrentMonth: boolean }[] = []

      for (let i = firstDay - 1; i >= 0; i--) {
        days.push({
          date: new Date(year, month - 1, prevMonthDays - i),
          isCurrentMonth: false,
        })
      }

      for (let i = 1; i <= daysInMonth; i++) {
        days.push({
          date: new Date(year, month, i),
          isCurrentMonth: true,
        })
      }

      const remaining = 7 - (days.length % 7)
      if (remaining < 7) {
        for (let i = 1; i <= remaining; i++) {
          days.push({
            date: new Date(year, month + 1, i),
            isCurrentMonth: false,
          })
        }
      }

      const label = new Date(year, month, 1).toLocaleString('default', { month: 'long', year: 'numeric' })
      return { year, month, days, label }
    })
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
      <div className="p-6">
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
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Post Calendar <HelpTooltip text="See all your scheduled and published posts laid out on a calendar." /></h1>
        <p className="text-muted-foreground mt-1" data-testid="text-page-description">
          View your scheduled and published posts on your content calendar
          <HelpTooltip text="Switch between quarter, month, and week views. Click any day to see its posts. Use the platform filter to focus on one network." />
        </p>
        <div className="flex items-center gap-2 mt-3" data-testid="view-toggle">
          <Button
            variant={viewMode === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('month')}
            data-testid="button-view-month"
            className="toggle-elevate"
          >
            <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
            Month
          </Button>
          <Button
            variant={viewMode === 'quarter' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('quarter')}
            data-testid="button-view-quarter"
            className="toggle-elevate"
          >
            <LayoutGrid className="mr-1.5 h-3.5 w-3.5" />
            Quarter
          </Button>
          <Button
            variant={viewMode === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('week')}
            data-testid="button-view-week"
            className="toggle-elevate"
          >
            <List className="mr-1.5 h-3.5 w-3.5" />
            Week
          </Button>
        </div>
      </div>

      {calendarPosts.length > 0 && (
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

      {calendarPosts.length === 0 ? (
        <Card data-testid="empty-state-calendar">
          <CardContent className="py-12 text-center">
            <div className="flex items-center justify-center gap-3 mb-4" data-testid="empty-icon-composition">
              <Clock className="h-8 w-8 text-muted-foreground/40" />
              <CalendarDays className="h-12 w-12 text-muted-foreground" />
              <Send className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-medium" data-testid="text-empty-calendar">No posts yet</h3>
            <p className="text-muted-foreground mt-1">
              Create and schedule posts to see them on your content calendar.
            </p>
            <Button className="mt-4" asChild data-testid="button-create-scheduled-post">
              <Link href="/dashboard/social/posts">Create a Post</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === 'month' && (
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
                              className={`block h-2 w-2 rounded-full ${getPlatformDotClass(platform)}`}
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
                      {dayPosts.length > 1 && (
                        <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground" data-testid={`count-${dateKey}`}>
                          {dayPosts.length}
                        </span>
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
                                className={`block h-1.5 w-1.5 flex-shrink-0 rounded-full ${getPlatformDotClass(platform)}`}
                              />
                              <span>{count} {PLATFORM_NAMES[platform] || platform}</span>
                            </div>
                          ))}
                        </div>
                        {dayPosts.slice(0, 3).map(post => (
                          <div key={post.id} className="flex items-start gap-1.5">
                            <span
                              className={`mt-1 block h-1.5 w-1.5 flex-shrink-0 rounded-full ${getPlatformDotClass(post.platform)}`}
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
          )}

          {viewMode === 'month' && selectedDate && (
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
                        className="flex items-start gap-3 p-3 rounded-md border cursor-pointer hover-elevate active-elevate-2"
                        onClick={() => setDetailPost(post)}
                        data-testid={`card-post-${post.id}`}
                      >
                        <PlatformIconCircle platform={post.platform} size="sm" />
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

          {viewMode === 'quarter' && (
            <div data-testid="card-quarter-view">
              <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentDate(new Date(currentYear, currentMonth - 3, 1))}
                  data-testid="button-prev-quarter"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold" data-testid="text-quarter-range">
                    {quarterMonths[0].label} &ndash; {quarterMonths[2].label}
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToToday}
                    data-testid="button-today-quarter"
                  >
                    Today
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentDate(new Date(currentYear, currentMonth + 3, 1))}
                  data-testid="button-next-quarter"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="quarter-grid">
                {quarterMonths.map(qm => (
                  <Card key={`${qm.year}-${qm.month}`} className="overflow-visible">
                    <CardContent className="p-4">
                      <h3
                        className="text-base font-semibold text-center mb-3"
                        data-testid={`text-quarter-month-${qm.year}-${qm.month}`}
                      >
                        {new Date(qm.year, qm.month, 1).toLocaleString('default', { month: 'long' })}
                      </h3>
                      <div className="grid grid-cols-7">
                        {DAYS_OF_WEEK.map(day => (
                          <div
                            key={day}
                            className="text-center text-sm font-medium text-muted-foreground py-1.5"
                          >
                            {day}
                          </div>
                        ))}
                        {qm.days.map(({ date, isCurrentMonth }, index) => {
                          const dateKey = toDateKey(date)
                          const dayPosts = postsByDate[dateKey] || []
                          const isToday = dateKey === todayKey
                          const isSelected = dateKey === selectedDate
                          const uniquePlatforms = [...new Set(dayPosts.map(p => p.platform))]

                          return (
                            <button
                              key={index}
                              onClick={() => setSelectedDate(dateKey)}
                              className={`
                                relative flex flex-col items-center justify-center py-1.5 rounded-md text-sm transition-colors
                                ${isCurrentMonth ? '' : 'opacity-30'}
                                ${isToday ? 'ring-1 ring-primary font-bold' : ''}
                                ${isSelected ? 'bg-accent' : ''}
                                ${!isSelected ? 'hover-elevate' : ''}
                              `}
                              data-testid={`button-quarter-day-${dateKey}`}
                            >
                              <span className={isToday ? 'text-primary-600 dark:text-primary-400' : ''}>
                                {date.getDate()}
                              </span>
                              {uniquePlatforms.length > 0 && (
                                <div className="flex gap-0.5 mt-0.5">
                                  {uniquePlatforms.slice(0, 3).map(platform => (
                                    <span
                                      key={platform}
                                      className={`block h-1.5 w-1.5 rounded-full ${getPlatformDotClass(platform)}`}
                                    />
                                  ))}
                                  {uniquePlatforms.length > 3 && (
                                    <span className="text-[8px] text-muted-foreground leading-none">+</span>
                                  )}
                                </div>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {viewMode === 'quarter' && selectedDate && (
            <Card data-testid="card-selected-day-quarter">
              <CardHeader>
                <CardTitle className="text-base" data-testid="text-selected-date-quarter">
                  Posts for {new Date(selectedDate + 'T00:00:00').toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDayPosts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4" data-testid="text-no-posts-day-quarter">
                    No posts scheduled for this day
                  </p>
                ) : (
                  <div className="space-y-3" data-testid="list-day-posts-quarter">
                    {selectedDayPosts.map(post => (
                      <div
                        key={post.id}
                        className="flex items-start gap-3 p-3 rounded-md border cursor-pointer hover-elevate active-elevate-2"
                        onClick={() => setDetailPost(post)}
                        data-testid={`card-post-quarter-${post.id}`}
                      >
                        <PlatformIconCircle platform={post.platform} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm" data-testid={`text-content-quarter-${post.id}`}>
                            {post.content.length > 100
                              ? post.content.slice(0, 100) + '...'
                              : post.content}
                          </p>
                          {post.scheduled_at && (
                            <p className="text-xs text-muted-foreground mt-1" data-testid={`text-time-quarter-${post.id}`}>
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
                          data-testid={`badge-status-quarter-${post.id}`}
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

          {viewMode === 'week' && (
            <Card data-testid="card-week-view">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date(currentDate.getTime() - 7 * 86400000))} data-testid="button-prev-week">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg" data-testid="text-week-range">
                      {weekDays[0].toLocaleDateString('default', { month: 'short', day: 'numeric' })} - {weekDays[6].toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={goToToday} data-testid="button-today-week">Today</Button>
                  </div>
                  <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date(currentDate.getTime() + 7 * 86400000))} data-testid="button-next-week">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2" data-testid="week-list">
                  {weekDays.map(day => {
                    const dateKey = toDateKey(day)
                    const dayPosts = postsByDate[dateKey] || []
                    const isToday = dateKey === todayKey
                    return (
                      <div key={dateKey} className={`p-3 rounded-md border ${isToday ? 'ring-2 ring-primary' : ''}`} data-testid={`week-day-${dateKey}`}>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-sm font-medium">{day.toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                          <Badge variant="outline" className="text-xs">{dayPosts.length} post{dayPosts.length !== 1 ? 's' : ''}</Badge>
                        </div>
                        {dayPosts.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No posts</p>
                        ) : (
                          <div className="space-y-1.5">
                            {dayPosts.map(post => (
                              <div key={post.id} className="flex items-center gap-2 text-xs cursor-pointer hover-elevate active-elevate-2 rounded-sm p-1 -m-1" onClick={() => setDetailPost(post)}>
                                <span className={`block h-2 w-2 rounded-full shrink-0 ${getPlatformDotClass(post.platform)}`} />
                                <span className="truncate flex-1">{post.content}</span>
                                <Badge variant={STATUS_VARIANT[post.status] || 'outline'} className="text-xs shrink-0">{post.status}</Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
      <PostDetailDialog
        post={detailPost}
        open={!!detailPost}
        onOpenChange={(open) => { if (!open) setDetailPost(null) }}
      />
    </div>
  )
}
