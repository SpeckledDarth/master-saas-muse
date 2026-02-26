'use client';

import { useState, useEffect } from 'react';

interface ChurnData {
  churnRate: { rate: number; churnedCount: number; totalActive: number; totalChurned: number };
  churnReasons: { reason: string; count: number; percentage: number }[];
  churnTiming: { month: number; count: number }[];
  atRisk: { referral_id: string; days_inactive: number; last_active: string | null; status: string }[];
  netGrowth: { new: number; churned: number; net: number; previousNet: number; trend: string };
}

interface CohortData {
  retentionCurve: { month: number; retained: number; total: number; percentage: number }[];
  conversionTrend: { month: string; clicks: number; conversions: number; rate: number }[];
  benchmark: { yourRate: number; averageRate: number; totalAffiliates: number; percentile: number };
}

interface SourcesData {
  revenueBySource: { source: string; clicks: number; conversions: number; revenue_cents: number }[];
  cumulativeEarnings: { month: string; cumulative_cents: number }[];
  dropoff: { month: string; clicks: number; signups: number; conversions: number }[];
  geo: { country: string; count: number; percentage: number }[];
  devices: { device: string; count: number; percentage: number }[];
  repeatVisitors: { total: number; multiClickCount: number; totalUniqueVisitors: number };
}

interface AIAnalyticsData {
  insights: Record<string, string>;
  bestTimeToPost: { bestHour: number | null; bestDay: string | null; clicksByHour: Record<number, number>; clicksByDay: Record<string, number> };
  generatedAt: string;
}

const REASON_LABELS: Record<string, string> = {
  too_expensive: 'Too expensive',
  not_using_enough: 'Not using enough',
  switched_competitor: 'Switched to competitor',
  no_longer_needed: 'No longer needed',
  missing_features: 'Missing features',
  unknown: 'Unknown',
};

const COUNTRY_FLAGS: Record<string, string> = {
  US: '🇺🇸', UK: '🇬🇧', CA: '🇨🇦', AU: '🇦🇺', DE: '🇩🇪', FR: '🇫🇷', IN: '🇮🇳', BR: '🇧🇷', JP: '🇯🇵',
};

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--primary-400))',
  'hsl(var(--primary-600))',
  'hsl(var(--primary-300))',
];

export function ChurnRateCard({ data }: { data: ChurnData['churnRate'] }) {
  const color = data.rate < 5 ? 'text-[hsl(var(--success))]' : data.rate < 10 ? 'text-[hsl(var(--warning))]' : 'text-[hsl(var(--danger))]';
  return (
    <div data-testid="churn-rate-card" className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold text-sm mb-2">📉 Churn Rate</h3>
      <p className={`text-3xl font-bold ${color}`}>{data.rate}%</p>
      <p className="text-xs text-muted-foreground mt-1">
        {data.churnedCount} churned this period · {data.totalActive} active · {data.totalChurned} total churned
      </p>
    </div>
  );
}

