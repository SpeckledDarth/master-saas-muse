'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  CalendarCheck, Repeat, Layers, Clock, Leaf, AlertTriangle,
  TrendingDown, RefreshCw, Loader2, ArrowLeft, BookOpen, Sparkles,
  FileText, Send,
} from 'lucide-react'
import { HelpTooltip } from '@/components/social/help-tooltip'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

interface BlogArticle {
  id: string
  title: string
  status: string
}

interface CalendarItem {
  date: string
  platform: string
  content: string
  type: string
}

interface BatchResult {
  articleId: string
  articleTitle: string
  snippets: { platform: string; content: string }[]
}

interface ThreadTweet {
  index: number
  content: string
}

interface RepurposeChainResult {
  socialSnippets: { platform: string; content: string }[]
  thread: string[]
  emailBlurb: string
  linkedinSummary: string
  instagramCaption: string
}

interface CrossPostTiming {
  platform: string
  staggerDelay: string
  reason: string
}

interface EvergreenArticle {
  id: string
  title: string
  score: number
  label: 'Evergreen' | 'Seasonal' | 'Dated'
  reason: string
}

interface StaleDraft {
  id: string
  title: string
  type: string
  daysOld: number
}

interface DecayAlert {
  id: string
  title: string
  dropPercentage: number
  suggestion: string
}

interface RecyclablePost {
  id: string
  title: string
  engagementScore: number
  suggestedRecycleDate: string
}

const PLATFORM_LABELS: Record<string, string> = {
  twitter: 'Twitter',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
}

const EVERGREEN_COLORS: Record<string, string> = {
  Evergreen: 'default',
  Seasonal: 'secondary',
  Dated: 'destructive',
}

