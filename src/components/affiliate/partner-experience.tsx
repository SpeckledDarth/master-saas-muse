'use client';

import { useState, useEffect } from 'react';

interface GoalData {
  goal: {
    target_cents: number;
    earned_cents: number;
    progress: number;
    days_left: number;
    period: string;
  } | null;
}

interface DisputeData {
  id: string;
  reason: string;
  status: string;
  created_at: string;
  admin_response?: string;
}

interface SpotlightData {
  affiliate_name: string;
  affiliate_avatar: string;
  story: string;
  stats_summary: string;
  month: string;
}

export function EarningsGoalSetter() {
  const [goal, setGoal] = useState<GoalData['goal']>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [targetAmount, setTargetAmount] = useState('');
  const [period, setPeriod] = useState('monthly');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/affiliate/goals')
      .then(r => r.json())
      .then(d => { setGoal(d.goal); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/affiliate/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_amount: parseFloat(targetAmount), period })
      });
      const data = await res.json();
      if (data.goal) {
        setGoal({ ...data.goal, earned_cents: 0, progress: 0, days_left: period === 'monthly' ? 30 : period === 'quarterly' ? 90 : 365 });
        setShowForm(false);
      }
    } catch {}
    setSaving(false);
  };

  if (loading) return <div data-testid="goal-loading" className="animate-pulse h-32 bg-muted rounded-[var(--card-radius,0.75rem)]" />;

  return (
    <div data-testid="earnings-goal-card" className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] p-[var(--card-padding,1.25rem)]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">🎯 Earnings Goal</h3>
        <button data-testid="btn-set-goal" onClick={() => setShowForm(!showForm)} className="text-xs text-primary hover:underline">
          {goal ? 'Change Goal' : 'Set Goal'}
        </button>
      </div>
      {showForm && (
        <div className="space-y-2 mb-3">
          <input data-testid="input-goal-amount" type="number" placeholder="Target amount ($)" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} className="w-full rounded border bg-background px-3 py-1.5 text-sm" />
          <select data-testid="select-goal-period" value={period} onChange={e => setPeriod(e.target.value)} className="w-full rounded border bg-background px-3 py-1.5 text-sm">
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
          <button data-testid="btn-save-goal" onClick={handleSave} disabled={saving || !targetAmount} className="w-full rounded bg-primary text-primary-foreground py-1.5 text-sm disabled:opacity-50">
            {saving ? 'Saving...' : 'Set Goal'}
          </button>
        </div>
      )}
      {goal && (
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>${(goal.earned_cents / 100).toFixed(2)} of ${(goal.target_cents / 100).toFixed(2)}</span>
            <span className="text-muted-foreground">{goal.days_left}d left</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${goal.progress}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{goal.progress}% complete • {goal.period}</p>
        </div>
      )}
      {!goal && !showForm && (
        <p className="text-sm text-muted-foreground">Set a monthly earnings target to track your progress.</p>
      )}
    </div>
  );
}

