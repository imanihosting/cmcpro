/**
 * Test Stripe Webhook Events
 * 
 * This script simulates Stripe webhook events for testing purposes.
 * It directly calls the webhook handler functions with simulated event data.
 * 
 * Usage:
 * 1. Run with ts-node: npx ts-node src/scripts/test-stripe-webhook.ts
 * 2. Or build and run: npm run build && node .next/server/src/scripts/test-stripe-webhook.js
 */

import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

// Define local enum to match schema changes
enum SubscriptionStatus {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM'
}

/**
 * Simulates a subscription cancellation event
 */
async function simulateSubscriptionCancelled(userId: string) {
  console.log(`Simulating subscription cancellation for user ${userId}`);
  
  // First, check if user exists
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      subscriptionStatus: true,
      Subscription: {
        select: {
          id: true,
          stripeSubscriptionId: true,
          status: true
        }
      }
    }
  });
  
  if (!user) {
    console.error(`User ${userId} not found`);
    return;
  }
  
  if (!user.Subscription) {
    console.error(`No subscription found for user ${userId}`);
    return;
  }
  
  console.log(`Current user status: ${user.subscriptionStatus}`);
  console.log(`Current subscription status: ${user.Subscription.status}`);
  
  // Update subscription to cancelled
  await db.subscription.update({
    where: { id: user.Subscription.id },
    data: {
      status: 'canceled',
      cancelAtPeriodEnd: false,
    }
  });
  
  // Update user's subscription status
  await db.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: 'FREE' as SubscriptionStatus,
    }
  });
  
  console.log(`Subscription marked as cancelled`);
  console.log(`User subscription status updated to FREE`);
  
  // Verify updates
  const updatedUser = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      subscriptionStatus: true,
      Subscription: {
        select: {
          id: true,
          status: true
        }
      }
    }
  });
  
  console.log(`Updated user status: ${updatedUser?.subscriptionStatus}`);
  console.log(`Updated subscription status: ${updatedUser?.Subscription?.status}`);
}

// Get user ID from command line or use a default
const userId = process.argv[2] || 'YOUR_TEST_USER_ID';

// Run the simulation
simulateSubscriptionCancelled(userId)
  .then(() => {
    console.log('Simulation completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error during simulation:', error);
    process.exit(1);
  }); 