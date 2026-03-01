'use client';

import { useState, useEffect } from 'react';

interface ExpandedAnalytics {
  clickHeatmap: Record<string, number>;
  channelBreakdown: Record<string, { clicks: number; signups: number; conversions: number }>;
  scorecard: Record<string, { current: number; previous: number; change: number }>;
  personalBest: { month: string; amount_cents: number } | null;
  efficiency: { earningsPerClick: number; earningsPerSignup: number; conversionRate: number };
  dualAxis: { dailyClicks: Record<string, number>; dailyConversions: Record<string, number> };
  campaignComparison: any[];
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function ClickHeatmap({ data }: { data: Record<string, number> }) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div data-testid="click-heatmap-empty" className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] p-[var(--card-padding,1.25rem)]">
        <h3 className="font-semibold text-sm mb-2">🗓️ Click Heatmap</h3>
        <p className="text-sm text-muted-foreground">Not enough click data yet. Keep promoting!</p>
      </div>
    );
  }

  const maxVal = Math.max(...Object.values(data), 1);

  return (
    <div data-testid="click-heatmap" className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] p-[var(--card-padding,1.25rem)]">
      <h3 className="font-semibold text-sm mb-3">🗓️ Click Heatmap (Day × Hour)</h3>
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          <div className="flex">
            <div className="w-10" />
            {HOURS.filter((_, i) => i % 3 === 0).map(h => (
              <div key={h} className="flex-1 text-center text-[10px] text-muted-foreground">{h}:00</div>
            ))}
          </div>
          {DAYS.map((day, dayIdx) => (
            <div key={day} className="flex items-center">
              <div className="w-10 text-[10px] text-muted-foreground">{day}</div>
              <div className="flex-1 flex gap-[1px]">
                {HOURS.map(h => {
                  const key = `${dayIdx}-${h}`;
                  const val = data[key] || 0;
                  const intensity = val / maxVal;
                  const bg = val === 0
                    ? 'bg-muted/30'
                    : intensity < 0.33
                      ? 'bg-primary-200 dark:bg-primary-900/40'
                      : intensity < 0.66
                        ? 'bg-primary-400 dark:bg-primary-700/60'
                        : 'bg-primary-600 dark:bg-primary-500/80';
                  return (
                    <div key={h} className={`w-full aspect-square rounded-sm ${bg}`} title={`${day} ${h}:00 — ${val} clicks`} />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
        <span>Less</span>
        <div className="w-3 h-3 rounded-sm bg-muted/30" />
        <div className="w-3 h-3 rounded-sm bg-primary-200 dark:bg-primary-900/40" />
        <div className="w-3 h-3 rounded-sm bg-primary-400 dark:bg-primary-700/60" />
        <div className="w-3 h-3 rounded-sm bg-primary-600 dark:bg-primary-500/80" />
        <span>More</span>
      </div>
    </div>
  );
}

export function ConversionByChannel({ data }: { data: Record<string, { clicks: number; signups: number; conversions: number }> }) {
  const channels = Object.entries(data).sort((a, b) => b[1].clicks - a[1].clicks).slice(0, 10);
  if (channels.length === 0) return null;

  const maxClicks = Math.max(...channels.map(([, v]) => v.clicks), 1);

  return (
    <div data-testid="conversion-by-channel" className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] p-[var(--card-padding,1.25rem)]">
      <h3 className="font-semibold text-sm mb-3">📊 Conversion Rate by Channel</h3>
      <div className="space-y-2">
        {channels.map(([channel, stats]) => {
          const rate = stats.clicks > 0 ? ((stats.conversions / stats.clicks) * 100).toFixed(1) : '0.0';
          return (
            <div key={channel} data-testid={`channel-${channel}`}>
              <div className="flex items-center justify-between text-xs mb-0.5">
                <span className="truncate max-w-[120px]">{channel}</span>
                <span className="text-muted-foreground">{stats.clicks} clicks → {stats.conversions} conv ({rate}%)</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div className="h-full bg-primary-500 dark:bg-primary-400 rounded-full" style={{ width: `${(stats.clicks / maxClicks) * 100}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MoMScorecard({ data }: { data: Record<string, { current: number; previous: number; change: number }> }) {
  if (!data) return null;

  const metrics = [
    { key: 'clicks', label: 'Clicks', format: (v: number) => v.toString() },
    { key: 'signups', label: 'Signups', format: (v: number) => v.toString() },
    { key: 'conversions', label: 'Conversions', format: (v: number) => v.toString() },
    { key: 'earnings', label: 'Earnings', format: (v: number) => `$${(v / 100).toFixed(2)}` }
  ];

  return (
    <div data-testid="mom-scorecard" className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] p-[var(--card-padding,1.25rem)]">
      <h3 className="font-semibold text-sm mb-3">📈 Period Scorecard</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {metrics.map(m => {
          const d = data[m.key];
          if (!d) return null;
          const isUp = d.change > 0;
          const isDown = d.change < 0;
          return (
            <div key={m.key} data-testid={`scorecard-${m.key}`} className="p-2 bg-muted/30 rounded text-center">
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p className="text-lg font-bold">{m.format(d.current)}</p>
              <p className={`text-xs ${isUp ? 'text-[hsl(var(--success))]' : isDown ? 'text-[hsl(var(--danger))]' : 'text-muted-foreground'}`}>
                {isUp ? '↑' : isDown ? '↓' : '→'} {Math.abs(d.change)}%
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PersonalBestCard({ data }: { data: { month: string; amount_cents: number } | null }) {
  if (!data) return null;

  return (
    <div data-testid="personal-best" className="rounded-lg border bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-950/20 dark:to-primary-900/20 p-4">
      <h3 className="font-semibold text-sm">🏆 Personal Best</h3>
      <p className="text-2xl font-bold mt-1">${(data.amount_cents / 100).toFixed(2)}</p>
      <p className="text-xs text-muted-foreground">{data.month} — Can you beat it?</p>
    </div>
  );
}

export function EfficiencyMetrics({ data }: { data: { earningsPerClick: number; earningsPerSignup: number; conversionRate: number } }) {
  return (
    <div data-testid="efficiency-metrics" className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] p-[var(--card-padding,1.25rem)]">
      <h3 className="font-semibold text-sm mb-3">⚡ Efficiency Metrics</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
        <div className="p-2 bg-muted/30 rounded">
          <p className="font-bold">${(data.earningsPerClick / 100).toFixed(2)}</p>
          <p className="text-[10px] text-muted-foreground">Per Click</p>
        </div>
        <div className="p-2 bg-muted/30 rounded">
          <p className="font-bold">${(data.earningsPerSignup / 100).toFixed(2)}</p>
          <p className="text-[10px] text-muted-foreground">Per Signup</p>
        </div>
        <div className="p-2 bg-muted/30 rounded">
          <p className="font-bold">{data.conversionRate}%</p>
          <p className="text-[10px] text-muted-foreground">Conv. Rate</p>
        </div>
      </div>
    </div>
  );
}

export function DualAxisChart({ data }: { data: { dailyClicks: Record<string, number>; dailyConversions: Record<string, number> } }) {
  const dates = [...new Set([...Object.keys(data.dailyClicks), ...Object.keys(data.dailyConversions)])].sort().slice(-30);
  if (dates.length === 0) return null;

  const maxClicks = Math.max(...dates.map(d => data.dailyClicks[d] || 0), 1);
  const maxConv = Math.max(...dates.map(d => data.dailyConversions[d] || 0), 1);
  const width = 500;
  const height = 150;
  const padding = 30;

  const clickPoints = dates.map((d, i) => {
    const x = padding + (i / (dates.length - 1 || 1)) * (width - 2 * padding);
    const y = height - padding - ((data.dailyClicks[d] || 0) / maxClicks) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  const convPoints = dates.map((d, i) => {
    const x = padding + (i / (dates.length - 1 || 1)) * (width - 2 * padding);
    const y = height - padding - ((data.dailyConversions[d] || 0) / maxConv) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div data-testid="dual-axis-chart" className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] p-[var(--card-padding,1.25rem)]">
      <h3 className="font-semibold text-sm mb-3">📉 Clicks vs Conversions</h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        <polyline points={clickPoints} fill="none" stroke="hsl(var(--chart-1))" strokeWidth="2" />
        <polyline points={convPoints} fill="none" stroke="hsl(var(--chart-2))" strokeWidth="2" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
      </svg>
      <div className="flex items-center gap-4 justify-center text-xs text-muted-foreground mt-1">
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[hsl(var(--chart-1))] inline-block" /> Clicks</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[hsl(var(--chart-2))] inline-block" /> Conversions</span>
      </div>
    </div>
  );
}

export function CampaignComparison({ campaigns }: { campaigns: any[] }) {
  if (!campaigns || campaigns.length === 0) return null;

  return (
    <div data-testid="campaign-comparison" className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] p-[var(--card-padding,1.25rem)]">
      <h3 className="font-semibold text-sm mb-3">📋 Campaign Comparison</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b">
              <th className="text-left p-1">Campaign</th>
              <th className="text-right p-1">Clicks</th>
              <th className="text-right p-1">Signups</th>
              <th className="text-right p-1">Conv.</th>
              <th className="text-right p-1">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map(c => (
              <tr key={c.id} className="border-b border-muted/30">
                <td className="p-1 truncate max-w-[120px]">{c.name}</td>
                <td className="text-right p-1">{c.clicks || 0}</td>
                <td className="text-right p-1">{c.signups || 0}</td>
                <td className="text-right p-1">{c.conversions || 0}</td>
                <td className="text-right p-1">${((c.revenue_cents || 0) / 100).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ExpandedAnalyticsSection() {
  const [data, setData] = useState<ExpandedAnalytics | null>(null);
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/affiliate/analytics/expanded?period=${period}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  if (loading) return <div className="animate-pulse space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted rounded-lg" />)}</div>;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Expanded Analytics</h2>
        <div className="flex gap-1">
          {['7d', '30d', '90d', '1y'].map(p => (
            <button key={p} data-testid={`expanded-period-${p}`} onClick={() => setPeriod(p)} className={`px-2 py-1 text-xs rounded ${period === p ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>
      <MoMScorecard data={data.scorecard} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PersonalBestCard data={data.personalBest} />
        <EfficiencyMetrics data={data.efficiency} />
      </div>
      <DualAxisChart data={data.dualAxis} />
      <ClickHeatmap data={data.clickHeatmap} />
      <ConversionByChannel data={data.channelBreakdown} />
      <CampaignComparison campaigns={data.campaignComparison} />
    </div>
  );
}
