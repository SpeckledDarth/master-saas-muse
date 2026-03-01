import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sanitizeCodeInput, isReservedCode, generateAlternativeSuggestions } from '@/lib/affiliate/discount-codes'

const RENAME_COOLDOWN_DAYS = 30

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const admin = createAdminClient()

    const { data: codes } = await admin
      .from('affiliate_discount_codes')
      .select('*')
      .eq('affiliate_user_id', user.id)
      .order('created_at', { ascending: false })

    const { data: requests } = await admin
      .from('affiliate_code_requests')
      .select('*')
      .eq('affiliate_user_id', user.id)
      .order('created_at', { ascending: false })

    const { data: profile } = await admin
      .from('user_profiles')
      .select('display_name')
      .eq('user_id', user.id)
      .maybeSingle()

    return NextResponse.json({
      codes: codes || [],
      requests: requests || [],
      displayName: profile?.display_name || user.user_metadata?.full_name || '',
    })
  } catch (err: any) {
    if (err?.code === '42P01') {
      return NextResponse.json({ codes: [], requests: [] })
    }
    console.error('Discount codes GET error:', err)
    return NextResponse.json({ error: 'Failed to load codes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const body = await request.json()
    const admin = createAdminClient()

    if (body.action === 'request_code') {
      const requestedCode = sanitizeCodeInput(body.code || '')
      if (!requestedCode || requestedCode.length < 4 || requestedCode.length > 20) {
        return NextResponse.json({ error: 'Code must be 4-20 alphanumeric characters' }, { status: 400 })
      }

      if (isReservedCode(requestedCode)) {
        return NextResponse.json({ error: 'This code contains a reserved word. Please choose another.' }, { status: 400 })
      }

      const { data: existing } = await admin
        .from('affiliate_discount_codes')
        .select('id')
        .eq('code', requestedCode)
        .maybeSingle()

      if (existing) {
        return NextResponse.json({ error: 'This code is already taken. Try another.' }, { status: 409 })
      }

      const { error } = await admin
        .from('affiliate_code_requests')
        .insert({
          affiliate_user_id: user.id,
          requested_code: requestedCode,
          requested_discount_percent: body.discount_percent || null,
          reason: body.reason || null,
          status: 'pending',
        })

      if (error) {
        console.error('Code request insert error:', error)
        return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: 'Code request submitted for admin review' })
    }

    if (body.action === 'rename') {
      const { code_id, new_code } = body
      if (!code_id || !new_code) {
        return NextResponse.json({ error: 'code_id and new_code are required' }, { status: 400 })
      }

      const sanitized = sanitizeCodeInput(new_code)
      if (sanitized.length < 4 || sanitized.length > 20) {
        return NextResponse.json({ error: 'Code must be 4-20 alphanumeric characters' }, { status: 400 })
      }

      if (isReservedCode(sanitized)) {
        return NextResponse.json({ error: 'This code contains a reserved word. Please choose another.' }, { status: 400 })
      }

      const { data: currentCode } = await admin
        .from('affiliate_discount_codes')
        .select('*')
        .eq('id', code_id)
        .eq('affiliate_user_id', user.id)
        .maybeSingle()

      if (!currentCode) {
        return NextResponse.json({ error: 'Code not found' }, { status: 404 })
      }

      if (currentCode.last_renamed_at) {
        const lastRenamed = new Date(currentCode.last_renamed_at)
        const cooldownEnd = new Date(lastRenamed.getTime() + RENAME_COOLDOWN_DAYS * 24 * 60 * 60 * 1000)
        if (cooldownEnd > new Date()) {
          const daysRemaining = Math.ceil((cooldownEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          return NextResponse.json({
            error: `You can rename your code again in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. Rename cooldown is ${RENAME_COOLDOWN_DAYS} days to avoid confusion with existing content.`,
            cooldown_days_remaining: daysRemaining,
          }, { status: 429 })
        }
      }

      const { data: taken } = await admin
        .from('affiliate_discount_codes')
        .select('id')
        .eq('code', sanitized)
        .neq('id', code_id)
        .maybeSingle()

      if (taken) {
        const affiliateName = user.user_metadata?.full_name || ''
        const suggestions = generateAlternativeSuggestions(affiliateName, currentCode.discount_percent)
        return NextResponse.json({
          error: "That code is already claimed by another partner. Try something unique to your personal brand — your podcast name, your channel name, or a nickname your audience knows you by.",
          suggestions,
          taken: true,
        }, { status: 409 })
      }

      const { error: updateErr } = await admin
        .from('affiliate_discount_codes')
        .update({
          code: sanitized,
          last_renamed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', code_id)

      if (updateErr) {
        console.error('Code rename error:', updateErr)
        return NextResponse.json({ error: 'Failed to rename code' }, { status: 500 })
      }

      return NextResponse.json({ success: true, code: sanitized })
    }

    if (body.action === 'check_availability') {
      const sanitized = sanitizeCodeInput(body.code || '')
      if (sanitized.length < 4) {
        return NextResponse.json({ available: false, error: 'Too short (min 4 characters)' })
      }
      if (isReservedCode(sanitized)) {
        return NextResponse.json({ available: false, error: 'Contains a reserved word' })
      }

      const { data: taken } = await admin
        .from('affiliate_discount_codes')
        .select('id')
        .eq('code', sanitized)
        .maybeSingle()

      return NextResponse.json({ available: !taken, code: sanitized })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err: any) {
    console.error('Discount codes POST error:', err)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
