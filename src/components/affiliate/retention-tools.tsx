'use client';

import { useState, useEffect } from 'react';
import { ExportButton } from './flywheel-reports';

interface EarningsProjectionsData {
  summary: { totalEarningsCents: number; activeReferrals: number; avgMonthlyEarnings: number; growthRate: number; currentTier: string };
  currentMonth: { monthSoFar: number; projected: number; optimistic: number; pessimistic: number; daysLeft: number; dailyAvg: number };
  monthlyProjections: { month: string; projected: number; optimistic: number; pessimistic: number; cumulative: number }[];
  annualProjection: { yearToDate: number; projected: number; growthAdjusted: number };
  tierProjection: { currentTier: string; nextTier: string | null; referralsNeeded: number; estimatedDate: string | null; additionalMonthlyEarnings: number } | null;
  milestoneProjections: { name: string; threshold: number; current: number; bonusCents: number; estimatedDate: string | null }[];
  goalProjections: { name: string; targetCents: number; currentCents: number; onTrack: boolean; estimatedDate: string | null; dailyNeeded: number }[];
  historicalMonthly: { month: string; earnings: number }[];
}

interface PayoutHistoryData {
  payouts: { id: string; total_amount_cents: number; status: string; method: string; created_at: string; processed_at: string | null }[];
  summary: { totalPaid: number; totalPending: number; totalCount: number };
  csvData?: Record<string, any>[];
  total: number;
  totalPages: number;
  page: number;
}

interface RenewalStats {
  totalRequests: number;
  approved: number;
  denied: number;
  pending: number;
  successRate: number;
  avgExtensionDays: number;
  revenueSavedCents: number;
}

