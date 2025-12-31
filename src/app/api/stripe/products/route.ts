import { NextResponse } from 'next/server';
import { getUncachableStripeClient } from '@/lib/stripe/client';

export async function GET() {
  try {
    const stripe = await getUncachableStripeClient();
    
    const products = await stripe.products.list({
      active: true,
      expand: ['data.default_price'],
    });

    const prices = await stripe.prices.list({
      active: true,
    });

    const productsWithPrices = products.data.map(product => {
      const productPrices = prices.data.filter(price => price.product === product.id);
      return {
        id: product.id,
        name: product.name,
        description: product.description,
        metadata: product.metadata,
        prices: productPrices.map(price => ({
          id: price.id,
          unit_amount: price.unit_amount,
          currency: price.currency,
          recurring: price.recurring,
        })),
      };
    });

    return NextResponse.json({ data: productsWithPrices });
  } catch (error: any) {
    console.error('Products error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
