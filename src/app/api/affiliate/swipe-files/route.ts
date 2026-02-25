import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const SWIPE_FILE_CATEGORIES = ['introduction', 'follow-up', 'limited-time', 'seasonal', 're-engagement'] as const;

type SwipeFileCategory = typeof SWIPE_FILE_CATEGORIES[number];

interface SwipeFile {
  id: string;
  title: string;
  category: SwipeFileCategory;
  subject: string;
  body: string;
  description: string;
  sort_order: number;
  is_published: boolean;
  copy_count: number;
  created_at: string;
}

const DEFAULT_SWIPE_FILES: Omit<SwipeFile, 'copy_count' | 'created_at'>[] = [
  {
    id: 'intro-warm',
    title: 'Warm Introduction',
    category: 'introduction',
    subject: 'A tool I think you\'d love for content scheduling',
    body: `Hi {affiliate_name} here — I wanted to share something that's been a game-changer for my content workflow.\n\nI've been using PassivePost to schedule and manage all my social content from one dashboard. It's saved me hours every week.\n\nI have a partner discount code ({discount_code}) that gets you a deal if you want to try it:\n{referral_link}\n\nHappy to answer any questions!\n\nBest,\n{affiliate_name}`,
    description: 'Perfect for reaching out to people who already know you — friends, colleagues, or warm leads.',
    sort_order: 1,
    is_published: true,
  },
  {
    id: 'intro-cold',
    title: 'Cold Outreach',
    category: 'introduction',
    subject: 'Quick content scheduling tool recommendation',
    body: `Hi there,\n\nI came across your content and noticed you're active on multiple platforms. Managing that manually can be a real time sink.\n\nI use PassivePost to schedule everything from one place — it handles cross-platform posting, AI captions, and analytics.\n\nIf you'd like to try it, use my code {discount_code} for a discount:\n{referral_link}\n\nCheers,\n{affiliate_name}`,
    description: 'For reaching out to creators or businesses you don\'t have an existing relationship with.',
    sort_order: 2,
    is_published: true,
  },
  {
    id: 'follow-up-interest',
    title: 'Follow-Up After Interest',
    category: 'follow-up',
    subject: 'Re: PassivePost — here\'s what makes it worth it',
    body: `Hi again,\n\nThanks for your interest in PassivePost! Here are the top reasons I recommend it:\n\n1. Cross-platform scheduling — write once, publish everywhere\n2. AI-powered content suggestions — better captions, faster\n3. Unified analytics — see what works across all channels\n4. Content calendar — plan your whole week in one sitting\n\nMy partner code {discount_code} still works:\n{referral_link}\n\nLet me know if you have any questions!\n\n{affiliate_name}`,
    description: 'Send this after someone expresses interest but hasn\'t signed up yet.',
    sort_order: 3,
    is_published: true,
  },
  {
    id: 'follow-up-reminder',
    title: 'Gentle Reminder',
    category: 'follow-up',
    subject: 'Still thinking about PassivePost?',
    body: `Hey,\n\nJust wanted to follow up — I mentioned PassivePost a little while ago and thought you might still be interested.\n\nA lot of creators I know have been switching to it because it genuinely saves time. No more logging into 5 different platforms to post the same content.\n\nMy discount code {discount_code} is still active:\n{referral_link}\n\nNo pressure at all — just didn't want you to miss out.\n\n{affiliate_name}`,
    description: 'A soft follow-up for leads who showed interest but haven\'t converted.',
    sort_order: 4,
    is_published: true,
  },
  {
    id: 'limited-flash-sale',
    title: 'Flash Sale Announcement',
    category: 'limited-time',
    subject: 'Limited time: Extra savings on PassivePost',
    body: `Quick heads up —\n\nPassivePost is running a limited-time promotion and my partner code {discount_code} stacks with it for even bigger savings.\n\nIf you've been on the fence about trying a content scheduling tool, now's the best time:\n{referral_link}\n\nThis deal won't last long, so I wanted to make sure you knew about it.\n\n{affiliate_name}`,
    description: 'Use during special promotions or flash sales to create urgency.',
    sort_order: 5,
    is_published: true,
  },
  {
    id: 'limited-expiring',
    title: 'Expiring Offer',
    category: 'limited-time',
    subject: 'Last chance: Your PassivePost discount expires soon',
    body: `Hey,\n\nJust a quick note — my partner discount for PassivePost is expiring soon.\n\nIf you've been thinking about streamlining your content workflow, this is your last chance to get in at a lower price.\n\nUse code {discount_code} before it expires:\n{referral_link}\n\nAfter that, it'll be full price.\n\n{affiliate_name}`,
    description: 'Creates urgency when a discount or promotion is about to end.',
    sort_order: 6,
    is_published: true,
  },
  {
    id: 'seasonal-new-year',
    title: 'New Year / Fresh Start',
    category: 'seasonal',
    subject: 'Start the new year with better content habits',
    body: `Happy New Year!\n\nIf one of your goals this year is to be more consistent with content, I have a suggestion that makes it way easier.\n\nPassivePost lets you batch-schedule content across all your platforms. I use it every week and it's completely changed my workflow.\n\nStart the year right with my partner discount ({discount_code}):\n{referral_link}\n\nHere's to a productive year!\n\n{affiliate_name}`,
    description: 'Perfect for Q1 outreach when people are setting new goals.',
    sort_order: 7,
    is_published: true,
  },
  {
    id: 'seasonal-back-to-business',
    title: 'Back to Business (Fall)',
    category: 'seasonal',
    subject: 'Get your content strategy back on track',
    body: `Hey,\n\nSummer's over and it's time to get back to business. If your content schedule fell off during the break, PassivePost makes it easy to get back on track.\n\nBatch your content for the week, schedule it across platforms, and let it run on autopilot.\n\nUse my code {discount_code} to save:\n{referral_link}\n\nLet me know if you want to see how I set up my weekly workflow!\n\n{affiliate_name}`,
    description: 'Great for fall outreach when businesses ramp back up.',
    sort_order: 8,
    is_published: true,
  },
  {
    id: 'reengagement-comeback',
    title: 'Win-Back / Comeback',
    category: 're-engagement',
    subject: 'PassivePost has gotten even better since you last looked',
    body: `Hey,\n\nI know you checked out PassivePost a while back. Just wanted to let you know they've added a ton of new features since then:\n\n- Smarter AI content suggestions\n- Better analytics and reporting\n- Improved scheduling reliability\n- New platform integrations\n\nIf you want to give it another look, my partner code {discount_code} still works:\n{referral_link}\n\nWorth another look!\n\n{affiliate_name}`,
    description: 'For leads who previously showed interest or tried the product but didn\'t stick.',
    sort_order: 9,
    is_published: true,
  },
  {
    id: 'reengagement-value',
    title: 'Value-First Re-engagement',
    category: 're-engagement',
    subject: 'Content scheduling tip + a discount for you',
    body: `Hey,\n\nQuick content tip: The most consistent creators I know batch their content on one day and schedule it for the whole week. It takes about 2 hours and covers 7 days of posting.\n\nThe tool that makes this easiest? PassivePost. I use it myself and it handles all the scheduling and cross-posting automatically.\n\nIf you want to try this approach, here's my partner link with a discount:\nCode: {discount_code}\nLink: {referral_link}\n\nHope that helps!\n\n{affiliate_name}`,
    description: 'Leads with value before the ask — great for re-engaging cold leads.',
    sort_order: 10,
    is_published: true,
  },
];

