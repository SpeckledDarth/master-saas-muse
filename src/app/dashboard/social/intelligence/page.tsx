'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Brain, Sparkles, Target, BarChart3, AlertTriangle, Shield, Layers,
  BookOpen, Loader2, ArrowLeft, TrendingUp, TrendingDown, Minus, Clock,
} from 'lucide-react'
import { HelpTooltip } from '@/components/social/help-tooltip'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

interface GradeResult {
  grade: string
  score: number
  readability: number
  seo: number
  engagement: number
  platformFit: number
  tips: string[]
}

interface BriefResult {
  titles: string[]
  outline: { heading: string; subheadings: string[] }[]
  keywords: string[]
  idealLength: string
  estimatedReadTime: string
  targetPlatforms?: string[]
}

interface ContentDNA {
  topTopics: string[]
  bestTimes: { day: string; hour: number }[]
  optimalLength: { platform: string; chars: number }[]
  aiVsManual: { aiAvgEngagement: number; manualAvgEngagement: number }
}

interface ContentMix {
  mix: { promotional: number; educational: number; entertaining: number; inspirational: number }
  total: number
  recommendation: string
}

interface TopicFatigueAlert {
  topic: string
  postCount: number
  engagementDrop: number
  suggestion: string
}

interface ToneDrift {
  configured: boolean
  alignment?: number
  drift?: boolean
  driftDescription?: string
  recentTone?: string
}

interface CannibalizationPair {
  article1: { id: string; title: string }
  article2: { id: string; title: string }
  overlapScore: number
  suggestion: string
}

const GRADE_COLORS: Record<string, string> = {
  A: 'text-green-600 dark:text-green-400',
  B: 'text-blue-600 dark:text-blue-400',
  C: 'text-yellow-600 dark:text-yellow-400',
  D: 'text-red-600 dark:text-red-400',
}

const MIX_COLORS: Record<string, string> = {
  promotional: 'bg-red-500',
  educational: 'bg-blue-500',
  entertaining: 'bg-yellow-500',
  inspirational: 'bg-purple-500',
}

const MIX_LABELS: Record<string, string> = {
  promotional: 'Promotional',
  educational: 'Educational',
  entertaining: 'Entertaining',
  inspirational: 'Inspirational',
}

