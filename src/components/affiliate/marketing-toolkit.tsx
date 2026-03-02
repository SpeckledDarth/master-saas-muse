'use client';

import { useState, useEffect } from 'react';

interface ShortLink {
  id: string;
  slug: string;
  destination_url: string;
  label: string;
  clicks: number;
}

interface MediaKitData {
  name: string;
  bio: string;
  referralCode: string;
  referralUrl: string;
  commissionRate: number;
  totalReferrals: number;
  totalEarnedCents: number;
  badge: string | null;
}

export function LinkShortener() {
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [url, setUrl] = useState('');
  const [slug, setSlug] = useState('');
  const [label, setLabel] = useState('');
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/affiliate/link-shortener')
      .then(r => r.json())
      .then(d => setLinks(d.links || []))
      .catch(() => {});
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/affiliate/link-shortener', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination_url: url, custom_slug: slug, label })
      });
      const data = await res.json();
      if (data.shortLink) {
        setLinks(prev => [data.shortLink, ...prev]);
        setShowForm(false);
        setUrl('');
        setSlug('');
        setLabel('');
      }
    } catch {}
    setCreating(false);
  };

  const copyLink = (link: ShortLink) => {
    const shortUrl = `${window.location.origin}/r/${link.slug}`;
    navigator.clipboard.writeText(shortUrl);
    setCopied(link.id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div data-testid="link-shortener-card" className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] p-[var(--card-padding,1.25rem)]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">🔗 Link Shortener</h3>
        <button data-testid="btn-create-short-link" onClick={() => setShowForm(!showForm)} className="text-xs text-primary hover:underline">
          {showForm ? 'Cancel' : 'Create Short Link'}
        </button>
      </div>
      {showForm && (
        <div className="space-y-2 mb-3">
          <input data-testid="input-short-url" type="url" placeholder="Destination URL" value={url} onChange={e => setUrl(e.target.value)} className="w-full rounded border bg-background px-3 py-1.5 text-sm" />
          <input data-testid="input-short-slug" type="text" placeholder="Custom slug (optional)" value={slug} onChange={e => setSlug(e.target.value)} className="w-full rounded border bg-background px-3 py-1.5 text-sm" />
          <input data-testid="input-short-label" type="text" placeholder="Label (optional)" value={label} onChange={e => setLabel(e.target.value)} className="w-full rounded border bg-background px-3 py-1.5 text-sm" />
          <button data-testid="btn-save-short-link" onClick={handleCreate} disabled={creating || !url} className="w-full rounded bg-primary text-primary-foreground py-1.5 text-sm disabled:opacity-50">
            {creating ? 'Creating...' : 'Create Link'}
          </button>
        </div>
      )}
      {links.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {links.map(l => (
            <div key={l.id} data-testid={`short-link-${l.id}`} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
              <div className="truncate flex-1 mr-2">
                <span className="font-medium">{String(l.label || l.slug || '')}</span>
                <span className="text-xs text-muted-foreground ml-1">({l.clicks} clicks)</span>
              </div>
              <button onClick={() => copyLink(l)} className="text-xs text-primary hover:underline shrink-0">
                {copied === l.id ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function QRCodeGenerator({ referralUrl }: { referralUrl: string }) {
  const [qrSvg, setQrSvg] = useState('');

  useEffect(() => {
    if (!referralUrl) return;
    const size = 200;
    const data = referralUrl;
    const svg = generateSimpleQR(data, size);
    setQrSvg(svg);
  }, [referralUrl]);

  return (
    <div data-testid="qr-code-card" className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] p-[var(--card-padding,1.25rem)]">
      <h3 className="font-semibold text-sm mb-3">📱 QR Code</h3>
      <div className="flex flex-col items-center gap-[var(--content-density-gap,1rem)]">
        {qrSvg ? (
          <div dangerouslySetInnerHTML={{ __html: qrSvg }} className="bg-white p-2 rounded" />
        ) : (
          <div className="w-[200px] h-[200px] bg-muted rounded flex items-center justify-center text-sm text-muted-foreground">
            No referral URL
          </div>
        )}
        <p className="text-xs text-muted-foreground text-center">Right-click to save, or screenshot for use in videos and flyers.</p>
        {referralUrl && (
          <button data-testid="btn-copy-qr-url" onClick={() => navigator.clipboard.writeText(referralUrl)} className="text-xs text-primary hover:underline">
            Copy Referral URL
          </button>
        )}
      </div>
    </div>
  );
}

function generateSimpleQR(data: string, size: number): string {
  const modules = 21;
  const cellSize = Math.floor(size / modules);
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${modules * cellSize}" height="${modules * cellSize}" viewBox="0 0 ${modules * cellSize} ${modules * cellSize}">`;
  svg += `<rect width="100%" height="100%" fill="white"/>`;

  const drawFinderPattern = (x: number, y: number) => {
    for (let dy = 0; dy < 7; dy++) {
      for (let dx = 0; dx < 7; dx++) {
        const isBlack = dy === 0 || dy === 6 || dx === 0 || dx === 6 ||
          (dy >= 2 && dy <= 4 && dx >= 2 && dx <= 4);
        if (isBlack) {
          svg += `<rect x="${(x + dx) * cellSize}" y="${(y + dy) * cellSize}" width="${cellSize}" height="${cellSize}" fill="black"/>`;
        }
      }
    }
  };

  drawFinderPattern(0, 0);
  drawFinderPattern(modules - 7, 0);
  drawFinderPattern(0, modules - 7);

  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash) + data.charCodeAt(i);
    hash |= 0;
  }

  for (let y = 0; y < modules; y++) {
    for (let x = 0; x < modules; x++) {
      if ((x < 8 && y < 8) || (x >= modules - 8 && y < 8) || (x < 8 && y >= modules - 8)) continue;
      const seed = (hash + x * 31 + y * 37) & 0xFFFF;
      if (seed % 3 === 0) {
        svg += `<rect x="${x * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="black"/>`;
      }
    }
  }

  svg += '</svg>';
  return svg;
}

export function MediaKitPage() {
  const [kit, setKit] = useState<MediaKitData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/affiliate/media-kit')
      .then(r => r.json())
      .then(d => { setKit(d.mediaKit); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse h-48 bg-muted rounded-[var(--card-radius,0.75rem)]" />;
  if (!kit) return null;

  return (
    <div data-testid="media-kit-card" className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] p-[var(--card-padding,1.25rem)]">
      <h3 className="font-semibold text-sm mb-3">📋 Your Media Kit</h3>
      <div className="space-y-3">
        <div className="p-3 bg-muted/30 rounded">
          <p className="font-medium">{String(kit.name ?? '')}</p>
          {kit.badge && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{String(kit.badge)}</span>}
          <p className="text-sm text-muted-foreground mt-1">{String(kit.bio || 'Official PassivePost Partner')}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-muted/20 rounded">
            <p className="font-bold text-lg">{kit.totalReferrals}</p>
            <p className="text-xs text-muted-foreground">Referrals</p>
          </div>
          <div className="p-2 bg-muted/20 rounded">
            <p className="font-bold text-lg">{kit.commissionRate}%</p>
            <p className="text-xs text-muted-foreground">Commission</p>
          </div>
          <div className="p-2 bg-muted/20 rounded">
            <p className="font-bold text-lg">${(kit.totalEarnedCents / 100).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Earned</p>
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Your Referral Link</p>
          <div className="flex items-center gap-2">
            <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">{kit.referralUrl}</code>
            <button data-testid="btn-copy-media-kit-link" onClick={() => navigator.clipboard.writeText(kit.referralUrl)} className="text-xs text-primary hover:underline shrink-0">Copy</button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Share this card with brands and sponsors to show your partnership credentials.</p>
      </div>
    </div>
  );
}

export function StarterKit() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/affiliate/assets?limit=5&starter=true')
      .then(r => r.json())
      .then(d => { setAssets(d.assets || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading || assets.length === 0) return null;

  return (
    <div data-testid="starter-kit-card" className="rounded-[var(--card-radius,0.75rem)] border bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-950/20 dark:to-accent-950/20 p-[var(--card-padding,1.25rem)]">
      <h3 className="font-semibold text-sm mb-2">🎁 Starter Kit</h3>
      <p className="text-xs text-muted-foreground mb-3">Get started with these essential resources:</p>
      <div className="space-y-1">
        {assets.slice(0, 5).map((a: any) => (
          <div key={a.id} className="flex items-center justify-between p-1.5 bg-white/50 dark:bg-black/20 rounded text-sm">
            <span className="truncate">{String(a.title ?? a.name ?? '')}</span>
            <button onClick={() => navigator.clipboard.writeText(a.content || a.url || '')} className="text-xs text-primary hover:underline shrink-0 ml-2">
              Copy
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AssetUsageTracker({ assetId, onTrack }: { assetId: string; onTrack?: () => void }) {
  const trackUsage = async (action: string) => {
    try {
      await fetch('/api/affiliate/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asset_id: assetId, action })
      });
      onTrack?.();
    } catch {}
  };

  return { trackUsage };
}

export function CopyPasteCaptions({ referralCode, referralUrl }: { referralCode: string; referralUrl: string }) {
  const [copied, setCopied] = useState<number | null>(null);

  const captions = [
    { platform: 'Twitter/X', text: `I use @PassivePost to schedule all my content. Saves me hours every week! Try it with my link and get a discount: ${referralUrl} #ContentCreator #ProductivityTools` },
    { platform: 'Instagram', text: `Stop spending hours posting manually! I switched to PassivePost and now my content goes out on autopilot across all platforms. Link in bio or use code ${referralCode} for a discount! 🚀` },
    { platform: 'LinkedIn', text: `As a content creator, scheduling used to eat up my mornings. Since switching to PassivePost, I've reclaimed 10+ hours per week. If you're creating content for your brand, give it a try: ${referralUrl}` },
    { platform: 'YouTube Description', text: `📌 Try PassivePost (what I use to schedule all my content): ${referralUrl}\nUse code ${referralCode} for a special discount!` },
    { platform: 'Email Signature', text: `I schedule my content with PassivePost — ${referralUrl}` }
  ];

  const copy = (idx: number) => {
    navigator.clipboard.writeText(captions[idx].text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div data-testid="copy-paste-captions" className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] p-[var(--card-padding,1.25rem)]">
      <h3 className="font-semibold text-sm mb-3">📝 Ready-to-Post Captions</h3>
      <p className="text-xs text-muted-foreground mb-3">Your referral code ({referralCode}) is auto-inserted. Just copy and post!</p>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {captions.map((c, i) => (
          <div key={i} className="p-2 bg-muted/30 rounded">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium">{c.platform}</span>
              <button data-testid={`btn-copy-caption-${i}`} onClick={() => copy(i)} className="text-xs text-primary hover:underline">
                {copied === i ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-muted-foreground whitespace-pre-wrap">{c.text.substring(0, 120)}...</p>
          </div>
        ))}
      </div>
    </div>
  );
}
