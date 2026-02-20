'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  DollarSign, Calculator, Award, FileDown, TrendingUp, Loader2, ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

interface ROISettings {
  leadValue: number
  clickValue: number
  shareValue: number
  commentValue: number
  likeValue: number
}

interface ROIBreakdown {
  likes: { count: number; value: number }
  comments: { count: number; value: number }
  shares: { count: number; value: number }
  clicks: { count: number; value: number }
}

interface ROIData {
  settings: ROISettings
  totalROI: number
  breakdown: ROIBreakdown
}

interface CostData {
  hourlyRate: number
  totalPosts: number
  aiPosts: number
  manualPosts: number
  avgCostAi: number
  avgCostManual: number
  totalSaved: number
  savingsPercent: number
}

interface ReportCard {
  grade: string
  flywheelScore: number
  totalPosts: number
  totalBlogs: number
  totalEngagement: number
  topPost: { platform: string; content: string; engagement: number } | null
  worstPost: { platform: string; content: string; engagement: number } | null
  contentMix: { promotional: number; educational: number; entertaining: number }
  recommendations: string[]
}

const GRADE_COLORS: Record<string, string> = {
  A: 'text-green-600 dark:text-green-400',
  B: 'text-blue-600 dark:text-blue-400',
  C: 'text-yellow-600 dark:text-yellow-400',
  D: 'text-orange-600 dark:text-orange-400',
  F: 'text-red-600 dark:text-red-400',
}

const GRADE_BG: Record<string, string> = {
  A: 'bg-green-100 dark:bg-green-900/30',
  B: 'bg-blue-100 dark:bg-blue-900/30',
  C: 'bg-yellow-100 dark:bg-yellow-900/30',
  D: 'bg-orange-100 dark:bg-orange-900/30',
  F: 'bg-red-100 dark:bg-red-900/30',
}

const MIX_COLORS: Record<string, string> = {
  promotional: 'bg-red-500',
  educational: 'bg-blue-500',
  entertaining: 'bg-yellow-500',
}

const MIX_LABELS: Record<string, string> = {
  promotional: 'Promotional',
  educational: 'Educational',
  entertaining: 'Entertaining',
}

