'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CreditCard,
  ExternalLink,
  Loader2,
  Crown,
  Users,
  Sparkles,
  FileText,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  Receipt,
  Calendar,
  DollarSign,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  CheckCircle,
  Mail,
  Bell,
  Package,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface SubscriptionInfo {
  status: 'free' | 'active' | 'canceled' | 'past_due' | 'trialing'
  tier: 'free' | 'pro' | 'team'
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  subscriptionId: string | null
  priceId: string | null
}

interface Invoice {
  id: string
  invoice_number: string | null
  amount: number | null
  currency: string | null
  status: string | null
  description: string | null
  stripe_invoice_id: string | null
  hosted_invoice_url: string | null
  invoice_pdf_url: string | null
  created_at: string
  paid_at: string | null
  due_date: string | null
  metadata: Record<string, unknown> | null
}

interface InvoiceItem {
  id: string
  invoice_id: string
  description: string | null
  amount: number | null
  quantity: number | null
  unit_price: number | null
  created_at: string
}

const tierConfig = {
  free: {
    name: 'Free',
    description: 'Basic features for getting started',
    icon: Sparkles,
    color: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200',
  },
  pro: {
    name: 'Pro',
    description: 'For professionals and growing teams',
    icon: Crown,
    color: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
  },
  team: {
    name: 'Team',
    description: 'For larger organizations',
    icon: Users,
    color: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
  },
}

const statusLabels: Record<SubscriptionInfo['status'], { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  free: { label: 'Free Plan', variant: 'secondary' },
  active: { label: 'Active', variant: 'default' },
  canceled: { label: 'Canceled', variant: 'destructive' },
  past_due: { label: 'Past Due', variant: 'destructive' },
  trialing: { label: 'Trial', variant: 'outline' },
}

const invoiceStatusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  paid: { label: 'Paid', variant: 'default' },
  open: { label: 'Open', variant: 'outline' },
  draft: { label: 'Draft', variant: 'secondary' },
  void: { label: 'Void', variant: 'secondary' },
  uncollectible: { label: 'Uncollectible', variant: 'destructive' },
  overdue: { label: 'Overdue', variant: 'destructive' },
  pending: { label: 'Pending', variant: 'outline' },
}

function formatCurrency(amount: number | null, currency?: string | null): string {
  if (amount == null) return '$0.00'
  const cents = amount < 100 && amount > 0 ? amount : amount / 100
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'usd',
  }).format(cents >= 1 ? amount / 100 : amount)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const PAGE_SIZE = 10