function formatHour(hour: number): string {
  if (hour === 0) return '12 AM'
  if (hour === 12) return '12 PM'
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`
}

export default function ContentIntelligencePage() {
  const { toast } = useToast()

  const [gradeContent, setGradeContent] = useState('')
  const [gradePlatform, setGradePlatform] = useState('twitter')
  const [grading, setGrading] = useState(false)
  const [gradeResult, setGradeResult] = useState<GradeResult | null>(null)

  const [briefTopic, setBriefTopic] = useState('')
  const [briefNiche, setBriefNiche] = useState('')
  const [generatingBrief, setGeneratingBrief] = useState(false)
  const [briefResult, setBriefResult] = useState<BriefResult | null>(null)

  const [dna, setDna] = useState<ContentDNA | null>(null)
  const [dnaLoading, setDnaLoading] = useState(true)

  const [contentMix, setContentMix] = useState<ContentMix | null>(null)
  const [mixLoading, setMixLoading] = useState(true)

  const [fatigueAlerts, setFatigueAlerts] = useState<TopicFatigueAlert[]>([])
  const [fatigueLoading, setFatigueLoading] = useState(true)

  const [toneDrift, setToneDrift] = useState<ToneDrift | null>(null)
  const [toneLoading, setToneLoading] = useState(true)

  const [cannibalization, setCannibalization] = useState<CannibalizationPair[]>([])
  const [cannibLoading, setCannibLoading] = useState(true)

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

    const [dnaData, mixData, fatigueData, toneData, cannibData] = await Promise.all([
      fetchJSON('/api/social/intelligence/content-dna'),
      fetchJSON('/api/social/intelligence/content-mix'),
      fetchJSON('/api/social/intelligence/topic-fatigue'),
      fetchJSON('/api/social/intelligence/tone-drift'),
      fetchJSON('/api/social/intelligence/cannibalization'),
    ])

    setDna(dnaData)
    setDnaLoading(false)

    setContentMix(mixData)
    setMixLoading(false)

    setFatigueAlerts(fatigueData?.alerts || [])
    setFatigueLoading(false)

    setToneDrift(toneData)
    setToneLoading(false)

    setCannibalization(cannibData?.pairs || [])
    setCannibLoading(false)
  }, [])

  useEffect(() => { fetchAutoData() }, [fetchAutoData])

  const handleGrade = async () => {
    if (!gradeContent.trim()) {
      toast({ title: 'Error', description: 'Please enter content to grade', variant: 'destructive' })
      return
    }
    setGrading(true)
    setGradeResult(null)
    try {
      const res = await fetch('/api/social/intelligence/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: gradeContent, platform: gradePlatform }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to grade content')
      }
      const data = await res.json()
      setGradeResult(data)
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setGrading(false)
    }
  }

  const handleGenerateBrief = async () => {
    if (!briefTopic.trim()) {
      toast({ title: 'Error', description: 'Please enter a topic', variant: 'destructive' })
      return
    }
    setGeneratingBrief(true)
    setBriefResult(null)
    try {
      const res = await fetch('/api/social/intelligence/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: briefTopic, niche: briefNiche || undefined }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to generate brief')
      }
      const data = await res.json()
      setBriefResult(data)
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setGeneratingBrief(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-row items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-intelligence-title">
            Content Intelligence <HelpTooltip text="AI-powered analysis tools that help you understand and improve your content strategy across all platforms." />
          </h1>
          <p className="text-muted-foreground mt-1" data-testid="text-intelligence-description">
            AI-powered insights to improve your content strategy
          </p>
        </div>
        <Link href="/dashboard/social/overview">
          <Button variant="outline" data-testid="button-back-overview">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Overview
          </Button>
        </Link>
      </div>

      <Card data-testid="card-content-grader">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            Content Grader
            <HelpTooltip text="Paste any content and get an AI-powered quality grade with scores for readability, SEO, engagement, and platform fit." />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="grade-content">Content to Grade</Label>
            <Textarea
              id="grade-content"
              placeholder="Paste your content here to get a quality grade..."
              value={gradeContent}
              onChange={(e) => setGradeContent(e.target.value)}
              className="min-h-[120px]"
              data-testid="textarea-grade-content"
            />
          </div>
          <div className="flex items-end gap-3 flex-wrap">
            <div className="space-y-2">
              <Label htmlFor="grade-platform">Platform</Label>
              <Select value={gradePlatform} onValueChange={setGradePlatform}>
                <SelectTrigger className="w-[160px]" data-testid="select-grade-platform">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="twitter">Twitter</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="blog">Blog</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleGrade} disabled={grading || !gradeContent.trim()} data-testid="button-grade-content">
              {grading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Target className="mr-2 h-4 w-4" />}
              Grade Content
            </Button>
          </div>

          {gradeResult && (
            <div className="mt-4 space-y-4 border-t pt-4" data-testid="section-grade-results">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="text-center">
                  <span className={`text-5xl font-bold ${GRADE_COLORS[gradeResult.grade] || 'text-foreground'}`} data-testid="text-grade-letter">
                    {gradeResult.grade}
                  </span>
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="text-grade-score">{gradeResult.score}<span className="text-sm text-muted-foreground font-normal"> / 100</span></p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Readability', value: gradeResult.readability, max: 25 },
                  { label: 'SEO', value: gradeResult.seo, max: 25 },
                  { label: 'Engagement', value: gradeResult.engagement, max: 25 },
                  { label: 'Platform Fit', value: gradeResult.platformFit, max: 25 },
                ].map(item => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{item.label}</span>
                      <span className="text-sm text-muted-foreground">{item.value} / {item.max}</span>
                    </div>
                    <Progress value={(item.value / item.max) * 100} data-testid={`progress-grade-${item.label.toLowerCase().replace(' ', '-')}`} />
                  </div>
                ))}
              </div>

              {gradeResult.tips && gradeResult.tips.length > 0 && (
                <div className="space-y-2" data-testid="section-grade-tips">
                  <p className="text-sm font-medium">Tips for Improvement</p>
                  <ul className="space-y-1">
                    {gradeResult.tips.map((tip, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <Sparkles className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                        <span data-testid={`text-grade-tip-${i}`}>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-content-brief">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            Content Brief Generator
            <HelpTooltip text="Enter a topic and get a complete content brief with title suggestions, structured outline, keywords, and length recommendations." />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brief-topic">Topic</Label>
              <Input
                id="brief-topic"
                placeholder="e.g., Remote work productivity tips"
                value={briefTopic}
                onChange={(e) => setBriefTopic(e.target.value)}
                data-testid="input-brief-topic"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brief-niche">Niche (optional)</Label>
              <Input
                id="brief-niche"
                placeholder="e.g., SaaS, Marketing"
                value={briefNiche}
                onChange={(e) => setBriefNiche(e.target.value)}
                data-testid="input-brief-niche"
              />
            </div>
          </div>
          <Button onClick={handleGenerateBrief} disabled={generatingBrief || !briefTopic.trim()} data-testid="button-generate-brief">
            {generatingBrief ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Generate Brief
          </Button>

          {briefResult && (
            <div className="mt-4 space-y-4 border-t pt-4" data-testid="section-brief-results">
              <div className="space-y-2">
                <p className="text-sm font-medium">Title Suggestions</p>
                <div className="space-y-1">
                  {briefResult.titles.map((title, i) => (
                    <p key={i} className="text-sm text-muted-foreground" data-testid={`text-brief-title-${i}`}>
                      {i + 1}. {title}
                    </p>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Outline</p>
                <div className="space-y-2">
                  {briefResult.outline.map((section, i) => (
                    <div key={i} className="pl-2 border-l-2 border-muted" data-testid={`section-brief-outline-${i}`}>
                      <p className="text-sm font-medium">{section.heading}</p>
                      {section.subheadings && section.subheadings.length > 0 && (
                        <ul className="ml-4 mt-1 space-y-0.5">
                          {section.subheadings.map((sub, j) => (
                            <li key={j} className="text-xs text-muted-foreground">{sub}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Keywords</p>
                <div className="flex flex-wrap gap-1.5">
                  {briefResult.keywords.map((kw, i) => (
                    <Badge key={i} variant="secondary" className="text-xs" data-testid={`badge-brief-keyword-${i}`}>{kw}</Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-6 flex-wrap text-sm">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Length:</span>
                  <span className="font-medium" data-testid="text-brief-length">{briefResult.idealLength}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Read time:</span>
                  <span className="font-medium" data-testid="text-brief-readtime">{briefResult.estimatedReadTime}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-content-dna">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-4 w-4 text-muted-foreground" />
              Content DNA
              <HelpTooltip text="Your unique content fingerprint: top topics, best posting times, optimal lengths, and how AI-generated content performs vs. manual." />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dnaLoading ? (
              <div className="flex items-center justify-center py-8" data-testid="loading-content-dna">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : dna ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Top Topics</p>
                  {dna.topTopics.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {dna.topTopics.map((topic, i) => (
                        <Badge key={i} variant="secondary" className="text-xs" data-testid={`badge-dna-topic-${i}`}>{topic}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No topics detected yet</p>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Best Posting Times</p>
                  {dna.bestTimes.length > 0 ? (
                    <div className="space-y-1">
                      {dna.bestTimes.map((t, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm" data-testid={`text-dna-time-${i}`}>
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{t.day} at {formatHour(t.hour)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not enough data yet</p>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Optimal Content Length</p>
                  {dna.optimalLength.length > 0 ? (
                    <div className="space-y-1">
                      {dna.optimalLength.map((item, i) => (
                        <div key={i} className="flex items-center justify-between gap-2 text-sm" data-testid={`text-dna-length-${i}`}>
                          <span className="capitalize">{item.platform}</span>
                          <span className="text-muted-foreground">{item.chars} chars</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not enough data yet</p>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">AI vs Manual Performance</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-md border text-center">
                      <Sparkles className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                      <p className="text-lg font-bold" data-testid="text-dna-ai-engagement">{dna.aiVsManual.aiAvgEngagement}</p>
                      <p className="text-xs text-muted-foreground">AI avg engagement</p>
                    </div>
                    <div className="p-3 rounded-md border text-center">
                      <BarChart3 className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                      <p className="text-lg font-bold" data-testid="text-dna-manual-engagement">{dna.aiVsManual.manualAvgEngagement}</p>
                      <p className="text-xs text-muted-foreground">Manual avg engagement</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4">Unable to load content DNA</p>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-content-mix">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              Content Mix Optimizer
              <HelpTooltip text="See the balance of your content categories. A healthy mix includes educational, promotional, entertaining, and inspirational content." />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mixLoading ? (
              <div className="flex items-center justify-center py-8" data-testid="loading-content-mix">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : contentMix ? (
              <div className="space-y-4">
                {contentMix.total > 0 ? (
                  <>
                    <div className="space-y-3">
                      {Object.entries(contentMix.mix).map(([key, value]) => {
                        const percent = contentMix.total > 0 ? Math.round((value / contentMix.total) * 100) : 0
                        return (
                          <div key={key} className="space-y-1" data-testid={`section-mix-${key}`}>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium">{MIX_LABELS[key] || key}</span>
                              <span className="text-sm text-muted-foreground">{percent}% ({value})</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full rounded-full ${MIX_COLORS[key] || 'bg-primary'}`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="p-3 rounded-md border">
                      <p className="text-sm text-muted-foreground" data-testid="text-mix-recommendation">{contentMix.recommendation}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground py-4">No content analyzed yet. Start posting to see your content mix.</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4">Unable to load content mix</p>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-topic-fatigue">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              Topic Fatigue Alerts
              <HelpTooltip text="Detects when you're overusing certain topics and engagement is dropping. Helps you diversify your content." />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {fatigueLoading ? (
              <div className="flex items-center justify-center py-8" data-testid="loading-topic-fatigue">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : fatigueAlerts.length > 0 ? (
              <div className="space-y-3" data-testid="list-fatigue-alerts">
                {fatigueAlerts.map((alert, i) => (
                  <div key={i} className="p-3 rounded-md border space-y-1" data-testid={`fatigue-alert-${i}`}>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-sm font-medium capitalize" data-testid={`text-fatigue-topic-${i}`}>{alert.topic}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">{alert.postCount} posts</Badge>
                        <Badge variant="destructive" className="text-xs">
                          <TrendingDown className="mr-1 h-2.5 w-2.5" />
                          {alert.engagementDrop}% drop
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground" data-testid={`text-fatigue-suggestion-${i}`}>{alert.suggestion}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="text-sm text-muted-foreground" data-testid="text-no-fatigue">No topic fatigue detected</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-tone-drift">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              Tone Drift Monitor
              <HelpTooltip text="Monitors whether your recent posts match your configured brand voice. Alerts you when your tone starts drifting." />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {toneLoading ? (
              <div className="flex items-center justify-center py-8" data-testid="loading-tone-drift">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : toneDrift ? (
              toneDrift.configured === false ? (
                <div className="py-4 text-center">
                  <Shield className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground" data-testid="text-tone-not-configured">
                    Set up your brand voice in settings to use this feature
                  </p>
                  <Link href="/dashboard/social/brand">
                    <Button variant="outline" size="sm" className="mt-3" data-testid="button-setup-brand-voice">
                      Configure Brand Voice
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4" data-testid="section-tone-results">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="text-center">
                      <p className={`text-3xl font-bold ${(toneDrift.alignment ?? 0) >= 70 ? 'text-green-600 dark:text-green-400' : (toneDrift.alignment ?? 0) >= 40 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`} data-testid="text-tone-alignment">
                        {toneDrift.alignment ?? 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Alignment Score</p>
                    </div>
                    <div>
                      <Badge variant={toneDrift.drift ? 'destructive' : 'default'} data-testid="badge-tone-drift-status">
                        {toneDrift.drift ? (
                          <><TrendingDown className="mr-1 h-3 w-3" /> Drift Detected</>
                        ) : (
                          <><Minus className="mr-1 h-3 w-3" /> On Track</>
                        )}
                      </Badge>
                    </div>
                  </div>
                  {toneDrift.driftDescription && (
                    <p className="text-sm text-muted-foreground" data-testid="text-tone-description">{toneDrift.driftDescription}</p>
                  )}
                  {toneDrift.recentTone && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Recent tone:</span>
                      <span className="font-medium" data-testid="text-tone-recent">{toneDrift.recentTone}</span>
                    </div>
                  )}
                </div>
              )
            ) : (
              <p className="text-sm text-muted-foreground py-4">Unable to load tone drift data</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2" data-testid="card-cannibalization">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Content Cannibalization
              <HelpTooltip text="Detects blog articles that overlap too much in topic/keywords, which can hurt SEO. Suggests how to differentiate them." />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cannibLoading ? (
              <div className="flex items-center justify-center py-8" data-testid="loading-cannibalization">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : cannibalization.length > 0 ? (
              <div className="space-y-3" data-testid="list-cannibalization-pairs">
                {cannibalization.map((pair, i) => (
                  <div key={i} className="p-3 rounded-md border space-y-2" data-testid={`cannibalization-pair-${i}`}>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" data-testid={`text-cannib-article1-${i}`}>{pair.article1.title || 'Untitled'}</p>
                        <p className="text-xs text-muted-foreground">overlaps with</p>
                        <p className="text-sm font-medium truncate" data-testid={`text-cannib-article2-${i}`}>{pair.article2.title || 'Untitled'}</p>
                      </div>
                      <Badge variant="secondary" className="shrink-0" data-testid={`badge-cannib-overlap-${i}`}>
                        {pair.overlapScore}% overlap
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground" data-testid={`text-cannib-suggestion-${i}`}>{pair.suggestion}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="text-sm text-muted-foreground" data-testid="text-no-cannibalization">No content cannibalization detected</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}