import { NextRequest, NextResponse } from 'next/server';
import { WebhookHandlers } from '@/lib/stripe/webhook-handlers';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  try {
    const rawBody = await request.arrayBuffer();
    const payload = Buffer.from(rawBody);

    await WebhookHandlers.processWebhook(payload, signature);

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error('Webhook error:', error.message);
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 400 });
  }
}
