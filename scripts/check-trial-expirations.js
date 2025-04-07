const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTrialExpirations() {
  try {
    console.log('Checking for expired trial subscriptions...');
    
    const now = new Date();
    
    // Find all users on active trials that have expired
    const expiredTrialUsers = await prisma.user.findMany({
      where: {
        subscriptionStatus: 'TRIALING',
        trialEndDate: {
          lt: now
        }
      }
    });
    
    console.log(`Found ${expiredTrialUsers.length} users with expired trials`);
    
    // Update their status to trial_expired
    if (expiredTrialUsers.length > 0) {
      for (const user of expiredTrialUsers) {
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            subscriptionStatus: 'TRIAL_EXPIRED'
          }
        });
        
        console.log(`Updated user ${user.id} (${user.email}) to TRIAL_EXPIRED`);
        
        // Optional: Send notifications to users about their expired trials
        try {
          await prisma.notification.create({
            data: {
              id: Date.now().toString() + Math.random().toString().slice(2, 8),
              type: 'TRIAL_EXPIRED',
              title: 'Your Free Trial Has Expired',
              message: 'Your free trial period has ended. Please subscribe to continue using our premium features.',
              status: 'UNREAD',
              userId: user.id,
              createdAt: now,
              updatedAt: now
            }
          });
        } catch (notifError) {
          console.error(`Error creating notification for user ${user.id}:`, notifError);
        }
      }
      
      console.log('Successfully updated all expired trial users');
    }
  } catch (error) {
    console.error('Error checking trial expirations:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTrialExpirations()
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 