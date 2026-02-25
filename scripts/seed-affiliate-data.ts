import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const TEST_AFFILIATES = [
  { email: 'affiliate.alice@test.com', name: 'Alice Martinez', tier: 'gold', signups: 45, clicks: 890, daysAgo: 90 },
  { email: 'affiliate.bob@test.com', name: 'Bob Johnson', tier: 'silver', signups: 22, clicks: 410, daysAgo: 60 },
  { email: 'affiliate.carol@test.com', name: 'Carol Chen', tier: 'bronze', signups: 8, clicks: 150, daysAgo: 45 },
  { email: 'affiliate.dave@test.com', name: 'Dave Wilson', tier: 'starter', signups: 3, clicks: 55, daysAgo: 30 },
  { email: 'affiliate.emma@test.com', name: 'Emma Brown', tier: 'gold', signups: 60, clicks: 1200, daysAgo: 120 },
  { email: 'affiliate.frank@test.com', name: 'Frank Garcia', tier: 'silver', signups: 18, clicks: 320, daysAgo: 75 },
  { email: 'affiliate.grace@test.com', name: 'Grace Lee', tier: 'bronze', signups: 5, clicks: 90, daysAgo: 20 },
  { email: 'affiliate.dormant@test.com', name: 'Harry Dormant', tier: 'starter', signups: 1, clicks: 10, daysAgo: 180 },
]

const TIERS = [
  { name: 'Starter', min_referrals: 0, commission_rate: 15, sort_order: 1, min_payout_cents: 2500 },
  { name: 'Bronze', min_referrals: 5, commission_rate: 20, sort_order: 2, min_payout_cents: 2000 },
  { name: 'Silver', min_referrals: 15, commission_rate: 25, sort_order: 3, min_payout_cents: 1500 },
  { name: 'Gold', min_referrals: 30, commission_rate: 30, sort_order: 4, min_payout_cents: 1000 },
  { name: 'Platinum', min_referrals: 75, commission_rate: 35, sort_order: 5, min_payout_cents: 500, perks: ['Priority support', 'Custom landing pages', 'Early access to features'] },
]

const MILESTONES = [
  { name: 'First Referral', referral_threshold: 1, bonus_amount_cents: 500, description: 'Welcome bonus for your first successful referral' },
  { name: 'Rising Star', referral_threshold: 5, bonus_amount_cents: 1500, description: 'You\'re building momentum!' },
  { name: 'Power Affiliate', referral_threshold: 25, bonus_amount_cents: 5000, description: 'A true influencer in our community' },
  { name: 'Super Affiliate', referral_threshold: 50, bonus_amount_cents: 10000, description: 'Elite status — top 1% of affiliates' },
  { name: 'Legend', referral_threshold: 100, bonus_amount_cents: 25000, description: 'Hall of fame level achievement' },
]

function daysAgoDate(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

function randomRefCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}

async function getOrCreateUser(email: string, name: string): Promise<string> {
  const { data: existingUsers } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const existing = existingUsers?.users?.find(u => u.email === email)
  if (existing) {
    console.log(`  Found existing user: ${email} (${existing.id})`)
    return existing.id
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: 'TestAffiliate123!',
    email_confirm: true,
    user_metadata: { full_name: name },
  })

  if (error) {
    console.error(`  Failed to create user ${email}:`, error.message)
    throw error
  }

  console.log(`  Created user: ${email} (${data.user.id})`)
  return data.user.id
}

