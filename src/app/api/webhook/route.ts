import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import Stripe from "stripe";
import { PrismaClient, Prisma } from "@prisma/client";

export const dynamic = 'force-dynamic';

// This is your Stripe webhook secret for testing your endpoint locally
const webhookSecret = process.env.NEXT_PUBLIC_STRIPE_WEBHOOK_SECRET;

// Define subscription status
const SubscriptionStatus = {
  FREE: 'FREE',
  PREMIUM: 'PREMIUM'
} as const;

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = headers().get("Stripe-Signature") as string;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret as string
      );
    } catch (error: any) {
      console.error(`Webhook signature verification failed: ${error.message}`);
      return NextResponse.json(
        { error: `Webhook signature verification failed` },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        
        if (checkoutSession.metadata?.userId) {
          const userId = checkoutSession.metadata.userId;
          
          // Record webhook event
          await db.webhookEvent.create({
            data: {
              id: uuidv4(),
              checkoutSessionId: checkoutSession.id,
              userId: userId,
              status: "COMPLETED",
              completedAt: new Date(),
              subscriptionId: checkoutSession.subscription as string,
              createdAt: new Date(),
            },
          });

          // Update user subscription status
          if (checkoutSession.subscription) {
            const subscription = await stripe.subscriptions.retrieve(
              checkoutSession.subscription as string
            );

            console.log(`Webhook: Updating subscription for user ${userId}`);
            
            // First create or update the subscription record
            await db.subscription.upsert({
              where: {
                userId: userId,
              },
              create: {
                id: uuidv4(),
                userId: userId,
                stripeCustomerId: checkoutSession.customer as string,
                stripeSubscriptionId: subscription.id,
                stripePriceId: subscription.items.data[0].price.id,
                status: subscription.status,
                stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
                plan: subscription.items.data[0].price.id === process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID ? "MONTHLY" : "YEARLY",
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              update: {
                stripeSubscriptionId: subscription.id,
                stripePriceId: subscription.items.data[0].price.id,
                status: subscription.status,
                stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
                plan: subscription.items.data[0].price.id === process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID ? "MONTHLY" : "YEARLY",
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
                updatedAt: new Date(),
              },
            });

            // Update user subscription status using raw SQL to avoid type issues
            console.log(`Webhook: Setting subscription status to PREMIUM for user ${userId}`);
            try {
              const updateSql = generateUpdateStatusSQL(userId, 'PREMIUM');
              await db.$executeRawUnsafe(updateSql);
              console.log(`Successfully updated user ${userId} to PREMIUM status via SQL`);
            } catch (sqlError) {
              console.error('SQL update error:', sqlError);
            }
          }
        }
        break;
      
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        const subscription = event.data.object as Stripe.Subscription;
        
        const userSubscription = await db.subscription.findFirst({
          where: {
            stripeSubscriptionId: subscription.id,
          },
        });

        if (userSubscription) {
          await db.subscription.update({
            where: {
              id: userSubscription.id,
            },
            data: {
              status: subscription.status,
              stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
              updatedAt: new Date(),
            },
          });

          // Update user subscription status using raw SQL to avoid type issues
          const newStatus = subscription.status === "active" ? 'PREMIUM' : 'FREE';
          const updateSql = generateUpdateStatusSQL(userSubscription.userId, newStatus);
          await db.$executeRawUnsafe(updateSql);
        }
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
} 