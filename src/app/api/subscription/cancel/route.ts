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
        { error: 'You must be logged in to cancel your subscription' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { cancelImmediately } = await req.json();
    
    // Get user's subscription from database
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        Subscription: {
          select: {
            id: true,
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

    // Cancel the subscription in Stripe
    // If cancelImmediately is true, cancel immediately, otherwise at period end
    let subscription;
    
    if (cancelImmediately) {
      // Use the cancel method for immediate cancellation
      subscription = await stripe.subscriptions.cancel(subscriptionId);
    } else {
      // Use update with cancel_at_period_end for end-of-period cancellation
      subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true
      });
    }

    // Update the subscription in database
    await db.subscription.update({
      where: { id: user.Subscription.id },
      data: {
        cancelAtPeriodEnd: !cancelImmediately ? true : false,
        status: subscription.status,
        updatedAt: new Date(),
      }
    });

    // Update the user's subscription status only if cancelling immediately
    if (cancelImmediately) {
      await db.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: 'FREE',
        }
      });
    }

    return NextResponse.json({
      success: true,
      canceledImmediately: cancelImmediately,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
      subscriptionStatus: cancelImmediately ? 'FREE' : session.user.subscriptionStatus
    });
  } catch (error: any) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 