import { NextResponse } from 'next/server'
import { getAllProviders } from '@/lib/ai/provider'

export async function GET() {
  const providers = getAllProviders()
  return NextResponse.json({ providers })
}
