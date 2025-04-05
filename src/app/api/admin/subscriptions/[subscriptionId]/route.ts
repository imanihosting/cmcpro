import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { subscriptionId: string } }
) {
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
    
    const subscriptionId = params.subscriptionId;
    
    // First, try to find the subscription in our database
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
            role: true,
            subscriptionStatus: true,
          }
        }
      }
    });
    
    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }
    
    // If we have a Stripe subscription ID, get detailed information from Stripe
    if (subscription.stripeSubscriptionId) {
      try {
        // Get subscription details from Stripe
        const stripeSubscription = await stripe.subscriptions.retrieve(
          subscription.stripeSubscriptionId,
          { expand: ['latest_invoice', 'customer', 'default_payment_method'] }
        );
        
        // Get the product details
        const priceId = stripeSubscription.items.data[0]?.price?.id;
        let productDetails = null;
        
        if (priceId) {
          const price = await stripe.prices.retrieve(priceId, {
            expand: ['product']
          });
          
          productDetails = {
            priceId: price.id,
            productId: typeof price.product === 'string' ? price.product : price.product?.id,
            name: typeof price.product === 'string' ? null : (price.product as any)?.name,
            description: typeof price.product === 'string' ? null : (price.product as any)?.description,
            amount: price.unit_amount ? price.unit_amount / 100 : 0,
            currency: price.currency,
            interval: price.recurring?.interval || null,
            intervalCount: price.recurring?.interval_count || null,
          };
        }
        
        // Get payment method details if available
        const paymentMethod = stripeSubscription.default_payment_method
          ? typeof stripeSubscription.default_payment_method === 'string'
            ? null
            : {
                id: (stripeSubscription.default_payment_method as any).id,
                type: (stripeSubscription.default_payment_method as any).type,
                last4: (stripeSubscription.default_payment_method as any).card?.last4,
                brand: (stripeSubscription.default_payment_method as any).card?.brand,
                expMonth: (stripeSubscription.default_payment_method as any).card?.exp_month,
                expYear: (stripeSubscription.default_payment_method as any).card?.exp_year,
              }
          : null;
        
        // Get latest invoice details
        const invoiceDetails = stripeSubscription.latest_invoice
          ? typeof stripeSubscription.latest_invoice === 'string'
            ? null
            : {
                id: (stripeSubscription.latest_invoice as any).id,
                number: (stripeSubscription.latest_invoice as any).number,
                status: (stripeSubscription.latest_invoice as any).status,
                amountPaid: (stripeSubscription.latest_invoice as any).amount_paid / 100,
                amountDue: (stripeSubscription.latest_invoice as any).amount_due / 100,
                currency: (stripeSubscription.latest_invoice as any).currency,
                created: new Date((stripeSubscription.latest_invoice as any).created * 1000),
                hostedInvoiceUrl: (stripeSubscription.latest_invoice as any).hosted_invoice_url,
              }
          : null;
        
        // Format the response
        const detailedSubscription = {
          id: subscription.id,
          stripeSubscriptionId: subscription.stripeSubscriptionId,
          stripeCustomerId: subscription.stripeCustomerId,
          status: stripeSubscription.status,
          plan: productDetails?.name || subscription.plan,
          createdAt: subscription.createdAt,
          updatedAt: subscription.updatedAt,
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
          canceledAt: stripeSubscription.canceled_at 
            ? new Date(stripeSubscription.canceled_at * 1000) 
            : null,
          cancelAt: stripeSubscription.cancel_at 
            ? new Date(stripeSubscription.cancel_at * 1000) 
            : null,
          startDate: new Date(stripeSubscription.start_date * 1000),
          trialStart: stripeSubscription.trial_start 
            ? new Date(stripeSubscription.trial_start * 1000) 
            : null,
          trialEnd: stripeSubscription.trial_end 
            ? new Date(stripeSubscription.trial_end * 1000) 
            : null,
          user: {
            id: subscription.userId,
            name: subscription.User.name,
            email: subscription.User.email,
            role: subscription.User.role,
            subscriptionStatus: subscription.User.subscriptionStatus,
          },
          product: productDetails,
          paymentMethod: paymentMethod,
          latestInvoice: invoiceDetails,
          stripeUrl: `https://dashboard.stripe.com/${process.env.NODE_ENV === 'production' ? '' : 'test/'}subscriptions/${subscription.stripeSubscriptionId}`,
        };
        
        return NextResponse.json(detailedSubscription);
      } catch (stripeError: any) {
        console.error('Error fetching from Stripe:', stripeError);
        
        // If Stripe retrieval fails, return the database information with an error note
        return NextResponse.json({
          id: subscription.id,
          stripeSubscriptionId: subscription.stripeSubscriptionId,
          stripeCustomerId: subscription.stripeCustomerId,
          status: subscription.status,
          plan: subscription.plan,
          createdAt: subscription.createdAt,
          updatedAt: subscription.updatedAt,
          currentPeriodEnd: subscription.stripeCurrentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          user: {
            id: subscription.userId,
            name: subscription.User.name,
            email: subscription.User.email,
            role: subscription.User.role,
            subscriptionStatus: subscription.User.subscriptionStatus,
          },
          stripeError: stripeError.message,
        });
      }
    }
    
    // If no Stripe ID, return just the database information
    return NextResponse.json({
      id: subscription.id,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      stripeCustomerId: subscription.stripeCustomerId,
      status: subscription.status,
      plan: subscription.plan,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
      currentPeriodEnd: subscription.stripeCurrentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      user: {
        id: subscription.userId,
        name: subscription.User.name,
        email: subscription.User.email,
        role: subscription.User.role,
        subscriptionStatus: subscription.User.subscriptionStatus,
      },
    });
  } catch (error: any) {
    console.error('Error fetching subscription details:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 