import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
  try {
    // Get the session to authenticate the request
    const session = await getServerSession(authOptions);
    
    // Only allow authenticated users
    if (!session) {
      return NextResponse.json(
        { error: 'You must be logged in to update your subscription' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { priceId } = await req.json();

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      );
    }

    // Get the user's subscription from database
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        Subscription: {
          select: {
            id: true,
            stripeCustomerId: true,
            stripeSubscriptionId: true,
          }
        }
      },
    });

    if (!user?.Subscription?.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    const subscriptionId = user.Subscription.stripeSubscriptionId;

    // Update the subscription in Stripe
    const updatedSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    // Get the current item ID to update
    const itemId = updatedSubscription.items.data[0].id;
    
    // Update the subscription with the new price
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      items: [{ id: itemId, price: priceId }],
      proration_behavior: 'create_prorations', // Handle proration automatically
    });

    // Update the subscription in database if needed
    await db.subscription.update({
      where: { id: user.Subscription.id },
      data: {
        stripePriceId: priceId,
        updatedAt: new Date(),
      }
    });

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      }
    });
  } catch (error: any) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 