export function ChurnReasonsChart({ reasons }: { reasons: ChurnData['churnReasons'] }) {
  if (reasons.length === 0) return null;
  const colors = ['bg-[hsl(var(--chart-4))]', 'bg-[hsl(var(--chart-3))]', 'bg-[hsl(var(--warning))]', 'bg-[hsl(var(--chart-1))]', 'bg-[hsl(var(--chart-5))]', 'bg-muted-foreground/60'];

  return (
    <div data-testid="churn-reasons" className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold text-sm mb-3">❓ Why They Left</h3>
      <div className="space-y-2">
        {reasons.map((r, i) => (
          <div key={r.reason} data-testid={`churn-reason-${r.reason}`}>
            <div className="flex items-center justify-between text-xs mb-0.5">
              <span>{REASON_LABELS[r.reason] || r.reason}</span>
              <span className="text-muted-foreground">{r.count} ({r.percentage}%)</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div className={`h-full rounded-full ${colors[i % colors.length]}`} style={{ width: `${r.percentage}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChurnTimingChart({ timing }: { timing: ChurnData['churnTiming'] }) {
  if (timing.length === 0) return null;
  const maxCount = Math.max(...timing.map(t => t.count), 1);

  return (
    <div data-testid="churn-timing" className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold text-sm mb-3">⏱️ When They Churn</h3>
      <div className="flex items-end gap-1 h-24">
        {timing.map(t => (
          <div key={t.month} className="flex-1 flex flex-col items-center">
            <div className="w-full bg-[hsl(var(--danger)/0.6)] dark:bg-[hsl(var(--danger)/0.7)] rounded-t" style={{ height: `${(t.count / maxCount) * 80}px` }} title={`Month ${t.month}: ${t.count} churned`} />
            <span className="text-[9px] text-muted-foreground mt-1">M{t.month}</span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground mt-2">
        Peak churn: Month {timing.reduce((a, b) => a.count > b.count ? a : b).month}
      </p>
    </div>
  );
}

export function AtRiskAlerts({ alerts }: { alerts: ChurnData['atRisk'] }) {
  if (alerts.length === 0) return (
    <div data-testid="at-risk-empty" className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold text-sm">✅ No At-Risk Referrals</h3>
      <p className="text-xs text-muted-foreground mt-1">All your active referrals are engaged!</p>
    </div>
  );

  return (
    <div data-testid="at-risk-alerts" className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold text-sm mb-3">⚠️ At-Risk Referrals</h3>
      <div className="space-y-2">
        {alerts.slice(0, 5).map(a => (
          <div key={a.referral_id} className="flex items-center justify-between p-2 bg-[hsl(var(--danger)/0.08)] dark:bg-[hsl(var(--danger)/0.12)] rounded text-xs">
            <span>Referral {a.referral_id.slice(0, 8)}...</span>
            <span className="text-[hsl(var(--danger))] font-medium">{a.days_inactive} days inactive</span>
          </div>
        ))}
      </div>
      {alerts.length > 5 && <p className="text-xs text-muted-foreground mt-2">+{alerts.length - 5} more at-risk referrals</p>}
    </div>
  );
}

export function NetGrowthCard({ data }: { data: ChurnData['netGrowth'] }) {
  const isPositive = data.net > 0;
  const color = isPositive ? 'text-[hsl(var(--success))]' : data.net < 0 ? 'text-[hsl(var(--danger))]' : 'text-muted-foreground';
  const trendIcon = data.trend === 'up' ? '↑' : data.trend === 'down' ? '↓' : '→';

  return (
    <div data-testid="net-growth" className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold text-sm mb-2">📊 Net Referral Growth</h3>
      <p className={`text-3xl font-bold ${color}`}>{isPositive ? '+' : ''}{data.net}</p>
      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
        <span className="text-[hsl(var(--success))]">+{data.new} new</span>
        <span className="text-[hsl(var(--danger))]">-{data.churned} churned</span>
        <span>{trendIcon} vs prev period ({data.previousNet >= 0 ? '+' : ''}{data.previousNet})</span>
      </div>
    </div>
  );
}

export function RetentionCurve({ data }: { data: CohortData['retentionCurve'] }) {
  if (data.length === 0) return null;
  const width = 500;
  const height = 160;
  const padding = 40;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1 || 1)) * (width - 2 * padding);
    const y = height - padding - (d.percentage / 100) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `${padding},${height - padding} ${points} ${padding + ((data.length - 1) / (data.length - 1 || 1)) * (width - 2 * padding)},${height - padding}`;

  return (
    <div data-testid="retention-curve" className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold text-sm mb-3">📈 Referral Retention Curve</h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        <polygon points={areaPoints} fill="url(#retentionGrad)" />
        <defs>
          <linearGradient id="retentionGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <polyline points={points} fill="none" stroke="hsl(var(--chart-1))" strokeWidth="2.5" />
        {data.map((d, i) => {
          const x = padding + (i / (data.length - 1 || 1)) * (width - 2 * padding);
          const y = height - padding - (d.percentage / 100) * (height - 2 * padding);
          return <circle key={i} cx={x} cy={y} r="3" fill="hsl(var(--chart-1))" />;
        })}
        {[0, 25, 50, 75, 100].map(v => {
          const y = height - padding - (v / 100) * (height - 2 * padding);
          return <g key={v}><line x1={padding} y1={y} x2={width - padding} y2={y} stroke="currentColor" strokeWidth="0.3" opacity="0.15" /><text x={padding - 5} y={y + 3} textAnchor="end" fontSize="8" fill="currentColor" opacity="0.5">{v}%</text></g>;
        })}
        {data.map((d, i) => {
          const x = padding + (i / (data.length - 1 || 1)) * (width - 2 * padding);
          return <text key={i} x={x} y={height - padding + 12} textAnchor="middle" fontSize="8" fill="currentColor" opacity="0.5">M{d.month}</text>;
        })}
      </svg>
      <p className="text-[10px] text-muted-foreground mt-1">
        {data[data.length - 1]?.percentage}% retention at month {data[data.length - 1]?.month} ({data[data.length - 1]?.retained}/{data[data.length - 1]?.total} referrals)
      </p>
    </div>
  );
}

export function ConversionTrendLine({ data }: { data: CohortData['conversionTrend'] }) {
  if (data.length === 0) return null;
  const width = 500;
  const height = 140;
  const padding = 40;
  const maxRate = Math.max(...data.map(d => d.rate), 1);

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1 || 1)) * (width - 2 * padding);
    const y = height - padding - (d.rate / maxRate) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div data-testid="conversion-trend" className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold text-sm mb-3">📉 Conversion Rate Over Time</h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        <polyline points={points} fill="none" stroke="hsl(var(--chart-2))" strokeWidth="2" />
        {data.map((d, i) => {
          const x = padding + (i / (data.length - 1 || 1)) * (width - 2 * padding);
          const y = height - padding - (d.rate / maxRate) * (height - 2 * padding);
          return <circle key={i} cx={x} cy={y} r="2.5" fill="hsl(var(--chart-2))" />;
        })}
        {data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 6)) === 0 || i === data.length - 1).map((d) => {
          const idx = data.indexOf(d);
          const x = padding + (idx / (data.length - 1 || 1)) * (width - 2 * padding);
          return <text key={d.month} x={x} y={height - padding + 12} textAnchor="middle" fontSize="7" fill="currentColor" opacity="0.5">{d.month.slice(5)}</text>;
        })}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
      </svg>
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
        <span>Latest: {data[data.length - 1]?.rate}%</span>
        <span>Avg: {(data.reduce((s, d) => s + d.rate, 0) / data.length).toFixed(1)}%</span>
      </div>
    </div>
  );
}

export function TrialBenchmarks({ data }: { data: CohortData['benchmark'] }) {
  const isAbove = data.yourRate >= data.averageRate;

  return (
    <div data-testid="trial-benchmarks" className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold text-sm mb-3">🎯 Trial-to-Paid Benchmark</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-3 bg-muted/30 rounded">
          <p className="text-xs text-muted-foreground">Your Rate</p>
          <p className={`text-2xl font-bold ${isAbove ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--warning))]'}`}>{data.yourRate}%</p>
        </div>
        <div className="text-center p-3 bg-muted/30 rounded">
          <p className="text-xs text-muted-foreground">Average</p>
          <p className="text-2xl font-bold">{data.averageRate}%</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        You're in the top {100 - data.percentile}% of {data.totalAffiliates} affiliates
      </p>
    </div>
  );
}

export function RevenuePieChart({ data }: { data: SourcesData['revenueBySource'] }) {
  if (data.length === 0) return null;
  const total = data.reduce((s, d) => s + d.revenue_cents, 0) || 1;

  let cumAngle = 0;
  const slices = data.slice(0, 8).map((d, i) => {
    const angle = (d.revenue_cents / total) * 360;
    const startAngle = cumAngle;
    cumAngle += angle;
    const x1 = 100 + 80 * Math.cos(startAngle * Math.PI / 180);
    const y1 = 100 + 80 * Math.sin(startAngle * Math.PI / 180);
    const x2 = 100 + 80 * Math.cos((startAngle + angle) * Math.PI / 180);
    const y2 = 100 + 80 * Math.sin((startAngle + angle) * Math.PI / 180);
    const large = angle > 180 ? 1 : 0;
    return { ...d, color: CHART_COLORS[i], path: `M100,100 L${x1},${y1} A80,80 0 ${large},1 ${x2},${y2} Z`, percentage: Math.round((d.revenue_cents / total) * 100) };
  });

  return (
    <div data-testid="revenue-pie" className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold text-sm mb-3">🥧 Revenue by Source</h3>
      <div className="flex items-start gap-4">
        <svg viewBox="0 0 200 200" className="w-32 h-32 flex-shrink-0">
          {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} opacity="0.85" />)}
        </svg>
        <div className="space-y-1 text-xs flex-1">
          {slices.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: s.color }} />
              <span className="truncate">{s.source}</span>
              <span className="text-muted-foreground ml-auto">{s.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CumulativeEarningsChart({ data }: { data: SourcesData['cumulativeEarnings'] }) {
  if (data.length === 0) return null;
  const width = 500;
  const height = 150;
  const padding = 40;
  const maxVal = Math.max(...data.map(d => d.cumulative_cents), 1);

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1 || 1)) * (width - 2 * padding);
    const y = height - padding - (d.cumulative_cents / maxVal) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `${padding},${height - padding} ${points} ${padding + ((data.length - 1) / (data.length - 1 || 1)) * (width - 2 * padding)},${height - padding}`;

  return (
    <div data-testid="cumulative-earnings" className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold text-sm mb-3">💰 Cumulative Lifetime Earnings</h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        <polygon points={areaPoints} fill="url(#earningsGrad)" />
        <defs>
          <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <polyline points={points} fill="none" stroke="hsl(var(--chart-2))" strokeWidth="2.5" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
        {data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 6)) === 0 || i === data.length - 1).map((d) => {
          const idx = data.indexOf(d);
          const x = padding + (idx / (data.length - 1 || 1)) * (width - 2 * padding);
          return <text key={d.month} x={x} y={height - padding + 12} textAnchor="middle" fontSize="7" fill="currentColor" opacity="0.5">{d.month.slice(2)}</text>;
        })}
      </svg>
      <p className="text-xs text-muted-foreground mt-1">
        Total: ${(data[data.length - 1]?.cumulative_cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
}

export function DropoffAnalysis({ data }: { data: SourcesData['dropoff'] }) {
  if (data.length === 0) return null;
  const latest = data[data.length - 1];
  if (!latest) return null;

  const stages = [
    { label: 'Clicks', value: latest.clicks, color: 'bg-[hsl(var(--chart-1))]' },
    { label: 'Signups', value: latest.signups, color: 'bg-[hsl(var(--chart-2))]' },
    { label: 'Conversions', value: latest.conversions, color: 'bg-[hsl(var(--chart-5))]' },
  ];
  const maxVal = Math.max(...stages.map(s => s.value), 1);

  return (
    <div data-testid="dropoff-analysis" className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold text-sm mb-3">🔻 Conversion Funnel (Latest Period)</h3>
      <div className="space-y-2">
        {stages.map((stage, i) => {
          const dropPct = i > 0 && stages[i - 1].value > 0
            ? Math.round(((stages[i - 1].value - stage.value) / stages[i - 1].value) * 100)
            : 0;
          return (
            <div key={stage.label}>
              <div className="flex items-center justify-between text-xs mb-0.5">
                <span>{stage.label}</span>
                <span className="text-muted-foreground">
                  {stage.value}
                  {i > 0 && <span className="text-[hsl(var(--danger))] ml-1">(-{dropPct}%)</span>}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <div className={`h-full rounded-full ${stage.color}`} style={{ width: `${(stage.value / maxVal) * 100}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      {latest.clicks > 0 && latest.conversions === 0 && (
        <p className="text-xs text-[hsl(var(--warning))] mt-2">Tip: Focus on converting signups — you have clicks but no paid conversions this period.</p>
      )}
      {latest.signups > 0 && latest.conversions > 0 && stages[0].value > 0 && stages[1].value > 0 && (
        <p className="text-xs text-muted-foreground mt-2">
          Biggest drop: {(stages[1].value / stages[0].value) < (stages[2].value / stages[1].value) ? 'Click → Signup' : 'Signup → Conversion'}
        </p>
      )}
    </div>
  );
}

export function GeoBreakdown({ data }: { data: SourcesData['geo'] }) {
  if (data.length === 0) return null;

  return (
    <div data-testid="geo-breakdown" className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold text-sm mb-3">🌍 Geographic Breakdown</h3>
      <div className="space-y-1.5">
        {data.slice(0, 10).map(g => (
          <div key={g.country} className="flex items-center gap-2 text-xs">
            <span className="text-base">{COUNTRY_FLAGS[g.country] || '🏳️'}</span>
            <span className="w-8">{g.country}</span>
            <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
              <div className="h-full bg-primary-500 dark:bg-primary-400 rounded-full" style={{ width: `${g.percentage}%` }} />
            </div>
            <span className="text-muted-foreground w-10 text-right">{g.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DeviceBreakdown({ data }: { data: SourcesData['devices'] }) {
  if (data.length === 0) return null;
  const icons: Record<string, string> = { mobile: '📱', desktop: '💻', tablet: '📟', unknown: '❓' };
  const colors: Record<string, string> = { mobile: 'bg-[hsl(var(--chart-1))]', desktop: 'bg-[hsl(var(--chart-2))]', tablet: 'bg-[hsl(var(--chart-5))]', unknown: 'bg-muted-foreground/60' };

  return (
    <div data-testid="device-breakdown" className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold text-sm mb-3">📱 Device Breakdown</h3>
      <div className="flex items-center gap-2 mb-3">
        {data.map(d => (
          <div key={d.device} className="flex-1 text-center p-2 bg-muted/30 rounded">
            <p className="text-lg">{icons[d.device] || '❓'}</p>
            <p className="text-sm font-bold">{d.percentage}%</p>
            <p className="text-[10px] text-muted-foreground capitalize">{d.device}</p>
          </div>
        ))}
      </div>
      <div className="w-full h-3 rounded-full flex overflow-hidden">
        {data.map(d => (
          <div key={d.device} className={`h-full ${colors[d.device] || 'bg-muted-foreground/60'}`} style={{ width: `${d.percentage}%` }} />
        ))}
      </div>
    </div>
  );
}

export function RepeatVisitors({ data }: { data: SourcesData['repeatVisitors'] }) {
  return (
    <div data-testid="repeat-visitors" className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold text-sm mb-2">🔄 Repeat Visitors</h3>
      <p className="text-2xl font-bold">{data.total}</p>
      <p className="text-xs text-muted-foreground">
        {data.total} people clicked multiple times · {data.multiClickCount} multi-click interactions · {data.totalUniqueVisitors} unique visitors total
      </p>
    </div>
  );
}

export function AIInsightsPanel({ data }: { data: AIAnalyticsData }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  if (!data?.insights) return null;

  const labels: Record<string, { icon: string; title: string }> = {
    conversion_drop: { icon: '📉', title: 'Why Conversions Dropped' },
    content_recommendations: { icon: '📝', title: 'Content Recommendations' },
    channel_optimization: { icon: '📡', title: 'Channel Optimization' },
    audience_fit: { icon: '🎯', title: 'Audience Fit Score' },
    seasonal_trends: { icon: '📅', title: 'Seasonal Trends' },
    competitor_tips: { icon: '⚔️', title: 'Competitor Displacement' },
  };

  return (
    <div data-testid="ai-insights" className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold text-sm mb-3">🤖 AI Analytics Intelligence</h3>
      <p className="text-[10px] text-muted-foreground mb-3">Powered by your real performance data · Generated {new Date(data.generatedAt).toLocaleDateString()}</p>
      <div className="space-y-2">
        {Object.entries(data.insights).map(([key, content]) => {
          const meta = labels[key] || { icon: '💡', title: key.replace(/_/g, ' ') };
          const isExpanded = expanded === key;
          return (
            <div key={key} data-testid={`ai-insight-${key}`} className="border rounded-lg overflow-hidden">
              <button onClick={() => setExpanded(isExpanded ? null : key)} className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/30 transition-colors">
                <span className="text-sm font-medium">{meta.icon} {meta.title}</span>
                <span className="text-xs text-muted-foreground">{isExpanded ? '▲' : '▼'}</span>
              </button>
              {isExpanded && (
                <div className="px-3 pb-3 text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground border-t pt-2">
                  {content}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function BestTimeToPost({ data }: { data: AIAnalyticsData['bestTimeToPost'] }) {
  if (!data) return null;
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayData = Object.entries(data.clicksByDay || {}).map(([day, count]) => ({ day, count: count as number }));
  const maxDayClicks = Math.max(...dayData.map(d => d.count), 1);

  return (
    <div data-testid="best-time-to-post" className="rounded-lg border bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-950/20 dark:to-primary-900/20 p-4">
      <h3 className="font-semibold text-sm mb-2">⏰ Best Time to Post</h3>
      {data.bestDay && data.bestHour !== null ? (
        <p className="text-lg font-bold">{data.bestDay}s at {data.bestHour}:00</p>
      ) : (
        <p className="text-sm text-muted-foreground">Not enough data yet</p>
      )}
      {dayData.length > 0 && (
        <div className="mt-3 flex items-end gap-1 h-12">
          {dayNames.map(day => {
            const count = (data.clicksByDay as Record<string, number>)?.[day] || 0;
            return (
              <div key={day} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-primary-400 dark:bg-primary-600 rounded-t transition-all" style={{ height: `${(count / maxDayClicks) * 40}px`, minHeight: count > 0 ? '2px' : '0' }} />
                <span className="text-[8px] text-muted-foreground mt-0.5">{day.slice(0, 2)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function FlywheelAnalyticsSection() {
  const [churnData, setChurnData] = useState<ChurnData | null>(null);
  const [cohortData, setCohortData] = useState<CohortData | null>(null);
  const [sourcesData, setSourcesData] = useState<SourcesData | null>(null);
  const [aiData, setAiData] = useState<AIAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [period, setPeriod] = useState('90d');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/affiliate/analytics/churn?period=${period}`).then(r => r.json()).catch(() => null),
      fetch('/api/affiliate/analytics/cohort').then(r => r.json()).catch(() => null),
      fetch('/api/affiliate/analytics/sources').then(r => r.json()).catch(() => null),
    ]).then(([churn, cohort, sources]) => {
      setChurnData(churn);
      setCohortData(cohort);
      setSourcesData(sources);
      setLoading(false);
    });
  }, [period]);

  const loadAIInsights = () => {
    setAiLoading(true);
    fetch('/api/affiliate/ai-analytics?type=all')
      .then(r => r.json())
      .then(d => { setAiData(d); setAiLoading(false); })
      .catch(() => setAiLoading(false));
  };

  if (loading) return <div className="animate-pulse space-y-4">{[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-muted rounded-lg" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Flywheel Intelligence</h2>
        <div className="flex gap-1">
          {['7d', '30d', '90d', '1y'].map(p => (
            <button key={p} data-testid={`flywheel-period-${p}`} onClick={() => setPeriod(p)} className={`px-2 py-1 text-xs rounded ${period === p ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {churnData && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Churn Intelligence</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ChurnRateCard data={churnData.churnRate} />
            <NetGrowthCard data={churnData.netGrowth} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <ChurnReasonsChart reasons={churnData.churnReasons} />
            <ChurnTimingChart timing={churnData.churnTiming} />
          </div>
          <div className="mt-4">
            <AtRiskAlerts alerts={churnData.atRisk} />
          </div>
        </div>
      )}

      {cohortData && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Cohort & Trends</h3>
          <RetentionCurve data={cohortData.retentionCurve} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <ConversionTrendLine data={cohortData.conversionTrend} />
            <TrialBenchmarks data={cohortData.benchmark} />
          </div>
        </div>
      )}

      {sourcesData && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Revenue & Traffic</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RevenuePieChart data={sourcesData.revenueBySource} />
            <CumulativeEarningsChart data={sourcesData.cumulativeEarnings} />
          </div>
          <div className="mt-4">
            <DropoffAnalysis data={sourcesData.dropoff} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <GeoBreakdown data={sourcesData.geo} />
            <DeviceBreakdown data={sourcesData.devices} />
          </div>
          <div className="mt-4">
            <RepeatVisitors data={sourcesData.repeatVisitors} />
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">AI Intelligence</h3>
        {!aiData && !aiLoading && (
          <button data-testid="load-ai-insights" onClick={loadAIInsights} className="w-full p-4 rounded-lg border border-dashed hover:bg-muted/30 transition-colors text-center">
            <p className="text-sm font-medium">🤖 Generate AI Insights</p>
            <p className="text-xs text-muted-foreground mt-1">AI analyzes your real data to provide personalized recommendations</p>
          </button>
        )}
        {aiLoading && (
          <div className="p-4 rounded-lg border text-center animate-pulse">
            <p className="text-sm">🤖 Analyzing your data...</p>
            <p className="text-xs text-muted-foreground mt-1">This may take 10-15 seconds</p>
          </div>
        )}
        {aiData && (
          <>
            <BestTimeToPost data={aiData.bestTimeToPost} />
            <div className="mt-4">
              <AIInsightsPanel data={aiData} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