export function CommissionDisputes() {
  const [disputes, setDisputes] = useState<DisputeData[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/affiliate/disputes')
      .then(r => r.json())
      .then(d => setDisputes(d.disputes || []))
      .catch(() => {});
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/affiliate/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, details })
      });
      const data = await res.json();
      if (data.dispute) {
        setDisputes(prev => [data.dispute, ...prev]);
        setShowForm(false);
        setReason('');
        setDetails('');
      }
    } catch {}
    setSubmitting(false);
  };

  const statusColor: Record<string, string> = {
    open: 'bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))] dark:bg-[hsl(var(--warning)/0.15)]',
    under_review: 'bg-primary/10 text-primary dark:bg-primary/15',
    approved: 'bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))] dark:bg-[hsl(var(--success)/0.15)]',
    denied: 'bg-[hsl(var(--danger)/0.1)] text-[hsl(var(--danger))] dark:bg-[hsl(var(--danger)/0.15)]'
  };

  return (
    <div data-testid="commission-disputes-card" className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] p-[var(--card-padding,1.25rem)]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">⚖️ Commission Disputes</h3>
        <button data-testid="btn-new-dispute" onClick={() => setShowForm(!showForm)} className="text-xs text-primary hover:underline">
          {showForm ? 'Cancel' : 'File Dispute'}
        </button>
      </div>
      {showForm && (
        <div className="space-y-2 mb-3 p-3 bg-muted/50 rounded">
          <select data-testid="select-dispute-reason" value={reason} onChange={e => setReason(e.target.value)} className="w-full rounded border bg-background px-3 py-1.5 text-sm">
            <option value="">Select reason...</option>
            <option value="missing_commission">Missing commission</option>
            <option value="incorrect_amount">Incorrect amount</option>
            <option value="wrong_attribution">Wrong attribution</option>
            <option value="delayed_payout">Delayed payout</option>
            <option value="other">Other</option>
          </select>
          <textarea data-testid="input-dispute-details" placeholder="Describe the issue..." value={details} onChange={e => setDetails(e.target.value)} rows={3} className="w-full rounded border bg-background px-3 py-1.5 text-sm resize-none" />
          <button data-testid="btn-submit-dispute" onClick={handleSubmit} disabled={submitting || !reason} className="w-full rounded bg-primary text-primary-foreground py-1.5 text-sm disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Submit Dispute'}
          </button>
        </div>
      )}
      {disputes.length > 0 ? (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {disputes.map(d => (
            <div key={d.id} data-testid={`dispute-${d.id}`} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
              <div>
                <span className="font-medium">{d.reason.replace(/_/g, ' ')}</span>
                <span className="text-xs text-muted-foreground ml-2">{new Date(d.created_at).toLocaleDateString()}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[d.status] || ''}`}>{d.status}</span>
            </div>
          ))}
        </div>
      ) : !showForm && (
        <p className="text-sm text-muted-foreground">No disputes filed. If a commission seems incorrect, file a dispute for admin review.</p>
      )}
    </div>
  );
}

export function ReferralOfMonth() {
  const [spotlight, setSpotlight] = useState<SpotlightData | null>(null);

  useEffect(() => {
    fetch('/api/admin/spotlight')
      .then(r => r.json())
      .then(d => setSpotlight(d.spotlight))
      .catch(() => {});
  }, []);

  if (!spotlight) return null;

  return (
    <div data-testid="spotlight-card" className="rounded-[var(--card-radius,0.75rem)] border bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-[var(--card-padding,1.25rem)]">
      <h3 className="font-semibold text-sm mb-2">⭐ Partner of the Month — {spotlight.month}</h3>
      <div className="flex items-start gap-[var(--content-density-gap,1rem)]">
        {spotlight.affiliate_avatar && (
          <img src={spotlight.affiliate_avatar} alt="" className="w-10 h-10 rounded-full" />
        )}
        <div>
          <p className="font-medium text-sm">{spotlight.affiliate_name}</p>
          {spotlight.stats_summary && <p className="text-xs text-muted-foreground">{spotlight.stats_summary}</p>}
          {spotlight.story && <p className="text-sm mt-1">{spotlight.story}</p>}
        </div>
      </div>
    </div>
  );
}

export function GracePeriodNotice() {
  return (
    <div data-testid="grace-period-notice" className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] p-[var(--card-padding,1.25rem)]">
      <h3 className="font-semibold text-sm mb-1">🛡️ Churn Grace Period</h3>
      <p className="text-sm text-muted-foreground">
        If a referral cancels, they have 30 days to resubscribe. If they come back, your commission continues uninterrupted.
      </p>
    </div>
  );
}

export function AffiliateManagerCard() {
  return (
    <div data-testid="affiliate-manager-card" className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] p-[var(--card-padding,1.25rem)]">
      <h3 className="font-semibold text-sm mb-2">👤 Your Affiliate Manager</h3>
      <div className="flex items-center gap-[var(--content-density-gap,1rem)]">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
          PP
        </div>
        <div>
          <p className="font-medium text-sm">PassivePost Team</p>
          <p className="text-xs text-muted-foreground">partners@passivepost.com</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2">Need help? Use the Messages tab or file a support ticket.</p>
    </div>
  );
}
