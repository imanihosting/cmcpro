const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateSubscriptionStatus() {
  console.log('Starting subscription status migration...');
  
  try {
    // Update users with 'BASIC', 'PRO', or 'active' to 'PREMIUM'
    const updatedCount = await prisma.$executeRaw`
      UPDATE User 
      SET subscriptionStatus = 'PREMIUM' 
      WHERE subscriptionStatus IN ('BASIC', 'PRO', 'active')
    `;
    
    console.log(`Successfully updated ${updatedCount} users to PREMIUM status`);
    
    // Verify no users have invalid subscription status
    const remainingInvalidUsers = await prisma.user.findMany({
      where: {
        subscriptionStatus: {
          notIn: ['FREE', 'PREMIUM']
        }
      },
      select: {
        id: true,
        email: true,
        subscriptionStatus: true
      }
    });
    
    if (remainingInvalidUsers.length > 0) {
      console.error('There are still users with invalid subscription status:');
      console.table(remainingInvalidUsers);
    } else {
      console.log('All users now have valid subscription status (FREE or PREMIUM)');
    }
    
  } catch (error) {
    console.error('Error migrating subscription status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateSubscriptionStatus(); 