'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowLeft, ExternalLink, AlertTriangle, CreditCard } from 'lucide-react'
import { EntityNotes } from '@/components/admin/entity-notes'

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500/10 text-green-600 dark:text-green-400',
  trialing: 'bg-primary/10 text-primary',
  canceled: 'bg-muted text-muted-foreground',
  past_due: 'bg-destructive/10 text-destructive',
  incomplete: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  paid: 'bg-green-500/10 text-green-600 dark:text-green-400',
  open: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  failed: 'bg-destructive/10 text-destructive',
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function SubscriptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/admin/subscriptions/${id}`)
        if (res.ok) {
          setData(await res.json())
        } else {
          setError(true)
        }
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-testid="loading-subscription-detail">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center" data-testid="error-not-found">
        <p className="text-muted-foreground mb-4">Subscription not found</p>
        <Button variant="outline" onClick={() => router.push('/admin/subscriptions')}>Back to Subscriptions</Button>
      </div>
    )
  }

  const { subscription: sub, user, product, invoices, stripeCustomerId, churnIndicators } = data

  return (
    <div className="p-6" data-testid="page-subscription-detail">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin/subscriptions')} data-testid="button-back-subs" aria-label="Back to Subscriptions">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold" data-testid="text-sub-title">
            {product?.name || 'Subscription'} — {sub.tier_id || 'Default'} Plan
          </h1>
          <p className="text-sm text-muted-foreground">
            {user.name} · {user.email}
          </p>
        </div>
        <span className={`ml-auto inline-flex items-center px-2.5 py-1 rounded text-xs font-medium capitalize ${STATUS_COLORS[sub.status] || 'bg-muted text-muted-foreground'}`}>
          {sub.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Link href={`/admin/crm/${user.id}`} className="rounded-lg border bg-card p-4 hover:bg-muted/30 transition-colors block" data-testid="card-customer">
          <p className="text-xs text-muted-foreground mb-2">Customer</p>
          <div className="flex items-center gap-2">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                {(user.name || '?').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </Link>

        <div className="rounded-lg border bg-card p-4" data-testid="card-sub-details">
          <p className="text-xs text-muted-foreground mb-2">Subscription Details</p>
          <div className="space-y-1 text-sm">
            {sub.stripe_subscription_id && (
              <p className="text-xs text-muted-foreground truncate">Stripe: {sub.stripe_subscription_id}</p>
            )}
            <p>Started: {formatDate(sub.created_at)}</p>
            <p>Current period: {formatDate(sub.current_period_start)} — {formatDate(sub.current_period_end)}</p>
            <p>Renewal: {formatDate(sub.current_period_end)}</p>
            {sub.cancel_at_period_end && (
              <p className="text-destructive font-medium">Cancels at period end</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4" data-testid="card-amount">
          <p className="text-xs text-muted-foreground mb-2">Amount</p>
          <p className="text-2xl font-bold">{formatCurrency(sub.price_amount || 0)}</p>
          <p className="text-xs text-muted-foreground">per month</p>
        </div>
      </div>

      {churnIndicators && churnIndicators.length > 0 && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 mb-6" data-testid="section-churn-risk">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h3 className="text-sm font-medium text-destructive">Churn Risk Indicators</h3>
          </div>
          <ul className="space-y-1">
            {churnIndicators.map((indicator: string, i: number) => (
              <li key={i} className="text-sm text-destructive/80 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                {indicator}
              </li>
            ))}
          </ul>
        </div>
      )}

      {invoices && invoices.length > 0 && (
        <div className="mb-6" data-testid="section-invoice-history">
          <h3 className="text-sm font-medium mb-3">Invoice History</h3>
          <div className="rounded-lg border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">Invoice</th>
                  <th className="text-right py-2.5 px-4 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv: any) => (
                  <tr
                    key={inv.id}
                    className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => router.push(`/admin/revenue/${inv.id}`)}
                    data-testid={`row-invoice-${inv.id}`}
                  >
                    <td className="py-2.5 px-4 text-foreground">{inv.stripe_invoice_id || inv.id}</td>
                    <td className="py-2.5 px-4 text-right tabular-nums font-medium">{formatCurrency(inv.amount_paid_cents || inv.amount_due_cents || 0)}</td>
                    <td className="py-2.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium capitalize ${STATUS_COLORS[inv.status] || 'bg-muted text-muted-foreground'}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-muted-foreground text-xs">{formatDate(inv.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-6">
        {sub.stripe_subscription_id && (
          <Button variant="outline" size="sm" asChild data-testid="button-view-stripe">
            <a href={`https://dashboard.stripe.com/subscriptions/${sub.stripe_subscription_id}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-1.5" /> View in Stripe
            </a>
          </Button>
        )}
        {stripeCustomerId && (
          <Button variant="outline" size="sm" asChild data-testid="button-view-customer-stripe">
            <a href={`https://dashboard.stripe.com/customers/${stripeCustomerId}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-1.5" /> Customer in Stripe
            </a>
          </Button>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium mb-3">Notes</h3>
        <EntityNotes entityType="subscription" entityId={id} />
      </div>
    </div>
  )
}