export default function BillingPage() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPortalLoading, setIsPortalLoading] = useState(false)
  const router = useRouter()

  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [invoiceTotal, setInvoiceTotal] = useState(0)
  const [invoicePage, setInvoicePage] = useState(0)
  const [invoiceFilter, setInvoiceFilter] = useState<string>('all')
  const [invoicesLoading, setInvoicesLoading] = useState(true)

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [subscriptionError, setSubscriptionError] = useState(false)
  const [invoicesError, setInvoicesError] = useState(false)
  const [detailError, setDetailError] = useState(false)
  const [sendingReceipt, setSendingReceipt] = useState<string | null>(null)
  const [usageInsights, setUsageInsights] = useState<any>(null)

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const response = await fetch('/api/stripe/subscription')
        if (response.status === 401) {
          router.push('/login?redirect=/billing')
          return
        }
        if (!response.ok) {
          setSubscriptionError(true)
          return
        }
        const data = await response.json()
        setSubscription(data)
        setSubscriptionError(false)
      } catch (error) {
        console.error('Failed to fetch subscription:', error)
        setSubscriptionError(true)
      } finally {
        setIsLoading(false)
      }
    }
    fetchSubscription()
  }, [router])

  const fetchInvoices = useCallback(async () => {
    setInvoicesLoading(true)
    setInvoicesError(false)
    try {
      const params = new URLSearchParams({
        limit: PAGE_SIZE.toString(),
        offset: (invoicePage * PAGE_SIZE).toString(),
      })
      if (invoiceFilter !== 'all') {
        params.set('status', invoiceFilter)
      }
      const response = await fetch(`/api/user/invoices?${params}`)
      if (response.ok) {
        const data = await response.json()
        setInvoices(data.invoices || [])
        setInvoiceTotal(data.total || 0)
      } else {
        setInvoicesError(true)
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
      setInvoicesError(true)
    } finally {
      setInvoicesLoading(false)
    }
  }, [invoicePage, invoiceFilter])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  useEffect(() => {
    fetch('/api/user/usage-insights')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.insights) setUsageInsights(data.insights) })
      .catch(() => {})
  }, [])

  const sendBrandedReceipt = async (invoiceId: string) => {
    setSendingReceipt(invoiceId)
    try {
      const res = await fetch('/api/email/branded-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId }),
      })
      if (res.ok) {
        alert('Receipt sent to your email')
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to send receipt')
      }
    } catch {
      alert('Failed to send receipt')
    } finally {
      setSendingReceipt(null)
    }
  }

  const openInvoiceDetail = async (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setDetailOpen(true)
    setDetailLoading(true)
    setDetailError(false)
    try {
      const response = await fetch(`/api/user/invoices/${invoice.id}`)
      if (response.ok) {
        const data = await response.json()
        setInvoiceItems(data.items || [])
      } else {
        setDetailError(true)
      }
    } catch (error) {
      console.error('Failed to fetch invoice detail:', error)
      setDetailError(true)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleManageBilling = async () => {
    setIsPortalLoading(true)
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      } else if (data.error === 'No billing account found') {
        router.push('/pricing')
      }
    } catch (error) {
      console.error('Portal error:', error)
    } finally {
      setIsPortalLoading(false)
    }
  }

  const totalPages = Math.ceil(invoiceTotal / PAGE_SIZE)

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" data-testid="loader-billing" />
        </div>
      </div>
    )
  }

  const tierInfo = subscription ? tierConfig[subscription.tier] : tierConfig.free
  const TierIcon = tierInfo.icon
  const statusInfo = subscription ? statusLabels[subscription.status] : statusLabels.free

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold" data-testid="text-billing-title">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-2">Manage your subscription and billing information</p>
      </div>

      <div className="space-y-6">
        {subscriptionError ? (
          <Card data-testid="card-subscription-error">
            <CardContent className="py-8 text-center">
              <p className="text-destructive font-medium mb-2">Unable to load subscription information</p>
              <p className="text-sm text-muted-foreground mb-4">Please try again or contact support if the issue persists.</p>
              <Button variant="outline" onClick={() => window.location.reload()} data-testid="button-retry-subscription">
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : (
        <Card data-testid="card-subscription-status">
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-md ${tierInfo.color}`}>
                  <TierIcon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-xl">{tierInfo.name} Plan</CardTitle>
                  <CardDescription>{tierInfo.description}</CardDescription>
                </div>
              </div>
              <Badge variant={statusInfo.variant} data-testid="badge-subscription-status">
                {statusInfo.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscription && subscription.status !== 'free' && subscription.currentPeriodEnd && (
              <div className="flex items-center justify-between gap-4 py-3 border-t flex-wrap">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {subscription.cancelAtPeriodEnd ? 'Access ends on' : 'Next billing date'}
                    </p>
                    <p className="text-sm text-muted-foreground" data-testid="text-billing-date">
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                {subscription.cancelAtPeriodEnd && (
                  <Badge variant="outline" className="text-amber-600 border-amber-600">
                    Canceling
                  </Badge>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2 flex-wrap">
              {!subscription || subscription.status === 'free' ? (
                <Button onClick={() => router.push('/pricing')} data-testid="button-upgrade">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Upgrade to Pro
                </Button>
              ) : (
                <Button
                  onClick={handleManageBilling}
                  disabled={isPortalLoading}
                  data-testid="button-manage-billing"
                >
                  {isPortalLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4 mr-2" />
                  )}
                  Manage Subscription
                </Button>
              )}
              {subscription && subscription.status !== 'free' && (
                <Button variant="outline" onClick={() => router.push('/pricing')} data-testid="button-view-plans">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Plans
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        )}

        {subscription && subscription.status !== 'free' && subscription.currentPeriodEnd && (
          <Card data-testid="card-billing-reminder">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Upcoming Payment</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-sm text-muted-foreground" data-testid="text-next-payment-info">
                    {subscription.cancelAtPeriodEnd
                      ? 'Your subscription will end on the date below. No further payments will be charged.'
                      : `Your next payment will be processed on ${new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.`}
                  </p>
                  {!subscription.cancelAtPeriodEnd && (() => {
                    const daysUntil = Math.ceil((new Date(subscription.currentPeriodEnd!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    if (daysUntil <= 7 && daysUntil > 0) {
                      return (
                        <Badge variant="outline" className="mt-2 text-amber-600 border-amber-600" data-testid="badge-payment-soon">
                          Payment in {daysUntil} day{daysUntil !== 1 ? 's' : ''}
                        </Badge>
                      )
                    }
                    return null
                  })()}
                </div>
                <Button variant="outline" size="sm" onClick={handleManageBilling} disabled={isPortalLoading} data-testid="button-update-payment-method">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Update Payment Method
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card data-testid="card-plan-features">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Plan Features</CardTitle>
            </div>
            <CardDescription>What&apos;s included in your {tierInfo.name} plan</CardDescription>
          </CardHeader>
          <CardContent>
            {(!subscription || subscription.tier === 'free') ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {['Social post scheduling', 'Basic analytics', '3 connected accounts', 'Community support'].map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                      <span data-testid={`text-free-feature-${i}`}>{feature}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-3 mt-3">
                  <p className="text-sm text-muted-foreground mb-2">Upgrade to Pro for:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {['Unlimited scheduling', 'Advanced analytics', 'AI content tools', 'Priority support', 'Blog integration', 'Revenue tracking'].map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Sparkles className="h-4 w-4 text-primary shrink-0" />
                        <span data-testid={`text-upgrade-feature-${i}`}>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : subscription.tier === 'pro' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {['Unlimited scheduling', 'Advanced analytics', 'AI content tools', 'Priority support', 'Blog integration', 'Revenue tracking', '10 connected accounts', 'Brand voice AI', 'Engagement insights', 'Lead generation'].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                    <span data-testid={`text-pro-feature-${i}`}>{feature}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {['Everything in Pro', 'Unlimited accounts', 'Team collaboration', 'Approval workflows', 'Custom branding', 'API access', 'Dedicated support', 'SSO integration'].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                    <span data-testid={`text-team-feature-${i}`}>{feature}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {usageInsights && (
          <Card data-testid="card-usage-insights">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Usage Insights</CardTitle>
              </div>
              <CardDescription>Your activity this {usageInsights.monthName}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-2xl font-bold" data-testid="text-posts-this-month">{usageInsights.postsThisMonth}</p>
                  <p className="text-sm text-muted-foreground">Posts this month</p>
                  <div className="flex items-center gap-1 text-xs">
                    {usageInsights.postsDelta > 0 ? (
                      <><TrendingUp className="h-3 w-3 text-green-500" /><span className="text-green-600" data-testid="text-posts-delta">+{usageInsights.postsDelta} from {usageInsights.lastMonthName}</span></>
                    ) : usageInsights.postsDelta < 0 ? (
                      <><TrendingDown className="h-3 w-3 text-red-500" /><span className="text-red-600" data-testid="text-posts-delta">{usageInsights.postsDelta} from {usageInsights.lastMonthName}</span></>
                    ) : (
                      <><Minus className="h-3 w-3 text-muted-foreground" /><span className="text-muted-foreground" data-testid="text-posts-delta">Same as {usageInsights.lastMonthName}</span></>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold" data-testid="text-activities-count">{usageInsights.activitiesThisMonth}</p>
                  <p className="text-sm text-muted-foreground">Activities</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold" data-testid="text-tickets-count">{usageInsights.ticketsTotal}</p>
                  <p className="text-sm text-muted-foreground">Support tickets</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card data-testid="card-payment-method">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Payment Method</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {subscription && subscription.status !== 'free' ? (
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <p className="text-sm text-muted-foreground">
                  Your payment method is managed through Stripe. Click &quot;Manage Subscription&quot; above to update your card or payment details.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManageBilling}
                  disabled={isPortalLoading}
                  data-testid="button-update-payment"
                >
                  {isPortalLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4 mr-2" />
                  )}
                  Update Payment
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No payment method on file. Upgrade your plan to add a payment method.
              </p>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-invoice-history">
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Invoice History</CardTitle>
              </div>
              <Select value={invoiceFilter} onValueChange={(val) => { setInvoiceFilter(val); setInvoicePage(0) }}>
                <SelectTrigger className="w-full sm:w-[140px]" data-testid="select-invoice-filter">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="void">Void</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <CardDescription>View and download your past invoices</CardDescription>
          </CardHeader>
          <CardContent>
            {invoicesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" data-testid="loader-invoices" />
              </div>
            ) : invoicesError ? (
              <div className="text-center py-12">
                <p className="text-destructive font-medium mb-2">Failed to load invoices</p>
                <p className="text-sm text-muted-foreground mb-4">Please try again.</p>
                <Button variant="outline" size="sm" onClick={() => fetchInvoices()} data-testid="button-retry-invoices">
                  Try Again
                </Button>
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground" data-testid="text-no-invoices">No invoices found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => {
                    const invStatus = invoiceStatusConfig[invoice.status || 'draft'] || { label: invoice.status || 'Unknown', variant: 'secondary' as const }
                    return (
                      <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                        <TableCell className="font-medium">
                          <span data-testid={`text-invoice-number-${invoice.id}`}>
                            {invoice.invoice_number || `INV-${invoice.id.slice(0, 8)}`}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(invoice.created_at)}
                        </TableCell>
                        <TableCell>
                          <span data-testid={`text-invoice-amount-${invoice.id}`}>
                            {formatCurrency(invoice.amount, invoice.currency)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={invStatus.variant} data-testid={`badge-invoice-status-${invoice.id}`}>
                            {invStatus.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openInvoiceDetail(invoice)}
                              data-testid={`button-view-invoice-${invoice.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => sendBrandedReceipt(invoice.id)}
                              disabled={sendingReceipt === invoice.id}
                              data-testid={`button-email-receipt-${invoice.id}`}
                            >
                              {sendingReceipt === invoice.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                            </Button>
                            {(invoice.invoice_pdf_url || invoice.hosted_invoice_url) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                                data-testid={`button-download-invoice-${invoice.id}`}
                              >
                                <a
                                  href={invoice.invoice_pdf_url || invoice.hosted_invoice_url || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Download className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
          {totalPages > 1 && (
            <CardFooter className="flex items-center justify-between gap-4 flex-wrap">
              <p className="text-sm text-muted-foreground" data-testid="text-invoice-count">
                Showing {invoicePage * PAGE_SIZE + 1}–{Math.min((invoicePage + 1) * PAGE_SIZE, invoiceTotal)} of {invoiceTotal}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={invoicePage === 0}
                  onClick={() => setInvoicePage((p) => p - 1)}
                  data-testid="button-invoice-prev"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  {invoicePage + 1} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={invoicePage >= totalPages - 1}
                  onClick={() => setInvoicePage((p) => p + 1)}
                  data-testid="button-invoice-next"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>

        <Card data-testid="card-billing-help">
          <CardHeader>
            <CardTitle className="text-lg">Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              If you have questions about your subscription or need assistance with billing,
              please contact our support team.
            </p>
            <Button variant="outline" size="sm" data-testid="button-contact-support">
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg" data-testid="dialog-invoice-detail">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice {selectedInvoice?.invoice_number || `INV-${selectedInvoice?.id.slice(0, 8)}`}
            </DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : detailError ? (
            <div className="text-center py-8">
              <p className="text-destructive font-medium mb-2">Failed to load invoice details</p>
              <Button variant="outline" size="sm" onClick={() => selectedInvoice && openInvoiceDetail(selectedInvoice)} data-testid="button-retry-detail">
                Try Again
              </Button>
            </div>
          ) : selectedInvoice ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium" data-testid="text-detail-date">{formatDate(selectedInvoice.created_at)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge
                    variant={(invoiceStatusConfig[selectedInvoice.status || 'draft'] || { variant: 'secondary' }).variant as 'default' | 'secondary' | 'destructive' | 'outline'}
                    data-testid="badge-detail-status"
                  >
                    {(invoiceStatusConfig[selectedInvoice.status || 'draft'] || { label: selectedInvoice.status }).label}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-medium text-lg" data-testid="text-detail-amount">
                    {formatCurrency(selectedInvoice.amount, selectedInvoice.currency)}
                  </p>
                </div>
                {selectedInvoice.paid_at && (
                  <div>
                    <p className="text-muted-foreground">Paid On</p>
                    <p className="font-medium" data-testid="text-detail-paid">{formatDate(selectedInvoice.paid_at)}</p>
                  </div>
                )}
              </div>

              {selectedInvoice.description && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Description</p>
                  <p data-testid="text-detail-description">{selectedInvoice.description}</p>
                </div>
              )}

              {invoiceItems.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Line Items</p>
                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoiceItems.map((item) => (
                        <TableRow key={item.id} data-testid={`row-item-${item.id}`}>
                          <TableCell className="text-sm">{item.description || 'Item'}</TableCell>
                          <TableCell className="text-right text-sm">{item.quantity || 1}</TableCell>
                          <TableCell className="text-right text-sm">{formatCurrency(item.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => sendBrandedReceipt(selectedInvoice.id)}
                  disabled={sendingReceipt === selectedInvoice.id}
                  data-testid="button-detail-email-receipt"
                >
                  {sendingReceipt === selectedInvoice.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                  Email Receipt
                </Button>
                {selectedInvoice.invoice_pdf_url && (
                  <Button variant="outline" size="sm" asChild data-testid="button-detail-download-pdf">
                    <a href={selectedInvoice.invoice_pdf_url} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </a>
                  </Button>
                )}
                {selectedInvoice.hosted_invoice_url && (
                  <Button variant="outline" size="sm" asChild data-testid="button-detail-view-stripe">
                    <a href={selectedInvoice.hosted_invoice_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View on Stripe
                    </a>
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
