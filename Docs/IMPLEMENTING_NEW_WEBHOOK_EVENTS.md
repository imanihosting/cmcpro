# Implementing New Webhook Events

This guide explains how to implement new webhook event handlers in the Childminder Connect platform.

## Overview

The platform uses webhooks to receive real-time notifications from external services (primarily Stripe). This guide will walk you through the process of adding support for new webhook events.

## Adding a New Stripe Webhook Event

### Step 1: Update the Relevant Events List

In `/src/app/api/webhooks/stripe/route.ts`, update the `relevantEvents` set to include the new event type:

```typescript
const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  // Add your new event here
  'your.new.event',
]);
```

### Step 2: Add a Handler Function

Create a new handler function for your event:

```typescript
/**
 * Handle your new event
 */
async function handleYourNewEvent(eventData: any) {
  // Implement your event handling logic
  console.log(`Webhook (stripe): Processing your new event`);
  
  // Example: Find related subscription
  const subscription = await db.subscription.findFirst({
    where: {
      stripeSubscriptionId: eventData.subscription,
    },
  });
  
  if (!subscription) {
    throw new Error(`No subscription found with ID: ${eventData.subscription}`);
  }
  
  // Update database records as needed
  await db.subscription.update({
    where: {
      id: subscription.id,
    },
    data: {
      // Your updates here
    },
  });
  
  // Additional processing...
}
```

### Step 3: Add Your Handler to the Switch Statement

In the main `POST` handler function, add your new event to the switch statement:

```typescript
switch (event.type) {
  case 'checkout.session.completed':
    await handleCheckoutSessionCompleted(event.data.object);
    break;
  // ... existing cases ...
  case 'your.new.event':
    await handleYourNewEvent(event.data.object);
    break;
  default:
    throw new Error(`Unhandled relevant event: ${event.type}`);
}
```

### Step 4: Register the Event in Stripe Dashboard

1. Log into the [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers > Webhooks**
3. Select your webhook endpoint
4. Click **Add event**
5. Find and select your new event type
6. Click **Add events**

## Testing New Webhook Events

### Method 1: Using Stripe CLI

The Stripe CLI is the easiest way to test webhook events locally:

1. [Install the Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Login to your Stripe account: `stripe login`
3. Forward webhook events to your local server:
   ```
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. In a new terminal, trigger a test event:
   ```
   stripe trigger your.new.event
   ```

### Method 2: Creating a Test Script

For more complex events or custom testing scenarios, create a dedicated test script:

1. Create a new file in the `src/scripts` directory (e.g., `test-new-webhook.ts`)
2. Implement the test logic:

```typescript
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

async function simulateNewEvent(userId: string) {
  console.log(`Simulating new event for user ${userId}`);
  
  // Check if user exists
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
  
  // Implement your test logic here
  // This should simulate the actions your webhook handler would perform
  
  console.log('Simulation completed');
}

// Get user ID from command line or use a default
const userId = process.argv[2] || 'YOUR_TEST_USER_ID';

// Run the simulation
simulateNewEvent(userId)
  .then(() => {
    console.log('Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error during test:', error);
    process.exit(1);
  });
```

3. Run the test script:
   ```
   npx ts-node src/scripts/test-new-webhook.ts <userId>
   ```

### Method 3: Using ngrok for External Testing

To test webhooks from external services that need to reach your local development environment:

1. [Install ngrok](https://ngrok.com/download)
2. Start your Next.js application: `npm run dev`
3. In a separate terminal, start ngrok:
   ```
   ngrok http 3000
   ```
4. Copy the ngrok HTTPS URL (e.g., `https://abc123.ngrok.io`)
5. Update your webhook URL in the Stripe Dashboard to point to:
   ```
   https://abc123.ngrok.io/api/webhooks/stripe
   ```
6. Trigger the event from the external service or use Stripe's dashboard to send a test webhook

## Common Pitfalls and Best Practices

### Error Handling

Always implement proper error handling in webhook handlers to prevent complete handler failure:

```typescript
try {
  // Your logic here
} catch (error) {
  console.error(`Error handling webhook event:`, error);
  // Consider whether to rethrow or not based on criticality
  // Rethrow will cause the webhook to return an error to Stripe (which will retry)
  // Not rethrowing will acknowledge the webhook despite the error
}
```

### Idempotency

Ensure your handlers are idempotent (can be safely retried multiple times):

```typescript
// Check if we've already processed this event
const existingEvent = await db.webhookEvent.findUnique({
  where: {
    checkoutSessionId: eventData.id,
  },
});

if (existingEvent && existingEvent.status === 'PROCESSED') {
  console.log(`Event ${eventData.id} already processed, skipping`);
  return;
}
```

### Logging

Add detailed logging to your webhook handlers:

```typescript
console.log(`Webhook (stripe): Processing ${event.type} - ID: ${eventData.id}`);
// ... your handler logic ...
console.log(`Webhook (stripe): Completed processing ${event.type} - ID: ${eventData.id}`);
```

### Verification

Always verify the event signature to ensure it's actually from Stripe:

```typescript
try {
  event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
} catch (error: any) {
  console.error(`Webhook Error: ${error.message}`);
  return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
}
```

## Integration with WebhookEvent Table

Remember to update the WebhookEvent table with appropriate statuses:

```typescript
// When receiving the event
const webhookEvent = await db.webhookEvent.create({
  data: {
    id: randomUUID(),
    checkoutSessionId: eventData.id,
    userId: userId,
    status: 'PENDING',
    createdAt: new Date(),
  }
});

// After processing
await db.webhookEvent.update({
  where: {
    id: webhookEvent.id,
  },
  data: {
    status: 'PROCESSED',
    completedAt: new Date(),
  }
});
```

## Additional Resources

- [Stripe Webhook Documentation](https://stripe.com/docs/webhooks)
- [Stripe Events API Reference](https://stripe.com/docs/api/events/types)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli) 