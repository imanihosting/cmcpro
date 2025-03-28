# Subscription Status Enum Update Instructions

## The Issue

We've updated the `User_subscriptionStatus` enum in the Prisma schema to only include `FREE` and `PREMIUM` values, removing `BASIC`, `PRO`, and `active`. However, we have existing users in the database with these old values, which is causing errors when trying to apply the schema changes.

Our database analysis shows:
- 17 users with "FREE" status
- 11 users with "BASIC" status
- 5 users with "PRO" status

## The Solution

Follow these steps to update the database and code:

### Step 1: Update Database Records

First, we need to update all users with old subscription status values to use the new values. The most reliable way is to use a direct database connection.

Connect to the MySQL database directly:

```bash
mysql -h 87.232.53.94 -u [username] -p cmsbackend_db
```

Run these SQL commands:

```sql
-- Check current values
SELECT subscriptionStatus, COUNT(*) as count 
FROM User 
GROUP BY subscriptionStatus;

-- Update the values
UPDATE User SET subscriptionStatus = 'PREMIUM' WHERE subscriptionStatus = 'BASIC';
UPDATE User SET subscriptionStatus = 'PREMIUM' WHERE subscriptionStatus = 'PRO';
UPDATE User SET subscriptionStatus = 'PREMIUM' WHERE subscriptionStatus = 'active';

-- Verify the update
SELECT subscriptionStatus, COUNT(*) as count 
FROM User 
GROUP BY subscriptionStatus;
```

### Step 2: Update Prisma Schema

Once all users have been updated to use only `FREE` or `PREMIUM`, update the schema:

```prisma
// In prisma/schema.prisma

enum User_subscriptionStatus {
  FREE
  PREMIUM
}
```

### Step 3: Generate Updated Prisma Client

```bash
npx prisma generate
```

### Step 4: Update Code References

Update any code that references the old enum values:

1. Run the webhook handler update script:

```bash
node scripts/update-webhook-handler.js
```

2. Check any other files that might reference the old enum values:

```bash
npx grep "BASIC\|PRO\|active" src/
```

And update them accordingly.

### Step 5: Test the Changes

1. Test the signup flow
2. Test the subscription flow
3. Verify users can be properly marked as Premium subscribers

## Fallback Option

If there are issues with directly updating the database, you can try the two-step approach outlined in the SUBSCRIPTION-UPDATE-GUIDE.md file.

## References

See the following files for additional information:
- SUBSCRIPTION-UPDATE-GUIDE.md - Detailed guide with multiple options
- scripts/update-webhook-handler.js - Script to update the webhook handler
- scripts/export-users-for-review.js - Script to export user data for review 