import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

// Define local enum to match schema changes
// This is a workaround until the Prisma client can be regenerated
enum SubscriptionStatus {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM'
}

// Detect database type to use appropriate SQL syntax
const getDatabaseProvider = () => {
  // @ts-ignore accessing private property for critical functionality
  const databaseUrl = process.env.DATABASE_URL || '';
  
  if (databaseUrl.includes('postgresql') || databaseUrl.includes('postgres')) {
    return 'postgresql';
  } else if (databaseUrl.includes('mysql')) {
    return 'mysql';
  } else {
    // Default to MySQL syntax as fallback
    return 'mysql';
  }
};

// Function to generate SQL for updating subscription status based on DB provider
const generateUpdateStatusSQL = (userId: string, status: string) => {
  const provider = getDatabaseProvider();
  
  if (provider === 'postgresql') {
    // PostgreSQL uses type casting
    return `UPDATE "User" SET "subscriptionStatus" = '${status}'::"User_subscriptionStatus", "updatedAt" = NOW() WHERE id = '${userId}'`;
  } else {
    // MySQL doesn't use type casting
    return `UPDATE User SET subscriptionStatus = '${status}', updatedAt = NOW() WHERE id = '${userId}'`;
  }
};

// Stripe webhook events: https://stripe.com/docs/api/events/types
const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
]);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature') as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return new NextResponse('Webhook secret not configured', { status: 500 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error: any) {
    console.error(`Webhook Error: ${error.message}`);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  if (relevantEvents.has(event.type)) {
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutSessionCompleted(event.data.object);
          break;
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event.data.object);
          break;
        case 'invoice.payment_succeeded':
          await handleInvoicePaymentSucceeded(event.data.object);
          break;
        case 'invoice.payment_failed':
          await handleInvoicePaymentFailed(event.data.object);
          break;
        default:
          throw new Error(`Unhandled relevant event: ${event.type}`);
      }
    } catch (error) {
      console.error(error);
      return new NextResponse('Webhook handler failed', { status: 500 });
    }
  }

  return new NextResponse(null, { status: 200 });
}

/**
 * Handle Stripe checkout session completed event
 */
async function handleCheckoutSessionCompleted(session: any) {
  const { client_reference_id, customer, metadata } = session;
  
  console.log(`Webhook (stripe): Processing checkout session for user ${client_reference_id}`);
  
  if (!client_reference_id) {
    throw new Error('Missing client_reference_id');
  }

  // Get active subscription for this customer
  const subscriptionData = await stripe.subscriptions.list({
    customer: customer,
    status: 'active',
    expand: ['data.default_payment_method'],
  });

  if (!subscriptionData.data.length) {
    throw new Error('No active subscription found');
  }

  const subscription = subscriptionData.data[0];

  // Determine the plan type
  const plan = metadata?.plan || (
    subscription.items.data[0].price.recurring?.interval === 'month' 
      ? 'monthly' : 'annual'
  );

  console.log(`Webhook (stripe): Creating/updating subscription record for user ${client_reference_id}`);
  
  try {
    // Create or update subscription record
    await db.subscription.upsert({
      where: {
        userId: client_reference_id,
      },
      create: {
        id: randomUUID(),
        userId: client_reference_id,
        stripeCustomerId: customer,
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0].price.id,
        stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        plan,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      update: {
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0].price.id,
        stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        plan,
        status: 'active',
        updatedAt: new Date(),
      },
    });
    console.log(`Webhook (stripe): Successfully created/updated subscription record for ${client_reference_id}`);
  } catch (error) {
    console.error(`Webhook (stripe): Error creating/updating subscription record:`, error);
  }

  console.log(`Webhook (stripe): Updating user subscription status to PREMIUM for user ${client_reference_id}`);
  
  try {
    // First try using the Prisma client update method
    try {
      await db.user.update({
        where: {
          id: client_reference_id,
        },
        data: {
          // @ts-ignore: Using local enum to match schema changes
          subscriptionStatus: SubscriptionStatus.PREMIUM,
          updatedAt: new Date(),
        },
      });
      console.log(`Webhook (stripe): Successfully updated user subscription status for ${client_reference_id}`);
    } catch (prismaError) {
      console.error(`Webhook (stripe): Error with Prisma update:`, prismaError);
      
      // If Prisma update fails, try with raw SQL
      try {
        const updateSql = generateUpdateStatusSQL(client_reference_id, 'PREMIUM');
        await db.$executeRawUnsafe(updateSql);
        console.log(`Webhook (stripe): Successfully updated user with raw SQL for ${client_reference_id}`);
      } catch (sqlError) {
        console.error(`Webhook (stripe): Error with raw SQL update:`, sqlError);
        throw sqlError; // Rethrow to trigger webhook failure
      }
    }
    
    // Verify the update was successful by fetching the user
    const updatedUser = await db.user.findUnique({
      where: {
        id: client_reference_id
      },
      select: {
        id: true,
        subscriptionStatus: true
      }
    });
    
    console.log(`Webhook (stripe): Verification - User ${client_reference_id} subscription status is now:`, updatedUser?.subscriptionStatus);
    
    // String comparison to avoid type issues
    if (updatedUser && String(updatedUser.subscriptionStatus) !== 'PREMIUM') {
      console.error(`Webhook (stripe): WARNING - User subscription status was not updated correctly`);
      
      // One final attempt with a different approach - use generated SQL
      const emergencySql = generateUpdateStatusSQL(client_reference_id, 'PREMIUM');
      await db.$executeRawUnsafe(emergencySql);
    }
    
  } catch (error) {
    console.error(`Webhook (stripe): Critical error updating user subscription status:`, error);
    throw error; // Rethrow to ensure webhook is retried
  }
}

