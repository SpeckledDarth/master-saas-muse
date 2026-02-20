'use client'

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Star, Quote, ArrowRight, TrendingUp, Users, BarChart, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Testimonial {
  id: string
  name: string
  role: string
  company: string
  quote: string
  avatar_url?: string
  company_logo_url?: string
  rating?: number
  featured: boolean
}

interface Stats {
  totalUsers: number
  totalPosts: number
  connectedAccounts: number
  totalTestimonials: number
}

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/public/testimonials').then(r => r.json()).catch(() => ({ testimonials: [] })),
      fetch('/api/public/stats').then(r => r.json()).catch(() => null),
    ]).then(([tData, sData]) => {
      setTestimonials(tData.testimonials || [])
      setStats(sData)
      setLoading(false)
    })
  }, [])

  const featured = testimonials.filter(t => t.featured)
  const regular = testimonials.filter(t => !t.featured)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-wall-title">
            Wall of Love
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="text-wall-subtitle">
            See what our customers are saying about their experience
          </p>
        </div>
      </section>

      {stats && (stats.totalUsers > 0 || stats.totalPosts > 0) && (
        <section className="py-12 border-b">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.totalUsers > 0 && (
                <div className="text-center" data-testid="stat-users">
                  <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <div className="text-3xl font-bold">{stats.totalUsers.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Active Users</div>
                </div>
              )}
              {stats.totalPosts > 0 && (
                <div className="text-center" data-testid="stat-posts">
                  <MessageSquare className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <div className="text-3xl font-bold">{stats.totalPosts.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Posts Created</div>
                </div>
              )}
              {stats.connectedAccounts > 0 && (
                <div className="text-center" data-testid="stat-accounts">
                  <BarChart className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <div className="text-3xl font-bold">{stats.connectedAccounts.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Connected Accounts</div>
                </div>
              )}
              <div className="text-center" data-testid="stat-testimonials">
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-primary" />
                <div className="text-3xl font-bold">{testimonials.length}</div>
                <div className="text-sm text-muted-foreground">Happy Customers</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-10">Featured Stories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {featured.map(t => (
                <TestimonialCard key={t.id} testimonial={t} large />
              ))}
            </div>
          </div>
        </section>
      )}

      {regular.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            {featured.length > 0 && (
              <h2 className="text-2xl font-bold text-center mb-10">More Customer Stories</h2>
            )}
            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 max-w-6xl mx-auto">
              {regular.map(t => (
                <div key={t.id} className="break-inside-avoid mb-6">
                  <TestimonialCard testimonial={t} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {testimonials.length === 0 && (
        <section className="py-24">
          <div className="container mx-auto px-4 text-center text-muted-foreground">
            <Quote className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg">No testimonials yet. Check back soon!</p>
          </div>
        </section>
      )}

      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to join them?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Start your journey today and see why our customers love us
          </p>
          <Button size="lg" asChild data-testid="button-cta-signup">
            <Link href="/signup">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

function TestimonialCard({ testimonial: t, large = false }: { testimonial: Testimonial; large?: boolean }) {
  const initials = t.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

  return (
    <div className={`rounded-xl border border-gray-500/50 bg-white/[0.09] p-6 ${large ? 'md:p-8' : ''} text-black dark:text-white relative`} data-testid={`card-public-testimonial-${t.id}`}>
      <Quote className="absolute top-4 right-4 h-8 w-8 text-primary-200 dark:text-primary-800 opacity-50" />
      <p className={`text-muted-foreground italic leading-relaxed mb-6 ${large ? 'text-lg' : 'text-sm'}`}>
        &quot;{t.quote}&quot;
      </p>
      {t.rating && (
        <div className="flex gap-0.5 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`h-4 w-4 ${i < t.rating! ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} />
          ))}
        </div>
      )}
      <div className="flex items-center gap-3">
        <Avatar className={large ? 'h-14 w-14' : 'h-10 w-10'}>
          {t.avatar_url && <AvatarImage src={t.avatar_url} alt={t.name} />}
          <AvatarFallback className="bg-primary-100 text-primary-800 dark:bg-primary-800 dark:text-primary-200 text-sm font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold">{t.name}</p>
          {(t.role || t.company) && (
            <p className="text-sm text-muted-foreground">
              {[t.role, t.company].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
        {t.company_logo_url && (
          <img src={t.company_logo_url} alt={t.company} className="h-6 w-auto opacity-50" />
        )}
      </div>
    </div>
  )
}
