import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { stripe } from '@/lib/stripe';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Schema for request body validation
const CancelSubscriptionSchema = z.object({
  subscriptionId: z.string().min(1, "Subscription ID is required"),
  reason: z.string().min(5, "Cancellation reason is required (min 5 characters)"),
  cancelImmediately: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    // Get the session to authenticate the request
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is an admin
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized access. Admin privileges required.' },
        { status: 403 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    const { subscriptionId, reason, cancelImmediately } = CancelSubscriptionSchema.parse(body);
    
    // Find the subscription in our database
    const subscription = await db.subscription.findFirst({
      where: {
        OR: [
          { id: subscriptionId },
          { stripeSubscriptionId: subscriptionId },
        ]
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });
    
    if (!subscription || !subscription.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'Subscription not found or no Stripe subscription ID available' },
        { status: 404 }
      );
    }
    
    // Create an audit log entry before making any changes
    const auditLog = await db.systemLog.create({
      data: {
        id: uuidv4(),
        type: 'AUDIT',
        level: 'INFO',
        message: `Admin initiated subscription cancellation`,
        details: JSON.stringify({
          subscriptionId: subscription.id,
          stripeSubscriptionId: subscription.stripeSubscriptionId,
          userId: subscription.userId,
          adminId: session.user.id,
          adminEmail: session.user.email,
          reason: reason,
          cancelImmediately: cancelImmediately,
          timestamp: new Date().toISOString()
        }),
        userId: session.user.id,
        source: 'admin-api',
      }
    });
    
    // Also create a user activity log entry
    await db.userActivityLog.create({
      data: {
        id: uuidv4(),
        userId: subscription.userId,
        action: 'SUBSCRIPTION_CANCELLED_BY_ADMIN',
        details: JSON.stringify({
          adminId: session.user.id,
          adminEmail: session.user.email,
          reason: reason,
          cancelImmediately: cancelImmediately,
          timestamp: new Date().toISOString()
        }),
        timestamp: new Date(),
      }
    });
    
    // Cancel the subscription in Stripe
    let stripeSubscription;
    try {
      if (cancelImmediately) {
        // Cancel immediately
        stripeSubscription = await stripe.subscriptions.cancel(
          subscription.stripeSubscriptionId
        );
      } else {
        // Cancel at period end
        stripeSubscription = await stripe.subscriptions.update(
          subscription.stripeSubscriptionId,
          {
            cancel_at_period_end: true,
          }
        );
      }
      
      // Update local database
      await db.subscription.update({
        where: { id: subscription.id },
        data: {
          status: cancelImmediately ? 'canceled' : 'active',
          cancelAtPeriodEnd: !cancelImmediately,
        }
      });
      
      // Create another log entry for successful cancellation
      await db.systemLog.create({
        data: {
          id: uuidv4(),
          type: 'AUDIT',
          level: 'INFO',
          message: `Admin successfully cancelled subscription`,
          details: JSON.stringify({
            subscriptionId: subscription.id,
            stripeSubscriptionId: subscription.stripeSubscriptionId,
            userId: subscription.userId,
            adminId: session.user.id,
            adminEmail: session.user.email,
            reason: reason,
            cancelImmediately: cancelImmediately,
            stripeStatus: stripeSubscription.status,
            timestamp: new Date().toISOString()
          }),
          userId: session.user.id,
          source: 'admin-api',
        }
      });
      
      return NextResponse.json({
        success: true,
        message: cancelImmediately 
          ? 'Subscription cancelled immediately'
          : 'Subscription scheduled to be cancelled at the end of the billing period',
        subscription: {
          id: subscription.id,
          status: stripeSubscription.status,
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        }
      });
      
    } catch (stripeError: any) {
      console.error('Error cancelling subscription in Stripe:', stripeError);
      
      // Log the error
      await db.systemLog.create({
        data: {
          id: uuidv4(),
          type: 'ERROR',
          level: 'ERROR',
          message: `Failed to cancel subscription in Stripe`,
          details: JSON.stringify({
            subscriptionId: subscription.id,
            stripeSubscriptionId: subscription.stripeSubscriptionId,
            userId: subscription.userId,
            adminId: session.user.id,
            adminEmail: session.user.email,
            error: stripeError.message,
            timestamp: new Date().toISOString()
          }),
          userId: session.user.id,
          source: 'admin-api',
        }
      });
      
      return NextResponse.json(
        { 
          error: 'Failed to cancel subscription in Stripe',
          details: stripeError.message
        },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 