function fmt(cents: number) {
  return '$' + (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtShort(cents: number) {
  if (cents >= 100000) return '$' + (cents / 100000).toFixed(1) + 'k';
  return fmt(cents);
}

export function EarningsProjectionsPanel() {
  const [data, setData] = useState<EarningsProjectionsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadProjections = () => {
    setLoading(true);
    setError('');
    fetch('/api/affiliate/analytics/earnings-projections')
      .then(r => { if (!r.ok) throw new Error('Request failed'); return r.json(); })
      .then(d => { if (d.error) setError(d.error); else setData(d); })
      .catch(() => setError('Failed to load projections'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadProjections(); }, []);

  if (loading) return (
    <div data-testid="earnings-projections-loading" className="rounded-lg border bg-card p-6 text-center">
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-muted rounded w-1/3 mx-auto" />
        <div className="h-20 bg-muted rounded" />
      </div>
    </div>
  );

  if (error) return (
    <div data-testid="earnings-projections-error" className="rounded-lg border bg-card p-4 text-center">
      <p className="text-sm text-muted-foreground">{error}</p>
      <button onClick={loadProjections} className="text-xs text-primary mt-2 hover:underline" data-testid="button-retry-projections">Retry</button>
    </div>
  );

  if (!data) return null;

  const maxProjected = Math.max(...(data.monthlyProjections || []).map(m => m.optimistic), 1);

  return (
    <div data-testid="earnings-projections" className="space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <h3 className="font-semibold text-sm mb-3">This Month's Pace</h3>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-muted/30 rounded">
            <p className="text-lg font-bold" data-testid="text-month-so-far">{fmt(data.currentMonth.monthSoFar)}</p>
            <p className="text-[10px] text-muted-foreground">Earned So Far</p>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded">
            <p className="text-lg font-bold text-primary" data-testid="text-month-projected">{fmt(data.currentMonth.projected)}</p>
            <p className="text-[10px] text-muted-foreground">Projected Total</p>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded">
            <p className="text-lg font-bold" data-testid="text-daily-avg">{fmt(data.currentMonth.dailyAvg)}</p>
            <p className="text-[10px] text-muted-foreground">Daily Average</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
          <span data-testid="text-projection-range">Range: {fmt(data.currentMonth.pessimistic)} – {fmt(data.currentMonth.optimistic)}</span>
          <span className="ml-auto">{data.currentMonth.daysLeft} days left</span>
        </div>
      </div>

      {data.monthlyProjections && data.monthlyProjections.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold text-sm mb-3">Forward Projections</h3>
          <div className="space-y-2">
            {data.monthlyProjections.map(m => (
              <div key={m.month} className="flex items-center gap-2 text-xs" data-testid={`projection-row-${m.month}`}>
                <span className="w-14 text-muted-foreground">{new Date(m.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}</span>
                <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden relative">
                  <div className="h-full bg-blue-200 dark:bg-blue-900 rounded-full absolute" style={{ width: `${(m.optimistic / maxProjected) * 100}%` }} />
                  <div className="h-full bg-blue-500 dark:bg-blue-400 rounded-full absolute" style={{ width: `${(m.projected / maxProjected) * 100}%` }} />
                </div>
                <span className="w-16 text-right font-medium">{fmtShort(m.projected)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-3 h-2 bg-blue-500 rounded inline-block" /> Projected</span>
            <span className="flex items-center gap-1"><span className="w-3 h-2 bg-blue-200 dark:bg-blue-900 rounded inline-block" /> Optimistic</span>
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-card p-4">
        <h3 className="font-semibold text-sm mb-2">Annual Projection</h3>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-muted/30 rounded">
            <p className="text-sm font-bold" data-testid="text-ytd">{fmt(data.annualProjection.yearToDate)}</p>
            <p className="text-[10px] text-muted-foreground">Year to Date</p>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded">
            <p className="text-sm font-bold text-primary" data-testid="text-annual-projected">{fmt(data.annualProjection.projected)}</p>
            <p className="text-[10px] text-muted-foreground">Projected Annual</p>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded">
            <p className="text-sm font-bold text-green-600" data-testid="text-annual-growth">{fmt(data.annualProjection.growthAdjusted)}</p>
            <p className="text-[10px] text-muted-foreground">With Growth</p>
          </div>
        </div>
      </div>

      {data.tierProjection && data.tierProjection.nextTier && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold text-sm mb-2">Tier Trajectory</h3>
          <p className="text-xs text-muted-foreground">
            Currently <strong>{data.tierProjection.currentTier}</strong> — need {data.tierProjection.referralsNeeded} more referrals to reach <strong>{data.tierProjection.nextTier}</strong>
            {data.tierProjection.estimatedDate && <> (estimated {new Date(data.tierProjection.estimatedDate).toLocaleDateString()})</>}
          </p>
          {data.tierProjection.additionalMonthlyEarnings > 0 && (
            <p className="text-xs text-green-600 mt-1">Upgrading adds ~{fmt(data.tierProjection.additionalMonthlyEarnings)}/mo from higher commission rate</p>
          )}
        </div>
      )}

      {data.milestoneProjections && data.milestoneProjections.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold text-sm mb-2">Upcoming Milestone Bonuses</h3>
          <div className="space-y-2">
            {data.milestoneProjections.slice(0, 3).map(m => (
              <div key={m.name} className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-medium">{m.name}</span>
                  <span className="text-muted-foreground ml-2">{m.current}/{m.threshold} referrals</span>
                </div>
                <div className="text-right">
                  <span className="font-medium text-green-600">{fmt(m.bonusCents)}</span>
                  {m.estimatedDate && <span className="text-muted-foreground ml-1">~{new Date(m.estimatedDate).toLocaleDateString('en-US', { month: 'short' })}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.goalProjections && data.goalProjections.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold text-sm mb-2">Goal Progress</h3>
          <div className="space-y-3">
            {data.goalProjections.map(g => {
              const pct = g.targetCents > 0 ? Math.min(100, Math.round((g.currentCents / g.targetCents) * 100)) : 0;
              return (
                <div key={g.name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium">{g.name}</span>
                    <span className={g.onTrack ? 'text-green-600' : 'text-orange-500'}>{g.onTrack ? 'On track' : 'Behind pace'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                      <div className={`h-full rounded-full ${g.onTrack ? 'bg-green-500' : 'bg-orange-400'}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground w-20 text-right">{fmt(g.currentCents)} / {fmt(g.targetCents)}</span>
                  </div>
                  {g.estimatedDate && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Est. completion: {new Date(g.estimatedDate).toLocaleDateString()} · Need {fmt(g.dailyNeeded)}/day
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {data.historicalMonthly && data.historicalMonthly.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm">Historical Trend</h3>
            <ExportButton data={data.historicalMonthly.map(h => ({ Month: h.month, Earnings: (h.earnings / 100).toFixed(2) }))} filename="earnings-history" />
          </div>
          <div className="flex items-end gap-1 h-20">
            {data.historicalMonthly.map(h => {
              const max = Math.max(...data.historicalMonthly.map(x => x.earnings), 1);
              return (
                <div key={h.month} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-blue-400 dark:bg-blue-600 rounded-t transition-all" style={{ height: `${(h.earnings / max) * 60}px` }} title={fmt(h.earnings)} />
                  <span className="text-[7px] text-muted-foreground mt-0.5">{new Date(h.month + '-01').toLocaleDateString('en-US', { month: 'short' })}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function PayoutHistoryPanel() {
  const [data, setData] = useState<PayoutHistoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  const loadPayouts = (p = 1) => {
    setLoading(true);
    setError(null);
    let url = `/api/affiliate/payout-history?page=${p}&limit=20&format=csv`;
    if (statusFilter !== 'all') url += `&status=${statusFilter}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    fetch(url)
      .then(r => { if (!r.ok) throw new Error('Request failed'); return r.json(); })
      .then(d => { setData(d); setPage(p); })
      .catch(() => setError('Failed to load payout history'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadPayouts(); }, []);

  if (error && !data) return (
    <div data-testid="payout-history-error" className="rounded-lg border bg-card p-4 text-center">
      <p className="text-sm text-muted-foreground">{error}</p>
      <button onClick={() => loadPayouts(1)} className="text-xs text-primary mt-2 hover:underline" data-testid="button-retry-payouts">Retry</button>
    </div>
  );

  if (loading && !data) return (
    <div data-testid="payout-history-loading" className="rounded-lg border bg-card p-4">
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="h-16 bg-muted rounded" />
        <div className="h-10 bg-muted rounded" />
      </div>
    </div>
  );

  return (
    <div data-testid="payout-history-panel" className="space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="font-semibold text-sm">Payout History</h3>
          <div className="flex items-center gap-2 flex-wrap">
            {data?.csvData && data.csvData.length > 0 && (
              <ExportButton data={data.csvData} filename="payout-history" label="Export CSV" />
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs border rounded px-2 py-1 bg-background"
            data-testid="select-payout-status-filter"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-xs border rounded px-2 py-1 bg-background" data-testid="input-payout-start-date" />
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-xs border rounded px-2 py-1 bg-background" data-testid="input-payout-end-date" />
          <button onClick={() => loadPayouts(1)} className="text-xs px-3 py-1 bg-primary text-primary-foreground rounded hover:opacity-90" data-testid="button-filter-payouts">
            {loading ? 'Loading...' : 'Filter'}
          </button>
        </div>

        {data?.summary && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center p-2 bg-muted/30 rounded">
              <p className="text-sm font-bold text-green-600" data-testid="text-total-paid">{fmt(data.summary.totalPaid)}</p>
              <p className="text-[10px] text-muted-foreground">Total Paid</p>
            </div>
            <div className="text-center p-2 bg-muted/30 rounded">
              <p className="text-sm font-bold text-orange-500" data-testid="text-total-pending">{fmt(data.summary.totalPending)}</p>
              <p className="text-[10px] text-muted-foreground">Pending</p>
            </div>
            <div className="text-center p-2 bg-muted/30 rounded">
              <p className="text-sm font-bold" data-testid="text-payout-count">{data.summary.totalCount}</p>
              <p className="text-[10px] text-muted-foreground">Total Payouts</p>
            </div>
          </div>
        )}

        {data?.payouts && data.payouts.length > 0 ? (
          <div className="space-y-1">
            {data.payouts.map(p => (
              <div key={p.id} className="flex items-center justify-between p-2 rounded border text-xs" data-testid={`payout-history-${p.id}`}>
                <div className="flex items-center gap-2">
                  <span data-testid={`badge-payout-status-${p.id}`} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    p.status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    p.status === 'approved' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    p.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>{p.status}</span>
                  <span className="font-medium">{fmt(p.total_amount_cents)}</span>
                  {p.method && <span className="text-muted-foreground">{p.method}</span>}
                </div>
                <span className="text-muted-foreground">{new Date(p.processed_at || p.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No payouts found for the selected filters.</p>
        )}

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-3">
            <button disabled={page <= 1} onClick={() => loadPayouts(page - 1)} className="text-xs px-2 py-1 border rounded disabled:opacity-40" data-testid="button-payout-prev">Prev</button>
            <span className="text-xs text-muted-foreground">Page {page} of {data.totalPages}</span>
            <button disabled={page >= data.totalPages} onClick={() => loadPayouts(page + 1)} className="text-xs px-2 py-1 border rounded disabled:opacity-40" data-testid="button-payout-next">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}

export function TaxCenterPanel() {
  const [taxSummary, setTaxSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [downloading, setDownloading] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const loadSummary = (year: number) => {
    setLoading(true);
    setError(null);
    setSelectedYear(year);
    fetch(`/api/affiliate/tax-summary?year=${year}`)
      .then(r => { if (!r.ok) throw new Error('Request failed'); return r.json(); })
      .then(d => setTaxSummary(d))
      .catch(() => setError('Failed to load tax summary'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadSummary(selectedYear); }, []);

  const downloadTaxReport = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/affiliate/tax-summary?year=${selectedYear}&format=html`);
      if (res.ok) {
        const html = await res.text();
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tax-summary-${selectedYear}.html`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {}
    setDownloading(false);
  };

  const grossCents = taxSummary?.grossEarnings || taxSummary?.gross_earnings_cents || 0;
  const paidCents = taxSummary?.totalPaid || taxSummary?.total_paid_cents || 0;
  const needs1099 = grossCents >= 60000;

  return (
    <div data-testid="tax-center-panel" className="space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Tax Summary</h3>
          <div className="flex items-center gap-2">
            <select
              value={selectedYear}
              onChange={e => loadSummary(Number(e.target.value))}
              className="text-xs border rounded px-2 py-1 bg-background"
              data-testid="select-tax-year"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button
              onClick={downloadTaxReport}
              disabled={downloading || loading}
              className="text-[10px] px-2 py-0.5 border rounded hover:bg-muted transition-colors disabled:opacity-50"
              data-testid="button-download-tax-report"
            >
              {downloading ? 'Generating...' : 'Download Report'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-16 bg-muted rounded" />
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">{error}</p>
            <button onClick={() => loadSummary(selectedYear)} className="text-xs text-primary mt-2 hover:underline" data-testid="button-retry-tax">Retry</button>
          </div>
        ) : taxSummary ? (
          <>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="text-center p-3 bg-muted/30 rounded">
                <p className="text-lg font-bold" data-testid="text-gross-earnings">{fmt(grossCents)}</p>
                <p className="text-[10px] text-muted-foreground">Gross Earnings</p>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded">
                <p className="text-lg font-bold text-green-600" data-testid="text-total-paid-tax">{fmt(paidCents)}</p>
                <p className="text-[10px] text-muted-foreground">Total Paid Out</p>
              </div>
            </div>

            {needs1099 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 mb-3" data-testid="notice-1099">
                <p className="text-xs font-medium text-amber-800 dark:text-amber-300">1099-NEC Likely Required</p>
                <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5">Your {selectedYear} earnings exceed $600. You should receive a 1099-NEC form. Make sure your tax information is up to date.</p>
              </div>
            )}

            {taxSummary.monthlyBreakdown && taxSummary.monthlyBreakdown.length > 0 && (
              <div>
                <h4 className="text-xs font-medium mb-2">Monthly Breakdown</h4>
                <div className="grid grid-cols-4 gap-1 text-[10px]">
                  {taxSummary.monthlyBreakdown.map((m: any) => (
                    <div key={m.month} className="text-center p-1.5 bg-muted/20 rounded">
                      <p className="font-medium">{fmt(m.earnings || m.amount || 0)}</p>
                      <p className="text-muted-foreground">{new Date(m.month + '-01').toLocaleDateString('en-US', { month: 'short' })}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3 p-3 bg-muted/20 rounded">
              <h4 className="text-xs font-medium mb-1">Estimated Tax Withholding</h4>
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div>
                  <p className="text-muted-foreground">Self-Employment (15.3%)</p>
                  <p className="font-medium">{fmt(Math.round(grossCents * 0.153))}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Federal (~22%)</p>
                  <p className="font-medium">{fmt(Math.round(grossCents * 0.22))}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total (~37%)</p>
                  <p className="font-medium text-red-500">{fmt(Math.round(grossCents * 0.37))}</p>
                </div>
              </div>
              <p className="text-[9px] text-muted-foreground mt-1">Estimates only. Consult a tax professional for accurate calculations.</p>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No earnings data found for {selectedYear}.</p>
        )}
      </div>
    </div>
  );
}

export function CommissionRenewalStatsPanel({ stats }: { stats: RenewalStats | null }) {
  if (!stats || stats.totalRequests === 0) return null;

  return (
    <div data-testid="renewal-stats-panel" className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold text-sm mb-3">Renewal Performance</h3>
      <div className="grid grid-cols-4 gap-2">
        <div className="text-center p-2 bg-muted/30 rounded">
          <p className="text-sm font-bold" data-testid="text-renewal-total">{stats.totalRequests}</p>
          <p className="text-[10px] text-muted-foreground">Total Requests</p>
        </div>
        <div className="text-center p-2 bg-muted/30 rounded">
          <p className="text-sm font-bold text-green-600" data-testid="text-renewal-success-rate">{stats.successRate}%</p>
          <p className="text-[10px] text-muted-foreground">Approval Rate</p>
        </div>
        <div className="text-center p-2 bg-muted/30 rounded">
          <p className="text-sm font-bold" data-testid="text-renewal-avg-extension">{stats.avgExtensionDays}d</p>
          <p className="text-[10px] text-muted-foreground">Avg Extension</p>
        </div>
        <div className="text-center p-2 bg-muted/30 rounded">
          <p className="text-sm font-bold text-green-600" data-testid="text-renewal-revenue-saved">{fmt(stats.revenueSavedCents)}</p>
          <p className="text-[10px] text-muted-foreground">Revenue Saved</p>
        </div>
      </div>

      <div className="flex items-center gap-1 mt-3">
        <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden flex">
          {stats.approved > 0 && <div className="h-full bg-green-500" style={{ width: `${(stats.approved / stats.totalRequests) * 100}%` }} />}
          {stats.denied > 0 && <div className="h-full bg-red-400" style={{ width: `${(stats.denied / stats.totalRequests) * 100}%` }} />}
          {stats.pending > 0 && <div className="h-full bg-yellow-400" style={{ width: `${(stats.pending / stats.totalRequests) * 100}%` }} />}
        </div>
        <div className="flex gap-2 text-[9px] text-muted-foreground">
          <span className="flex items-center gap-0.5"><span className="w-2 h-2 bg-green-500 rounded-full inline-block" /> {stats.approved}</span>
          <span className="flex items-center gap-0.5"><span className="w-2 h-2 bg-red-400 rounded-full inline-block" /> {stats.denied}</span>
          <span className="flex items-center gap-0.5"><span className="w-2 h-2 bg-yellow-400 rounded-full inline-block" /> {stats.pending}</span>
        </div>
      </div>
    </div>
  );
}

export function CommissionLifecycleTimeline({ referral }: { referral: any }) {
  const stages = [
    { key: 'click', label: 'Click', date: null, done: true },
    { key: 'signup', label: 'Signup', date: referral.created_at, done: true },
    { key: 'convert', label: 'Converted', date: referral.converted_at, done: !!referral.converted_at },
    { key: 'earning', label: 'Earning', date: null, done: referral.status === 'converted' || referral.status === 'paid' },
    { key: 'expiry', label: referral.commission_end_date ? `Expires ${new Date(referral.commission_end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'Active', date: referral.commission_end_date, done: false },
  ];

  if (referral.status === 'churned') {
    stages[3] = { key: 'churned', label: 'Churned', date: referral.churned_at, done: true };
    stages[4] = { key: 'lost', label: 'Lost', date: referral.churned_at, done: true };
  }

  return (
    <div data-testid={`lifecycle-${referral.id}`} className="flex items-center gap-0 text-[9px]">
      {stages.map((s, i) => (
        <div key={s.key} className="flex items-center">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold ${
            s.key === 'churned' || s.key === 'lost' ? 'bg-red-100 text-red-600 dark:bg-red-900/30' :
            s.done ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
            'bg-muted text-muted-foreground'
          }`}>
            {i + 1}
          </div>
          {i < stages.length - 1 && (
            <div className={`w-4 h-0.5 ${s.done ? 'bg-green-400' : 'bg-muted'}`} />
          )}
        </div>
      ))}
      <span className="ml-1 text-muted-foreground truncate max-w-[80px]">
        {stages[stages.length - 1].label}
      </span>
    </div>
  );
}

export function BulkRenewalButton({ expiringReferrals, onSuccess }: { expiringReferrals: any[]; onSuccess: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [checkInType, setCheckInType] = useState<'email' | 'call' | 'note'>('email');
  const [notes, setNotes] = useState('');
  const [showForm, setShowForm] = useState(false);

  if (expiringReferrals.length < 2) return null;

  const handleBulkRenewal = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/affiliate/renewals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referral_ids: expiringReferrals.map(r => r.id),
          check_in_type: checkInType,
          check_in_notes: notes || `Bulk renewal request for ${expiringReferrals.length} referrals`,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowForm(false);
        setNotes('');
        onSuccess();
      }
    } catch {}
    setSubmitting(false);
  };

  return (
    <div data-testid="bulk-renewal">
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded hover:opacity-90"
          data-testid="button-bulk-renewal"
        >
          Renew All ({expiringReferrals.length})
        </button>
      ) : (
        <div className="p-3 rounded-lg border bg-muted/20 space-y-2">
          <p className="text-xs font-medium">Bulk Renewal — {expiringReferrals.length} referrals</p>
          <select value={checkInType} onChange={e => setCheckInType(e.target.value as any)} className="text-xs border rounded px-2 py-1 bg-background w-full" data-testid="select-bulk-checkin-type">
            <option value="email">Email Check-in</option>
            <option value="call">Phone/Video Call</option>
            <option value="note">Written Note</option>
          </select>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Describe your check-in with these customers..."
            className="text-xs border rounded px-2 py-1 bg-background w-full h-16 resize-none"
            data-testid="input-bulk-renewal-notes"
          />
          <div className="flex gap-2">
            <button
              onClick={handleBulkRenewal}
              disabled={submitting}
              className="text-xs px-3 py-1 bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50"
              data-testid="button-submit-bulk-renewal"
            >
              {submitting ? 'Submitting...' : `Submit ${expiringReferrals.length} Renewals`}
            </button>
            <button onClick={() => setShowForm(false)} className="text-xs px-3 py-1 border rounded hover:bg-muted" data-testid="button-cancel-bulk-renewal">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
