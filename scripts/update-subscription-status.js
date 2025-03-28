const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateSubscriptionStatus() {
  console.log('Starting targeted subscription status update...');
  
  try {
    // Update PRO users to PREMIUM
    const proUpdated = await prisma.user.updateMany({
      where: {
        subscriptionStatus: 'PRO'
      },
      data: {
        subscriptionStatus: 'PREMIUM'
      }
    });
    
    console.log(`Updated ${proUpdated.count} users from PRO to PREMIUM`);
    
    // Update BASIC users to PREMIUM
    const basicUpdated = await prisma.user.updateMany({
      where: {
        subscriptionStatus: 'BASIC'
      },
      data: {
        subscriptionStatus: 'PREMIUM'
      }
    });
    
    console.log(`Updated ${basicUpdated.count} users from BASIC to PREMIUM`);
    
    // Update active users to PREMIUM
    const activeUpdated = await prisma.user.updateMany({
      where: {
        subscriptionStatus: 'active'
      },
      data: {
        subscriptionStatus: 'PREMIUM'
      }
    });
    
    console.log(`Updated ${activeUpdated.count} users from active to PREMIUM`);
    
    // Check the result
    const results = await prisma.user.groupBy({
      by: ['subscriptionStatus'],
      _count: {
        _all: true
      }
    });
    
    console.log('Updated subscription status counts:');
    console.table(results);
    
  } catch (error) {
    console.error('Error during update:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateSubscriptionStatus(); 