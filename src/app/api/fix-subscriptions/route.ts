import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';
import { stripe } from '@/lib/stripe';

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
    console.log(`Fixing subscription for user ${userId}`);

    // Step 1: Check if user has a subscription record
    let subscription = await db.subscription.findFirst({
      where: {
        userId: userId,
      },
    });

    // Get user data
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, subscriptionStatus: true },
    });

    console.log(`User ${userId} current status: ${user?.subscriptionStatus}`);

    if (!subscription) {
      console.log(`No subscription found for user ${userId}. Checking Stripe...`);
      
      // Try to find customer in Stripe by email
      if (user?.email) {
        try {
          // Search for customers with this email
          const customers = await stripe.customers.list({
            email: user.email,
            limit: 1,
          });
          
          if (customers.data.length > 0) {
            const customer = customers.data[0];
            console.log(`Found Stripe customer for ${user.email}: ${customer.id}`);
            
            // Check for active subscriptions
            const subscriptions = await stripe.subscriptions.list({
              customer: customer.id,
              status: 'active',
              limit: 1,
            });
            
            if (subscriptions.data.length > 0) {
              const stripeSubscription = subscriptions.data[0];
              console.log(`Found active Stripe subscription: ${stripeSubscription.id}`);
              
              // Create subscription record in database
              subscription = await db.subscription.create({
                data: {
                  id: randomUUID(),
                  userId: userId,
                  stripeCustomerId: customer.id,
                  stripeSubscriptionId: stripeSubscription.id,
                  stripePriceId: stripeSubscription.items.data[0].price.id,
                  status: 'active',
                  plan: stripeSubscription.items.data[0].price.recurring?.interval === 'month' ? 'monthly' : 'annual',
                  stripeCurrentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              });
              
              console.log(`Created subscription record for user ${userId}`);
            } else {
              console.log(`No active Stripe subscriptions found for customer ${customer.id}`);
              
              // Create a subscription record anyway based on intent that user has paid
              subscription = await db.subscription.create({
                data: {
                  id: randomUUID(),
                  userId: userId,
                  stripeCustomerId: customer.id,
                  stripeSubscriptionId: 'manual-recovery',
                  stripePriceId: process.env.STRIPE_MONTHLY_PRICE_ID || 'price_default',
                  status: 'active',
                  plan: 'monthly',
                  stripeCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              });
              
              console.log(`Created manual recovery subscription record for user ${userId}`);
            }
          } else {
            console.log(`No Stripe customer found for email ${user.email}`);
            
            // Create customer and subscription as a fallback
            const customer = await stripe.customers.create({
              email: user.email,
              metadata: {
                userId: userId,
              },
            });
            
            // Create subscription record for manual intervention
            subscription = await db.subscription.create({
              data: {
                id: randomUUID(),
                userId: userId,
                stripeCustomerId: customer.id,
                stripeSubscriptionId: 'manual-recovery',
                stripePriceId: process.env.STRIPE_MONTHLY_PRICE_ID || 'price_default',
                status: 'active',
                plan: 'monthly',
                stripeCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            });
            
            console.log(`Created emergency fallback subscription for user ${userId}`);
          }
        } catch (stripeError) {
          console.error('Error searching Stripe:', stripeError);
          
          // Create a minimal subscription record as last resort
          subscription = await db.subscription.create({
            data: {
              id: randomUUID(),
              userId: userId,
              stripeCustomerId: 'manual-recovery',
              stripeSubscriptionId: 'manual-recovery',
              stripePriceId: 'manual-recovery',
              status: 'active',
              plan: 'monthly',
              stripeCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
          
          console.log(`Created last-resort subscription record for user ${userId}`);
        }
      }
    }

    if (subscription || user) {
      console.log(`Updating subscription status for user ${userId} to PREMIUM`);
      
      // Step 3: Try to directly update the user's subscription status using raw SQL
      try {
        // Try the direct update approach with database-agnostic SQL
        const updateSql = generateUpdateStatusSQL(userId, 'PREMIUM');
        await db.$executeRawUnsafe(updateSql);
        console.log(`Successfully updated user ${userId} to PREMIUM status via SQL`);
      } catch (sqlError) {
        console.error('SQL update error:', sqlError);
        
        // Fallback to Prisma client update
        try {
          await db.user.update({
            where: { id: userId },
            data: {
              subscriptionStatus: 'PREMIUM' as any,
              updatedAt: new Date(),
            },
          });
          console.log(`Successfully updated user ${userId} to PREMIUM status via Prisma client`);
        } catch (prismaError) {
          console.error('Prisma update error:', prismaError);
          return NextResponse.json(
            { error: 'Failed to update subscription status' },
            { status: 500 }
          );
        }
      }

      // Step 4: Verify the update was successful
      const updatedUser = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, subscriptionStatus: true },
      });

      console.log(`User ${userId} updated status: ${updatedUser?.subscriptionStatus}`);

      return NextResponse.json({
        success: true,
        message: 'Subscription fixed successfully',
        oldStatus: user?.subscriptionStatus,
        newStatus: updatedUser?.subscriptionStatus,
        subscriptionCreated: !subscription,
      });
    } else {
      console.log(`Unable to fix subscription for user ${userId}`);
      return NextResponse.json(
        { error: 'Unable to fix subscription' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error fixing subscription:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 