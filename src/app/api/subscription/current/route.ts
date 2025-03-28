import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { stripe } from '@/lib/stripe';

export async function GET(req: Request) {
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

    const userId = session.user.id;

    // Get user and subscription information from database
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        subscriptionStatus: true,
        Subscription: {
          select: {
            stripeCustomerId: true,
            stripeSubscriptionId: true,
            status: true,
            plan: true,
            stripeCurrentPeriodEnd: true,
            stripePriceId: true,
            cancelAtPeriodEnd: true,
          }
        }
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // If no subscription record or no Stripe subscription ID, return basic info
    if (!user.Subscription?.stripeSubscriptionId) {
      return NextResponse.json({
        status: 'inactive',
        plan: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        priceId: null,
        subscriptionStatus: user.subscriptionStatus
      });
    }

    // Get real-time subscription details from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(
      user.Subscription.stripeSubscriptionId
    );

    // Get the product details for additional information
    const priceId = stripeSubscription.items.data[0].price.id;
    const price = await stripe.prices.retrieve(priceId, {
      expand: ['product']
    });

    // Format subscription details for response
    const productName = (price.product as any)?.name || 'Premium Plan';
    
    const subscriptionDetails = {
      id: stripeSubscription.id,
      status: stripeSubscription.status,
      plan: productName,
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      priceId: priceId,
      interval: (price.recurring?.interval || 'month'),
      amount: price.unit_amount ? price.unit_amount / 100 : 0,
      currency: price.currency,
      subscriptionStatus: user.subscriptionStatus
    };

    return NextResponse.json(subscriptionDetails);
  } catch (error: any) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 