export default function ContentAutomationPage() {
  const { toast } = useToast()

  const [articles, setArticles] = useState<BlogArticle[]>([])
  const [articlesLoading, setArticlesLoading] = useState(true)

  const [postsPerWeek, setPostsPerWeek] = useState(3)
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['twitter'])
  const [weeksAhead, setWeeksAhead] = useState(2)
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([])
  const [savingCalendar, setSavingCalendar] = useState(false)

  const [selectedArticleIds, setSelectedArticleIds] = useState<string[]>([])
  const [batchLoading, setBatchLoading] = useState(false)
  const [batchResults, setBatchResults] = useState<BatchResult[]>([])

  const [threadArticleId, setThreadArticleId] = useState('')
  const [threadLoading, setThreadLoading] = useState(false)
  const [threadResult, setThreadResult] = useState<ThreadTweet[]>([])

  const [repurposeArticleId, setRepurposeArticleId] = useState('')
  const [repurposeLoading, setRepurposeLoading] = useState(false)
  const [repurposeResult, setRepurposeResult] = useState<RepurposeChainResult | null>(null)

  const [crosspostTiming, setCrosspostTiming] = useState<CrossPostTiming[]>([])
  const [crosspostLoading, setCrosspostLoading] = useState(true)

  const [evergreenResults, setEvergreenResults] = useState<EvergreenArticle[]>([])
  const [evergreenLoading, setEvergreenLoading] = useState(false)

  const [staleDrafts, setStaleDrafts] = useState<StaleDraft[]>([])
  const [draftsLoading, setDraftsLoading] = useState(true)

  const [decayAlerts, setDecayAlerts] = useState<DecayAlert[]>([])
  const [decayLoading, setDecayLoading] = useState(true)

  const [recyclingQueue, setRecyclingQueue] = useState<RecyclablePost[]>([])
  const [recyclingLoading, setRecyclingLoading] = useState(true)

  const fetchJSON = useCallback(async (url: string) => {
    try {
      const res = await fetch(url)
      if (!res.ok) return null
      return await res.json()
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    const loadInitialData = async () => {
      const [articlesData, crosspostData, draftsData, decayData, recyclingData] = await Promise.all([
        fetchJSON('/api/social/blog/posts'),
        fetchJSON('/api/social/automation/crosspost-timing'),
        fetchJSON('/api/social/automation/draft-warnings'),
        fetchJSON('/api/social/automation/content-decay'),
        fetchJSON('/api/social/automation/recycling-queue'),
      ])

      setArticles(articlesData?.articles || articlesData?.posts || [])
      setArticlesLoading(false)

      setCrosspostTiming(crosspostData?.recommendations || crosspostData?.timings || [])
      setCrosspostLoading(false)

      setStaleDrafts(draftsData?.drafts || draftsData?.warnings || [])
      setDraftsLoading(false)

      setDecayAlerts(decayData?.alerts || [])
      setDecayLoading(false)

      setRecyclingQueue(recyclingData?.queue || recyclingData?.posts || [])
      setRecyclingLoading(false)
    }
    loadInitialData()
  }, [fetchJSON])

  const handleFillCalendar = async () => {
    if (selectedPlatforms.length === 0) {
      toast({ title: 'Error', description: 'Select at least one platform', variant: 'destructive' })
      return
    }
    setCalendarLoading(true)
    setCalendarItems([])
    try {
      const res = await fetch('/api/social/automation/calendar-autopilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postsPerWeek, platforms: selectedPlatforms, weeksAhead }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to generate calendar')
      }
      const data = await res.json()
      setCalendarItems(data.items || data.calendar || [])
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setCalendarLoading(false)
    }
  }

  const handleSaveCalendar = async () => {
    setSavingCalendar(true)
    try {
      const res = await fetch('/api/social/automation/calendar-autopilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postsPerWeek, platforms: selectedPlatforms, weeksAhead, save: true, items: calendarItems }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save calendar')
      }
      toast({ title: 'Saved', description: `${calendarItems.length} posts added to your calendar` })
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setSavingCalendar(false)
    }
  }

  const handleBatchRepurpose = async () => {
    if (selectedArticleIds.length === 0) {
      toast({ title: 'Error', description: 'Select at least one article', variant: 'destructive' })
      return
    }
    if (selectedArticleIds.length > 5) {
      toast({ title: 'Error', description: 'Maximum 5 articles at a time', variant: 'destructive' })
      return
    }
    setBatchLoading(true)
    setBatchResults([])
    try {
      const res = await fetch('/api/social/automation/batch-repurpose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleIds: selectedArticleIds }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to batch repurpose')
      }
      const data = await res.json()
      setBatchResults(data.results || [])
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setBatchLoading(false)
    }
  }

  const handleBlogToThread = async () => {
    if (!threadArticleId) {
      toast({ title: 'Error', description: 'Select an article', variant: 'destructive' })
      return
    }
    setThreadLoading(true)
    setThreadResult([])
    try {
      const res = await fetch('/api/social/automation/blog-to-thread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId: threadArticleId }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to convert to thread')
      }
      const data = await res.json()
      setThreadResult(data.thread || data.tweets || [])
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setThreadLoading(false)
    }
  }

  const handleRepurposeChains = async () => {
    if (!repurposeArticleId) {
      toast({ title: 'Error', description: 'Select an article', variant: 'destructive' })
      return
    }
    setRepurposeLoading(true)
    setRepurposeResult(null)
    try {
      const res = await fetch('/api/social/automation/repurpose-chains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId: repurposeArticleId }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to repurpose')
      }
      const data = await res.json()
      setRepurposeResult(data)
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setRepurposeLoading(false)
    }
  }

  const handleEvergreenScan = async () => {
    setEvergreenLoading(true)
    setEvergreenResults([])
    try {
      const data = await fetchJSON('/api/social/automation/evergreen-scan')
      setEvergreenResults(data?.articles || data?.results || [])
    } catch {
      toast({ title: 'Error', description: 'Failed to scan articles', variant: 'destructive' })
    } finally {
      setEvergreenLoading(false)
    }
  }

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
    )
  }

  const toggleArticleSelection = (id: string) => {
    setSelectedArticleIds(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-row items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-automation-title">
            Content Automation <HelpTooltip text="Automate your content creation, repurposing, and distribution with AI-powered tools." />
          </h1>
          <p className="text-muted-foreground mt-1" data-testid="text-automation-description">
            Automate your content creation and distribution workflow
          </p>
        </div>
        <Link href="/dashboard/social/overview">
          <Button variant="outline" data-testid="button-back-overview">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Overview
          </Button>
        </Link>
      </div>

      <Card data-testid="card-calendar-autopilot">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
            Calendar Autopilot
            <HelpTooltip text="Automatically fill your content calendar with AI-generated posts across your selected platforms." />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="posts-per-week">Posts per Week</Label>
              <Input
                id="posts-per-week"
                type="number"
                min={1}
                max={21}
                value={postsPerWeek}
                onChange={(e) => setPostsPerWeek(Number(e.target.value))}
                data-testid="input-posts-per-week"
              />
            </div>
            <div className="space-y-2">
              <Label>Platforms</Label>
              <div className="flex flex-col gap-2">
                {['twitter', 'linkedin', 'facebook'].map(platform => (
                  <div key={platform} className="flex items-center gap-2">
                    <Checkbox
                      id={`platform-${platform}`}
                      checked={selectedPlatforms.includes(platform)}
                      onCheckedChange={() => togglePlatform(platform)}
                      data-testid={`checkbox-platform-${platform}`}
                    />
                    <Label htmlFor={`platform-${platform}`} className="text-sm font-normal cursor-pointer">
                      {PLATFORM_LABELS[platform]}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="weeks-ahead">Weeks Ahead</Label>
              <Input
                id="weeks-ahead"
                type="number"
                min={1}
                max={8}
                value={weeksAhead}
                onChange={(e) => setWeeksAhead(Number(e.target.value))}
                data-testid="input-weeks-ahead"
              />
            </div>
          </div>
          <Button onClick={handleFillCalendar} disabled={calendarLoading} data-testid="button-fill-calendar">
            {calendarLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarCheck className="mr-2 h-4 w-4" />}
            Fill My Calendar
          </Button>

          {calendarItems.length > 0 && (
            <div className="mt-4 space-y-3 border-t pt-4" data-testid="section-calendar-results">
              <div className="space-y-2">
                {calendarItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-md border" data-testid={`calendar-item-${i}`}>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                      <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground" data-testid={`text-calendar-date-${i}`}>{item.date}</span>
                        <Badge variant="secondary" className="text-xs" data-testid={`badge-calendar-platform-${i}`}>
                          {PLATFORM_LABELS[item.platform] || item.platform}
                        </Badge>
                        {item.type && (
                          <Badge variant="outline" className="text-xs" data-testid={`badge-calendar-type-${i}`}>{item.type}</Badge>
                        )}
                      </div>
                      <p className="text-sm mt-1 line-clamp-2" data-testid={`text-calendar-content-${i}`}>{item.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button onClick={handleSaveCalendar} disabled={savingCalendar} data-testid="button-save-calendar">
                {savingCalendar ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Save All
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-batch-repurpose">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <Repeat className="h-4 w-4 text-muted-foreground" />
            Batch Repurpose
            <HelpTooltip text="Select multiple blog articles and repurpose them all into social media snippets at once. Maximum 5 articles per batch." />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {articlesLoading ? (
            <div className="flex items-center justify-center py-8" data-testid="loading-articles">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : articles.length > 0 ? (
            <>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {articles.map(article => (
                  <div key={article.id} className="flex items-center gap-3 p-2 rounded-md border" data-testid={`batch-article-${article.id}`}>
                    <Checkbox
                      id={`batch-${article.id}`}
                      checked={selectedArticleIds.includes(article.id)}
                      onCheckedChange={() => toggleArticleSelection(article.id)}
                      disabled={!selectedArticleIds.includes(article.id) && selectedArticleIds.length >= 5}
                      data-testid={`checkbox-batch-${article.id}`}
                    />
                    <div className="flex-1 min-w-0">
                      <Label htmlFor={`batch-${article.id}`} className="text-sm font-normal cursor-pointer truncate block">
                        {article.title}
                      </Label>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0" data-testid={`badge-batch-status-${article.id}`}>
                      {article.status}
                    </Badge>
                  </div>
                ))}
              </div>
              <Button
                onClick={handleBatchRepurpose}
                disabled={batchLoading || selectedArticleIds.length === 0}
                data-testid="button-batch-repurpose"
              >
                {batchLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Repeat className="mr-2 h-4 w-4" />}
                Repurpose Selected ({selectedArticleIds.length})
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground py-4">No blog articles found. Create some articles first.</p>
          )}

          {batchResults.length > 0 && (
            <div className="mt-4 space-y-4 border-t pt-4" data-testid="section-batch-results">
              {batchResults.map((result, i) => (
                <div key={i} className="space-y-2" data-testid={`batch-result-${i}`}>
                  <p className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    {result.articleTitle}
                  </p>
                  <div className="space-y-1.5 pl-5">
                    {result.snippets.map((snippet, j) => (
                      <div key={j} className="p-2 rounded-md border text-sm" data-testid={`batch-snippet-${i}-${j}`}>
                        <Badge variant="secondary" className="text-xs mb-1">{PLATFORM_LABELS[snippet.platform] || snippet.platform}</Badge>
                        <p className="text-muted-foreground">{snippet.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-blog-to-thread">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              Blog-to-Thread Converter
              <HelpTooltip text="Convert a blog article into a Twitter/X thread format with numbered tweets." />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Article</Label>
              <Select value={threadArticleId} onValueChange={setThreadArticleId}>
                <SelectTrigger data-testid="select-thread-article">
                  <SelectValue placeholder="Choose an article" />
                </SelectTrigger>
                <SelectContent>
                  {articles.map(article => (
                    <SelectItem key={article.id} value={article.id}>{article.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleBlogToThread} disabled={threadLoading || !threadArticleId} data-testid="button-convert-thread">
              {threadLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Layers className="mr-2 h-4 w-4" />}
              Convert to Thread
            </Button>

            {threadResult.length > 0 && (
              <div className="mt-4 space-y-2 border-t pt-4" data-testid="section-thread-results">
                {threadResult.map((tweet, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-md border" data-testid={`thread-tweet-${i}`}>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium shrink-0">
                      {tweet.index || i + 1}
                    </span>
                    <p className="text-sm">{tweet.content}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-repurpose-chains">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              Repurpose Chains
              <HelpTooltip text="Transform a single blog article into multiple content formats: social snippets, threads, email blurbs, LinkedIn summaries, and Instagram captions." />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Article</Label>
              <Select value={repurposeArticleId} onValueChange={setRepurposeArticleId}>
                <SelectTrigger data-testid="select-repurpose-article">
                  <SelectValue placeholder="Choose an article" />
                </SelectTrigger>
                <SelectContent>
                  {articles.map(article => (
                    <SelectItem key={article.id} value={article.id}>{article.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleRepurposeChains} disabled={repurposeLoading || !repurposeArticleId} data-testid="button-full-repurpose">
              {repurposeLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Full Repurpose
            </Button>

            {repurposeResult && (
              <div className="mt-4 space-y-4 border-t pt-4" data-testid="section-repurpose-results">
                {repurposeResult.socialSnippets && repurposeResult.socialSnippets.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Social Snippets</p>
                    {repurposeResult.socialSnippets.map((snippet, i) => (
                      <div key={i} className="p-2 rounded-md border text-sm" data-testid={`repurpose-snippet-${i}`}>
                        <Badge variant="secondary" className="text-xs mb-1">{PLATFORM_LABELS[snippet.platform] || snippet.platform}</Badge>
                        <p className="text-muted-foreground">{snippet.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {repurposeResult.thread && repurposeResult.thread.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Thread</p>
                    {repurposeResult.thread.map((tweet, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm" data-testid={`repurpose-thread-${i}`}>
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-medium shrink-0">{i + 1}</span>
                        <p className="text-muted-foreground">{tweet}</p>
                      </div>
                    ))}
                  </div>
                )}

                {repurposeResult.emailBlurb && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Email Blurb</p>
                    <p className="text-sm text-muted-foreground p-2 rounded-md border" data-testid="text-repurpose-email">{repurposeResult.emailBlurb}</p>
                  </div>
                )}

                {repurposeResult.linkedinSummary && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">LinkedIn Summary</p>
                    <p className="text-sm text-muted-foreground p-2 rounded-md border" data-testid="text-repurpose-linkedin">{repurposeResult.linkedinSummary}</p>
                  </div>
                )}

                {repurposeResult.instagramCaption && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Instagram Caption</p>
                    <p className="text-sm text-muted-foreground p-2 rounded-md border" data-testid="text-repurpose-instagram">{repurposeResult.instagramCaption}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-crosspost-timing">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Cross-Post Timing
              <HelpTooltip text="Optimal stagger timing recommendations for cross-posting content across multiple platforms." />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {crosspostLoading ? (
              <div className="flex items-center justify-center py-8" data-testid="loading-crosspost-timing">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : crosspostTiming.length > 0 ? (
              <div className="space-y-3" data-testid="list-crosspost-timing">
                {crosspostTiming.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-md border" data-testid={`crosspost-timing-${i}`}>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium" data-testid={`text-crosspost-platform-${i}`}>
                          {PLATFORM_LABELS[item.platform] || item.platform}
                        </span>
                        <Badge variant="secondary" className="text-xs" data-testid={`badge-crosspost-delay-${i}`}>
                          {item.staggerDelay}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1" data-testid={`text-crosspost-reason-${i}`}>{item.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4">No timing recommendations available</p>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-evergreen-scanner">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Leaf className="h-4 w-4 text-muted-foreground" />
              Evergreen Scanner
              <HelpTooltip text="Analyze your articles to determine which are evergreen, seasonal, or dated. Prioritize promoting evergreen content." />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleEvergreenScan} disabled={evergreenLoading} data-testid="button-scan-articles">
              {evergreenLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Leaf className="mr-2 h-4 w-4" />}
              Scan Articles
            </Button>

            {evergreenResults.length > 0 && (
              <div className="space-y-2" data-testid="section-evergreen-results">
                {evergreenResults.map((article, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-md border" data-testid={`evergreen-article-${i}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium truncate" data-testid={`text-evergreen-title-${i}`}>{article.title}</span>
                        <Badge variant={EVERGREEN_COLORS[article.label] as any || 'outline'} className="text-xs" data-testid={`badge-evergreen-label-${i}`}>
                          {article.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground" data-testid={`text-evergreen-score-${i}`}>Score: {article.score}/100</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1" data-testid={`text-evergreen-reason-${i}`}>{article.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-draft-warnings">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              Draft Expiration Warnings
              <HelpTooltip text="Stale drafts that have been sitting too long. Review and publish or discard them." />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {draftsLoading ? (
              <div className="flex items-center justify-center py-8" data-testid="loading-draft-warnings">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : staleDrafts.length > 0 ? (
              <div className="space-y-2" data-testid="list-draft-warnings">
                {staleDrafts.map((draft, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-md border" data-testid={`draft-warning-${i}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium truncate" data-testid={`text-draft-title-${i}`}>{draft.title}</span>
                        <Badge variant="outline" className="text-xs" data-testid={`badge-draft-type-${i}`}>{draft.type}</Badge>
                        <span className="text-xs text-muted-foreground" data-testid={`text-draft-age-${i}`}>{draft.daysOld} days old</span>
                      </div>
                    </div>
                    <Link href={`/dashboard/social/posts?edit=${draft.id}`}>
                      <Button variant="ghost" size="sm" data-testid={`button-view-draft-${i}`}>
                        View
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4">No stale drafts found</p>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-content-decay">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
              Content Decay Alerts
              <HelpTooltip text="Posts that are losing engagement over time. Take action to refresh or update declining content." />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {decayLoading ? (
              <div className="flex items-center justify-center py-8" data-testid="loading-content-decay">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : decayAlerts.length > 0 ? (
              <div className="space-y-2" data-testid="list-content-decay">
                {decayAlerts.map((alert, i) => (
                  <div key={i} className="p-3 rounded-md border space-y-1" data-testid={`decay-alert-${i}`}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium truncate" data-testid={`text-decay-title-${i}`}>{alert.title}</span>
                      <Badge variant="destructive" className="text-xs" data-testid={`badge-decay-drop-${i}`}>
                        {alert.dropPercentage}% drop
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground" data-testid={`text-decay-suggestion-${i}`}>{alert.suggestion}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4">No content decay detected</p>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-recycling-queue">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
              Recycling Queue
              <HelpTooltip text="High-performing content that can be reshared. Shows engagement scores and suggested dates to recycle posts." />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recyclingLoading ? (
              <div className="flex items-center justify-center py-8" data-testid="loading-recycling-queue">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : recyclingQueue.length > 0 ? (
              <div className="space-y-2" data-testid="list-recycling-queue">
                {recyclingQueue.map((post, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-md border" data-testid={`recycling-post-${i}`}>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium truncate block" data-testid={`text-recycling-title-${i}`}>{post.title}</span>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs text-muted-foreground" data-testid={`text-recycling-score-${i}`}>
                          Engagement: {post.engagementScore}
                        </span>
                        <span className="text-xs text-muted-foreground" data-testid={`text-recycling-date-${i}`}>
                          Recycle: {post.suggestedRecycleDate}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4">No recyclable content found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}