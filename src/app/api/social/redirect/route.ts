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

  const safeUrl = authUrl.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  const html = `<!DOCTYPE html>
<html><head><title>Connecting...</title>
<style>
body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#111;color:#fff}
.card{text-align:center;padding:2rem}
.spinner{width:40px;height:40px;border:3px solid #333;border-top-color:#fff;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 1rem}
@keyframes spin{to{transform:rotate(360deg)}}
p{color:#aaa;font-size:0.9rem}
</style></head>
<body><div class="card">
<div class="spinner"></div>
<p>Redirecting to login...</p>
</div>
<script>
setTimeout(function() {
  window.location.href = "${safeUrl}";
}, 500);
</script></body></html>`

  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } })
}
