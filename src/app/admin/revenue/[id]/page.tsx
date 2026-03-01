'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowLeft, ExternalLink, FileText, DollarSign, CreditCard, Users, Receipt } from 'lucide-react'
import { AdminBreadcrumbs } from '@/components/admin/breadcrumbs'
import { EntityNotes } from '@/components/admin/entity-notes'
import { RelatedRecords } from '@/components/admin/related-records'

const STATUS_COLORS: Record<string, string> = {
  paid: 'bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]',
  open: 'bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))]',
  pending: 'bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))]',
  failed: 'bg-destructive/10 text-destructive',
  void: 'bg-muted text-muted-foreground',
  approved: 'bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]',
  completed: 'bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]',
  processing: 'bg-primary/10 text-primary',
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function PersonCard({ user, label }: { user: any; label: string }) {
  if (!user) return null
  return (
    <Link href={`/admin/crm/${user.id}`} className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] p-[var(--card-padding,1.25rem)] hover:bg-muted/30 transition-colors block" data-testid={`card-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="flex items-center gap-2">
        {user.avatar_url ? (
          <img src={user.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
            {(user.name || '?').charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-medium text-sm text-foreground">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>
    </Link>
  )
}

function InvoiceDetail({ data }: { data: any }) {
  const { record, user, payment, lineItems, subscription, affiliateAttribution } = data

  return (
    <div className="space-y-[var(--content-density-gap,1rem)]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" data-testid="text-invoice-number">
            Invoice {record.stripe_invoice_id || record.invoice_number || record.id}
          </h2>
          <p className="text-sm text-muted-foreground">{formatDate(record.created_at)}</p>
        </div>
        <div className="flex items-center gap-[var(--content-density-gap,1rem)]">
          <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium capitalize ${STATUS_COLORS[record.status] || 'bg-muted text-muted-foreground'}`}>
            {record.status}
          </span>
          <span className="text-2xl font-bold">{formatCurrency(record.amount_paid_cents || record.amount_due_cents || 0)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[var(--content-density-gap,1rem)]">
        <PersonCard user={user} label="Customer" />

        {payment && (
          <div className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] p-[var(--card-padding,1.25rem)]" data-testid="card-payment-details">
            <p className="text-xs text-muted-foreground mb-1">Payment</p>
            <p className="font-medium text-sm">{payment.card_brand || 'Card'} ****{payment.card_last4 || '****'}</p>
            <p className="text-xs text-muted-foreground">{formatDate(payment.created_at)} · {payment.status}</p>
          </div>
        )}

        {subscription && (
          <Link href={`/admin/subscriptions/${subscription.id}`} className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] p-[var(--card-padding,1.25rem)] hover:bg-muted/30 transition-colors block" data-testid="card-subscription-link">
            <p className="text-xs text-muted-foreground mb-1">Subscription</p>
            <p className="font-medium text-sm">{subscription.tier_id || 'Active'} plan</p>
            <p className="text-xs text-muted-foreground">Period: {formatDate(record.period_start)} — {formatDate(record.period_end)}</p>
          </Link>
        )}
      </div>

      {affiliateAttribution && (
        <div className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] p-[var(--card-padding,1.25rem)]" data-testid="card-affiliate-attribution">
          <h3 className="text-sm font-medium mb-3">Affiliate Attribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-[var(--content-density-gap,1rem)]">
            <PersonCard user={affiliateAttribution.affiliate} label="Affiliate" />
            <div>
              <p className="text-xs text-muted-foreground">Commission</p>
              <p className="font-bold">{formatCurrency(affiliateAttribution.commission_amount || 0)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Rate</p>
              <p className="font-bold">{((affiliateAttribution.commission_rate || 0) * 100).toFixed(0)}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium capitalize ${STATUS_COLORS[affiliateAttribution.commission_status] || 'bg-muted text-muted-foreground'}`}>
                {affiliateAttribution.commission_status}
              </span>
            </div>
          </div>
        </div>
      )}

      {lineItems && lineItems.length > 0 && (
        <div data-testid="section-line-items">
          <h3 className="text-sm font-medium mb-2">Line Items</h3>
          <div className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left py-2 px-4 font-medium text-muted-foreground">Description</th>
                  <th className="text-right py-2 px-4 font-medium text-muted-foreground">Amount</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item: any, i: number) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 px-4">{item.description || item.stripe_price_id || 'Line item'}</td>
                    <td className="py-2 px-4 text-right tabular-nums">{formatCurrency(item.amount_cents || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {record.stripe_invoice_id && (
        <Button variant="outline" size="sm" asChild data-testid="button-view-stripe">
          <a href={`https://dashboard.stripe.com/invoices/${record.stripe_invoice_id}`} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-1.5" /> View in Stripe
          </a>
        </Button>
      )}

      <div>
        <h3 className="text-sm font-medium mb-3">Notes</h3>
        <EntityNotes entityType="invoice" entityId={record.id} />
      </div>
    </div>
  )
}

function PaymentDetail({ data }: { data: any }) {
  const { record, user, relatedInvoice } = data

  return (
    <div className="space-y-[var(--content-density-gap,1rem)]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" data-testid="text-payment-id">Payment {record.stripe_payment_intent_id || record.id}</h2>
          <p className="text-sm text-muted-foreground">{formatDate(record.created_at)}</p>
        </div>
        <div className="flex items-center gap-[var(--content-density-gap,1rem)]">
          <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium capitalize ${STATUS_COLORS[record.status] || 'bg-muted text-muted-foreground'}`}>
            {record.status}
          </span>
          <span className="text-2xl font-bold">{formatCurrency(record.amount_cents || 0)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--content-density-gap,1rem)]">
        <PersonCard user={user} label="Customer" />
        <div className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] p-[var(--card-padding,1.25rem)]" data-testid="card-card-details">
          <p className="text-xs text-muted-foreground mb-1">Card</p>
          <p className="font-medium text-sm">{record.card_brand || 'Card'} ****{record.card_last4 || '****'}</p>
        </div>
        {relatedInvoice && (
          <Link href={`/admin/revenue/${relatedInvoice.id}`} className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] p-[var(--card-padding,1.25rem)] hover:bg-muted/30 transition-colors block" data-testid="card-related-invoice">
            <p className="text-xs text-muted-foreground mb-1">Related Invoice</p>
            <p className="font-medium text-sm">{relatedInvoice.stripe_invoice_id || relatedInvoice.id}</p>
            <p className="text-xs text-muted-foreground">{formatCurrency(relatedInvoice.amount_paid_cents || 0)} · {relatedInvoice.status}</p>
          </Link>
        )}
      </div>
    </div>
  )
}

function CommissionDetail({ data }: { data: any }) {
  const { record, user, relatedInvoice, referredCustomer, referral } = data

  return (
    <div className="space-y-[var(--content-density-gap,1rem)]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" data-testid="text-commission-title">Commission</h2>
          <p className="text-sm text-muted-foreground">{formatDate(record.created_at)}</p>
        </div>
        <div className="flex items-center gap-[var(--content-density-gap,1rem)]">
          <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium capitalize ${STATUS_COLORS[record.status] || 'bg-muted text-muted-foreground'}`}>
            {record.status}
          </span>
          <span className="text-2xl font-bold">{formatCurrency(record.amount_cents || 0)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--content-density-gap,1rem)] text-sm">
        <div className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] p-[var(--card-padding,1.25rem)]">
          <p className="text-xs text-muted-foreground">Rate</p>
          <p className="font-bold">{((record.commission_rate || 0) * 100).toFixed(0)}%</p>
        </div>
        {referral && (
          <div className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] p-[var(--card-padding,1.25rem)]">
            <p className="text-xs text-muted-foreground">Referral</p>
            <p className="font-bold capitalize">{referral.status} · {formatDate(referral.created_at)}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--content-density-gap,1rem)]">
        <PersonCard user={user} label="Affiliate" />
        {referredCustomer && <PersonCard user={referredCustomer} label="Referred Customer" />}
        {relatedInvoice && (
          <Link href={`/admin/revenue/${relatedInvoice.id}`} className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] p-[var(--card-padding,1.25rem)] hover:bg-muted/30 transition-colors block" data-testid="card-related-invoice">
            <p className="text-xs text-muted-foreground mb-1">Triggering Invoice</p>
            <p className="font-medium text-sm">{relatedInvoice.stripe_invoice_id || relatedInvoice.id}</p>
            <p className="text-xs text-muted-foreground">{formatCurrency(relatedInvoice.amount_paid_cents || 0)}</p>
          </Link>
        )}
      </div>
    </div>
  )
}

