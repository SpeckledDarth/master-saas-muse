'use client';

import { useState, useEffect, useRef } from 'react';

interface ConnectedOverview {
  connectedPlatforms: { platform: string; account_name: string; last_synced: string }[];
  affiliateOverview: { totalClicks: number; totalSignups: number; totalConversions: number; totalEarnings: number };
  platformComparison: { platform: string; reach: number; engagement: number; clicks: number; signups: number; conversions: number; earnings_cents: number; efficiency: number }[];
  mergedTimeline: { date: string; platform_reach: number; affiliate_clicks: number; conversions: number }[];
}

interface FinancialData {
  overview: { totalEarned: number; totalPaidOut: number; pendingEarnings: number; totalSubscriptionCost: number; netIncome: number; roi: number; breakEvenMonth: string | null };
  projections: { avgMonthlyEarnings: number; avgMonthlySpend: number; monthlyNet: number; projectedAnnualNet: number; subscriptionPaysForItself: boolean };
  monthlyBreakdown: { month: string; earned: number; spent: number; net: number }[];
  activeReferrals: number;
  totalReferrals: number;
}

interface PredictionsData {
  tierProjection: { currentTier: string; nextTier: string; earningsNeeded: number; referralsNeeded: number; avgMonthlyEarnings: number; estimatedMonths: number | null; estimatedDate: string | null } | null;
  churnPrediction: string | null;
  seasonalPattern: { month: string; clicks: number }[] | null;
  aiPredictions: string;
  nextMilestone?: { name: string; threshold: number; current: number; bonusCents: number; referralsNeeded: number } | null;
  activeContests?: { name: string; metric: string; daysLeft: number; prizes: string }[];
  generatedAt: string;
}

interface ContentIntelligenceData {
  frequencyAnalysis: { avgGapDays: number; highActivityConvRate: number; lowActivityConvRate: number; recommendation: string; totalActiveWeeks: number };
  weeklyActivity: { week: string; clicks: number; conversions: number; rate: number }[];
  platformCorrelation: { platform: string; postsNearClicks: number; totalPosts: number; correlation: number }[];
  aiRecommendations: string;
  suggestedTools?: { tool: string; route: string; reason: string }[];
}

interface CustomRangePeriodData {
  period: { start: string; end: string };
  summary: { totalClicks: number; totalSignups: number; totalConversions: number; totalEarnings: number; convRate: number };
  topSources: { source: string; clicks: number; conversions: number }[];
  dailyClicks: { date: string; count: number }[];
  commissionBreakdown: { paid: number; approved: number; pending: number };
}

interface CustomRangeData {
  primary: CustomRangePeriodData;
  comparison: CustomRangePeriodData | null;
  delta: { clicks: number; clicksPct: number; conversions: number; conversionsPct: number; earnings: number; earningsPct: number; convRate: number } | null;
}

const PLATFORM_ICONS: Record<string, string> = {
  youtube: '📺', instagram: '📸', linkedin: '💼', google_analytics: '📊',
  twitter: '🐦', tiktok: '🎵', facebook: '👥', blog: '📝',
};