/**
 * Handle Stripe subscription updated event
 */
async function handleSubscriptionUpdated(subscription: any) {
  try {
    // Find the user by subscription ID
    const dbSubscription = await db.subscription.findFirst({
      where: {
        stripeSubscriptionId: subscription.id,
      },
    });

    if (!dbSubscription) {
      console.log(`No subscription found with ID: ${subscription.id}. Creating new record...`);
      
      // Try to find customer and create subscription record
      const customer = subscription.customer;
      // Attempt to find user by customer ID in existing subscriptions
      const customerSubscription = await db.subscription.findFirst({
        where: {
          stripeCustomerId: customer,
        },
      });
      
      if (customerSubscription) {
        // We found a user with this customer ID, use their userId
        const userId = customerSubscription.userId;
        console.log(`Found user ${userId} with customer ID ${customer}`);
        
        // Create a new subscription record for this user
        const planInterval = subscription.items.data[0].price.recurring?.interval;
        const plan = planInterval === 'month' ? 'monthly' : 'annual';
        
        await db.subscription.create({
          data: {
            id: randomUUID(),
            userId: userId,
            stripeCustomerId: customer,
            stripeSubscriptionId: subscription.id,
            stripePriceId: subscription.items.data[0].price.id,
            stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
            status: subscription.status,
            plan,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        
        console.log(`Created new subscription record for user ${userId}`);
        
        // Update user's subscription status based on this subscription's status
        try {
          if (subscription.status === 'active') {
            const updateSql = generateUpdateStatusSQL(userId, 'PREMIUM');
            await db.$executeRawUnsafe(updateSql);
            console.log(`Updated user ${userId} to PREMIUM status via SQL`);
          }
        } catch (error) {
          console.error(`Error updating user status:`, error);
        }
        
        // Exit function, we've handled this case
        return;
      }
      
      // If we got here, we couldn't find the user - log it and return
      console.log(`Could not match subscription ${subscription.id} to a user. Skipping update.`);
      return;
    }
    
    // Continue with normal flow if subscription was found...
    const planInterval = subscription.items.data[0].price.recurring?.interval;
    const plan = planInterval === 'month' ? 'monthly' : 'annual';

    // Update subscription in database
    await db.subscription.update({
      where: {
        id: dbSubscription.id,
      },
      data: {
        stripePriceId: subscription.items.data[0].price.id,
        stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        status: subscription.status,
        plan,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });

    // If subscription is canceled or inactive, update user's subscription status
    try {
      if (subscription.status !== 'active') {
        await db.user.update({
          where: {
            id: dbSubscription.userId,
          },
          data: {
            // @ts-ignore: Using local enum to match schema changes
            subscriptionStatus: SubscriptionStatus.FREE,
          },
        });
        console.log(`Subscription canceled/inactive: Updated user ${dbSubscription.userId} to FREE status`);
      } else {
        // If subscription is active, update to PREMIUM
        await db.user.update({
          where: {
            id: dbSubscription.userId,
          },
          data: {
            // @ts-ignore: Using local enum to match schema changes
            subscriptionStatus: SubscriptionStatus.PREMIUM,
          },
        });
        console.log(`Subscription active: Updated user ${dbSubscription.userId} to PREMIUM status`);
      }
    } catch (error) {
      console.error(`Error updating user subscription status:`, error);
      
      // Fallback to raw SQL if Prisma update fails
      try {
        const status = subscription.status === 'active' ? 'PREMIUM' : 'FREE';
        const updateSql = generateUpdateStatusSQL(dbSubscription.userId, status);
        await db.$executeRawUnsafe(updateSql);
        console.log(`Used raw SQL to update user ${dbSubscription.userId} to ${status} status`);
      } catch (sqlError) {
        console.error(`Raw SQL update error:`, sqlError);
        throw sqlError;
      }
    }
  } catch (error) {
    console.error(`Error in handleSubscriptionUpdated:`, error);
    // Don't rethrow to prevent webhook failure
  }
}

/**
 * Handle Stripe subscription deleted event
 */
async function handleSubscriptionDeleted(subscription: any) {
  // Find the subscription
  const dbSubscription = await db.subscription.findFirst({
    where: {
      stripeSubscriptionId: subscription.id,
    },
  });

  if (!dbSubscription) {
    throw new Error(`No subscription found with ID: ${subscription.id}`);
  }

  // Update subscription in database
  await db.subscription.update({
    where: {
      id: dbSubscription.id,
    },
    data: {
      status: 'canceled',
      cancelAtPeriodEnd: false,
    },
  });

  // Update user's subscription status
  await db.user.update({
    where: {
      id: dbSubscription.userId,
    },
    data: {
      // @ts-ignore: Using local enum to match schema changes
      subscriptionStatus: SubscriptionStatus.FREE,
    },
  });
}

/**
 * Handle Stripe invoice payment succeeded event
 */
async function handleInvoicePaymentSucceeded(invoice: any) {
  // Only process subscription invoices
  if (invoice.billing_reason === 'subscription_create' || invoice.billing_reason === 'subscription_cycle') {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    
    // Find the subscription
    const dbSubscription = await db.subscription.findFirst({
      where: {
        stripeSubscriptionId: invoice.subscription,
      },
    });

    if (!dbSubscription) {
      throw new Error(`No subscription found with ID: ${invoice.subscription}`);
    }

    // Update subscription in database
    await db.subscription.update({
      where: {
        id: dbSubscription.id,
      },
      data: {
        stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        status: 'active',
      },
    });

    // Update user's subscription status
    await db.user.update({
      where: {
        id: dbSubscription.userId,
      },
      data: {
        // @ts-ignore: Using local enum to match schema changes
        subscriptionStatus: SubscriptionStatus.PREMIUM,
      },
    });
  }
}

/**
 * Handle Stripe invoice payment failed event
 */
async function handleInvoicePaymentFailed(invoice: any) {
  // Find the subscription
  const dbSubscription = await db.subscription.findFirst({
    where: {
      stripeSubscriptionId: invoice.subscription,
    },
  });

  if (!dbSubscription) {
    throw new Error(`No subscription found with ID: ${invoice.subscription}`);
  }

  // If the payment failed, we log it but don't cancel the subscription yet
  // Stripe will retry the payment and eventually cancel if it keeps failing
  console.log(`Payment failed for subscription ${invoice.subscription}`);

  // Optionally send a notification to the user about failed payment
  await db.notification.create({
    data: {
      id: randomUUID(),
      userId: dbSubscription.userId,
      type: 'PAYMENT_FAILED',
      title: 'Payment Failed',
      message: 'Your subscription payment has failed. Please update your payment method to continue your subscription.',
      status: 'UNREAD',
      updatedAt: new Date(),
    },
  });
} 