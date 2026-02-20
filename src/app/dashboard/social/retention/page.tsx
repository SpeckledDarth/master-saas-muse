'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Flame, Mail, FileText, Globe, Loader2, ArrowLeft, Copy, BookOpen,
} from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

interface StreakData {
  currentStreak: number
  longestStreak: number
  streakActive: boolean
  lastActivityDate: string | null
}

interface DigestPreview {
  postsCreated: number
  blogsWritten: number
  snippetsGenerated: number
  flywheelScore: number
  topPost: { id: string; content: string; engagement: number } | null
  suggestedNextBlogTopic: string | null
  streakCount: number
  recommendations: string[]
}

interface Template {
  id: string
  name: string
  platform: string
  content: string
  type: string
  industry: string
}

interface TemplatesData {
  templates: Template[]
  industries: string[]
}

interface ScorecardData {
  username: string
  postsPublished: number
  blogsWritten: number
  totalEngagement: number
  flywheelScore: number
  streak: number
  memberSince: string
}

const INDUSTRIES = [
  'Home Services',
  'Real Estate',
  'Restaurant',
  'E-commerce',
  'Professional Services',
  'Health & Fitness',
]

export default function EngagementRetentionPage() {
  const { toast } = useToast()

  const [streak, setStreak] = useState<StreakData | null>(null)
  const [streakLoading, setStreakLoading] = useState(true)

  const [digest, setDigest] = useState<DigestPreview | null>(null)
  const [digestLoading, setDigestLoading] = useState(true)

  const [templates, setTemplates] = useState<Template[]>([])
  const [industries, setIndustries] = useState<string[]>(INDUSTRIES)
  const [selectedIndustry, setSelectedIndustry] = useState(INDUSTRIES[0])
  const [templatesLoading, setTemplatesLoading] = useState(true)

  const [scorecardUsername, setScorecardUsername] = useState('')
  const [scorecard, setScorecard] = useState<ScorecardData | null>(null)
  const [scorecardLoading, setScorecardLoading] = useState(false)

  const fetchAutoData = useCallback(async () => {
    const fetchJSON = async (url: string) => {
      try {
        const res = await fetch(url)
        if (!res.ok) return null
        return await res.json()
      } catch {
        return null
      }
    }

    const [streakData, digestData, templatesData] = await Promise.all([
      fetchJSON('/api/social/engagement/streak'),
      fetchJSON('/api/social/engagement/digest-preview'),
      fetchJSON('/api/social/engagement/templates'),
    ])

    setStreak(streakData)
    setStreakLoading(false)

    setDigest(digestData)
    setDigestLoading(false)

    if (templatesData) {
      setTemplates(templatesData.templates || [])
      if (templatesData.industries?.length) {
        setIndustries(templatesData.industries)
        setSelectedIndustry(templatesData.industries[0])
      }
    }
    setTemplatesLoading(false)
  }, [])

  useEffect(() => { fetchAutoData() }, [fetchAutoData])

  const handleCopyTemplate = (content: string) => {
    navigator.clipboard.writeText(content)
    toast({ title: 'Copied', description: 'Template copied to clipboard' })
  }

  const handleViewScorecard = async () => {
    if (!scorecardUsername.trim()) {
      toast({ title: 'Error', description: 'Please enter a username', variant: 'destructive' })
      return
    }
    setScorecardLoading(true)
    setScorecard(null)
    try {
      const res = await fetch(`/api/social/engagement/scorecard/${encodeURIComponent(scorecardUsername.trim())}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to load scorecard')
      }
      const data = await res.json()
      setScorecard(data)
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setScorecardLoading(false)
    }
  }

  const filteredTemplates = templates.filter(t => t.industry === selectedIndustry)

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-row items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-retention-title">
            Engagement &amp; Retention
          </h1>
          <p className="text-muted-foreground mt-1" data-testid="text-retention-description">
            Stay consistent and keep your audience engaged
          </p>
        </div>
        <Link href="/dashboard/social/overview">
          <Button variant="outline" data-testid="button-back-overview">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Overview
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-content-streak">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Flame className="h-4 w-4 text-muted-foreground" />
              Content Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            {streakLoading ? (
              <div className="flex items-center justify-center py-8" data-testid="loading-streak">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : streak ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Flame className="h-10 w-10 text-orange-500" />
                  <div>
                    <p className="text-4xl font-bold" data-testid="text-streak-current">{streak.currentStreak}</p>
                    <p className="text-sm text-muted-foreground">day streak</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">Longest Streak</span>
                  <span className="text-sm font-medium" data-testid="text-streak-longest">{streak.longestStreak} days</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {streak.streakActive ? (
                    <Badge variant="secondary" data-testid="badge-streak-status">Active</Badge>
                  ) : (
                    <Badge variant="destructive" data-testid="badge-streak-status">Broken &mdash; post today to restart!</Badge>
                  )}
                </div>

                {streak.lastActivityDate && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-muted-foreground">Last Activity</span>
                    <span className="text-sm font-medium" data-testid="text-streak-last-activity">
                      {new Date(streak.lastActivityDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4">Unable to load streak data</p>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-weekly-digest">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Weekly Digest Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {digestLoading ? (
              <div className="flex items-center justify-center py-8" data-testid="loading-digest">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : digest ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 rounded-md border">
                    <p className="text-lg font-bold" data-testid="text-digest-posts">{digest.postsCreated}</p>
                    <p className="text-xs text-muted-foreground">Posts</p>
                  </div>
                  <div className="text-center p-2 rounded-md border">
                    <p className="text-lg font-bold" data-testid="text-digest-blogs">{digest.blogsWritten}</p>
                    <p className="text-xs text-muted-foreground">Blogs</p>
                  </div>
                  <div className="text-center p-2 rounded-md border">
                    <p className="text-lg font-bold" data-testid="text-digest-snippets">{digest.snippetsGenerated}</p>
                    <p className="text-xs text-muted-foreground">Snippets</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">Flywheel Score</span>
                  <span className="text-sm font-medium" data-testid="text-digest-flywheel">{digest.flywheelScore}</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">Streak</span>
                  <span className="text-sm font-medium" data-testid="text-digest-streak">{digest.streakCount} days</span>
                </div>

                {digest.topPost && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Top Post of the Week</p>
                    <p className="text-sm text-muted-foreground line-clamp-2" data-testid="text-digest-top-post">
                      {digest.topPost.content}
                    </p>
                    <p className="text-xs text-muted-foreground" data-testid="text-digest-top-engagement">
                      {digest.topPost.engagement} engagements
                    </p>
                  </div>
                )}

                {digest.suggestedNextBlogTopic && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                      Suggested Next Blog Topic
                    </p>
                    <p className="text-sm text-muted-foreground" data-testid="text-digest-suggested-topic">
                      {digest.suggestedNextBlogTopic}
                    </p>
                  </div>
                )}

                {digest.recommendations && digest.recommendations.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Recommendations</p>
                    <ul className="space-y-1">
                      {digest.recommendations.map((rec, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <FileText className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                          <span data-testid={`text-digest-recommendation-${i}`}>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4">Unable to load digest preview</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-content-templates">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Content Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          {templatesLoading ? (
            <div className="flex items-center justify-center py-8" data-testid="loading-templates">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Tabs value={selectedIndustry} onValueChange={setSelectedIndustry}>
              <TabsList className="flex flex-wrap h-auto gap-1 mb-4" data-testid="tabs-industry-list">
                {industries.map(industry => (
                  <TabsTrigger key={industry} value={industry} data-testid={`tab-industry-${industry.toLowerCase().replace(/\s+/g, '-')}`}>
                    {industry}
                  </TabsTrigger>
                ))}
              </TabsList>

              {industries.map(industry => (
                <TabsContent key={industry} value={industry}>
                  {filteredTemplates.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredTemplates.map((template, i) => (
                        <Card key={template.id || i} className="flex flex-col" data-testid={`card-template-${i}`}>
                          <CardContent className="pt-4 flex-1 space-y-3">
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                              <p className="text-sm font-medium" data-testid={`text-template-name-${i}`}>{template.name}</p>
                              <Badge variant="secondary" className="text-xs" data-testid={`badge-template-type-${i}`}>{template.type}</Badge>
                            </div>
                            <Badge variant="outline" className="text-xs" data-testid={`badge-template-platform-${i}`}>{template.platform}</Badge>
                            <p className="text-sm text-muted-foreground line-clamp-3" data-testid={`text-template-content-${i}`}>
                              {template.content}
                            </p>
                          </CardContent>
                          <div className="p-4 pt-0">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => handleCopyTemplate(template.content)}
                              data-testid={`button-copy-template-${i}`}
                            >
                              <Copy className="mr-2 h-3.5 w-3.5" />
                              Copy
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4" data-testid="text-no-templates">
                      No templates available for {industry}
                    </p>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-public-scorecard">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              Public Scorecard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end gap-3 flex-wrap">
              <div className="space-y-2 flex-1 min-w-[200px]">
                <Label htmlFor="scorecard-username">Username</Label>
                <Input
                  id="scorecard-username"
                  placeholder="Enter username..."
                  value={scorecardUsername}
                  onChange={(e) => setScorecardUsername(e.target.value)}
                  data-testid="input-scorecard-username"
                />
              </div>
              <Button
                onClick={handleViewScorecard}
                disabled={scorecardLoading || !scorecardUsername.trim()}
                data-testid="button-view-scorecard"
              >
                {scorecardLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Globe className="mr-2 h-4 w-4" />}
                View Scorecard
              </Button>
            </div>

            {scorecard && (
              <div className="space-y-3 border-t pt-4" data-testid="section-scorecard-results">
                <p className="text-lg font-bold" data-testid="text-scorecard-username">{scorecard.username}</p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2 rounded-md border">
                    <p className="text-lg font-bold" data-testid="text-scorecard-posts">{scorecard.postsPublished}</p>
                    <p className="text-xs text-muted-foreground">Posts Published</p>
                  </div>
                  <div className="text-center p-2 rounded-md border">
                    <p className="text-lg font-bold" data-testid="text-scorecard-blogs">{scorecard.blogsWritten}</p>
                    <p className="text-xs text-muted-foreground">Blogs Written</p>
                  </div>
                  <div className="text-center p-2 rounded-md border">
                    <p className="text-lg font-bold" data-testid="text-scorecard-engagement">{scorecard.totalEngagement}</p>
                    <p className="text-xs text-muted-foreground">Total Engagement</p>
                  </div>
                  <div className="text-center p-2 rounded-md border">
                    <p className="text-lg font-bold" data-testid="text-scorecard-flywheel">{scorecard.flywheelScore}</p>
                    <p className="text-xs text-muted-foreground">Flywheel Score</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">Streak</span>
                  <span className="text-sm font-medium" data-testid="text-scorecard-streak">{scorecard.streak} days</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">Member Since</span>
                  <span className="text-sm font-medium" data-testid="text-scorecard-member-since">
                    {new Date(scorecard.memberSince).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground italic" data-testid="text-scorecard-share-note">
                  Share your public profile!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
