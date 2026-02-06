import { NextRequest, NextResponse } from 'next/server'
import { checkDomainSSO } from '@/lib/sso/provider'

export async function POST(request: NextRequest) {
  try {
    const { domain } = await request.json()

    if (!domain || typeof domain !== 'string') {
      return NextResponse.json({ hasSSO: false })
    }

    const result = await checkDomainSSO(domain.toLowerCase().trim())
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ hasSSO: false })
  }
}
