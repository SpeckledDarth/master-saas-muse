'use client'

import Link from 'next/link'
import { useSettings } from '@/hooks/use-settings'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DollarSign, Users, BarChart, Megaphone, Clock, Shield, ArrowRight, CheckCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function AffiliateLandingPage() {
  const { settings } = useSettings()
  const appName = settings?.branding?.appName || 'Our Product'
  const [programSettings, setProgramSettings] = useState<any>(null)

  useEffect(() => {
    fetch('/api/affiliate/settings')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.settings) setProgramSettings(data.settings)
      })
      .catch(() => {})
  }, [])

  const commissionRate = programSettings?.commission_rate ?? 20
  const commissionDuration = programSettings?.commission_duration_months ?? 12

  return (
    <div className="min-h-screen">
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-primary-600/10 dark:from-primary-900/30 dark:to-primary-800/20" />
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 text-sm font-medium mb-6" data-testid="badge-affiliate-program">
              <Megaphone className="h-4 w-4" />
              Affiliate Program
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-black dark:text-white mb-6" data-testid="text-affiliate-headline">
              Earn {commissionRate}% Recurring Commissions
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Promote {appName} to your audience and earn commissions on every subscription payment for {commissionDuration} months. No product experience needed — just share and earn.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/affiliate/join">
                <Button size="lg" className="text-lg px-8 py-6" data-testid="button-apply-now">
                  Apply Now <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/affiliate/login">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6" data-testid="button-affiliate-login">
                  Affiliate Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 md:px-8">
          <h2 className="text-3xl font-bold text-center text-black dark:text-white mb-12" data-testid="text-how-it-works">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '1', title: 'Apply', description: 'Fill out a quick application. We review and approve within 24-48 hours.', icon: Users },
              { step: '2', title: 'Share', description: 'Get your unique referral link and marketing materials. Share with your audience.', icon: Megaphone },
              { step: '3', title: 'Earn', description: `Earn ${commissionRate}% on every payment your referrals make for ${commissionDuration} months.`, icon: DollarSign },
            ].map(item => (
              <Card key={item.step} className="bg-white/10 border-gray-500/50 text-center" data-testid={`card-step-${item.step}`}>
                <CardContent className="pt-8 pb-6 px-6">
                  <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center mx-auto mb-4">
                    <item.icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-2">Step {item.step}</div>
                  <h3 className="text-xl font-semibold text-black dark:text-white mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-8">
          <h2 className="text-3xl font-bold text-center text-black dark:text-white mb-12">
            Why Partner With Us
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { icon: DollarSign, title: 'Recurring Commissions', description: `Earn ${commissionRate}% on every payment — not just the first. Commissions continue for ${commissionDuration} months.` },
              { icon: Clock, title: '30-Day Cookie Window', description: 'Your referrals are tracked for 30 days after clicking your link, so you get credit even if they sign up later.' },
              { icon: BarChart, title: 'Real-Time Dashboard', description: 'Track clicks, signups, conversions, and earnings from your own affiliate dashboard.' },
              { icon: Megaphone, title: 'Marketing Materials', description: 'Access banners, email templates, social post templates, and ready-to-use copy.' },
              { icon: Shield, title: 'Locked-In Rates', description: 'Your commission rate is locked in when you join. Even if we change rates later, you keep your original terms.' },
              { icon: Users, title: 'Performance Tiers', description: 'Refer more customers and unlock higher commission rates through our tier system.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 p-4" data-testid={`benefit-${i}`}>
                <div className="shrink-0 w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-black dark:text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 md:px-8">
          <h2 className="text-3xl font-bold text-center text-black dark:text-white mb-4">
            Who Can Be an Affiliate?
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            You don't need to be a customer. Anyone with an audience can join.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              'Bloggers & Content Creators',
              'YouTube Channels',
              'Newsletter Writers',
              'Podcast Hosts',
              'Social Media Influencers',
              'Industry Experts',
              'Course Creators',
              'Freelancers & Consultants',
              'Community Leaders',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3" data-testid={`audience-${i}`}>
                <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                <span className="text-black dark:text-white">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-4">
            Ready to Start Earning?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Apply today and start earning recurring commissions by sharing {appName} with your audience.
          </p>
          <Link href="/affiliate/join">
            <Button size="lg" className="text-lg px-8 py-6" data-testid="button-apply-bottom">
              Apply Now <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
