'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, TrendingDown, Users, BarChart3 } from 'lucide-react'

interface FunnelStep {
  step: number
  name: string
  viewed: number
  completed: number
  dropOff: number
}

export default function FunnelAdminPage() {
  const [funnel, setFunnel] = useState<FunnelStep[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/onboarding/track')
      .then(r => r.json())
      .then(data => setFunnel(data.funnel || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const totalStarted = funnel.length > 0 ? funnel[0].viewed : 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Onboarding Funnel</h2>
        <p className="text-muted-foreground">
          Track how users progress through the onboarding wizard
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <div className="text-2xl font-bold" data-testid="text-funnel-total">{totalStarted}</div>
                <div className="text-sm text-muted-foreground">Started Onboarding</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-green-600 dark:text-green-400" />
              <div>
                <div className="text-2xl font-bold" data-testid="text-funnel-completed">
                  {funnel.length > 0 ? funnel[funnel.length - 1].completed : 0}
                </div>
                <div className="text-sm text-muted-foreground">Completed All Steps</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingDown className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              <div>
                <div className="text-2xl font-bold" data-testid="text-funnel-rate">
                  {totalStarted > 0 && funnel.length > 0
                    ? Math.round((funnel[funnel.length - 1].completed / totalStarted) * 100)
                    : 0}%
                </div>
                <div className="text-sm text-muted-foreground">Completion Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-funnel-steps">
        <CardHeader>
          <CardTitle>Step-by-Step Breakdown</CardTitle>
          <CardDescription>See where users drop off in the onboarding flow</CardDescription>
        </CardHeader>
        <CardContent>
          {funnel.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No onboarding data yet. Users will show up once they start the wizard.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {funnel.map((step, idx) => {
                const prevViewed = idx > 0 ? funnel[idx - 1].viewed : step.viewed
                const retentionPct = prevViewed > 0 ? Math.round((step.viewed / prevViewed) * 100) : 100

                return (
                  <div key={step.step} className="relative" data-testid={`funnel-step-${step.step}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {step.step}
                        </span>
                        <span className="font-medium">{step.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{step.viewed} viewed</span>
                        <span>{step.completed} completed</span>
                        {step.dropOff > 0 && (
                          <span className="text-orange-600 dark:text-orange-400">
                            {step.dropOff}% drop-off
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500 rounded-full"
                        style={{ width: `${retentionPct}%` }}
                      />
                    </div>
                    {idx > 0 && retentionPct < 100 && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {retentionPct}% retention from previous step
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
