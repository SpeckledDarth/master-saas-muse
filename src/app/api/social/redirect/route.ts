import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

function getSigningKey(): string {
  const key = process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('No signing key available')
  return key
}

export function signRedirectUrl(url: string): string {
  const sig = crypto.createHmac('sha256', getSigningKey()).update(url).digest('base64url')
  return sig
}

export function verifyRedirectUrl(url: string, sig: string): boolean {
  const expected = crypto.createHmac('sha256', getSigningKey()).update(url).digest('base64url')
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  } catch {
    return false
  }
}

const ALLOWED_HOSTS = ['twitter.com', 'www.facebook.com', 'www.linkedin.com', 'x.com', 'api.twitter.com']

export async function GET(request: NextRequest) {
  const authUrl = request.nextUrl.searchParams.get('url')
  const sig = request.nextUrl.searchParams.get('sig')
  
  if (!authUrl || !sig) {
    return new NextResponse('Missing parameters', { status: 400 })
  }

  if (!verifyRedirectUrl(authUrl, sig)) {
    return new NextResponse('Invalid signature', { status: 403 })
  }

  try {
    const parsed = new URL(authUrl)
    if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
      return new NextResponse('Invalid redirect target', { status: 400 })
    }
  } catch {
    return new NextResponse('Invalid URL', { status: 400 })
  }

  return NextResponse.redirect(authUrl)
}
