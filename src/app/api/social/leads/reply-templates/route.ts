import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

async function getAuthenticatedUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

const TEMPLATES = [
  {
    signal: 'Price Inquiry',
    replies: [
      { text: "Great question! Pricing depends on the scope, but I'd love to give you a free estimate. Can you share a few details or photos?", tone: 'friendly' },
      { text: "Happy to help with pricing! Every project is unique, so let's set up a quick call to discuss your needs and budget.", tone: 'professional' },
      { text: "Thanks for reaching out! I offer competitive rates and free consultations. DM me the details and I'll get you a quote today.", tone: 'direct' },
    ],
  },
  {
    signal: 'Service Area Check',
    replies: [
      { text: "Yes, I service that area! I'd be happy to come out for a free consultation. What's the best time for you?", tone: 'friendly' },
      { text: "That's within my service area. I can typically schedule a visit within the week. Want me to pencil you in?", tone: 'professional' },
    ],
  },
  {
    signal: 'Bulk/Contract',
    replies: [
      { text: "I'd love to discuss a contract arrangement! I offer volume discounts for ongoing work. Can we set up a call this week?", tone: 'professional' },
      { text: "Multi-project work is my specialty. Let me put together a custom package that fits your needs and saves you money.", tone: 'friendly' },
      { text: "Absolutely, I handle contract work regularly. Send me the details and I'll have a proposal ready within 48 hours.", tone: 'direct' },
    ],
  },
  {
    signal: 'Referral Request',
    replies: [
      { text: "Thanks for thinking of me! I'd be glad to help. Feel free to share my info, and I'll make sure they're taken care of.", tone: 'friendly' },
      { text: "Appreciate the referral! Have them reach out directly and I'll prioritize their request. I offer a referral discount too!", tone: 'professional' },
    ],
  },
  {
    signal: 'Urgency/Emergency',
    replies: [
      { text: "I understand the urgency! I have availability this week and can prioritize your project. Let's connect ASAP.", tone: 'urgent' },
      { text: "I can help right away. Send me the details and I'll see what I can do to fit you into my schedule today.", tone: 'direct' },
      { text: "Emergency situations are something I handle regularly. DM me your address and I'll get back to you within the hour.", tone: 'professional' },
    ],
  },
]

export async function GET(_request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({ templates: TEMPLATES })
}
