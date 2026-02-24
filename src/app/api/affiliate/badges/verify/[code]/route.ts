import { NextRequest, NextResponse } from 'next/server'
import { verifyBadge } from '@/lib/affiliate/badges'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    if (!code) {
      return NextResponse.json({ error: 'Verification code required' }, { status: 400 })
    }

    const result = await verifyBadge(code)

    if (!result) {
      return NextResponse.json({ error: 'Invalid or inactive verification code', is_valid: false }, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('Badge verify error:', err)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
