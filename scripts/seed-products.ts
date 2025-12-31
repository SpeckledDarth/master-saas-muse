/**
 * Seed Script: Create Stripe Products and Prices
 * 
 * Run this script to create the Free/Pro/Team plans in Stripe.
 * The products will be automatically synced to your database via webhooks.
 * 
 * Usage: npx tsx scripts/seed-products.ts
 */

import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY environment variable is required');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-11-17.clover',
});

interface PlanConfig {
  name: string;
  description: string;
  features: string[];
  monthlyPrice: number;
  yearlyPrice: number;
  metadata: Record<string, string>;
}

const PLANS: PlanConfig[] = [
  {
    name: 'Free',
    description: 'Perfect for getting started',
    features: ['Basic features', 'Community support', '1 project'],
    monthlyPrice: 0,
    yearlyPrice: 0,
    metadata: {
      tier: 'free',
      projectLimit: '1',
      features: 'basic',
    },
  },
  {
    name: 'Pro',
    description: 'For professionals and growing teams',
    features: ['All Free features', 'Priority support', 'Unlimited projects', 'Advanced analytics'],
    monthlyPrice: 2900,
    yearlyPrice: 29000,
    metadata: {
      tier: 'pro',
      projectLimit: 'unlimited',
      features: 'advanced',
    },
  },
  {
    name: 'Team',
    description: 'For larger teams and organizations',
    features: ['All Pro features', 'Team collaboration', 'Admin controls', 'SSO', 'Dedicated support'],
    monthlyPrice: 9900,
    yearlyPrice: 99000,
    metadata: {
      tier: 'team',
      projectLimit: 'unlimited',
      features: 'enterprise',
      sso: 'true',
    },
  },
];

async function seedProducts() {
  console.log('Seeding Stripe products...\n');

  for (const plan of PLANS) {
    const existingProducts = await stripe.products.search({
      query: `name:'${plan.name}'`,
    });

    if (existingProducts.data.length > 0) {
      console.log(`Product "${plan.name}" already exists, skipping...`);
      continue;
    }

    console.log(`Creating product: ${plan.name}`);
    
    const product = await stripe.products.create({
      name: plan.name,
      description: plan.description,
      metadata: {
        ...plan.metadata,
        features: JSON.stringify(plan.features),
      },
    });

    console.log(`  Product ID: ${product.id}`);

    if (plan.monthlyPrice > 0) {
      const monthlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.monthlyPrice,
        currency: 'usd',
        recurring: { interval: 'month' },
        metadata: { interval: 'monthly' },
      });
      console.log(`  Monthly Price ID: ${monthlyPrice.id} ($${plan.monthlyPrice / 100}/mo)`);
    }

    if (plan.yearlyPrice > 0) {
      const yearlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.yearlyPrice,
        currency: 'usd',
        recurring: { interval: 'year' },
        metadata: { interval: 'yearly' },
      });
      console.log(`  Yearly Price ID: ${yearlyPrice.id} ($${plan.yearlyPrice / 100}/yr)`);
    }

    console.log('');
  }

  console.log('Done! Products created successfully.');
  console.log('\nNote: Free tier has no prices (it\'s free by default).');
}

seedProducts().catch(console.error);
