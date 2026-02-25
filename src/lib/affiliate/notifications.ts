import { createAdminClient } from '@/lib/supabase/admin'

export async function createBulkNotifications(
  userIds: string[],
  title: string,
  message: string,
  type: string = 'info',
  link?: string
) {
  if (userIds.length === 0) return
  try {
    const admin = createAdminClient()
    const rows = userIds.map(userId => ({
      user_id: userId,
      title,
      message,
      type,
      link: link || null,
    }))
    const batchSize = 100
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize)
      await admin.from('notifications').insert(batch)
    }
  } catch (err) {
    console.error('Failed to create bulk notifications:', err)
  }
}

export async function getAllAffiliateUserIds(): Promise<string[]> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('referral_links')
      .select('user_id')
      .eq('is_affiliate', true)
    return (data || []).map((d: any) => d.user_id)
  } catch {
    return []
  }
}

export async function createCommissionApprovalNotification(
  userId: string,
  count: number,
  totalCents: number
) {
  try {
    const admin = createAdminClient()
    const amount = (totalCents / 100).toFixed(2)
    await admin.from('notifications').insert({
      user_id: userId,
      title: 'Commissions Approved',
      message: `${count} commission${count !== 1 ? 's' : ''} totaling $${amount} ${count !== 1 ? 'have' : 'has'} been approved.`,
      type: 'success',
      link: '/affiliate/dashboard?section=earnings',
    })
  } catch (err) {
    console.error('Failed to create commission approval notification:', err)
  }
}

export async function createPayoutNotification(
  userId: string,
  amountCents: number,
  status: 'approved' | 'processing' | 'paid'
) {
  try {
    const admin = createAdminClient()
    const amount = (amountCents / 100).toFixed(2)
    const titles: Record<string, string> = {
      approved: 'Payout Approved',
      processing: 'Payout Processing',
      paid: 'Payout Sent',
    }
    const messages: Record<string, string> = {
      approved: `Your payout of $${amount} has been approved and is being processed.`,
      processing: `Your payout of $${amount} is being processed.`,
      paid: `Your payout of $${amount} has been sent!`,
    }
    await admin.from('notifications').insert({
      user_id: userId,
      title: titles[status],
      message: messages[status],
      type: status === 'paid' ? 'success' : 'info',
      link: '/affiliate/dashboard?section=payouts',
    })
  } catch (err) {
    console.error('Failed to create payout notification:', err)
  }
}

export async function createTierPromotionNotification(
  userId: string,
  tierName: string,
  commissionRate: number
) {
  try {
    const admin = createAdminClient()
    await admin.from('notifications').insert({
      user_id: userId,
      title: `You've been promoted to ${tierName}!`,
      message: `Congratulations! You've reached the ${tierName} tier. Your commission rate is now ${commissionRate}%. Keep up the great work!`,
      type: 'celebration',
      link: '/affiliate/dashboard',
    })
  } catch (err) {
    console.error('Failed to create tier promotion notification:', err)
  }
}

export async function createAssetUploadNotification(
  assetTitle: string,
  assetType: string,
  options?: {
    description?: string | null
    category?: string | null
    file_url?: string | null
    file_name?: string | null
  }
) {
  try {
    const userIds = await getAllAffiliateUserIds()
    if (userIds.length === 0) return

    const typeLabel = assetType.replace(/_/g, ' ')

    const typeEmoji: Record<string, string> = {
      banner: 'Banner',
      email: 'Email Template',
      social: 'Social Media Asset',
      video: 'Video',
      document: 'Document',
      link: 'Link',
      image: 'Image',
      copy: 'Copy',
      swipe_file: 'Swipe File',
    }
    const friendlyType = typeEmoji[assetType] || typeLabel

    let title = `New ${friendlyType} Available`

    let messageParts: string[] = [
      `"${assetTitle}" has been added to your marketing toolkit.`
    ]

    if (options?.description) {
      messageParts.push(options.description)
    }

    if (options?.category) {
      messageParts.push(`Category: ${options.category}`)
    }

    if (options?.file_name) {
      messageParts.push(`File: ${options.file_name}`)
    }

    const message = messageParts.join(' — ')

    await createBulkNotifications(
      userIds,
      title,
      message,
      'info',
      '/affiliate/dashboard?section=assets'
    )
  } catch (err) {
    console.error('Failed to create asset upload notifications:', err)
  }
}

export async function createTrialExpiryAlerts(admin: any) {
  try {
    const trialDays = 14
    const alertDaysBefore = 2
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - (trialDays - alertDaysBefore))
    const cutoffStart = new Date(cutoffDate)
    cutoffStart.setHours(0, 0, 0, 0)
    const cutoffEnd = new Date(cutoffDate)
    cutoffEnd.setHours(23, 59, 59, 999)

    const { data: referrals } = await admin
      .from('affiliate_referrals')
      .select('id, affiliate_user_id, referred_user_id, created_at')
      .eq('status', 'signed_up')
      .gte('created_at', cutoffStart.toISOString())
      .lte('created_at', cutoffEnd.toISOString())

    if (!referrals || referrals.length === 0) return 0

    let sent = 0
    const groupedByAffiliate: Record<string, number> = {}
    for (const ref of referrals) {
      groupedByAffiliate[ref.affiliate_user_id] = (groupedByAffiliate[ref.affiliate_user_id] || 0) + 1
    }

    for (const [affiliateId, count] of Object.entries(groupedByAffiliate)) {
      const dayNum = trialDays - alertDaysBefore
      await admin.from('notifications').insert({
        user_id: affiliateId,
        title: 'Trial Expiring Soon',
        message: `${count} of your referral${count !== 1 ? 's are' : ' is'} on day ${dayNum} of their ${trialDays}-day trial. A quick check-in could help them convert!`,
        type: 'warning',
        link: '/affiliate/dashboard?section=referrals',
      })
      sent++
    }
    return sent
  } catch (err) {
    console.error('Trial expiry alerts error:', err)
    return 0
  }
}
