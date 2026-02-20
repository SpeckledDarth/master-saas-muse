'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Hash, Users, Search, TrendingUp, TrendingDown, Minus, Loader2, ArrowLeft,
} from 'lucide-react'
import { HelpTooltip } from '@/components/social/help-tooltip'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

interface HashtagEntry {
  hashtag: string
  usageCount: number
  avgEngagement: number
  totalEngagement: number
  trend: 'up' | 'down' | 'stable'
}

interface Persona {
  name: string
  ageRange: string
  interests: string[]
  contentPreferences: string[]
  preferredPlatform: string
  bestTime: string
}

interface CompetitorGap {
  topic: string
  description: string
  difficulty: string
  impact: string
  suggestion: string
}

const TREND_CONFIG: Record<string, { icon: typeof TrendingUp; color: string; label: string }> = {
  up: { icon: TrendingUp, color: 'text-green-600 dark:text-green-400', label: 'Up' },
  down: { icon: TrendingDown, color: 'text-red-600 dark:text-red-400', label: 'Down' },
  stable: { icon: Minus, color: 'text-muted-foreground', label: 'Stable' },
}

const DIFFICULTY_VARIANT: Record<string, string> = {
  easy: 'text-green-600 dark:text-green-400 border-green-600/30 dark:border-green-400/30',
  medium: 'text-yellow-600 dark:text-yellow-400 border-yellow-600/30 dark:border-yellow-400/30',
  hard: 'text-red-600 dark:text-red-400 border-red-600/30 dark:border-red-400/30',
}

const IMPACT_VARIANT: Record<string, string> = {
  low: 'text-muted-foreground border-muted-foreground/30',
  medium: 'text-blue-600 dark:text-blue-400 border-blue-600/30 dark:border-blue-400/30',
  high: 'text-green-600 dark:text-green-400 border-green-600/30 dark:border-green-400/30',
}

