import { NextResponse } from 'next/server';
import { getStripePublishableKey } from '@/lib/stripe/client';

export async function GET() {
  try {
    const publishableKey = await getStripePublishableKey();
    return NextResponse.json({ publishableKey });
  } catch (error: any) {
    console.error('Publishable key error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
