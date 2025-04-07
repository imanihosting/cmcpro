# Webhook Event Schema Documentation

This document provides detailed information about the `WebhookEvent` table in the Childminder Connect platform database.

## Overview

The `WebhookEvent` table tracks and logs webhook events received from external services, particularly Stripe. This table serves several critical purposes:

1. **Audit Trail**: Maintaining a record of all incoming webhook events
2. **Idempotency**: Preventing duplicate processing of the same event
3. **Debugging**: Providing data for troubleshooting webhook issues
4. **Monitoring**: Allowing tracking of webhook processing performance

## Schema Definition

The `WebhookEvent` table has the following structure:

```prisma
model WebhookEvent {
  id                String    @id
  checkoutSessionId String    @unique
  userId            String
  status            String
  createdAt         DateTime  @default(now())
  completedAt       DateTime?
  subscriptionId    String?
  User              User      @relation(fields: [userId], references: [id])

  @@index([checkoutSessionId])
  @@index([userId])
}
```

### Fields

- **id**: Unique identifier for the webhook event record (Primary Key)
- **checkoutSessionId**: The ID of the Stripe checkout session that generated this event
- **userId**: Reference to the User who the webhook event is related to
- **status**: Current processing status of the webhook (e.g., "PENDING", "PROCESSED", "FAILED")
- **createdAt**: When the webhook event was received
- **completedAt**: When the webhook event processing was completed (null if still processing)
- **subscriptionId**: Optional reference to a Stripe subscription ID

### Indexes

- **checkoutSessionId**: For quickly looking up events by checkout session
- **userId**: For filtering events by user

## Usage in the Application

The WebhookEvent table is primarily used in the Stripe webhook handler (`/src/app/api/webhooks/stripe/route.ts`) for the following purposes:

### 1. Recording Incoming Events

When a webhook is received from Stripe, a record is created in this table before processing begins:

```typescript
// Example usage in webhook handler
await db.webhookEvent.create({
  data: {
    id: randomUUID(),
    checkoutSessionId: session.id,
    userId: client_reference_id,
    status: "PENDING",
    createdAt: new Date(),
  }
});
```

### 2. Preventing Duplicate Processing

Before processing a webhook event, the handler checks if an event with the same checkout session ID has already been processed:

```typescript
// Example duplicate check
const existingEvent = await db.webhookEvent.findUnique({
  where: {
    checkoutSessionId: session.id,
    status: "PROCESSED"
  }
});

if (existingEvent) {
  console.log(`Webhook already processed: ${session.id}`);
  return; // Skip processing
}
```

### 3. Updating Status After Processing

After successful processing, the event record is updated:

```typescript
// Example status update
await db.webhookEvent.update({
  where: { id: webhookEventId },
  data: {
    status: "PROCESSED",
    completedAt: new Date(),
    subscriptionId: subscription.id
  }
});
```

## Monitoring and Maintenance

The WebhookEvent table can be monitored to:

1. Identify failed webhook events that need manual intervention
2. Analyze patterns in webhook processing times
3. Audit subscription-related events for reconciliation purposes

### Recommended Queries

**Find Failed Webhook Events**:
```sql
SELECT * FROM WebhookEvent WHERE status = 'FAILED' ORDER BY createdAt DESC;
```

**Check Processing Times**:
```sql
SELECT id, checkoutSessionId, 
       TIMESTAMPDIFF(SECOND, createdAt, completedAt) AS processingTimeSeconds
FROM WebhookEvent 
WHERE completedAt IS NOT NULL
ORDER BY processingTimeSeconds DESC;
```

**Find Orphaned Events (Still Pending)**:
```sql
SELECT * FROM WebhookEvent 
WHERE status = 'PENDING' 
AND createdAt < DATE_SUB(NOW(), INTERVAL 1 HOUR);
```

## Data Retention

WebhookEvent records should be retained for at least 90 days for audit purposes. Consider implementing a data retention policy that archives or removes older records to manage database size. 