function fmt(cents: number) { return '$' + (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

export function ConnectedAnalyticsDashboard({ data }: { data: ConnectedOverview }) {
  if (!data?.platformComparison?.length) return (
    <div data-testid="connected-empty" className="rounded-lg border bg-card p-4 text-center">
      <p className="text-sm text-muted-foreground">No connected platforms yet. Connect YouTube, Instagram, or LinkedIn to see merged analytics.</p>
    </div>
  );

  return (
    <div data-testid="connected-dashboard" className="space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <h3 className="font-semibold text-sm mb-3">🔗 Connected Platforms — Merged View</h3>
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="text-center p-2 bg-muted/30 rounded">
            <p className="text-lg font-bold">{data.affiliateOverview.totalClicks}</p>
            <p className="text-[10px] text-muted-foreground">Clicks</p>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded">
            <p className="text-lg font-bold">{data.affiliateOverview.totalSignups}</p>
            <p className="text-[10px] text-muted-foreground">Signups</p>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded">
            <p className="text-lg font-bold">{data.affiliateOverview.totalConversions}</p>
            <p className="text-[10px] text-muted-foreground">Conversions</p>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded">
            <p className="text-lg font-bold">{fmt(data.affiliateOverview.totalEarnings)}</p>
            <p className="text-[10px] text-muted-foreground">Earned</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left py-1.5 pr-2">Platform</th>
                <th className="text-right py-1.5 px-1">Reach</th>
                <th className="text-right py-1.5 px-1">Clicks</th>
                <th className="text-right py-1.5 px-1">Conv</th>
                <th className="text-right py-1.5 px-1">Earnings</th>
                <th className="text-right py-1.5 pl-1">Efficiency</th>
              </tr>
            </thead>
            <tbody>
              {data.platformComparison.map(p => (
                <tr key={p.platform} data-testid={`platform-row-${p.platform}`} className="border-b last:border-0">
                  <td className="py-1.5 pr-2 font-medium">{PLATFORM_ICONS[p.platform] || '📌'} {p.platform}</td>
                  <td className="text-right py-1.5 px-1">{p.reach.toLocaleString()}</td>
                  <td className="text-right py-1.5 px-1">{p.clicks}</td>
                  <td className="text-right py-1.5 px-1">{p.conversions}</td>
                  <td className="text-right py-1.5 px-1">{fmt(p.earnings_cents)}</td>
                  <td className="text-right py-1.5 pl-1 font-medium">{p.efficiency}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function FinancialOverviewPanel({ data }: { data: FinancialData }) {
  const isPositive = data.overview.netIncome > 0;
  const breakdown = data.monthlyBreakdown;
  const maxVal = Math.max(...breakdown.map(m => Math.max(m.earned, m.spent)), 1);

  return (
    <div data-testid="financial-overview" className="space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <h3 className="font-semibold text-sm mb-3">💰 Unified Financial View</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="text-center p-2 bg-[hsl(var(--success)/0.08)] dark:bg-[hsl(var(--success)/0.12)] rounded">
            <p className="text-[10px] text-muted-foreground">Total Earned</p>
            <p className="text-lg font-bold text-[hsl(var(--success))]">{fmt(data.overview.totalEarned)}</p>
          </div>
          <div className="text-center p-2 bg-[hsl(var(--danger)/0.08)] dark:bg-[hsl(var(--danger)/0.12)] rounded">
            <p className="text-[10px] text-muted-foreground">Subscription Cost</p>
            <p className="text-lg font-bold text-[hsl(var(--danger))]">{fmt(data.overview.totalSubscriptionCost)}</p>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded">
            <p className="text-[10px] text-muted-foreground">Net Income</p>
            <p className={`text-lg font-bold ${isPositive ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--danger))]'}`}>{isPositive ? '+' : ''}{fmt(data.overview.netIncome)}</p>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded">
            <p className="text-[10px] text-muted-foreground">ROI</p>
            <p className={`text-lg font-bold ${data.overview.roi >= 100 ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--warning))]'}`}>{data.overview.roi}%</p>
          </div>
        </div>

        {data.overview.breakEvenMonth && (
          <p className="text-xs text-[hsl(var(--success))] mb-3">Subscription paid for itself since {data.overview.breakEvenMonth}</p>
        )}

        {breakdown.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Monthly Earnings vs. Spend</p>
            <div className="flex items-end gap-1 h-20">
              {breakdown.map(m => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full flex flex-col gap-px">
                    <div className="bg-[hsl(var(--success)/0.7)] dark:bg-[hsl(var(--success)/0.6)] rounded-t" style={{ height: `${(m.earned / maxVal) * 60}px` }} title={`Earned: ${fmt(m.earned)}`} />
                    <div className="bg-[hsl(var(--danger)/0.5)] dark:bg-[hsl(var(--danger)/0.6)] rounded-b" style={{ height: `${(m.spent / maxVal) * 60}px` }} title={`Spent: ${fmt(m.spent)}`} />
                  </div>
                  <span className="text-[7px] text-muted-foreground">{m.month.slice(5)}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[hsl(var(--success)/0.7)] rounded-sm" /> Earned</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[hsl(var(--danger)/0.5)] rounded-sm" /> Spent</span>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border bg-card p-4">
        <h3 className="font-semibold text-sm mb-3">📈 Projections</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-2 bg-muted/30 rounded">
            <p className="text-[10px] text-muted-foreground">Avg Monthly Earnings</p>
            <p className="text-sm font-bold">{fmt(data.projections.avgMonthlyEarnings)}</p>
          </div>
          <div className="p-2 bg-muted/30 rounded">
            <p className="text-[10px] text-muted-foreground">Avg Monthly Spend</p>
            <p className="text-sm font-bold">{fmt(data.projections.avgMonthlySpend)}</p>
          </div>
          <div className="p-2 bg-muted/30 rounded">
            <p className="text-[10px] text-muted-foreground">Monthly Net</p>
            <p className={`text-sm font-bold ${data.projections.monthlyNet >= 0 ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--danger))]'}`}>{data.projections.monthlyNet >= 0 ? '+' : ''}{fmt(data.projections.monthlyNet)}</p>
          </div>
          <div className="p-2 bg-muted/30 rounded">
            <p className="text-[10px] text-muted-foreground">Projected Annual Net</p>
            <p className={`text-sm font-bold ${data.projections.projectedAnnualNet >= 0 ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--danger))]'}`}>{data.projections.projectedAnnualNet >= 0 ? '+' : ''}{fmt(data.projections.projectedAnnualNet)}</p>
          </div>
        </div>
        {data.projections.subscriptionPaysForItself && (
          <p className="text-xs text-[hsl(var(--success))] mt-2">Your subscription pays for itself through affiliate earnings.</p>
        )}
      </div>
    </div>
  );
}

export function PredictiveIntelligencePanel({ data }: { data: PredictionsData }) {
  return (
    <div data-testid="predictions" className="space-y-4">
      {data.tierProjection && (
        <div className="rounded-lg border bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-950/20 dark:to-primary-900/20 p-4">
          <h3 className="font-semibold text-sm mb-2">🎯 Tier Trajectory</h3>
          <p className="text-xs">Current: <strong>{data.tierProjection.currentTier}</strong> → Next: <strong>{data.tierProjection.nextTier}</strong></p>
          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
            {data.tierProjection.earningsNeeded > 0 && <p>Need {fmt(data.tierProjection.earningsNeeded)} more in earnings</p>}
            {data.tierProjection.referralsNeeded > 0 && <p>Need {data.tierProjection.referralsNeeded} more active referrals</p>}
            {data.tierProjection.estimatedMonths && (
              <p className="text-sm font-medium text-foreground mt-1">
                Estimated: {data.tierProjection.estimatedMonths} months ({data.tierProjection.estimatedDate})
              </p>
            )}
          </div>
        </div>
      )}

      {data.churnPrediction && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold text-sm mb-2">⚠️ Churn Risk Window</h3>
          <p className="text-xs text-muted-foreground">{data.churnPrediction}</p>
        </div>
      )}

      {data.seasonalPattern && data.seasonalPattern.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold text-sm mb-3">📅 Seasonal Pattern</h3>
          <div className="flex items-end gap-1 h-16">
            {data.seasonalPattern.map(s => {
              const max = Math.max(...data.seasonalPattern!.map(x => x.clicks), 1);
              return (
                <div key={s.month} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-primary-400 dark:bg-primary-600 rounded-t" style={{ height: `${(s.clicks / max) * 50}px` }} />
                  <span className="text-[7px] text-muted-foreground mt-0.5">{s.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {data.nextMilestone && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold text-sm mb-2">🎯 Next Milestone</h3>
          <p className="text-sm font-medium">{data.nextMilestone.name}</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
              <div className="h-full bg-[hsl(var(--success))] rounded-full transition-all" style={{ width: `${Math.min(100, Math.round((data.nextMilestone.current / data.nextMilestone.threshold) * 100))}%` }} />
            </div>
            <span className="text-xs text-muted-foreground">{data.nextMilestone.current}/{data.nextMilestone.threshold}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{data.nextMilestone.referralsNeeded} more referral{data.nextMilestone.referralsNeeded !== 1 ? 's' : ''} → {fmt(data.nextMilestone.bonusCents)} bonus</p>
        </div>
      )}

      {data.activeContests && data.activeContests.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold text-sm mb-2">🏆 Active Contests</h3>
          <div className="space-y-2">
            {data.activeContests.map(c => (
              <div key={c.name} className="p-2 bg-[hsl(var(--warning)/0.1)] dark:bg-[hsl(var(--warning)/0.12)] rounded text-xs">
                <p className="font-medium">{c.name}</p>
                <p className="text-muted-foreground">Metric: {c.metric} · {c.daysLeft} day{c.daysLeft !== 1 ? 's' : ''} left{c.prizes ? ` · Prize: ${c.prizes}` : ''}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.aiPredictions && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold text-sm mb-2">🔮 AI Predictions</h3>
          <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">{data.aiPredictions}</p>
          <p className="text-[10px] text-muted-foreground mt-2">Generated {new Date(data.generatedAt).toLocaleDateString()}</p>
        </div>
      )}
    </div>
  );
}

export function ContentIntelligencePanel({ data }: { data: ContentIntelligenceData }) {
  return (
    <div data-testid="content-intelligence" className="space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <h3 className="font-semibold text-sm mb-3">📊 Promotion Frequency Analysis</h3>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center p-2 bg-muted/30 rounded">
            <p className="text-sm font-bold">{data.frequencyAnalysis.avgGapDays}d</p>
            <p className="text-[10px] text-muted-foreground">Avg Gap</p>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded">
            <p className="text-sm font-bold text-[hsl(var(--success))]">{data.frequencyAnalysis.highActivityConvRate}%</p>
            <p className="text-[10px] text-muted-foreground">High Activity Rate</p>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded">
            <p className="text-sm font-bold text-[hsl(var(--warning))]">{data.frequencyAnalysis.lowActivityConvRate}%</p>
            <p className="text-[10px] text-muted-foreground">Low Activity Rate</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{data.frequencyAnalysis.recommendation}</p>
      </div>

      {data.platformCorrelation.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold text-sm mb-3">🔗 Platform → Clicks Correlation</h3>
          <div className="space-y-2">
            {data.platformCorrelation.map(p => (
              <div key={p.platform} className="flex items-center gap-2 text-xs">
                <span className="w-20">{PLATFORM_ICONS[p.platform] || '📌'} {p.platform}</span>
                <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
                  <div className="h-full bg-primary-500 dark:bg-primary-400 rounded-full" style={{ width: `${p.correlation}%` }} />
                </div>
                <span className="text-muted-foreground w-10 text-right">{p.correlation}%</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">% of posts followed by affiliate clicks within 48 hours</p>
        </div>
      )}

      {data.aiRecommendations && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold text-sm mb-2">🤖 AI Frequency Recommendations</h3>
          <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">{data.aiRecommendations}</p>
        </div>
      )}

      {data.suggestedTools && data.suggestedTools.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold text-sm mb-3">🛠️ Recommended Tools</h3>
          <div className="space-y-2">
            {data.suggestedTools.map(t => (
              <a key={t.tool} href={t.route} data-testid={`tool-link-${t.tool.toLowerCase().replace(/\s+/g, '-')}`} className="flex items-center justify-between p-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors text-xs group">
                <div>
                  <span className="font-medium text-foreground">{t.tool}</span>
                  <span className="text-muted-foreground ml-2">{t.reason}</span>
                </div>
                <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function CustomRangeReportPanel() {
  const [startDate, setStartDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0]; });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [compareMode, setCompareMode] = useState(false);
  const [compareStart, setCompareStart] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 60); return d.toISOString().split('T')[0]; });
  const [compareEnd, setCompareEnd] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 31); return d.toISOString().split('T')[0]; });
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadReport = () => {
    setLoading(true);
    let url = `/api/affiliate/reports/custom-range?start=${startDate}&end=${endDate}`;
    if (compareMode) url += `&compareStart=${compareStart}&compareEnd=${compareEnd}`;
    fetch(url).then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  };

  return (
    <div data-testid="custom-range-report" className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold text-sm mb-3">📅 Custom Date Range Report</h3>
      <div className="flex flex-wrap items-end gap-2 mb-3">
        <div>
          <label className="text-[10px] text-muted-foreground block">From</label>
          <input data-testid="report-start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-xs border rounded px-2 py-1 bg-background" />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground block">To</label>
          <input data-testid="report-end-date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-xs border rounded px-2 py-1 bg-background" />
        </div>
        <button data-testid="toggle-compare" onClick={() => setCompareMode(!compareMode)} className={`text-xs px-2 py-1 rounded ${compareMode ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
          {compareMode ? 'Hide Compare' : 'Compare'}
        </button>
        <button data-testid="generate-report" onClick={loadReport} disabled={loading} className="text-xs px-3 py-1 bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50">
          {loading ? 'Loading...' : 'Generate'}
        </button>
      </div>

      {compareMode && (
        <div className="flex gap-2 mb-3">
          <div>
            <label className="text-[10px] text-muted-foreground block">Compare From</label>
            <input data-testid="compare-start-date" type="date" value={compareStart} onChange={e => setCompareStart(e.target.value)} className="text-xs border rounded px-2 py-1 bg-background" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground block">Compare To</label>
            <input data-testid="compare-end-date" type="date" value={compareEnd} onChange={e => setCompareEnd(e.target.value)} className="text-xs border rounded px-2 py-1 bg-background" />
          </div>
        </div>
      )}

      {data?.primary && (
        <div className="space-y-3 mt-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { label: 'Clicks', value: data.primary.summary.totalClicks, delta: data.delta?.clicksPct },
              { label: 'Conversions', value: data.primary.summary.totalConversions, delta: data.delta?.conversionsPct },
              { label: 'Earnings', value: fmt(data.primary.summary.totalEarnings), delta: data.delta?.earningsPct },
              { label: 'Conv Rate', value: `${data.primary.summary.convRate}%`, delta: data.delta?.convRate },
            ].map(m => (
              <div key={m.label} className="text-center p-2 bg-muted/30 rounded">
                <p className="text-[10px] text-muted-foreground">{m.label}</p>
                <p className="text-sm font-bold">{m.value}</p>
                {m.delta !== undefined && m.delta !== null && (
                  <p className={`text-[10px] ${m.delta > 0 ? 'text-[hsl(var(--success))]' : m.delta < 0 ? 'text-[hsl(var(--danger))]' : 'text-muted-foreground'}`}>
                    {m.delta > 0 ? '↑' : m.delta < 0 ? '↓' : '→'} {Math.abs(m.delta)}%
                  </p>
                )}
              </div>
            ))}
          </div>

          {data.primary.topSources?.length > 0 && (
            <div>
              <p className="text-xs font-medium mb-1">Top Sources</p>
              <div className="space-y-1">
                {data.primary.topSources.slice(0, 5).map((s: any) => (
                  <div key={s.source} className="flex items-center justify-between text-xs">
                    <span>{s.source}</span>
                    <span className="text-muted-foreground">{s.clicks} clicks · {s.conversions} conv</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-medium mb-1">Commission Status</p>
            <div className="flex gap-2 text-xs">
              <span className="text-[hsl(var(--success))]">Paid: {fmt(data.primary.commissionBreakdown.paid)}</span>
              <span className="text-[hsl(var(--chart-1))]">Approved: {fmt(data.primary.commissionBreakdown.approved)}</span>
              <span className="text-[hsl(var(--warning))]">Pending: {fmt(data.primary.commissionBreakdown.pending)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function MetricTooltip({ children, tip }: { children: React.ReactNode; tip: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-foreground text-background text-[10px] rounded shadow-lg whitespace-nowrap z-50 max-w-[200px] text-center">
          {tip}
        </span>
      )}
    </span>
  );
}

export function LastUpdated({ timestamp }: { timestamp?: string }) {
  const [relative, setRelative] = useState('');
  useEffect(() => {
    const update = () => {
      if (!timestamp) { setRelative(''); return; }
      const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
      if (diff < 60) setRelative('Just now');
      else if (diff < 3600) setRelative(`${Math.floor(diff / 60)}m ago`);
      else if (diff < 86400) setRelative(`${Math.floor(diff / 3600)}h ago`);
      else setRelative(`${Math.floor(diff / 86400)}d ago`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [timestamp]);

  if (!relative) return null;
  return <span data-testid="last-updated" className="text-[10px] text-muted-foreground">Updated {relative}</span>;
}

export function Sparkline({ data, width = 60, height = 16, color = 'hsl(var(--chart-1))' }: { data: number[]; width?: number; height?: number; color?: string }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 2) - 1;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="inline-block align-middle">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

export function ExportButton({ data, filename, label = 'Export CSV' }: { data: Record<string, any>[]; filename: string; label?: string }) {
  const handleExport = () => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csv = [headers.join(','), ...data.map(row => headers.map(h => {
      const val = row[h];
      return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
    }).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${filename}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button data-testid={`export-${filename}`} onClick={handleExport} className="text-[10px] px-2 py-0.5 border rounded hover:bg-muted transition-colors">
      {label}
    </button>
  );
}

export function FlywheelReportsSection() {
  const [connectedData, setConnectedData] = useState<ConnectedOverview | null>(null);
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [predictionsData, setPredictionsData] = useState<PredictionsData | null>(null);
  const [contentData, setContentData] = useState<ContentIntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [predictionsLoading, setPredictionsLoading] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/affiliate/analytics/connected-overview').then(r => r.json()).catch(() => null),
      fetch('/api/affiliate/analytics/financial-overview').then(r => r.json()).catch(() => null),
    ]).then(([connected, financial]) => {
      setConnectedData(connected);
      setFinancialData(financial);
      setLastUpdated(new Date().toISOString());
      setLoading(false);
    });
  }, []);

  const loadPredictions = () => {
    setPredictionsLoading(true);
    fetch('/api/affiliate/analytics/predictions')
      .then(r => r.json())
      .then(d => { setPredictionsData(d); setPredictionsLoading(false); })
      .catch(() => setPredictionsLoading(false));
  };

  const loadContentIntel = () => {
    setContentLoading(true);
    fetch('/api/affiliate/analytics/content-intelligence')
      .then(r => r.json())
      .then(d => { setContentData(d); setContentLoading(false); })
      .catch(() => setContentLoading(false));
  };

  if (loading) return <div className="animate-pulse space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted rounded-lg" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Reports & Intelligence</h2>
        <LastUpdated timestamp={lastUpdated} />
      </div>

      {connectedData && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Connected Analytics</h3>
          <ConnectedAnalyticsDashboard data={connectedData} />
        </div>
      )}

      {financialData && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Financial Overview</h3>
          <FinancialOverviewPanel data={financialData} />
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Reports</h3>
        <CustomRangeReportPanel />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Content Intelligence</h3>
        {!contentData && !contentLoading && (
          <button data-testid="load-content-intel" onClick={loadContentIntel} className="w-full p-4 rounded-lg border border-dashed hover:bg-muted/30 transition-colors text-center">
            <p className="text-sm font-medium">📊 Analyze Content Patterns</p>
            <p className="text-xs text-muted-foreground mt-1">See how your posting frequency affects conversions</p>
          </button>
        )}
        {contentLoading && <div className="p-4 rounded-lg border text-center animate-pulse"><p className="text-sm">📊 Analyzing patterns...</p></div>}
        {contentData && <ContentIntelligencePanel data={contentData} />}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Predictive Intelligence</h3>
        {!predictionsData && !predictionsLoading && (
          <button data-testid="load-predictions" onClick={loadPredictions} className="w-full p-4 rounded-lg border border-dashed hover:bg-muted/30 transition-colors text-center">
            <p className="text-sm font-medium">🔮 Generate Predictions</p>
            <p className="text-xs text-muted-foreground mt-1">AI predicts tier trajectory, churn windows, and seasonal trends</p>
          </button>
        )}
        {predictionsLoading && <div className="p-4 rounded-lg border text-center animate-pulse"><p className="text-sm">🔮 Generating predictions...</p></div>}
        {predictionsData && <PredictiveIntelligencePanel data={predictionsData} />}
      </div>
    </div>
  );
}
