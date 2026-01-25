'use client';

import Script from 'next/script';

const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

export function PlausibleAnalytics() {
  if (!PLAUSIBLE_DOMAIN) {
    return null;
  }

  return (
    <Script
      defer
      data-domain={PLAUSIBLE_DOMAIN}
      src="https://plausible.io/js/script.js"
      strategy="afterInteractive"
    />
  );
}

export function trackEvent(eventName: string, props?: Record<string, string | number | boolean>) {
  if (typeof window !== 'undefined' && (window as any).plausible) {
    (window as any).plausible(eventName, { props });
  }
}
