import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
    }

    const hasResendApiKey = !!process.env.RESEND_API_KEY
    const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'not set'
    
    return NextResponse.json({
      status: 'ok',
      user_email: user.email,
      resend_api_key_set: hasResendApiKey,
      resend_from_email: resendFromEmail,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
