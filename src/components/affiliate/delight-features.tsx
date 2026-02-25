'use client';

import { useState, useEffect, useCallback } from 'react';

interface Challenge {
  id: string;
  name: string;
  description: string;
  metric: string;
  target_count: number;
  progress_count: number;
  progress_pct: number;
  status: string;
  time_remaining: string;
  days_remaining: number;
  badge_reward: string | null;
  start_date: string;
  end_date: string;
}

interface CaseStudy {
  id: string;
  headline: string;
  summary: string;
  key_metric: string;
  key_metric_label: string;
  customer_quote: string;
  customer_name: string;
  customer_role: string;
  tags: string[];
  featured_image_url: string | null;
  affiliate_name: string | null;
  tier_name: string | null;
  testimonial_quote: string | null;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  type: string;
}

interface AudienceInsights {
  top_geos: { country: string; clicks: number; conversions: number; rate: number }[];
  device_split: { device: string; pct: number }[];
  top_sources: { source: string; clicks: number; conversions: number; earnings: number; rate: number }[];
  timing: { best_hour: number; best_day: string };
  ai_persona: string;
}

export function WeeklyChallengesPanel() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressing, setProgressing] = useState<string | null>(null);

  const loadChallenges = () => {
    setLoading(true);
    setError(null);
    fetch('/api/affiliate/challenges?status=active')
      .then(r => { if (!r.ok) throw new Error('Failed to load challenges'); return r.json(); })
      .then(d => setChallenges(d.challenges || []))
      .catch(() => setError('Failed to load challenges'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadChallenges(); }, []);

  const recordProgress = async (challengeId: string) => {
    setProgressing(challengeId);
    try {
      const res = await fetch('/api/affiliate/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge_id: challengeId, action: 'asset_shared' }),
      });
      if (res.ok) {
        const d = await res.json();
        setChallenges(prev => prev.map(c =>
          c.id === challengeId ? { ...c, progress_count: d.progress?.progress_count || c.progress_count + 1, progress_pct: d.progress?.progress_pct || Math.min(100, ((c.progress_count + 1) / c.target_count) * 100) } : c
        ));
      }
    } catch {}
    setProgressing(null);
  };

  if (loading) return (
    <div data-testid="challenges-loading" className="rounded-lg border bg-card p-4">
      <div className="animate-pulse space-y-2">
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="h-16 bg-muted rounded" />
      </div>
    </div>
  );

  if (error) return (
    <div data-testid="challenges-error" className="rounded-lg border bg-card p-4 text-center">
      <p className="text-sm text-muted-foreground">{error}</p>
      <button onClick={loadChallenges} className="text-xs text-primary mt-2 hover:underline" data-testid="button-retry-challenges">Retry</button>
    </div>
  );

  if (challenges.length === 0) return (
    <div data-testid="challenges-empty" className="rounded-lg border bg-card p-4 text-center">
      <p className="text-sm text-muted-foreground py-4">No active challenges right now. Check back soon!</p>
    </div>
  );

  return (
    <div data-testid="weekly-challenges-panel" className="space-y-3">
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Active Challenges</h3>
          <span className="text-[10px] text-muted-foreground">{challenges.length} active</span>
        </div>
        <div className="space-y-3">
          {challenges.map(ch => (
            <div key={ch.id} className="p-3 rounded-md border" data-testid={`challenge-${ch.id}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{ch.name}</span>
                <div className="flex items-center gap-2">
                  {ch.badge_reward && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded" data-testid={`challenge-badge-${ch.id}`}>
                      🏆 {ch.badge_reward}
                    </span>
                  )}
                  {ch.days_remaining > 0 && (
                    <span className="text-[10px] text-muted-foreground" data-testid={`challenge-time-${ch.id}`}>{ch.time_remaining}</span>
                  )}
                </div>
              </div>
              {ch.description && <p className="text-xs text-muted-foreground mb-2">{ch.description}</p>}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="h-2 bg-muted rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.min(100, ch.progress_pct)} aria-valuemin={0} aria-valuemax={100} aria-label={`${ch.name} progress: ${ch.progress_count} of ${ch.target_count}`}>
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, ch.progress_pct)}%` }}
                      data-testid={`challenge-progress-bar-${ch.id}`}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5" data-testid={`challenge-progress-text-${ch.id}`}>
                    {ch.progress_count}/{ch.target_count} {ch.metric || 'completed'}
                    {ch.progress_pct >= 100 && ' ✅'}
                  </p>
                </div>
                {ch.progress_pct < 100 && (
                  <button
                    onClick={() => recordProgress(ch.id)}
                    disabled={progressing === ch.id}
                    aria-label={`Record progress for ${ch.name}`}
                    className="text-[10px] px-2.5 py-1 bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity disabled:opacity-50"
                    data-testid={`button-challenge-progress-${ch.id}`}
                  >{progressing === ch.id ? '...' : '+1'}</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CaseStudyLibrary() {
  const [studies, setStudies] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadStudies = () => {
    setLoading(true);
    setError(null);
    fetch('/api/affiliate/case-studies')
      .then(r => { if (!r.ok) throw new Error('Failed'); return r.json(); })
      .then(d => setStudies(d.caseStudies || d.case_studies || []))
      .catch(() => setError('Failed to load case studies'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadStudies(); }, []);

  const shareStudy = async (study: CaseStudy) => {
    const text = `${study.headline}\n\n${study.summary}\n\n"${study.customer_quote}" — ${study.customer_name}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(study.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  if (loading) return (
    <div data-testid="case-studies-loading" className="rounded-lg border bg-card p-4">
      <div className="animate-pulse space-y-2">
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="h-20 bg-muted rounded" />
      </div>
    </div>
  );

  if (error) return (
    <div data-testid="case-studies-error" className="rounded-lg border bg-card p-4 text-center">
      <p className="text-sm text-muted-foreground">{error}</p>
      <button onClick={loadStudies} className="text-xs text-primary mt-2 hover:underline" data-testid="button-retry-case-studies">Retry</button>
    </div>
  );

  if (studies.length === 0) return (
    <div data-testid="case-studies-empty" className="rounded-lg border bg-card p-4 text-center">
      <p className="text-sm text-muted-foreground py-4">No success stories available yet.</p>
    </div>
  );

  return (
    <div data-testid="case-study-library" className="space-y-3">
      <div className="rounded-lg border bg-card p-4">
        <h3 className="font-semibold text-sm mb-3">Success Stories</h3>
        <div className="space-y-3">
          {studies.map(study => (
            <div key={study.id} className="rounded-md border overflow-hidden" data-testid={`case-study-${study.id}`}>
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-medium text-sm" data-testid={`case-study-headline-${study.id}`}>{study.headline}</h4>
                    {study.key_metric && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-lg font-bold text-primary" data-testid={`case-study-metric-${study.id}`}>{study.key_metric}</span>
                        {study.key_metric_label && <span className="text-[10px] text-muted-foreground">{study.key_metric_label}</span>}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setExpandedId(expandedId === study.id ? null : study.id)}
                      aria-expanded={expandedId === study.id}
                      aria-label={`${expandedId === study.id ? 'Collapse' : 'Expand'} case study: ${study.headline}`}
                      className="text-[10px] px-2 py-1 border rounded hover:bg-muted transition-colors"
                      data-testid={`button-expand-study-${study.id}`}
                    >{expandedId === study.id ? 'Less' : 'More'}</button>
                    <button
                      onClick={() => shareStudy(study)}
                      aria-label={`Copy case study "${study.headline}" to clipboard`}
                      className="text-[10px] px-2 py-1 bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity"
                      data-testid={`button-share-study-${study.id}`}
                    >{copiedId === study.id ? 'Copied!' : 'Share'}</button>
                  </div>
                </div>
                {study.affiliate_name && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-[10px] text-muted-foreground">by {study.affiliate_name}</span>
                    {study.tier_name && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded">{study.tier_name}</span>
                    )}
                  </div>
                )}
                {study.tags && study.tags.length > 0 && (
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {study.tags.map(tag => (
                      <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              {expandedId === study.id && (
                <div className="border-t p-3 bg-muted/10 space-y-2">
                  {study.summary && <p className="text-xs leading-relaxed">{study.summary}</p>}
                  {(study.customer_quote || study.testimonial_quote) && (
                    <blockquote className="border-l-2 border-primary pl-3 py-1" data-testid={`case-study-quote-${study.id}`}>
                      <p className="text-xs italic text-muted-foreground">"{study.customer_quote || study.testimonial_quote}"</p>
                      <p className="text-[10px] font-medium mt-1">— {study.customer_name}{study.customer_role ? `, ${study.customer_role}` : ''}</p>
                    </blockquote>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PromotionQuizPanel() {
  const [step, setStep] = useState<'intro' | 'quiz' | 'loading' | 'result'>('intro');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [playbook, setPlaybook] = useState<any>(null);
  const [previousResult, setPreviousResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/affiliate/promotion-quiz')
      .then(r => { if (!r.ok) throw new Error('Failed'); return r.json(); })
      .then(d => {
        setQuestions(d.questions || []);
        if (d.previousResult) {
          setPreviousResult(d.previousResult);
        }
      })
      .catch(() => {});
  }, []);

  const submitQuiz = async () => {
    setStep('loading');
    setError(null);
    try {
      const res = await fetch('/api/affiliate/promotion-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to generate playbook');
      }
      const d = await res.json();
      setPlaybook(d.playbook || d);
      setStep('result');
    } catch (e: any) {
      setError(e.message);
      setStep('quiz');
    }
  };

  const selectAnswer = (qId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  if (step === 'intro') return (
    <div data-testid="promotion-quiz-panel" className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold text-sm mb-2">Your Promotion Strategy</h3>
      <p className="text-xs text-muted-foreground mb-3">
        Take a short quiz about your content style and audience. Our AI will generate a personalized 30-day promotion playbook just for you.
      </p>
      {previousResult && (
        <div className="p-2 rounded-md bg-muted/50 mb-3">
          <p className="text-[10px] text-muted-foreground">You completed this quiz on {new Date(previousResult.completed_at || previousResult.date).toLocaleDateString()}.</p>
        </div>
      )}
      <button
        onClick={() => { setStep('quiz'); setCurrentQ(0); setAnswers({}); }}
        aria-label={previousResult ? 'Retake promotion strategy quiz' : 'Start promotion strategy quiz'}
        className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity"
        data-testid="button-start-quiz"
      >{previousResult ? 'Retake Quiz' : 'Start Quiz'}</button>
    </div>
  );

  if (step === 'loading') return (
    <div data-testid="quiz-loading" className="rounded-lg border bg-card p-4 text-center py-8">
      <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" role="status" aria-label="Generating playbook" />
      <p className="text-sm font-medium">Generating your playbook...</p>
      <p className="text-xs text-muted-foreground mt-1">Our AI is analyzing your profile and building a custom plan.</p>
    </div>
  );

  if (step === 'result' && playbook) return (
    <div data-testid="quiz-result" className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">Your 30-Day Promotion Playbook</h3>
        <button
          onClick={() => { setStep('intro'); }}
          aria-label="Retake promotion strategy quiz"
          className="text-[10px] px-2 py-1 border rounded hover:bg-muted transition-colors"
          data-testid="button-retake-quiz"
        >Retake</button>
      </div>
      {playbook.strategy_summary && (
        <p className="text-xs leading-relaxed mb-3 p-2 bg-muted/30 rounded" data-testid="text-strategy-summary">{playbook.strategy_summary}</p>
      )}
      {playbook.weeks && playbook.weeks.map((week: any, i: number) => (
        <div key={i} className="mb-3" data-testid={`quiz-week-${i + 1}`}>
          <h4 className="text-xs font-medium mb-1">Week {i + 1}: {String(week.theme ?? week.title ?? '')}</h4>
          <div className="space-y-1 pl-3">
            {(week.tasks || week.actions || []).map((task: any, j: number) => (
              <p key={j} className="text-[11px] text-muted-foreground">• {typeof task === 'string' ? task : String(task?.description ?? task?.text ?? '')}</p>
            ))}
          </div>
        </div>
      ))}
      {playbook.quick_wins && (
        <div className="mt-3 p-2 rounded bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800" data-testid="quiz-quick-wins">
          <h4 className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">Quick Wins</h4>
          {playbook.quick_wins.map((win: any, i: number) => (
            <p key={i} className="text-[11px] text-muted-foreground">• {typeof win === 'string' ? win : String(win?.text ?? win?.description ?? '')}</p>
          ))}
        </div>
      )}
    </div>
  );

  const q = questions[currentQ];
  if (!q) return null;

  return (
    <div data-testid="quiz-questions" className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">Promotion Strategy Quiz</h3>
        <span className="text-[10px] text-muted-foreground">{currentQ + 1}/{questions.length}</span>
      </div>
      {error && <p className="text-xs text-red-500 mb-2" data-testid="text-quiz-error">{error}</p>}
      <p className="text-sm mb-3" data-testid="text-quiz-question">{q.question}</p>
      <div className="space-y-1.5 mb-3">
        {q.options.map(opt => (
          <button
            key={opt}
            onClick={() => selectAnswer(q.id, opt)}
            role="radio"
            aria-checked={answers[q.id] === opt}
            className={`w-full text-left text-xs p-2.5 rounded border transition-colors ${answers[q.id] === opt ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'}`}
            data-testid={`quiz-option-${q.id}-${opt.replace(/\s+/g, '-').toLowerCase()}`}
          >{opt}</button>
        ))}
      </div>
      <div className="flex justify-between">
        <button
          onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
          disabled={currentQ === 0}
          aria-label="Go to previous question"
          className="text-[10px] px-2 py-1 border rounded hover:bg-muted transition-colors disabled:opacity-30"
          data-testid="button-quiz-back"
        >Back</button>
        {currentQ < questions.length - 1 ? (
          <button
            onClick={() => setCurrentQ(currentQ + 1)}
            disabled={!answers[q.id]}
            aria-label="Go to next question"
            className="text-[10px] px-3 py-1 bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity disabled:opacity-30"
            data-testid="button-quiz-next"
          >Next</button>
        ) : (
          <button
            onClick={submitQuiz}
            disabled={!answers[q.id]}
            aria-label="Submit quiz and generate playbook"
            className="text-[10px] px-3 py-1 bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity disabled:opacity-30"
            data-testid="button-quiz-submit"
          >Get My Playbook</button>
        )}
      </div>
    </div>
  );
}

export function AudienceAnalyzerPanel() {
  const [insights, setInsights] = useState<AudienceInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const analyze = () => {
    setLoading(true);
    setError(null);
    fetch('/api/affiliate/analyze-audience?days=90')
      .then(r => { if (!r.ok) throw new Error('Failed'); return r.json(); })
      .then(d => setInsights(d))
      .catch(() => setError('Failed to analyze audience data'))
      .finally(() => setLoading(false));
  };

  if (error && !loading) return (
    <div data-testid="audience-error" className="rounded-lg border bg-card p-4 text-center">
      <p className="text-sm text-muted-foreground">{error}</p>
      <button onClick={analyze} className="text-xs text-primary mt-2 hover:underline" data-testid="button-retry-audience">Retry</button>
    </div>
  );

  if (!insights && !loading) return (
    <div data-testid="audience-analyzer-panel" className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold text-sm mb-2">Audience Analyzer</h3>
      <p className="text-xs text-muted-foreground mb-3">
        Discover who your audience is, where they come from, and what converts best. AI-powered insights included.
      </p>
      <button
        onClick={analyze}
        aria-label="Analyze my audience data"
        className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity"
        data-testid="button-analyze-audience"
      >Analyze My Audience</button>
    </div>
  );

  if (loading) return (
    <div data-testid="audience-loading" className="rounded-lg border bg-card p-4 text-center py-8">
      <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" role="status" aria-label="Analyzing audience" />
      <p className="text-sm font-medium">Analyzing your audience...</p>
      <p className="text-xs text-muted-foreground mt-1">Crunching click data, conversions, and platform metrics.</p>
    </div>
  );

  if (!insights) return null;

  return (
    <div data-testid="audience-insights" className="space-y-3">
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Audience Insights</h3>
          <button
            onClick={analyze}
            aria-label="Refresh audience insights"
            className="text-[10px] px-2 py-1 border rounded hover:bg-muted transition-colors"
            data-testid="button-refresh-audience"
          >Refresh</button>
        </div>

        {insights.ai_persona && (
          <div className="p-3 rounded-md bg-muted/30 border mb-3" data-testid="text-ai-persona">
            <p className="text-[10px] font-medium text-muted-foreground mb-1">AI Audience Persona</p>
            <p className="text-xs leading-relaxed whitespace-pre-wrap">{insights.ai_persona}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {insights.top_sources && insights.top_sources.length > 0 && (
            <div data-testid="audience-top-sources" role="list" aria-label="Top traffic sources">
              <p className="text-[10px] font-medium text-muted-foreground mb-1.5">Top Traffic Sources</p>
              {insights.top_sources.slice(0, 5).map((s, i) => (
                <div key={i} role="listitem" className="flex items-center justify-between py-1 border-b border-muted/30 last:border-0">
                  <span className="text-[11px]">{s.source || 'Direct'}</span>
                  <div className="text-right">
                    <span className="text-[10px] font-medium">{s.clicks} clicks</span>
                    {s.rate > 0 && <span className="text-[9px] text-green-600 ml-1">{s.rate.toFixed(1)}%</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {insights.device_split && insights.device_split.length > 0 && (
            <div data-testid="audience-device-split" role="list" aria-label="Device breakdown">
              <p className="text-[10px] font-medium text-muted-foreground mb-1.5">Device Breakdown</p>
              {insights.device_split.map((d, i) => (
                <div key={i} role="listitem" className="mb-1.5">
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span className="capitalize">{d.device || 'Unknown'}</span>
                    <span className="font-medium">{d.pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.round(d.pct)} aria-valuemin={0} aria-valuemax={100} aria-label={`${d.device || 'Unknown'} usage: ${d.pct.toFixed(0)}%`}>
                    <div className="h-full bg-primary rounded-full" style={{ width: `${d.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {insights.top_geos && insights.top_geos.length > 0 && (
          <div className="mt-3" data-testid="audience-top-geos">
            <button
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              aria-label={`${expanded ? 'Hide' : 'Show'} geographic data`}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-toggle-geos"
            >{expanded ? '− Hide' : '+ Show'} Geographic Data</button>
            {expanded && (
              <div className="mt-2 space-y-1" role="list" aria-label="Geographic data">
                {insights.top_geos.slice(0, 10).map((g, i) => (
                  <div key={i} role="listitem" className="flex items-center justify-between py-0.5">
                    <span className="text-[11px]">{g.country || 'Unknown'}</span>
                    <div className="text-right">
                      <span className="text-[10px]">{g.clicks} clicks</span>
                      {g.conversions > 0 && <span className="text-[9px] text-green-600 ml-1">({g.conversions} conv)</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {insights.timing && (
          <div className="mt-3 p-2 rounded bg-muted/30" data-testid="audience-timing">
            <p className="text-[10px] font-medium text-muted-foreground mb-1">Best Timing</p>
            <p className="text-[11px]">
              Peak hour: <span className="font-medium">{insights.timing.best_hour}:00 UTC</span>
              {insights.timing.best_day && <> · Best day: <span className="font-medium capitalize">{insights.timing.best_day}</span></>}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function AffiliateDirectoryPreview() {
  const [optedIn, setOptedIn] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/affiliate/profile')
      .then(r => { if (!r.ok) throw new Error('Failed'); return r.json(); })
      .then(d => {
        setOptedIn(d.profile?.show_in_directory || false);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const toggleDirectory = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/affiliate/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ show_in_directory: !optedIn }),
      });
      if (res.ok) setOptedIn(!optedIn);
    } catch {}
    setSaving(false);
  };

  if (!loaded) return (
    <div data-testid="directory-loading" className="rounded-lg border bg-card p-4">
      <div className="animate-pulse space-y-2">
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="h-10 bg-muted rounded" />
      </div>
    </div>
  );

  return (
    <div data-testid="directory-preview" className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold text-sm mb-2">Partner Directory</h3>
      <p className="text-xs text-muted-foreground mb-3">
        Opt in to appear on our public partner directory. Showcase your profile, tier badge, and social links to potential collaborators.
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleDirectory}
            disabled={saving}
            className={`relative w-10 h-5 rounded-full transition-colors ${optedIn ? 'bg-primary' : 'bg-muted'}`}
            data-testid="button-toggle-directory"
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${optedIn ? 'left-5.5 translate-x-0' : 'left-0.5'}`} />
          </button>
          <span className="text-xs" data-testid="text-directory-status">{optedIn ? 'Visible in directory' : 'Not listed'}</span>
        </div>
        <a
          href="/partners"
          aria-label="View partner directory"
          className="text-[10px] text-primary hover:underline"
          data-testid="link-view-directory"
        >View Directory →</a>
      </div>
    </div>
  );
}
