# Guide to Updating Subscription Status Enum

We need to update the `User_subscriptionStatus` enum in the Prisma schema from the current values (FREE, BASIC, PRO, active) to just two values (FREE, PREMIUM). 

However, since there are existing records in the database using the old enum values, we need to update those records before removing the old enum values.

## Current Status

From our database analysis, we found:
- 17 users with "FREE" status
- 11 users with "BASIC" status
- 5 users with "PRO" status

## Option 1: Update via Database Admin Tools

The most reliable way to update the database is to use a direct database admin tool (e.g., MySQL Workbench, phpMyAdmin) or MySQL command line client:

```sql
-- Connect to the database directly
mysql -h 87.232.53.94 -u [username] -p [database_name]

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

## Option 2: Two-Step Schema Update

If you can't directly access the database, you can try a two-step approach:

1. First, modify the Prisma schema to include both old and new values:

```prisma
enum User_subscriptionStatus {
  FREE
  PREMIUM
  BASIC    // Keep temporarily
  PRO      // Keep temporarily
  active   // Keep temporarily
}
```

2. Run Prisma generate to update the client:

```
npx prisma generate
```

3. Create and run a script to update the values:

```javascript
// scripts/update-subscription.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Update BASIC to PREMIUM
  await prisma.user.updateMany({
    where: { subscriptionStatus: 'BASIC' },
    data: { subscriptionStatus: 'PREMIUM' }
  });
  
  // Update PRO to PREMIUM
  await prisma.user.updateMany({
    where: { subscriptionStatus: 'PRO' },
    data: { subscriptionStatus: 'PREMIUM' }
  });
  
  // Update active to PREMIUM
  await prisma.user.updateMany({
    where: { subscriptionStatus: 'active' },
    data: { subscriptionStatus: 'PREMIUM' }
  });
  
  console.log('Update completed');
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
```

4. After confirming all records have been updated, modify the schema again to remove the old values:

```prisma
enum User_subscriptionStatus {
  FREE
  PREMIUM
}
```

5. Run Prisma generate again:

```
npx prisma generate
```

## Option 3: Start Fresh

If you're developing locally or can reset the database:

1. First update the schema with the new enum values:

```prisma
enum User_subscriptionStatus {
  FREE
  PREMIUM
}
```

2. Use Prisma db push with the force-reset flag (WARNING: This will delete ALL data):

```
npx prisma db push --force-reset
```

3. Re-seed the database with correct enum values.

## After Updating

Once the database is updated, make sure to update any code that uses the old enum values:

1. Update the Stripe webhook handler to use only FREE and PREMIUM values
2. Update any other code that directly references the old enum values

## Verifying the Change

After making the changes, you should:

1. Check that the database only contains FREE and PREMIUM values
2. Test creating new users and updating subscription status
3. Test the Stripe subscription flow