# Subscription Status Update

We've updated the `User_subscriptionStatus` enum in the schema to only include `FREE` and `PREMIUM` values, removing `BASIC`, `PRO`, and `active`.

## Steps to Complete the Update

1. Connect to the MySQL database directly using a MySQL client:

```
mysql -h 87.232.53.94 -u [username] -p [password] cmsbackend_db
```

2. Run the following SQL commands to update the existing records:

```sql
-- Update subscription status from old values to PREMIUM
UPDATE User SET subscriptionStatus = 'PREMIUM' WHERE subscriptionStatus = 'BASIC';
UPDATE User SET subscriptionStatus = 'PREMIUM' WHERE subscriptionStatus = 'PRO';
UPDATE User SET subscriptionStatus = 'PREMIUM' WHERE subscriptionStatus = 'active';

-- Verify the update
SELECT subscriptionStatus, COUNT(*) FROM User GROUP BY subscriptionStatus;
```

3. After confirming all records have been updated, update the schema in `prisma/schema.prisma` to only include the new values:

```prisma
enum User_subscriptionStatus {
  FREE
  PREMIUM
}
```

4. Run Prisma generate to update the client:

```
npx prisma generate
```

## Understanding the Error

The error occurs because we're trying to change the enum values while there are existing records in the database that use the old values. The database is enforcing that the subscription status values must match one of the defined enum values.

By updating the database records directly, we ensure that all users have valid status values before changing the schema. 