import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/'
  
  // Sanitize next param - only allow internal paths (starts with / but not //)
  const sanitizedNext = next.startsWith('/') && !next.startsWith('//') ? next : '/'
  
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
    }
  }

  return NextResponse.redirect(new URL(sanitizedNext, request.url))
}
