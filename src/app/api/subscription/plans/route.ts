import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get the session to authenticate the request
    const session = await getServerSession(authOptions);
    
    // Only allow authenticated users
    if (!session) {
      return NextResponse.json(
        { error: 'You must be logged in to access this endpoint' },
        { status: 401 }
      );
    }

    // Get all active products from Stripe
    const products = await stripe.products.list({
      active: true,
      expand: ['data.default_price']
    });

    // Format products with their prices
    const plans = await Promise.all(
      products.data
        .filter(product => product.default_price)
        .map(async (product) => {
          // Get the default price
          const defaultPrice = product.default_price as any;
          
          // Get all available prices for this product for different intervals
          const prices = await stripe.prices.list({
            product: product.id,
            active: true
          });
          
          // Format and add all available prices to the plan
          const formattedPrices = prices.data.map(price => ({
            id: price.id,
            currency: price.currency,
            interval: price.recurring?.interval || 'month',
            intervalCount: price.recurring?.interval_count || 1,
            unitAmount: price.unit_amount ? price.unit_amount / 100 : 0,
            formattedPrice: formatAmount(price.unit_amount || 0, price.currency),
          }));
          
          return {
            id: product.id,
            name: product.name,
            description: product.description,
            features: parseFeatures(product.metadata.features || ''),
            isPopular: product.metadata.popular === 'true',
            prices: formattedPrices,
            defaultPrice: {
              id: defaultPrice.id,
              currency: defaultPrice.currency,
              interval: defaultPrice.recurring?.interval || 'month',
              unitAmount: defaultPrice.unit_amount ? defaultPrice.unit_amount / 100 : 0,
              formattedPrice: formatAmount(defaultPrice.unit_amount || 0, defaultPrice.currency),
            }
          };
        })
    );

    return NextResponse.json(plans);
  } catch (error: any) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// Helper function to parse features from metadata
function parseFeatures(featuresString: string): string[] {
  try {
    return featuresString.split(',').map(feat => feat.trim()).filter(Boolean);
  } catch (error) {
    return [];
  }
}

// Helper function to format amount
function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount / 100);
} 