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

## Free Trial Feature

The application now supports role-based free trials for new users. The functionality works as follows:

### Admin Settings

1. An administrator can enable or disable the automatic free trial feature through the admin settings at `/admin/settings/trial`
2. When enabled, new users receive:
   - Parent role: 30-day free trial
   - Childminder role: 60-day free trial

### Trial Workflow

1. **Registration**: When a user registers:
   - If trials are enabled: They receive a trial period based on their role and are redirected to their dashboard
   - If trials are disabled: They are redirected to the subscription page

2. **Trial Status**: The user's subscription status is set to `TRIALING` during the trial period

3. **Trial Expiration**: A scheduled job (`npm run check-trials`) checks for expired trials and updates their status to `TRIAL_EXPIRED`

4. **User Experience**:
   - Users on active trials see a trial banner with remaining days
   - Expired trial users are prompted to subscribe

### Implementation Details

1. **Database Changes**:
   - Added new values to `User_subscriptionStatus` enum: `TRIALING`, `TRIAL_EXPIRED`, `PENDING_SUBSCRIPTION`
   - Added a security setting `enable_free_trial` to toggle the feature

2. **Setup Commands**:
   - `npm run update-trial-setting`: Sets up the initial security setting (disabled by default)
   - `npm run check-trials`: Checks for expired trials and updates their status

3. **API Endpoints**:
   - `GET /api/admin/settings/trial`: Get current trial setting (admin only)
   - `POST /api/admin/settings/trial`: Update trial setting (admin only)

4. **Subscription Check**:
   - Free trial users have full access to features during their trial period
   - Access is checked through the `hasValidSubscription()` utility function

### Running the Trial Expiry Check

The trial expiry check should be scheduled to run regularly. Example approaches:

1. **Using cron (Linux/Mac)**:
   ```
   0 0 * * * cd /path/to/app && npm run check-trials >> /path/to/logs/trial-check.log 2>&1
   ```

2. **Using Task Scheduler (Windows)**:
   Schedule a task to run the command `npm run check-trials` daily 