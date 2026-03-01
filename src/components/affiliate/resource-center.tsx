'use client';

import { useState, useEffect, useCallback } from 'react';

function fmt(cents: number) {
  return '$' + (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface KBArticle {
  id: string;
  title: string;
  slug: string;
  body: string;
  category: string;
  view_count: number;
}

interface SwipeFile {
  id: string;
  title: string;
  category: string;
  subject_merged: string;
  body_merged: string;
  subject_raw: string;
  body_raw: string;
  copy_count: number;
}

interface PromoEvent {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string | null;
  campaign_type: string;
  status: string;
  days_until_start: number;
  days_remaining: number;
  content_suggestions: any[];
  linked_assets: any[];
  linked_contest: any | null;
}

export function KnowledgeBasePanel() {
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const loadArticles = useCallback(() => {
    setLoading(true);
    setError(null);
    let url = '/api/affiliate/knowledge-base?';
    if (category !== 'all') url += `category=${category}&`;
    if (search.trim()) url += `search=${encodeURIComponent(search)}&`;
    fetch(url)
      .then(r => { if (!r.ok) throw new Error('Failed'); return r.json(); })
      .then(d => { setArticles(d.articles || []); if (d.categories) setCategories(d.categories); })
      .catch(() => setError('Failed to load help articles'))
      .finally(() => setLoading(false));
  }, [category, search]);

  useEffect(() => { loadArticles(); }, [loadArticles]);

  const toggleArticle = (slug: string) => {
    setExpanded(expanded === slug ? null : slug);
  };

  return (
    <div data-testid="knowledge-base-panel" className="space-y-4">
      <div className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] p-[var(--card-padding,1.25rem)]">
        <h3 className="font-semibold text-sm mb-3">Help Center</h3>

        <div className="flex flex-wrap gap-2 mb-3">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search help articles..."
            aria-label="Search help articles"
            className="flex-1 min-w-[180px] text-xs border rounded px-3 py-1.5 bg-background"
            data-testid="input-kb-search"
          />
          {categories.length > 0 && (
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              aria-label="Filter by category"
              className="text-xs border rounded px-2 py-1.5 bg-background"
              data-testid="select-kb-category"
            >
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          )}
        </div>

        {loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground" data-testid="text-kb-error">{error}</p>
            <button onClick={loadArticles} className="text-xs text-primary mt-2 hover:underline" data-testid="button-retry-kb">Retry</button>
          </div>
        ) : articles.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6" data-testid="text-no-kb-articles">
            {search || category !== 'all' ? 'No articles match your search.' : 'No help articles available yet.'}
          </p>
        ) : (
          <div className="space-y-1" role="list" aria-label="Help articles">
            {articles.map(article => (
              <div key={article.id} role="listitem" data-testid={`kb-article-${article.slug}`}>
                <button
                  onClick={() => toggleArticle(article.slug)}
                  aria-expanded={expanded === article.slug}
                  aria-label={`${expanded === article.slug ? 'Collapse' : 'Expand'} article: ${article.title}`}
                  className="w-full text-left p-3 rounded-md border hover:bg-muted/30 transition-colors flex items-center justify-between"
                  data-testid={`button-toggle-kb-${article.slug}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium truncate">{String(article.title ?? '')}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground shrink-0">{String(article.category ?? '')}</span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">{expanded === article.slug ? '−' : '+'}</span>
                </button>
                {expanded === article.slug && (
                  <div className="p-4 border border-t-0 rounded-b-md bg-muted/10 text-sm leading-relaxed whitespace-pre-wrap" data-testid={`kb-content-${article.slug}`}>
                    {String(article.body ?? '')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function SwipeFileLibrary() {
  const [files, setFiles] = useState<SwipeFile[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadFiles = useCallback(() => {
    setLoading(true);
    setError(null);
    let url = '/api/affiliate/swipe-files';
    if (selectedCategory !== 'all') url += `?category=${selectedCategory}`;
    fetch(url)
      .then(r => { if (!r.ok) throw new Error('Failed'); return r.json(); })
      .then(d => { setFiles(d.swipeFiles || []); if (d.categories) setCategories(d.categories); })
      .catch(() => setError('Failed to load swipe files'))
      .finally(() => setLoading(false));
  }, [selectedCategory]);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  const handleCopy = async (file: SwipeFile) => {
    const text = `Subject: ${file.subject_merged}\n\n${file.body_merged}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(file.id);
      setTimeout(() => setCopiedId(null), 2000);
      fetch('/api/affiliate/swipe-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ swipe_file_id: file.id, action: 'copy' }),
      }).catch(() => {});
    } catch {}
  };

  const CATEGORY_COLORS: Record<string, string> = {
    introduction: 'bg-primary/10 text-primary dark:bg-primary/15',
    'follow-up': 'bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))] dark:bg-[hsl(var(--success)/0.15)]',
    'limited-time': 'bg-[hsl(var(--danger)/0.1)] text-[hsl(var(--danger))] dark:bg-[hsl(var(--danger)/0.15)]',
    seasonal: 'bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))] dark:bg-[hsl(var(--warning)/0.15)]',
    're-engagement': 'bg-[hsl(var(--chart-5)/0.1)] text-[hsl(var(--chart-5))] dark:bg-[hsl(var(--chart-5)/0.15)]',
  };

  return (
    <div data-testid="swipe-file-library" className="space-y-4">
      <div className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] p-[var(--card-padding,1.25rem)]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Email Swipe Files</h3>
          <p className="text-[10px] text-muted-foreground">Pre-written emails with your code & link</p>
        </div>

        {categories.length > 0 && (
          <div className="flex gap-1 mb-3 flex-wrap">
            <button
              onClick={() => setSelectedCategory('all')}
              aria-label="Show all swipe file categories"
              aria-pressed={selectedCategory === 'all'}
              className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${selectedCategory === 'all' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              data-testid="button-swipe-category-all"
            >All</button>
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                aria-label={`Filter swipe files by ${c.replace(/-/g, ' ')}`}
                aria-pressed={selectedCategory === c}
                className={`text-[10px] px-2 py-1 rounded-full border transition-colors capitalize ${selectedCategory === c ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                data-testid={`button-swipe-category-${c}`}
              >{c.replace(/-/g, ' ')}</button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-16 bg-muted rounded" />
            <div className="h-16 bg-muted rounded" />
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground" data-testid="text-swipe-error">{error}</p>
            <button onClick={loadFiles} className="text-xs text-primary mt-2 hover:underline" data-testid="button-retry-swipe-files">Retry</button>
          </div>
        ) : files.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6" data-testid="text-no-swipe-files">No swipe files available.</p>
        ) : (
          <div className="space-y-2" role="list" aria-label="Email swipe files">
            {files.map(file => (
              <div key={file.id} role="listitem" className="rounded-md border overflow-hidden" data-testid={`swipe-file-${file.id}`}>
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize shrink-0 ${CATEGORY_COLORS[file.category] || 'bg-muted text-muted-foreground'}`}>
                      {file.category.replace(/-/g, ' ')}
                    </span>
                    <span className="text-sm font-medium truncate">{file.title}</span>
                    {file.copy_count > 0 && (
                      <span className="text-[9px] text-muted-foreground shrink-0">{file.copy_count} copies</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      onClick={() => setExpandedId(expandedId === file.id ? null : file.id)}
                      aria-expanded={expandedId === file.id}
                      aria-label={`${expandedId === file.id ? 'Hide' : 'Preview'} swipe file: ${file.title}`}
                      className="text-[10px] px-2 py-1 border rounded hover:bg-muted transition-colors"
                      data-testid={`button-preview-swipe-${file.id}`}
                    >{expandedId === file.id ? 'Hide' : 'Preview'}</button>
                    <button
                      onClick={() => handleCopy(file)}
                      aria-label={`Copy swipe file "${file.title}" to clipboard`}
                      className="text-[10px] px-2 py-1 bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity"
                      data-testid={`button-copy-swipe-${file.id}`}
                    >{copiedId === file.id ? 'Copied!' : 'Copy'}</button>
                  </div>
                </div>
                {expandedId === file.id && (
                  <div className="border-t p-3 bg-muted/10 space-y-2">
                    <div>
                      <p className="text-[10px] text-muted-foreground font-medium">Subject Line</p>
                      <p className="text-xs font-medium" data-testid={`text-swipe-subject-${file.id}`}>{file.subject_merged}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-medium">Email Body</p>
                      <pre className="text-xs whitespace-pre-wrap leading-relaxed mt-1" data-testid={`text-swipe-body-${file.id}`}>{file.body_merged}</pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function PromotionalCalendarPanel() {
  const [events, setEvents] = useState<PromoEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = () => {
    setLoading(true);
    setError(null);
    fetch('/api/affiliate/promotional-calendar?include_contests=true')
      .then(r => { if (!r.ok) throw new Error('Failed'); return r.json(); })
      .then(d => setEvents(d.events || []))
      .catch(() => setError('Failed to load promotional calendar'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadEvents(); }, []);

  const TYPE_COLORS: Record<string, string> = {
    seasonal: 'bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))] dark:bg-[hsl(var(--warning)/0.15)]',
    feature_launch: 'bg-primary/10 text-primary dark:bg-primary/15',
    flash_sale: 'bg-[hsl(var(--danger)/0.1)] text-[hsl(var(--danger))] dark:bg-[hsl(var(--danger)/0.15)]',
    holiday: 'bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))] dark:bg-[hsl(var(--success)/0.15)]',
    contest: 'bg-[hsl(var(--chart-5)/0.1)] text-[hsl(var(--chart-5))] dark:bg-[hsl(var(--chart-5)/0.15)]',
    general: 'bg-muted text-muted-foreground',
  };

  const STATUS_ICONS: Record<string, string> = {
    upcoming: '📅',
    active: '🟢',
    ended: '⏹️',
  };

  if (loading) return (
    <div data-testid="promo-calendar-loading" className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] p-[var(--card-padding,1.25rem)]">
      <div className="animate-pulse space-y-2">
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="h-16 bg-muted rounded" />
      </div>
    </div>
  );

  if (error) return (
    <div data-testid="promo-calendar-error" className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] p-[var(--card-padding,1.25rem)] text-center">
      <p className="text-sm text-muted-foreground">{error}</p>
      <button onClick={loadEvents} className="text-xs text-primary mt-2 hover:underline" data-testid="button-retry-promo-calendar">Retry</button>
    </div>
  );

  if (events.length === 0) return (
    <div data-testid="promo-calendar-empty" className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] p-[var(--card-padding,1.25rem)] text-center">
      <p className="text-sm text-muted-foreground py-4">No upcoming promotions scheduled.</p>
    </div>
  );

  const activeEvents = events.filter(e => e.status === 'active');
  const upcomingEvents = events.filter(e => e.status === 'upcoming');

  return (
    <div data-testid="promotional-calendar-panel" className="space-y-4">
      {activeEvents.length > 0 && (
        <div className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] p-[var(--card-padding,1.25rem)]">
          <h3 className="font-semibold text-sm mb-3">Active Promotions</h3>
          <div className="space-y-3">
            {activeEvents.map(event => (
              <div key={event.id} className="p-3 rounded-md border border-[hsl(var(--success)/0.2)] dark:border-[hsl(var(--success)/0.3)] bg-[hsl(var(--success)/0.05)] dark:bg-[hsl(var(--success)/0.1)]" data-testid={`promo-active-${event.id}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm" data-testid={`promo-status-${event.id}`}>{STATUS_ICONS[event.status]}</span>
                    <span className="font-medium text-sm">{event.title}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${TYPE_COLORS[event.campaign_type] || TYPE_COLORS.general}`}>{event.campaign_type.replace('_', ' ')}</span>
                  </div>
                  {event.days_remaining > 0 && (
                    <span className="text-xs text-[hsl(var(--success))] font-medium" data-testid={`promo-countdown-${event.id}`}>{event.days_remaining}d left</span>
                  )}
                </div>
                {event.description && <p className="text-xs text-muted-foreground mt-1">{event.description}</p>}
                {event.content_suggestions && event.content_suggestions.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-[10px] font-medium text-muted-foreground">Content Ideas:</p>
                    {event.content_suggestions.slice(0, 3).map((s: any, i: number) => (
                      <p key={i} className="text-xs pl-3 text-muted-foreground" data-testid={`promo-suggestion-${event.id}-${i}`}>• {typeof s === 'string' ? s : String(s?.text ?? s?.title ?? JSON.stringify(s))}</p>
                    ))}
                  </div>
                )}
                {event.linked_assets && event.linked_assets.length > 0 && (
                  <div className="mt-2 flex gap-1 flex-wrap">
                    {event.linked_assets.map((a: any) => (
                      <span key={a.id} className="text-[9px] px-1.5 py-0.5 bg-muted rounded" data-testid={`promo-asset-${event.id}-${a.id}`}>{String(a.title ?? '')}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {upcomingEvents.length > 0 && (
        <div className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] p-[var(--card-padding,1.25rem)]">
          <h3 className="font-semibold text-sm mb-3">Upcoming Promotions</h3>
          <div className="space-y-2">
            {upcomingEvents.map(event => (
              <div key={event.id} className="p-3 rounded-md border" data-testid={`promo-upcoming-${event.id}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{event.title}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${TYPE_COLORS[event.campaign_type] || TYPE_COLORS.general}`}>{event.campaign_type.replace('_', ' ')}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium text-primary" data-testid={`promo-starts-in-${event.id}`}>Starts in {event.days_until_start}d</span>
                    <p className="text-[10px] text-muted-foreground">{new Date(event.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  </div>
                </div>
                {event.description && <p className="text-xs text-muted-foreground mt-1">{event.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function AssetUsageTracker({ assetId, onTrack }: { assetId: string; onTrack?: () => void }) {
  const trackUsage = (action: 'download' | 'copy' | 'view') => {
    fetch('/api/affiliate/asset-analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ asset_id: assetId, action }),
    }).catch(() => {});
    if (onTrack) onTrack();
  };

  return { trackUsage };
}

export function TopPerformerBadge() {
  return (
    <span className="text-[9px] px-1.5 py-0.5 bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))] dark:bg-[hsl(var(--warning)/0.15)] rounded font-medium" data-testid="badge-top-performer">
      Top Performer
    </span>
  );
}

export function AssetUsageBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="text-[9px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground" data-testid="badge-asset-usage">
      {count} uses
    </span>
  );
}