export default function RevenueROIPage() {
  const { toast } = useToast()

  const [roiData, setRoiData] = useState<ROIData | null>(null)
  const [roiLoading, setRoiLoading] = useState(true)
  const [roiValues, setRoiValues] = useState<ROISettings>({ leadValue: 50, clickValue: 2, shareValue: 5, commentValue: 3, likeValue: 1 })
  const [saving, setSaving] = useState(false)

  const [costData, setCostData] = useState<CostData | null>(null)
  const [costLoading, setCostLoading] = useState(true)

  const [reportCard, setReportCard] = useState<ReportCard | null>(null)
  const [reportLoading, setReportLoading] = useState(true)

  const [exporting, setExporting] = useState(false)

  const fetchJSON = async (url: string) => {
    try {
      const res = await fetch(url)
      if (!res.ok) return null
      return await res.json()
    } catch {
      return null
    }
  }

  const fetchAutoData = useCallback(async () => {
    const [roiRes, costRes, reportRes] = await Promise.all([
      fetchJSON('/api/social/revenue/roi-calculator'),
      fetchJSON('/api/social/revenue/cost-per-post'),
      fetchJSON('/api/social/revenue/report-card'),
    ])

    if (roiRes) {
      setRoiData(roiRes)
      setRoiValues(roiRes.settings)
    }
    setRoiLoading(false)

    setCostData(costRes)
    setCostLoading(false)

    setReportCard(reportRes)
    setReportLoading(false)
  }, [])

  useEffect(() => { fetchAutoData() }, [fetchAutoData])

  const handleSaveROI = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/social/revenue/roi-calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roiValues),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }
      toast({ title: 'Saved', description: 'ROI values updated successfully' })
      const refreshed = await fetchJSON('/api/social/revenue/roi-calculator')
      if (refreshed) {
        setRoiData(refreshed)
        setRoiValues(refreshed.settings)
      }
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/social/revenue/export-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to export')
      }
      const data = await res.json()
      if (data.html) {
        const w = window.open('', '_blank')
        if (w) {
          w.document.write(data.html)
          w.document.close()
        }
      }
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setExporting(false)
    }
  }

  const updateROIField = (field: keyof ROISettings, value: string) => {
    const num = parseFloat(value)
    if (!isNaN(num) && num >= 0) {
      setRoiValues(prev => ({ ...prev, [field]: num }))
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-row items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-revenue-title">
            Revenue & ROI
          </h1>
          <p className="text-muted-foreground mt-1" data-testid="text-revenue-description">
            Track the business impact of your content marketing
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={exporting}
            data-testid="button-export-report"
          >
            {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
            Export as PDF
          </Button>
          <Link href="/dashboard/social/overview">
            <Button variant="outline" data-testid="button-back-overview">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Overview
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-roi-calculator">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="h-4 w-4 text-muted-foreground" />
              ROI Calculator
            </CardTitle>
          </CardHeader>
          <CardContent>
            {roiLoading ? (
              <div className="flex items-center justify-center py-8" data-testid="loading-roi">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                {roiData && (
                  <div className="text-center p-4 rounded-md border" data-testid="section-roi-total">
                    <DollarSign className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                    <p className="text-3xl font-bold" data-testid="text-roi-total">${roiData.totalROI.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Estimated Total ROI</p>
                  </div>
                )}

                {roiData && (
                  <div className="space-y-2" data-testid="section-roi-breakdown">
                    <p className="text-sm font-medium">Breakdown</p>
                    {Object.entries(roiData.breakdown).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between gap-2 text-sm" data-testid={`text-roi-breakdown-${key}`}>
                        <span className="capitalize">{key}</span>
                        <span className="text-muted-foreground">
                          {val.count} x ${roiValues[`${key}Value` as keyof ROISettings] ?? roiValues[(`${key === 'likes' ? 'like' : key === 'comments' ? 'comment' : key === 'shares' ? 'share' : key === 'clicks' ? 'click' : key}Value`) as keyof ROISettings] ?? 0} = <span className="font-medium text-foreground">${val.value.toLocaleString()}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-3 border-t pt-4">
                  <p className="text-sm font-medium">Engagement Values ($)</p>
                  {([
                    { key: 'leadValue' as const, label: 'Lead Value' },
                    { key: 'clickValue' as const, label: 'Click Value' },
                    { key: 'shareValue' as const, label: 'Share Value' },
                    { key: 'commentValue' as const, label: 'Comment Value' },
                    { key: 'likeValue' as const, label: 'Like Value' },
                  ]).map(item => (
                    <div key={item.key} className="flex items-center justify-between gap-3">
                      <Label htmlFor={`roi-${item.key}`} className="text-sm shrink-0">{item.label}</Label>
                      <Input
                        id={`roi-${item.key}`}
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-24"
                        value={roiValues[item.key]}
                        onChange={(e) => updateROIField(item.key, e.target.value)}
                        data-testid={`input-roi-${item.key}`}
                      />
                    </div>
                  ))}
                  <Button onClick={handleSaveROI} disabled={saving} className="w-full" data-testid="button-save-roi">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DollarSign className="mr-2 h-4 w-4" />}
                    Save Values
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-cost-per-post">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Cost Per Post
            </CardTitle>
          </CardHeader>
          <CardContent>
            {costLoading ? (
              <div className="flex items-center justify-center py-8" data-testid="loading-cost">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : costData ? (
              <div className="space-y-4">
                <div className="text-center p-4 rounded-md border" data-testid="section-cost-savings">
                  <TrendingUp className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                  <p className="text-3xl font-bold" data-testid="text-cost-saved">${costData.totalSaved.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Savings</p>
                  <Badge variant="secondary" className="mt-2" data-testid="badge-savings-percent">{costData.savingsPercent}% saved</Badge>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-md border text-center">
                    <p className="text-lg font-bold" data-testid="text-cost-hourly">${costData.hourlyRate}</p>
                    <p className="text-xs text-muted-foreground">Hourly Rate</p>
                  </div>
                  <div className="p-3 rounded-md border text-center">
                    <p className="text-lg font-bold" data-testid="text-cost-total-posts">{costData.totalPosts}</p>
                    <p className="text-xs text-muted-foreground">Total Posts</p>
                  </div>
                  <div className="p-3 rounded-md border text-center">
                    <p className="text-lg font-bold" data-testid="text-cost-ai-posts">{costData.aiPosts}</p>
                    <p className="text-xs text-muted-foreground">AI Posts</p>
                  </div>
                  <div className="p-3 rounded-md border text-center">
                    <p className="text-lg font-bold" data-testid="text-cost-manual-posts">{costData.manualPosts}</p>
                    <p className="text-xs text-muted-foreground">Manual Posts</p>
                  </div>
                </div>

                <div className="space-y-2 border-t pt-4">
                  <p className="text-sm font-medium">Cost Comparison</p>
                  <div className="flex items-center justify-between gap-2 text-sm" data-testid="text-cost-ai-avg">
                    <span>AI Cost per Post</span>
                    <span className="font-medium">${costData.avgCostAi.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-sm" data-testid="text-cost-manual-avg">
                    <span>Manual Cost per Post</span>
                    <span className="font-medium">${costData.avgCostManual.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4" data-testid="text-cost-empty">Unable to load cost data</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-monthly-report">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-4 w-4 text-muted-foreground" />
            Monthly Report Card
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reportLoading ? (
            <div className="flex items-center justify-center py-8" data-testid="loading-report">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : reportCard ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className={`flex items-center justify-center w-24 h-24 rounded-md ${GRADE_BG[reportCard.grade] || 'bg-muted'}`} data-testid="section-report-grade">
                  <span className={`text-5xl font-bold ${GRADE_COLORS[reportCard.grade] || 'text-foreground'}`} data-testid="text-report-grade">
                    {reportCard.grade}
                  </span>
                </div>
                <div className="flex-1 space-y-2 w-full">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">Flywheel Score</span>
                    <span className="text-sm text-muted-foreground" data-testid="text-flywheel-score">{reportCard.flywheelScore} / 100</span>
                  </div>
                  <Progress value={reportCard.flywheelScore} data-testid="progress-flywheel" />
                  <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground mt-2">
                    <span data-testid="text-report-posts">{reportCard.totalPosts} posts</span>
                    <span data-testid="text-report-blogs">{reportCard.totalBlogs} blogs</span>
                    <span data-testid="text-report-engagement">{reportCard.totalEngagement} engagements</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3" data-testid="section-content-mix">
                <p className="text-sm font-medium">Content Mix</p>
                {Object.entries(reportCard.contentMix).map(([key, value]) => {
                  const total = reportCard.totalPosts || 1
                  const percent = Math.round((value / total) * 100)
                  return (
                    <div key={key} className="space-y-1" data-testid={`section-mix-${key}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm">{MIX_LABELS[key] || key}</span>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {reportCard.topPost && (
                  <div className="p-4 rounded-md border space-y-1" data-testid="section-top-post">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium">Top Post</span>
                    </div>
                    <Badge variant="secondary" className="text-xs" data-testid="badge-top-post-platform">{reportCard.topPost.platform}</Badge>
                    <p className="text-sm text-muted-foreground" data-testid="text-top-post-content">{reportCard.topPost.content}</p>
                    <p className="text-sm font-medium" data-testid="text-top-post-engagement">{reportCard.topPost.engagement} engagements</p>
                  </div>
                )}
                {reportCard.worstPost && (
                  <div className="p-4 rounded-md border space-y-1" data-testid="section-worst-post">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3.5 w-3.5 text-red-600 dark:text-red-400 rotate-180" />
                      <span className="text-sm font-medium">Worst Post</span>
                    </div>
                    <Badge variant="secondary" className="text-xs" data-testid="badge-worst-post-platform">{reportCard.worstPost.platform}</Badge>
                    <p className="text-sm text-muted-foreground" data-testid="text-worst-post-content">{reportCard.worstPost.content}</p>
                    <p className="text-sm font-medium" data-testid="text-worst-post-engagement">{reportCard.worstPost.engagement} engagements</p>
                  </div>
                )}
              </div>

              {reportCard.recommendations.length > 0 && (
                <div className="space-y-2" data-testid="section-recommendations">
                  <p className="text-sm font-medium">Recommendations</p>
                  <ul className="space-y-1">
                    {reportCard.recommendations.map((rec, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <Award className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                        <span data-testid={`text-recommendation-${i}`}>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4" data-testid="text-report-empty">Unable to load report card</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