function mergeTags(text: string, affiliateName: string, discountCode: string, referralLink: string): string {
  return text
    .replace(/\{affiliate_name\}/gi, affiliateName)
    .replace(/\{discount_code\}/gi, discountCode)
    .replace(/\{referral_link\}/gi, referralLink);
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    const [linkRes, profileRes, discountRes] = await Promise.all([
      admin.from('referral_links').select('code, ref_code, referral_url').eq('user_id', user.id).maybeSingle(),
      admin.from('affiliate_profiles').select('display_name').eq('user_id', user.id).maybeSingle(),
      admin.from('discount_codes').select('code').eq('affiliate_id', user.id).eq('active', true).maybeSingle(),
    ]);

    const refCode = linkRes.data?.ref_code || linkRes.data?.code || 'PARTNER';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://passivepost.io';
    const referralLink = linkRes.data?.referral_url || `${baseUrl}?ref=${refCode}`;
    const affiliateName = profileRes.data?.display_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Your Name';
    const discountCode = discountRes.data?.code || refCode;

    let swipeFiles = DEFAULT_SWIPE_FILES.filter(f => f.is_published);

    if (category && SWIPE_FILE_CATEGORIES.includes(category as SwipeFileCategory)) {
      swipeFiles = swipeFiles.filter(f => f.category === category);
    }

    let copyCountsMap: Record<string, number> = {};
    try {
      const { data: usageData } = await admin
        .from('affiliate_asset_usage')
        .select('asset_id, action')
        .eq('affiliate_id', user.id)
        .eq('action', 'copy')
        .like('asset_id', 'swipe-%');

      if (usageData) {
        for (const row of usageData) {
          const key = row.asset_id.replace('swipe-', '');
          copyCountsMap[key] = (copyCountsMap[key] || 0) + 1;
        }
      }
    } catch {}

    const merged = swipeFiles.map(file => ({
      id: file.id,
      title: file.title,
      category: file.category,
      description: file.description,
      sort_order: file.sort_order,
      subject: mergeTags(file.subject, affiliateName, discountCode, referralLink),
      body: mergeTags(file.body, affiliateName, discountCode, referralLink),
      raw_subject: file.subject,
      raw_body: file.body,
      copy_count: copyCountsMap[file.id] || 0,
    }));

    return NextResponse.json({
      swipe_files: merged,
      categories: SWIPE_FILE_CATEGORIES,
      merge_data: {
        affiliate_name: affiliateName,
        discount_code: discountCode,
        referral_link: referralLink,
      },
    });
  } catch (err: any) {
    console.error('Swipe files GET error:', err);
    return NextResponse.json({ error: err.message || 'Failed to load swipe files' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { swipe_file_id, action } = body;

    if (!swipe_file_id || !action) {
      return NextResponse.json({ error: 'swipe_file_id and action are required' }, { status: 400 });
    }

    if (!['copy', 'view'].includes(action)) {
      return NextResponse.json({ error: 'action must be copy or view' }, { status: 400 });
    }

    const admin = createAdminClient();

    try {
      const { error } = await admin
        .from('affiliate_asset_usage')
        .insert({
          asset_id: `swipe-${swipe_file_id}`,
          affiliate_id: user.id,
          action,
        });

      if (error && error.code !== '42P01') {
        console.error('Swipe file tracking error:', error);
      }
    } catch {}

    return NextResponse.json({ success: true, tracked: { swipe_file_id, action } });
  } catch (err: any) {
    console.error('Swipe files POST error:', err);
    return NextResponse.json({ error: err.message || 'Failed to track swipe file usage' }, { status: 500 });
  }
}