export default function DistributionIntelligencePage() {
  const { toast } = useToast()

  const [hashtags, setHashtags] = useState<HashtagEntry[]>([])
  const [hashtagLoading, setHashtagLoading] = useState(true)

  const [buildingPersonas, setBuildingPersonas] = useState(false)
  const [personas, setPersonas] = useState<Persona[]>([])

  const [competitors, setCompetitors] = useState([
    { name: '', description: '' },
    { name: '', description: '' },
    { name: '', description: '' },
  ])
  const [gapNiche, setGapNiche] = useState('')
  const [analyzingGaps, setAnalyzingGaps] = useState(false)
  const [gaps, setGaps] = useState<CompetitorGap[]>([])

  const fetchHashtags = useCallback(async () => {
    try {
      const res = await fetch('/api/social/distribution/hashtag-tracker')
      if (!res.ok) return
      const data = await res.json()
      const sorted = (data.hashtags || data || []).sort(
        (a: HashtagEntry, b: HashtagEntry) => b.avgEngagement - a.avgEngagement
      )
      setHashtags(sorted)
    } catch {
      // silently fail
    } finally {
      setHashtagLoading(false)
    }
  }, [])

  useEffect(() => { fetchHashtags() }, [fetchHashtags])

  const handleBuildPersonas = async () => {
    setBuildingPersonas(true)
    setPersonas([])
    try {
      const res = await fetch('/api/social/distribution/audience-personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to build personas')
      }
      const data = await res.json()
      setPersonas(data.personas || [])
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setBuildingPersonas(false)
    }
  }

  const handleAnalyzeGaps = async () => {
    const validCompetitors = competitors.filter(c => c.name.trim())
    if (validCompetitors.length === 0) {
      toast({ title: 'Error', description: 'Please enter at least one competitor name', variant: 'destructive' })
      return
    }
    setAnalyzingGaps(true)
    setGaps([])
    try {
      const res = await fetch('/api/social/distribution/competitor-gap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitors: validCompetitors, niche: gapNiche || undefined }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to analyze gaps')
      }
      const data = await res.json()
      setGaps(data.gaps || [])
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setAnalyzingGaps(false)
    }
  }

  const updateCompetitor = (index: number, field: 'name' | 'description', value: string) => {
    setCompetitors(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-row items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-distribution-title">
            Distribution Intelligence <HelpTooltip text="Optimize how and where your content reaches your audience with hashtag tracking, audience personas, and competitor gap analysis." />
          </h1>
          <p className="text-muted-foreground mt-1" data-testid="text-distribution-description">
            Optimize how and where your content reaches your audience
          </p>
        </div>
        <Link href="/dashboard/social/overview">
          <Button variant="outline" data-testid="button-back-overview">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Overview
          </Button>
        </Link>
      </div>

      <Card data-testid="card-hashtag-tracker">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <Hash className="h-4 w-4 text-muted-foreground" />
            Hashtag Performance Tracker
            <HelpTooltip text="Track which hashtags drive the most engagement. Auto-loaded from your posting history, sorted by average engagement." />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hashtagLoading ? (
            <div className="flex items-center justify-center py-8" data-testid="loading-hashtag-tracker">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : hashtags.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Hashtag</th>
                    <th className="text-right py-2 px-4 font-medium text-muted-foreground">Usage</th>
                    <th className="text-right py-2 px-4 font-medium text-muted-foreground">Avg Engagement</th>
                    <th className="text-right py-2 px-4 font-medium text-muted-foreground">Total Engagement</th>
                    <th className="text-right py-2 pl-4 font-medium text-muted-foreground">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {hashtags.map((entry, i) => {
                    const trendInfo = TREND_CONFIG[entry.trend] || TREND_CONFIG.stable
                    const TrendIcon = trendInfo.icon
                    return (
                      <tr key={i} className="border-b last:border-0" data-testid={`row-hashtag-${i}`}>
                        <td className="py-2 pr-4 font-medium" data-testid={`text-hashtag-name-${i}`}>{entry.hashtag}</td>
                        <td className="py-2 px-4 text-right text-muted-foreground" data-testid={`text-hashtag-usage-${i}`}>{entry.usageCount}</td>
                        <td className="py-2 px-4 text-right" data-testid={`text-hashtag-avg-${i}`}>{entry.avgEngagement.toFixed(1)}</td>
                        <td className="py-2 px-4 text-right text-muted-foreground" data-testid={`text-hashtag-total-${i}`}>{entry.totalEngagement}</td>
                        <td className="py-2 pl-4 text-right">
                          <Badge variant="outline" className={`${trendInfo.color} no-default-hover-elevate no-default-active-elevate`} data-testid={`badge-hashtag-trend-${i}`}>
                            <TrendIcon className="h-3 w-3 mr-1" />
                            {trendInfo.label}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4" data-testid="text-hashtag-empty">
              No hashtag data available yet. Start posting with hashtags to see performance tracking.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-audience-personas">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Audience Persona Builder
              <HelpTooltip text="Generate AI-powered audience personas based on your content history, showing demographics, interests, and optimal engagement strategies." />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleBuildPersonas} disabled={buildingPersonas} data-testid="button-build-personas">
              {buildingPersonas ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
              Build Personas
            </Button>

            {personas.length > 0 && (
              <div className="space-y-3 border-t pt-4" data-testid="section-persona-results">
                {personas.map((persona, i) => (
                  <div key={i} className="p-3 rounded-md border space-y-2" data-testid={`card-persona-${i}`}>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="font-medium" data-testid={`text-persona-name-${i}`}>{persona.name}</p>
                      <Badge variant="secondary" className="text-xs" data-testid={`badge-persona-age-${i}`}>{persona.ageRange}</Badge>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Interests</p>
                      <div className="flex flex-wrap gap-1">
                        {persona.interests.map((interest, j) => (
                          <Badge key={j} variant="outline" className="text-xs" data-testid={`badge-persona-interest-${i}-${j}`}>{interest}</Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Content Preferences</p>
                      <div className="flex flex-wrap gap-1">
                        {persona.contentPreferences.map((pref, j) => (
                          <Badge key={j} variant="secondary" className="text-xs" data-testid={`badge-persona-pref-${i}-${j}`}>{pref}</Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground">
                      <span data-testid={`text-persona-platform-${i}`}>
                        Platform: <span className="text-foreground font-medium">{persona.preferredPlatform}</span>
                      </span>
                      <span data-testid={`text-persona-time-${i}`}>
                        Best time: <span className="text-foreground font-medium">{persona.bestTime}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-competitor-gap">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              Competitor Gap Analysis
              <HelpTooltip text="Identify content gaps by analyzing your competitors. Enter up to 3 competitors to discover untapped topics and opportunities." />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {competitors.map((comp, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid={`section-competitor-input-${i}`}>
                <div className="space-y-1">
                  <Label htmlFor={`comp-name-${i}`} className="text-xs">Competitor {i + 1} Name</Label>
                  <Input
                    id={`comp-name-${i}`}
                    placeholder="e.g., Competitor Co"
                    value={comp.name}
                    onChange={(e) => updateCompetitor(i, 'name', e.target.value)}
                    data-testid={`input-competitor-name-${i}`}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`comp-desc-${i}`} className="text-xs">Description</Label>
                  <Input
                    id={`comp-desc-${i}`}
                    placeholder="e.g., SaaS marketing tool"
                    value={comp.description}
                    onChange={(e) => updateCompetitor(i, 'description', e.target.value)}
                    data-testid={`input-competitor-desc-${i}`}
                  />
                </div>
              </div>
            ))}

            <div className="space-y-1">
              <Label htmlFor="gap-niche" className="text-xs">Niche (optional)</Label>
              <Input
                id="gap-niche"
                placeholder="e.g., B2B SaaS Marketing"
                value={gapNiche}
                onChange={(e) => setGapNiche(e.target.value)}
                data-testid="input-gap-niche"
              />
            </div>

            <Button
              onClick={handleAnalyzeGaps}
              disabled={analyzingGaps || !competitors.some(c => c.name.trim())}
              data-testid="button-analyze-gaps"
            >
              {analyzingGaps ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Analyze Gaps
            </Button>

            {gaps.length > 0 && (
              <div className="space-y-3 border-t pt-4" data-testid="section-gap-results">
                {gaps.map((gap, i) => (
                  <div key={i} className="p-3 rounded-md border space-y-2" data-testid={`card-gap-${i}`}>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="font-medium text-sm" data-testid={`text-gap-topic-${i}`}>{gap.topic}</p>
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={`text-xs ${DIFFICULTY_VARIANT[gap.difficulty.toLowerCase()] || ''}`}
                          data-testid={`badge-gap-difficulty-${i}`}
                        >
                          {gap.difficulty}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-xs ${IMPACT_VARIANT[gap.impact.toLowerCase()] || ''}`}
                          data-testid={`badge-gap-impact-${i}`}
                        >
                          {gap.impact} impact
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground" data-testid={`text-gap-description-${i}`}>{gap.description}</p>
                    <p className="text-xs text-muted-foreground" data-testid={`text-gap-suggestion-${i}`}>{gap.suggestion}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
