'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface DirectoryAffiliate {
  id: string;
  display_name: string;
  bio: string | null;
  website: string | null;
  location: string | null;
  tier_name: string | null;
  tier_badge_color: string | null;
  referral_range: string;
  is_top_performer: boolean;
  landing_page_slug: string | null;
  social_links: Record<string, string>;
}

export default function PartnersPage() {
  const [affiliates, setAffiliates] = useState<DirectoryAffiliate[]>([]);
  const [tiers, setTiers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [appName, setAppName] = useState('PassivePost');

  useEffect(() => {
    fetch('/api/public/settings')
      .then(r => r.ok ? r.json() : ({} as any))
      .then((d: any) => { if (d.appName) setAppName(d.appName); })
      .catch(() => {});
  }, []);

  const loadDirectory = useCallback(() => {
    setLoading(true);
    let url = '/api/public/affiliate-directory?limit=50';
    if (search.trim()) url += `&search=${encodeURIComponent(search)}`;
    if (tierFilter !== 'all') url += `&tier=${encodeURIComponent(tierFilter)}`;
    fetch(url)
      .then(r => { if (!r.ok) throw new Error('Failed'); return r.json(); })
      .then(d => {
        setAffiliates(d.affiliates || []);
        if (d.tiers) setTiers(d.tiers);
      })
      .catch(() => setAffiliates([]))
      .finally(() => setLoading(false));
  }, [search, tierFilter]);

  useEffect(() => { loadDirectory(); }, [loadDirectory]);

  const TIER_COLORS: Record<string, string> = {
    bronze: 'bg-[hsl(var(--warning)/0.3)] text-[hsl(var(--warning))]',
    silver: 'bg-muted text-muted-foreground',
    gold: 'bg-[hsl(var(--warning)/0.2)] text-[hsl(var(--warning))]',
    platinum: 'bg-muted text-foreground',
    diamond: 'bg-[hsl(var(--info)/0.2)] text-[hsl(var(--info))]',
  };

  return (
    <div className="min-h-screen bg-background">
      <title>{`Our Partners | ${appName}`}</title>
      <meta name="description" content={`Meet the top affiliate partners of ${appName}. Join our partner program and start earning.`} />
      <meta property="og:title" content={`Our Partners | ${appName}`} />
      <meta property="og:description" content={`Meet the top affiliate partners of ${appName}. Join our partner program and start earning.`} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="/partners" />
      <link rel="canonical" href="/partners" />

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="text-directory-title">Our Partners</h1>
          <p className="text-muted-foreground" data-testid="text-directory-subtitle">
            Meet the creators and marketers who promote {appName}. Interested in joining?{' '}
            <Link href="/affiliate/apply" className="text-primary hover:underline" data-testid="link-apply-affiliate">Apply here</Link>.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search partners..."
            aria-label="Search partners"
            className="min-w-0 w-full sm:min-w-[200px] text-sm border rounded-lg px-4 py-2 bg-background"
            data-testid="input-directory-search"
          />
          {tiers.length > 0 && (
            <select
              value={tierFilter}
              onChange={e => setTierFilter(e.target.value)}
              aria-label="Filter by tier"
              className="text-sm border rounded-lg px-3 py-2 bg-background"
              data-testid="select-directory-tier"
            >
              <option value="all">All Tiers</option>
              {tiers.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="animate-pulse rounded-lg border p-5">
                <div className="h-12 w-12 bg-muted rounded-full mb-3" />
                <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                <div className="h-3 bg-muted rounded w-full" />
              </div>
            ))}
          </div>
        ) : affiliates.length === 0 ? (
          <div className="text-center py-16" data-testid="text-no-partners">
            <p className="text-lg text-muted-foreground">No partners found.</p>
            <p className="text-sm text-muted-foreground mt-1">
              {search || tierFilter !== 'all' ? 'Try adjusting your search.' : 'Check back soon!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" role="list" aria-label="Partner directory">
            {affiliates.map(aff => (
              <div key={aff.id} role="listitem" className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] p-[var(--card-padding,1.25rem)] hover:shadow-[var(--card-shadow)] transition-shadow" data-testid={`partner-card-${aff.id}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {(aff.display_name || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-medium text-sm" data-testid={`partner-name-${aff.id}`}>{aff.display_name}</h3>
                      {aff.location && <p className="text-[10px] text-muted-foreground">{aff.location}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {aff.is_top_performer && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))] rounded font-medium" data-testid={`partner-top-${aff.id}`}>Top</span>
                    )}
                    {aff.tier_name && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${TIER_COLORS[aff.tier_name.toLowerCase()] || 'bg-muted text-muted-foreground'}`} data-testid={`partner-tier-${aff.id}`}>
                        {aff.tier_name}
                      </span>
                    )}
                  </div>
                </div>
                {aff.bio && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{aff.bio}</p>}
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">{aff.referral_range} referrals</span>
                  <div className="flex items-center gap-2">
                    {aff.website && (
                      <a href={aff.website} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${aff.display_name}'s website`} className="text-primary hover:underline" data-testid={`partner-website-${aff.id}`}>Website</a>
                    )}
                    {aff.landing_page_slug && (
                      <Link href={`/partner/${aff.landing_page_slug}`} aria-label={`View ${aff.display_name}'s partner page`} className="text-primary hover:underline" data-testid={`partner-page-${aff.id}`}>Partner Page</Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