function PayoutDetail({ data }: { data: any }) {
  const { record, user, includedCommissions, processedBy } = data

  return (
    <div className="space-y-[var(--content-density-gap,1rem)]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" data-testid="text-payout-title">Payout</h2>
          <p className="text-sm text-muted-foreground">{formatDate(record.created_at)}</p>
        </div>
        <div className="flex items-center gap-[var(--content-density-gap,1rem)]">
          <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium capitalize ${STATUS_COLORS[record.status] || 'bg-muted text-muted-foreground'}`}>
            {record.status}
          </span>
          <span className="text-2xl font-bold">{formatCurrency(record.amount_cents || 0)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--content-density-gap,1rem)]">
        <PersonCard user={user} label="Affiliate" />
        {record.method || record.payout_method ? (
          <div className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] p-[var(--card-padding,1.25rem)]">
            <p className="text-xs text-muted-foreground mb-1">Method</p>
            <p className="font-medium text-sm capitalize">{record.method || record.payout_method}</p>
          </div>
        ) : null}
        {processedBy && <PersonCard user={processedBy} label="Processed By" />}
      </div>

      {includedCommissions && includedCommissions.length > 0 && (
        <div data-testid="section-included-commissions">
          <h3 className="text-sm font-medium mb-2">Included Commissions</h3>
          <div className="rounded-[var(--card-radius,0.75rem)] border bg-[var(--card-bg)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left py-2 px-4 font-medium text-muted-foreground">Commission ID</th>
                  <th className="text-right py-2 px-4 font-medium text-muted-foreground">Amount</th>
                </tr>
              </thead>
              <tbody>
                {includedCommissions.map((item: any, i: number) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 px-4">
                      <Link href={`/admin/revenue/${item.commission_id || item.id}`} className="text-primary hover:underline" data-testid={`link-commission-${i}`}>
                        {item.commission_id || item.id}
                      </Link>
                    </td>
                    <td className="py-2 px-4 text-right tabular-nums">{formatCurrency(item.amount_cents || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default function RevenueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/admin/revenue/${id}`)
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
      <div className="flex items-center justify-center min-h-[400px]" data-testid="loading-revenue-detail">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-[var(--section-spacing,1.5rem)] text-center" data-testid="error-not-found">
        <p className="text-muted-foreground mb-[var(--content-density-gap,1rem)]">Transaction not found</p>
        <Button variant="outline" onClick={() => router.push('/admin/revenue')}>Back to Revenue</Button>
      </div>
    )
  }

  const breadcrumbLabel = data.type === 'invoice'
    ? `Invoice ${data.record?.stripe_invoice_id || data.record?.invoice_number || ''}`
    : data.type === 'payment'
    ? `Payment`
    : data.type === 'commission'
    ? `Commission`
    : `Payout`

  return (
    <div className="p-[var(--section-spacing,1.5rem)]" data-testid="page-revenue-detail">
      <div className="flex items-center gap-[var(--content-density-gap,1rem)] mb-[var(--content-density-gap,1rem)]">
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin/revenue')} data-testid="button-back-revenue" aria-label="Back to Revenue">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          {data.type === 'invoice' && <Receipt className="h-5 w-5 text-primary" />}
          {data.type === 'payment' && <CreditCard className="h-5 w-5 text-[hsl(var(--success))]" />}
          {data.type === 'commission' && <DollarSign className="h-5 w-5 text-[hsl(var(--warning))]" />}
          {data.type === 'payout' && <Users className="h-5 w-5 text-primary" />}
          <span className="text-sm text-muted-foreground capitalize">{data.type}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-[var(--content-density-gap,1rem)]">
        <div>
          {data.type === 'invoice' && <InvoiceDetail data={data} />}
          {data.type === 'payment' && <PaymentDetail data={data} />}
          {data.type === 'commission' && <CommissionDetail data={data} />}
          {data.type === 'payout' && <PayoutDetail data={data} />}
        </div>
        <div className="print:hidden">
          <RelatedRecords entityType={data.type} entityId={id} userId={data.user?.id || ''} />
        </div>
      </div>
    </div>
  )
}
