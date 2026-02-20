import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

function generateRefCode(userId: string): string {
  const hash = crypto.createHash('sha256').update(userId + Date.now().toString()).digest('hex')
  return hash.substring(0, 8).toUpperCase()
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    let { data: link } = await adminClient
      .from('referral_links')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!link) {
      const refCode = generateRefCode(user.id)
      const { data: newLink, error } = await adminClient
        .from('referral_links')
        .insert({ user_id: user.id, ref_code: refCode })
        .select()
        .single()

      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          return NextResponse.json({ link: null, note: 'Referral table not created yet' })
        }
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      link = newLink
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://passivepost.io'
    const shareUrl = `${baseUrl}?ref=${link.ref_code}`

    return NextResponse.json({
      link: {
        ...link,
        shareUrl,
      },
    })
  } catch (error) {
    console.error('Referral link error:', error)
    return NextResponse.json({ error: 'Failed to get referral link' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ref_code, page_url } = body

    if (!ref_code) {
      return NextResponse.json({ error: 'Missing ref_code' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    const ipHash = crypto.createHash('sha256')
      .update(request.headers.get('x-forwarded-for') || 'unknown')
      .digest('hex')
      .substring(0, 16)

    await adminClient
      .from('referral_clicks')
      .insert({
        ref_code,
        ip_hash: ipHash,
        user_agent: request.headers.get('user-agent')?.substring(0, 200) || null,
        page_url: page_url || null,
      })

    const rpcResult = await adminClient.rpc('increment_referral_clicks', { code: ref_code })
    if (rpcResult.error) {
      await adminClient
        .from('referral_links')
        .update({ updated_at: new Date().toISOString() })
        .eq('ref_code', ref_code)
    }

    return NextResponse.json({ tracked: true })
  } catch (error) {
    console.error('Referral click tracking error:', error)
    return NextResponse.json({ tracked: false })
  }
}
