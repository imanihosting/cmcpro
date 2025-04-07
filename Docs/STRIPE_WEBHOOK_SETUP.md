# Stripe Webhook Integration Guide

This guide explains how to set up and manage Stripe webhooks for the Childminder Connect platform.

## Overview

Stripe webhooks allow our application to receive notifications about events that happen in your Stripe account. The application uses these events to:

- Update subscription status when payments succeed or fail
- Provision access when users subscribe
- Revoke access when subscriptions expire or are canceled
- Synchronize subscription data between Stripe and our database

## Webhook Configuration

### Environment Variables

The following environment variables are required for Stripe webhook functionality:

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_WEBHOOK_SECRET=whsec_...
```

### Setting Up the Webhook in Stripe Dashboard

1. Log into the [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers > Webhooks**
3. Click **+ Add endpoint**
4. Enter your webhook URL:
   - For production: `https://your-domain.com/api/webhooks/stripe`
   - For development: `http://localhost:3000/api/webhooks/stripe` (using Stripe CLI)
5. Select the following events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
6. Click **Add endpoint**
7. Copy the Webhook Signing Secret and add it to your `.env` file as `NEXT_PUBLIC_STRIPE_WEBHOOK_SECRET`

### Local Testing with Stripe CLI

To test webhooks locally:

1. [Install the Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Login to your Stripe account: `stripe login`
3. Forward webhook events to your local server: 
   ```
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. The command above provides the webhook secret for your local environment

## Webhook Handler Implementation

The webhook handler is implemented in `/src/app/api/webhooks/stripe/route.ts` and processes the following events:

### 1. `checkout.session.completed`

Triggered when a customer completes the Stripe Checkout process:
- Creates/updates a subscription record in the database
- Updates the user's subscription status to PREMIUM
- Logs the subscription creation

### 2. `customer.subscription.created` / `customer.subscription.updated`

Triggered when a subscription is created or updated:
- Updates the subscription record in the database
- Updates the user's subscription status based on the subscription state
- Handles proration and plan changes

### 3. `customer.subscription.deleted`

Triggered when a subscription is canceled:
- Updates the subscription status to "canceled" in the database
- Changes the user's subscription status to FREE

### 4. `invoice.payment_succeeded`

Triggered when an invoice payment succeeds:
- Updates the subscription's current period end date
- Confirms the subscription is active

### 5. `invoice.payment_failed`

Triggered when an invoice payment fails:
- Creates a notification for the user about the failed payment
- The user's subscription stays active until Stripe's automatic retry logic completes

## Database Integration

The webhook events update the following database tables:

1. `Subscription` - Stores subscription details from Stripe
2. `User` - Updates the `subscriptionStatus` field (FREE or PREMIUM)
3. `Notification` - Creates notifications for failed payments

## Testing Webhooks

You can test webhook handling with the script at `/src/scripts/test-stripe-webhook.ts`:

```bash
# Run with ts-node
npx ts-node src/scripts/test-stripe-webhook.ts <userId>

# Or after building
npm run build && node .next/server/src/scripts/test-stripe-webhook.js <userId>
```

This script simulates a subscription cancellation event for testing.

## Troubleshooting

### Common Issues

1. **Webhook Secret Mismatch**
   - Error: "No signatures found matching the expected signature"
   - Solution: Ensure your webhook secret in `.env` matches the one in the Stripe Dashboard

2. **Missing Events**
   - Issue: Some events aren't being processed
   - Solution: Check that you've subscribed to all required events in the Stripe Dashboard

3. **Database Update Failures**
   - Issue: Webhook succeeds but database isn't updated
   - Solution: The handler includes fallback mechanisms with raw SQL if Prisma fails

### Webhook Logs

The webhook handler includes extensive logging. Search your logs for `Webhook (stripe):` to find relevant entries.

## Recovery Mechanisms

The system includes several failsafe mechanisms:

1. Multiple attempts to update the database (Prisma, then raw SQL)
2. Verification of updates by re-fetching records
3. Emergency final attempt if verification fails

## Accessing Stripe Customers and Subscriptions

You can view and manage subscriptions directly in the [Stripe Dashboard](https://dashboard.stripe.com/):

1. **Customers**: Find users by email
2. **Subscriptions**: View all active subscriptions
3. **Events**: View webhook event history

---

For additional support, contact the development team. 