async function seed() {
  console.log('=== Affiliate System Test Data Seeder ===\n')

  console.log('1. Ensuring affiliate_program_settings exists...')
  const { data: existingSettings } = await admin
    .from('affiliate_program_settings')
    .select('id')
    .limit(1)
    .maybeSingle()

  if (!existingSettings) {
    await admin.from('affiliate_program_settings').insert({
      commission_rate: 20,
      commission_duration_months: 12,
      min_payout_cents: 5000,
      cookie_duration_days: 30,
      program_active: true,
      leaderboard_enabled: true,
      leaderboard_privacy_mode: 'initials',
      reengagement_enabled: true,
      dormancy_threshold_days: 30,
      max_reengagement_emails: 3,
      payout_schedule_day: 15,
      auto_approve_threshold_cents: 10000,
    })
    console.log('  Created program settings')
  } else {
    console.log('  Settings already exist, skipping')
  }

  console.log('\n2. Creating tiers...')
  for (const tier of TIERS) {
    const { data: existing } = await admin
      .from('affiliate_tiers')
      .select('id')
      .eq('name', tier.name)
      .maybeSingle()

    if (!existing) {
      const { error } = await admin.from('affiliate_tiers').insert({
        name: tier.name,
        min_referrals: tier.min_referrals,
        commission_rate: tier.commission_rate,
        sort_order: tier.sort_order,
        min_payout_cents: tier.min_payout_cents || null,
        perks: tier.perks ? JSON.stringify(tier.perks) : '[]',
      })
      if (error) console.error(`  Tier ${tier.name} error:`, error.message)
      else console.log(`  Created tier: ${tier.name}`)
    } else {
      console.log(`  Tier ${tier.name} already exists`)
    }
  }

  const { data: allTiers } = await admin.from('affiliate_tiers').select('*').order('min_referrals')
  const tierMap: Record<string, string> = {}
  for (const t of allTiers || []) {
    tierMap[t.name.toLowerCase()] = t.id
  }

  console.log('\n3. Creating milestones...')
  for (const ms of MILESTONES) {
    const { data: existing } = await admin
      .from('affiliate_milestones')
      .select('id')
      .eq('name', ms.name)
      .maybeSingle()

    if (!existing) {
      const { error } = await admin.from('affiliate_milestones').insert(ms)
      if (error) console.error(`  Milestone ${ms.name} error:`, error.message)
      else console.log(`  Created milestone: ${ms.name}`)
    } else {
      console.log(`  Milestone ${ms.name} already exists`)
    }
  }

  const { data: allMilestones } = await admin.from('affiliate_milestones').select('*')

  console.log('\n4. Creating test affiliate users and referral links...')
  const affiliateUserIds: { userId: string; email: string; name: string; tier: string; signups: number; clicks: number; daysAgo: number }[] = []

  for (const aff of TEST_AFFILIATES) {
    try {
      const userId = await getOrCreateUser(aff.email, aff.name)
      affiliateUserIds.push({ userId, ...aff })

      const { data: existingLink } = await admin
        .from('referral_links')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()

      const tierId = tierMap[aff.tier] || null
      const tierData = TIERS.find(t => t.name.toLowerCase() === aff.tier)

      if (!existingLink) {
        await admin.from('referral_links').insert({
          user_id: userId,
          ref_code: randomRefCode(),
          is_affiliate: true,
          affiliate_role: 'affiliate',
          clicks: aff.clicks,
          signups: aff.signups,
          locked_commission_rate: tierData?.commission_rate || 20,
          locked_duration_months: 12,
          locked_at: daysAgoDate(aff.daysAgo),
          current_tier_id: tierId,
          total_earnings_cents: Math.round(aff.signups * 2500 * (tierData?.commission_rate || 20) / 100),
          paid_earnings_cents: Math.round(aff.signups * 2500 * (tierData?.commission_rate || 20) / 100 * 0.6),
          pending_earnings_cents: Math.round(aff.signups * 2500 * (tierData?.commission_rate || 20) / 100 * 0.4),
          created_at: daysAgoDate(aff.daysAgo),
          updated_at: aff.name === 'Harry Dormant' ? daysAgoDate(45) : daysAgoDate(Math.min(aff.daysAgo, 5)),
        })
        console.log(`  Created referral link for ${aff.name}`)
      } else {
        await admin.from('referral_links').update({
          is_affiliate: true,
          affiliate_role: 'affiliate',
          clicks: aff.clicks,
          signups: aff.signups,
          locked_commission_rate: tierData?.commission_rate || 20,
          locked_duration_months: 12,
          locked_at: daysAgoDate(aff.daysAgo),
          current_tier_id: tierId,
          total_earnings_cents: Math.round(aff.signups * 2500 * (tierData?.commission_rate || 20) / 100),
          paid_earnings_cents: Math.round(aff.signups * 2500 * (tierData?.commission_rate || 20) / 100 * 0.6),
          pending_earnings_cents: Math.round(aff.signups * 2500 * (tierData?.commission_rate || 20) / 100 * 0.4),
          updated_at: aff.name === 'Harry Dormant' ? daysAgoDate(45) : daysAgoDate(Math.min(aff.daysAgo, 5)),
        }).eq('user_id', userId)
        console.log(`  Updated referral link for ${aff.name}`)
      }
    } catch (err) {
      console.error(`  Skipping ${aff.name}:`, (err as Error).message)
    }
  }

  console.log('\n5. Creating referred users and affiliate_referrals...')
  const referredUserIds: string[] = []
  let referralRecordIds: string[] = []

  for (const aff of affiliateUserIds) {
    const referralCount = Math.min(aff.signups, 5)
    for (let i = 0; i < referralCount; i++) {
      const referredEmail = `referred.${aff.email.split('@')[0]}.${i + 1}@test.com`
      try {
        const referredUserId = await getOrCreateUser(referredEmail, `Referred User ${i + 1}`)
        referredUserIds.push(referredUserId)

        const { data: existingRef } = await admin
          .from('affiliate_referrals')
          .select('id')
          .eq('affiliate_user_id', aff.userId)
          .eq('referred_user_id', referredUserId)
          .maybeSingle()

        if (!existingRef) {
          const daysOffset = Math.floor(Math.random() * 30)
          const createdAt = daysAgoDate(aff.daysAgo - daysOffset)
          const isConverted = Math.random() > 0.3
          const isFlagged = Math.random() > 0.9

          const { data: refData, error } = await admin.from('affiliate_referrals').insert({
            affiliate_user_id: aff.userId,
            referred_user_id: referredUserId,
            ref_code: randomRefCode(),
            status: isConverted ? 'converted' : 'signed_up',
            fraud_flags: isFlagged ? ['suspicious_timing'] : [],
            converted_at: isConverted ? daysAgoDate(aff.daysAgo - daysOffset - 2) : null,
            created_at: createdAt,
            source_tag: ['twitter', 'youtube', 'blog', 'email', 'linkedin'][Math.floor(Math.random() * 5)],
          }).select('id').single()

          if (error) {
            console.error(`  Referral error:`, error.message)
          } else if (refData) {
            referralRecordIds.push(refData.id)
          }
        } else {
          referralRecordIds.push(existingRef.id)
        }
      } catch (err) {
        console.error(`  Skipping referred user:`, (err as Error).message)
      }
    }
  }
  console.log(`  Created/found ${referralRecordIds.length} referral records`)

  console.log('\n6. Creating commission records...')
  let commissionsCreated = 0
  for (const aff of affiliateUserIds) {
    const { data: affReferrals } = await admin
      .from('affiliate_referrals')
      .select('id')
      .eq('affiliate_user_id', aff.userId)
      .eq('status', 'converted')

    for (const ref of affReferrals || []) {
      const numInvoices = Math.ceil(Math.random() * 3)
      for (let inv = 0; inv < numInvoices; inv++) {
        const invoiceId = `inv_test_${aff.userId.slice(0, 8)}_${ref.id.slice(0, 8)}_${inv}`

        const { data: existing } = await admin
          .from('affiliate_commissions')
          .select('id')
          .eq('stripe_invoice_id', invoiceId)
          .maybeSingle()

        if (!existing) {
          const invoiceAmount = [2900, 4900, 9900, 14900][Math.floor(Math.random() * 4)]
          const tierData = TIERS.find(t => t.name.toLowerCase() === aff.tier)
          const rate = tierData?.commission_rate || 20
          const commissionAmount = Math.round(invoiceAmount * rate / 100)
          const statuses = ['pending', 'approved', 'paid', 'paid', 'paid']
          const status = statuses[Math.floor(Math.random() * statuses.length)]

          await admin.from('affiliate_commissions').insert({
            affiliate_user_id: aff.userId,
            referral_id: ref.id,
            stripe_invoice_id: invoiceId,
            invoice_amount_cents: invoiceAmount,
            commission_rate: rate,
            commission_amount_cents: commissionAmount,
            status,
            created_at: daysAgoDate(Math.floor(Math.random() * 60)),
          })
          commissionsCreated++
        }
      }
    }
  }
  console.log(`  Created ${commissionsCreated} commission records`)

  console.log('\n7. Creating payout records...')
  let payoutsCreated = 0
  for (const aff of affiliateUserIds.slice(0, 5)) {
    const { data: existing } = await admin
      .from('affiliate_payouts')
      .select('id')
      .eq('affiliate_user_id', aff.userId)
      .limit(1)
      .maybeSingle()

    if (!existing) {
      const tierData = TIERS.find(t => t.name.toLowerCase() === aff.tier)
      const payoutAmount = Math.round(aff.signups * 2500 * (tierData?.commission_rate || 20) / 100 * 0.6)

      if (payoutAmount > 0) {
        await admin.from('affiliate_payouts').insert({
          affiliate_user_id: aff.userId,
          amount_cents: payoutAmount,
          method: 'paypal',
          status: Math.random() > 0.3 ? 'completed' : 'pending',
          notes: 'Monthly payout',
          created_at: daysAgoDate(15),
          processed_at: Math.random() > 0.3 ? daysAgoDate(14) : null,
        })
        payoutsCreated++
      }
    }
  }
  console.log(`  Created ${payoutsCreated} payout records`)

  console.log('\n8. Creating affiliate applications (mix of statuses)...')
  const applications = [
    { name: 'Sarah Palmer', email: 'sarah.palmer@test.com', website_url: 'https://sarahreviews.com', promotion_method: 'blog', status: 'pending', message: 'I run a tech review blog with 50k monthly readers.' },
    { name: 'Mike Torres', email: 'mike.torres@test.com', website_url: 'https://youtube.com/@miketorres', promotion_method: 'youtube', status: 'pending', message: 'YouTube channel with 25k subscribers focused on SaaS tools.' },
    { name: 'Lisa Wang', email: 'lisa.wang@test.com', website_url: 'https://lisawang.dev', promotion_method: 'newsletter', status: 'approved', message: 'Weekly newsletter for indie hackers, 8k subscribers.', reviewed_at: daysAgoDate(10) },
    { name: 'Tom Baker', email: 'tom.baker@test.com', website_url: '', promotion_method: 'social_media', status: 'rejected', message: 'I have a lot of followers on Twitter.', reviewer_notes: 'No website or concrete promotion plan provided.', reviewed_at: daysAgoDate(20) },
    { name: 'Nina Patel', email: 'nina.patel@test.com', website_url: 'https://startupdigest.io', promotion_method: 'blog', status: 'pending', message: 'I curate a startup tools digest with 12k email subscribers and 30k Twitter followers.' },
  ]

  for (const app of applications) {
    const { data: existing } = await admin
      .from('affiliate_applications')
      .select('id')
      .eq('email', app.email)
      .maybeSingle()

    if (!existing) {
      await admin.from('affiliate_applications').insert(app)
      console.log(`  Created application: ${app.name} (${app.status})`)
    } else {
      console.log(`  Application for ${app.name} already exists`)
    }
  }

  console.log('\n9. Creating marketing assets...')
  const assets = [
    { title: 'Product Banner (728x90)', description: 'Leaderboard banner for website headers', asset_type: 'banner', content: 'https://via.placeholder.com/728x90/6366f1/ffffff?text=Try+Our+Product', sort_order: 1 },
    { title: 'Social Media Square (1080x1080)', description: 'Perfect for Instagram and Facebook posts', asset_type: 'banner', content: 'https://via.placeholder.com/1080x1080/6366f1/ffffff?text=Share+This', sort_order: 2 },
    { title: 'Email Welcome Template', description: 'Use this in your newsletters to introduce our product', asset_type: 'email_template', content: '<h2>Check out this amazing tool!</h2><p>I\'ve been using [Product] for 3 months and it\'s saved me hours every week. Use my referral link to get started: [YOUR_LINK]</p>', sort_order: 3 },
    { title: 'Twitter Thread Template', description: 'Copy-paste thread for Twitter/X promotion', asset_type: 'social_post', content: 'Thread: Why I switched to [Product] and never looked back...\n\n1/ The dashboard is incredibly intuitive\n2/ Automation features save me 5+ hours/week\n3/ Support team responds within minutes\n\nTry it yourself: [YOUR_LINK]', sort_order: 4 },
    { title: 'LinkedIn Post Template', description: 'Professional post for LinkedIn audience', asset_type: 'social_post', content: 'After testing 10+ tools in this space, I settled on [Product]. Here\'s why:\n\n- Easy setup (took 5 minutes)\n- ROI positive in week 1\n- Best-in-class support\n\nCheck it out: [YOUR_LINK]', sort_order: 5 },
    { title: 'Product Comparison Sheet', description: 'PDF comparing us vs competitors — great for review articles', asset_type: 'document', content: 'https://example.com/comparison.pdf', sort_order: 6 },
  ]

  for (const asset of assets) {
    const { data: existing } = await admin
      .from('affiliate_assets')
      .select('id')
      .eq('title', asset.title)
      .maybeSingle()

    if (!existing) {
      await admin.from('affiliate_assets').insert(asset)
      console.log(`  Created asset: ${asset.title}`)
    } else {
      console.log(`  Asset ${asset.title} already exists`)
    }
  }

  console.log('\n10. Creating broadcasts...')
  const adminUserId = affiliateUserIds[0]?.userId
  const broadcasts = [
    { subject: 'Commission Rate Increase for Q1!', body: '<h2>Great news!</h2><p>We\'re increasing base commission rates by 5% for all tiers this quarter. Check your dashboard for updated rates.</p>', status: 'sent', sent_count: 7, opened_count: 5, clicked_count: 3, sent_at: daysAgoDate(15), created_at: daysAgoDate(16) },
    { subject: 'New Marketing Assets Available', body: '<h2>Fresh creatives just dropped!</h2><p>We\'ve added new banners, email templates, and social media posts to your Marketing tab. Log in to grab them!</p>', status: 'sent', sent_count: 8, opened_count: 6, clicked_count: 4, sent_at: daysAgoDate(5), created_at: daysAgoDate(6) },
    { subject: 'Summer Contest: Win $500 Bonus!', body: '<h2>Summer Referral Challenge!</h2><p>The affiliate with the most referrals between now and August 31st wins a $500 bonus. Second place gets $250. Check the Contests tab in your dashboard!</p>', status: 'draft', sent_count: 0, opened_count: 0, clicked_count: 0, created_at: daysAgoDate(1) },
  ]

  for (const bc of broadcasts) {
    const { data: existing } = await admin
      .from('affiliate_broadcasts')
      .select('id')
      .eq('subject', bc.subject)
      .maybeSingle()

    if (!existing) {
      await admin.from('affiliate_broadcasts').insert({
        ...bc,
        audience_filter: { type: 'all' },
        sent_by: adminUserId,
      })
      console.log(`  Created broadcast: ${bc.subject} (${bc.status})`)
    } else {
      console.log(`  Broadcast "${bc.subject}" already exists`)
    }
  }

  console.log('\n11. Creating contests...')
  const contests = [
    {
      name: 'Summer Referral Sprint',
      description: 'Most referrals wins! Running through the end of summer.',
      metric: 'referrals',
      start_date: daysAgoDate(30),
      end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      prize_description: '$500 cash bonus + Platinum tier upgrade',
      prize_amount_cents: 50000,
      status: 'active',
    },
    {
      name: 'Q4 Revenue Challenge',
      description: 'Generate the most referred revenue this quarter.',
      metric: 'revenue',
      start_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
      prize_description: '$1,000 cash bonus',
      prize_amount_cents: 100000,
      status: 'upcoming',
    },
    {
      name: 'Spring Launch Contest',
      description: 'Celebrate our spring launch with a referral competition!',
      metric: 'referrals',
      start_date: daysAgoDate(120),
      end_date: daysAgoDate(30),
      prize_description: '$300 cash bonus',
      prize_amount_cents: 30000,
      status: 'completed',
      winner_user_id: affiliateUserIds[0]?.userId || null,
      winner_announced_at: daysAgoDate(28),
    },
  ]

  for (const contest of contests) {
    const { data: existing } = await admin
      .from('affiliate_contests')
      .select('id')
      .eq('name', contest.name)
      .maybeSingle()

    if (!existing) {
      await admin.from('affiliate_contests').insert(contest)
      console.log(`  Created contest: ${contest.name} (${contest.status})`)
    } else {
      console.log(`  Contest ${contest.name} already exists`)
    }
  }

  console.log('\n12. Creating payout batches...')
  const batches = [
    { batch_date: daysAgoDate(15).split('T')[0], total_affiliates: 4, total_amount_cents: 45000, status: 'completed', notes: 'Monthly payout run - February' },
    { batch_date: daysAgoDate(45).split('T')[0], total_affiliates: 3, total_amount_cents: 32000, status: 'completed', notes: 'Monthly payout run - January' },
    { batch_date: new Date().toISOString().split('T')[0], total_affiliates: 5, total_amount_cents: 58000, status: 'pending', notes: 'Monthly payout run - March (pending approval)' },
  ]

  for (const batch of batches) {
    const { data: existing } = await admin
      .from('affiliate_payout_batches')
      .select('id')
      .eq('batch_date', batch.batch_date)
      .maybeSingle()

    if (!existing) {
      await admin.from('affiliate_payout_batches').insert(batch)
      console.log(`  Created payout batch: ${batch.batch_date} (${batch.status})`)
    } else {
      console.log(`  Payout batch ${batch.batch_date} already exists`)
    }
  }

  console.log('\n13. Activating affiliate network settings...')
  await admin.from('affiliate_network_settings')
    .update({ is_active: true, tracking_id: 'SAS-12345', postback_url: 'https://api.shareasale.com/postback/v2' })
    .eq('network_slug', 'shareasale')
  await admin.from('affiliate_network_settings')
    .update({ is_active: true, tracking_id: 'IMP-67890', postback_url: 'https://api.impact.com/postback' })
    .eq('network_slug', 'impact')
  console.log('  Activated ShareASale and Impact networks')

  console.log('\n14. Creating recent (this-month) referrals for Health growth KPIs...')
  const recentAffiliates = affiliateUserIds.slice(0, 3)
  for (const aff of recentAffiliates) {
    const recentEmail = `recent.ref.${aff.userId.slice(0, 6)}@test.com`
    try {
      const recentUserId = await getOrCreateUser(recentEmail, 'Recent Referral')
      const { data: existRef } = await admin
        .from('affiliate_referrals')
        .select('id')
        .eq('affiliate_user_id', aff.userId)
        .eq('referred_user_id', recentUserId)
        .maybeSingle()

      if (!existRef) {
        const now = new Date()
        const recentDate = new Date(now.getTime() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000)
        const { data: refData } = await admin.from('affiliate_referrals').insert({
          affiliate_user_id: aff.userId,
          referred_user_id: recentUserId,
          ref_code: randomRefCode(),
          status: 'converted',
          fraud_flags: [],
          converted_at: recentDate.toISOString(),
          created_at: recentDate.toISOString(),
          source_tag: 'twitter',
        }).select('id').single()

        if (refData) {
          const invoiceId = `inv_recent_${aff.userId.slice(0, 8)}_${refData.id.slice(0, 8)}`
          await admin.from('affiliate_commissions').insert({
            affiliate_user_id: aff.userId,
            referral_id: refData.id,
            stripe_invoice_id: invoiceId,
            invoice_amount_cents: 4900,
            commission_rate: 25,
            commission_amount_cents: 1225,
            status: 'pending',
            created_at: recentDate.toISOString(),
          })
          console.log(`  Added recent referral + commission for ${aff.name}`)
        }
      } else {
        console.log(`  Recent referral for ${aff.name} already exists`)
      }
    } catch (err) {
      console.error(`  Skipping recent referral for ${aff.name}:`, (err as Error).message)
    }
  }

  console.log('\n15. Creating milestone awards for top affiliates...')
  if (allMilestones && allMilestones.length > 0) {
    for (const aff of affiliateUserIds.filter(a => a.signups >= 5)) {
      const eligibleMilestones = (allMilestones || []).filter(m => aff.signups >= m.referral_threshold)
      for (const ms of eligibleMilestones) {
        const { data: existing } = await admin
          .from('affiliate_milestone_awards')
          .select('id')
          .eq('affiliate_user_id', aff.userId)
          .eq('milestone_id', ms.id)
          .maybeSingle()

        if (!existing) {
          await admin.from('affiliate_milestone_awards').insert({
            affiliate_user_id: aff.userId,
            milestone_id: ms.id,
            bonus_amount_cents: ms.bonus_amount_cents,
          })
        }
      }
    }
    console.log('  Awarded milestones to eligible affiliates')
  }

  console.log('\n16. Creating 12-month historical click data with geo/device...')
  const countries = ['US', 'US', 'US', 'US', 'UK', 'UK', 'CA', 'CA', 'AU', 'DE', 'FR', 'IN', 'BR', 'JP'];
  const deviceTypes = ['mobile', 'mobile', 'mobile', 'desktop', 'desktop', 'tablet'];
  const sources = ['twitter', 'youtube', 'blog', 'email', 'linkedin', 'instagram', 'direct'];

  for (const aff of affiliateUserIds.slice(0, 5)) {
    const { data: affLink } = await admin.from('referral_links').select('ref_code').eq('user_id', aff.userId).maybeSingle();
    if (!affLink) continue;

    for (let monthsAgo = 0; monthsAgo < 12; monthsAgo++) {
      const clickCount = Math.max(2, Math.floor(aff.clicks / 12) + Math.floor(Math.random() * 10) - 5);
      for (let c = 0; c < Math.min(clickCount, 8); c++) {
        const d = new Date();
        d.setMonth(d.getMonth() - monthsAgo);
        d.setDate(Math.floor(Math.random() * 28) + 1);
        d.setHours(Math.floor(Math.random() * 24));
        d.setMinutes(Math.floor(Math.random() * 60));

        await admin.from('referral_clicks').insert({
          ref_code: affLink.ref_code,
          referral_link_user_id: aff.userId,
          ip_hash: `hash_${Math.random().toString(36).slice(2, 10)}`,
          user_agent: `Mozilla/5.0 (${deviceTypes[Math.floor(Math.random() * deviceTypes.length)] === 'mobile' ? 'iPhone; CPU iPhone OS 17_0' : 'Windows NT 10.0; Win64; x64'})`,
          page_url: ['/', '/pricing', '/features', '/blog/getting-started', '/blog/tips'][Math.floor(Math.random() * 5)],
          source_tag: sources[Math.floor(Math.random() * sources.length)],
          landing_page: ['/', '/pricing', '/features'][Math.floor(Math.random() * 3)],
          country: countries[Math.floor(Math.random() * countries.length)],
          device_type: deviceTypes[Math.floor(Math.random() * deviceTypes.length)],
          created_at: d.toISOString(),
        });
      }
    }
    console.log(`  Added 12-month click history for ${aff.name}`);
  }

  console.log('\n17. Creating churned referrals for churn intelligence...')
  for (const aff of affiliateUserIds.slice(0, 4)) {
    const churnCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < churnCount; i++) {
      const churnEmail = `churned.${aff.userId.slice(0, 6)}.${i}@test.com`;
      try {
        const churnedUserId = await getOrCreateUser(churnEmail, `Churned User ${i + 1}`);
        const { data: existRef } = await admin.from('affiliate_referrals').select('id').eq('affiliate_user_id', aff.userId).eq('referred_user_id', churnedUserId).maybeSingle();
        if (!existRef) {
          const joinedMonthsAgo = Math.floor(Math.random() * 8) + 2;
          const churnedMonthsAgo = Math.floor(Math.random() * (joinedMonthsAgo - 1)) + 1;
          const joinDate = new Date(); joinDate.setMonth(joinDate.getMonth() - joinedMonthsAgo);
          const churnDate = new Date(); churnDate.setMonth(churnDate.getMonth() - churnedMonthsAgo);
          const lastActive = new Date(churnDate); lastActive.setDate(lastActive.getDate() - Math.floor(Math.random() * 14));

          await admin.from('affiliate_referrals').insert({
            affiliate_user_id: aff.userId,
            referred_user_id: churnedUserId,
            ref_code: randomRefCode(),
            status: 'churned',
            fraud_flags: [],
            converted_at: joinDate.toISOString(),
            created_at: joinDate.toISOString(),
            churned_at: churnDate.toISOString(),
            churn_reason: ['too_expensive', 'not_using_enough', 'switched_competitor', 'no_longer_needed', 'missing_features'][Math.floor(Math.random() * 5)],
            last_active_at: lastActive.toISOString(),
            source_tag: sources[Math.floor(Math.random() * sources.length)],
          });
          console.log(`  Added churned referral for ${aff.name}`);
        }
      } catch (err) {
        console.error(`  Skipping churned referral:`, (err as Error).message);
      }
    }
  }

  console.log('\n18. Creating trial referrals (not yet converted)...')
  for (const aff of affiliateUserIds.slice(0, 3)) {
    const trialCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < trialCount; i++) {
      const trialEmail = `trial.${aff.userId.slice(0, 6)}.${i}@test.com`;
      try {
        const trialUserId = await getOrCreateUser(trialEmail, `Trial User ${i + 1}`);
        const { data: existRef } = await admin.from('affiliate_referrals').select('id').eq('affiliate_user_id', aff.userId).eq('referred_user_id', trialUserId).maybeSingle();
        if (!existRef) {
          const daysInTrial = Math.floor(Math.random() * 12) + 2;
          const trialStart = new Date(); trialStart.setDate(trialStart.getDate() - daysInTrial);
          const lastActive = new Date(); lastActive.setDate(lastActive.getDate() - Math.floor(Math.random() * daysInTrial));

          await admin.from('affiliate_referrals').insert({
            affiliate_user_id: aff.userId,
            referred_user_id: trialUserId,
            ref_code: randomRefCode(),
            status: 'signed_up',
            fraud_flags: [],
            created_at: trialStart.toISOString(),
            last_active_at: lastActive.toISOString(),
            source_tag: sources[Math.floor(Math.random() * sources.length)],
          });
          console.log(`  Added trial referral for ${aff.name}`);
        }
      } catch (err) {
        console.error(`  Skipping trial referral:`, (err as Error).message);
      }
    }
  }

  console.log('\n19. Spreading commissions across 12 months...')
  for (const aff of affiliateUserIds.slice(0, 5)) {
    const { data: affRefs } = await admin.from('affiliate_referrals').select('id').eq('affiliate_user_id', aff.userId).eq('status', 'converted');
    const refIds = (affRefs || []).map(r => r.id);
    if (refIds.length === 0) continue;

    for (let monthsAgo = 1; monthsAgo < 12; monthsAgo++) {
      const numCommissions = Math.ceil(Math.random() * 3);
      for (let c = 0; c < numCommissions; c++) {
        const d = new Date(); d.setMonth(d.getMonth() - monthsAgo); d.setDate(Math.floor(Math.random() * 28) + 1);
        const invoiceAmount = [2900, 4900, 9900][Math.floor(Math.random() * 3)];
        const tierData = TIERS.find(t => t.name.toLowerCase() === aff.tier);
        const rate = tierData?.commission_rate || 20;
        const invoiceId = `inv_hist_${aff.userId.slice(0, 6)}_m${monthsAgo}_${c}`;

        const { data: existing } = await admin.from('affiliate_commissions').select('id').eq('stripe_invoice_id', invoiceId).maybeSingle();
        if (!existing) {
          await admin.from('affiliate_commissions').insert({
            affiliate_user_id: aff.userId,
            referral_id: refIds[Math.floor(Math.random() * refIds.length)],
            stripe_invoice_id: invoiceId,
            invoice_amount_cents: invoiceAmount,
            commission_rate: rate,
            commission_amount_cents: Math.round(invoiceAmount * rate / 100),
            status: monthsAgo > 1 ? 'paid' : (Math.random() > 0.5 ? 'approved' : 'pending'),
            created_at: d.toISOString(),
          });
        }
      }
    }
    console.log(`  Added 12-month commission history for ${aff.name}`);
  }

  console.log('\n20. Creating connected platform metrics...')
  const platforms = ['youtube', 'instagram', 'linkedin', 'google_analytics'];
  for (const aff of affiliateUserIds.slice(0, 3)) {
    for (const platform of platforms) {
      const { data: existConn } = await admin.from('connected_platforms').select('id').eq('user_id', aff.userId).eq('platform', platform).maybeSingle();
      if (!existConn) {
        await admin.from('connected_platforms').insert({
          user_id: aff.userId,
          platform,
          account_name: `${aff.name.split(' ')[0]}_${platform}`,
          last_synced_at: new Date().toISOString(),
        });
      }

      for (let daysAgo = 0; daysAgo < 90; daysAgo++) {
        const d = new Date(); d.setDate(d.getDate() - daysAgo);
        const dateStr = d.toISOString().split('T')[0];

        const metrics: Record<string, Record<string, number>> = {
          youtube: { views: Math.floor(Math.random() * 5000) + 500, watch_time_minutes: Math.floor(Math.random() * 2000) + 200, subscribers_gained: Math.floor(Math.random() * 20) },
          instagram: { impressions: Math.floor(Math.random() * 8000) + 1000, reach: Math.floor(Math.random() * 5000) + 800, engagement: Math.floor(Math.random() * 300) + 50 },
          linkedin: { impressions: Math.floor(Math.random() * 3000) + 200, clicks: Math.floor(Math.random() * 100) + 10, engagement: Math.floor(Math.random() * 50) + 5 },
          google_analytics: { pageviews: Math.floor(Math.random() * 10000) + 500, sessions: Math.floor(Math.random() * 3000) + 200, bounce_rate: Math.floor(Math.random() * 40) + 30 },
        };

        const platformMetrics = metrics[platform] || {};
        for (const [metricName, metricValue] of Object.entries(platformMetrics)) {
          await admin.from('connected_platform_metrics').insert({
            user_id: aff.userId,
            platform,
            metric_name: metricName,
            metric_value: metricValue,
            date: dateStr,
          });
        }
      }
    }
    console.log(`  Added 90 days of platform metrics for ${aff.name}`);
  }

  console.log('\n21. Creating goals, disputes, announcements, spotlight...')
  for (const aff of affiliateUserIds.slice(0, 3)) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const { data: existGoal } = await admin.from('affiliate_goals').select('id').eq('user_id', aff.userId).eq('is_active', true).maybeSingle();
    if (!existGoal) {
      await admin.from('affiliate_goals').insert({
        user_id: aff.userId,
        target_cents: [50000, 100000, 200000][Math.floor(Math.random() * 3)],
        period: 'monthly',
        period_start: monthStart.toISOString(),
        period_end: monthEnd.toISOString(),
        is_active: true,
      });
    }
  }

  const disputes = [
    { affiliate_user_id: affiliateUserIds[0]?.userId, reason: 'Missing commission', details: 'Customer John signed up through my link on Feb 10 but I never received the commission.', status: 'open' },
    { affiliate_user_id: affiliateUserIds[1]?.userId, reason: 'Incorrect amount', details: 'Commission was calculated at 20% but my locked rate is 25%.', status: 'under_review' },
    { affiliate_user_id: affiliateUserIds[0]?.userId, reason: 'Attribution error', details: 'Referral was attributed to another affiliate but the customer used my discount code.', status: 'approved', admin_response: 'Verified — commission adjusted. The cookie attribution was overridden by your discount code per policy.', resolved_at: daysAgoDate(5) },
  ];
  for (const dispute of disputes) {
    if (!dispute.affiliate_user_id) continue;
    const { data: existing } = await admin.from('commission_disputes').select('id').eq('affiliate_user_id', dispute.affiliate_user_id).eq('reason', dispute.reason).maybeSingle();
    if (!existing) {
      await admin.from('commission_disputes').insert(dispute);
    }
  }
  console.log('  Created goals, disputes');

  const announcements = [
    { title: 'New Feature: AI Post Writer', message: 'Generate promotional content with AI — check your Tools tab!', type: 'info', target_dashboards: ['affiliate'] },
    { title: 'Commission Rate Boost', message: 'All tiers get +5% commission through March 31!', type: 'promo', target_dashboards: ['affiliate'] },
    { title: 'Scheduled Maintenance', message: 'Brief downtime March 5, 2am-4am EST for database upgrades.', type: 'warning', target_dashboards: ['all'] },
    { title: 'New Reporting Features', message: 'Check out the new Analytics tab with churn intelligence and cohort analysis.', type: 'success', target_dashboards: ['affiliate'] },
  ];
  for (const ann of announcements) {
    const { data: existing } = await admin.from('announcements').select('id').eq('title', ann.title).maybeSingle();
    if (!existing) {
      await admin.from('announcements').insert(ann);
    }
  }
  console.log('  Created announcements');

  if (affiliateUserIds[0]) {
    const { data: existSpotlight } = await admin.from('affiliate_spotlight').select('id').limit(1).maybeSingle();
    if (!existSpotlight) {
      await admin.from('affiliate_spotlight').insert({
        affiliate_user_id: affiliateUserIds[0].userId,
        month: new Date().toISOString().substring(0, 7),
        affiliate_name: affiliateUserIds[0].name,
        story: 'Alice grew her affiliate earnings from $0 to $500/month in just 3 months by focusing on tutorial content on YouTube and LinkedIn.',
        stats_summary: '45 referrals, $13,500 total earnings, 8.5% conversion rate',
        is_active: true,
      });
      console.log('  Created affiliate spotlight');
    }
  }

  console.log('\n22. Creating email preferences and short links...')
  for (const aff of affiliateUserIds) {
    const { data: existPref } = await admin.from('email_preferences').select('id').eq('user_id', aff.userId).maybeSingle();
    if (!existPref) {
      await admin.from('email_preferences').insert({
        user_id: aff.userId,
        weekly_digest: Math.random() > 0.3,
        monthly_report: Math.random() > 0.2,
        affiliate_updates: true,
        marketing_emails: Math.random() > 0.5,
      });
    }
  }

  for (const aff of affiliateUserIds.slice(0, 4)) {
    const { data: affLink } = await admin.from('referral_links').select('ref_code').eq('user_id', aff.userId).maybeSingle();
    if (!affLink) continue;
    const slugBase = aff.name.split(' ')[0].toLowerCase();
    const shortLinks = [
      { slug: slugBase, destination_url: '/', label: 'Homepage', clicks: Math.floor(Math.random() * 200) + 50 },
      { slug: `${slugBase}-pricing`, destination_url: '/pricing', label: 'Pricing page', clicks: Math.floor(Math.random() * 100) + 20 },
    ];
    for (const sl of shortLinks) {
      const { data: existing } = await admin.from('affiliate_short_links').select('id').eq('slug', sl.slug).maybeSingle();
      if (!existing) {
        await admin.from('affiliate_short_links').insert({ affiliate_user_id: aff.userId, ...sl });
      }
    }
  }
  console.log('  Created email preferences and short links');

  console.log('\n23. Creating asset usage records...')
  const { data: allAssets } = await admin.from('affiliate_assets').select('id').limit(10);
  if (allAssets && allAssets.length > 0) {
    for (const aff of affiliateUserIds.slice(0, 5)) {
      for (const asset of allAssets.slice(0, 3)) {
        const actions: Array<'copy' | 'download' | 'view'> = ['copy', 'download', 'view'];
        const action = actions[Math.floor(Math.random() * actions.length)];
        await admin.from('affiliate_asset_usage').insert({
          asset_id: asset.id,
          affiliate_user_id: aff.userId,
          action,
          created_at: daysAgoDate(Math.floor(Math.random() * 30)),
        });
      }
    }
    console.log('  Created asset usage records');
  }

  console.log('\n✅ Seed complete! Summary:')
  console.log(`  - ${TEST_AFFILIATES.length} affiliate members (1 dormant)`)
  console.log(`  - ${TIERS.length} tiers (Starter → Platinum)`)
  console.log(`  - ${MILESTONES.length} milestones`)
  console.log(`  - ${referralRecordIds.length}+ referral records with commissions`)
  console.log(`  - ${applications.length} applications (2 pending, 1 approved, 1 rejected)`)
  console.log(`  - ${assets.length} marketing assets`)
  console.log(`  - ${broadcasts.length} broadcasts (2 sent, 1 draft)`)
  console.log(`  - ${contests.length} contests (1 active, 1 upcoming, 1 completed)`)
  console.log(`  - ${batches.length} payout batches`)
  console.log(`  - 12 months of historical clicks with geo/device data`)
  console.log(`  - Churned + trial referrals for churn intelligence`)
  console.log(`  - 12 months of commission history per affiliate`)
  console.log(`  - 90 days of connected platform metrics (YouTube, Instagram, LinkedIn, GA)`)
  console.log(`  - Goals, disputes, announcements, spotlight, short links, email prefs, asset usage`)
  console.log('\nRefresh the admin affiliate dashboard to see all data!')
}

seed().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
