const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateSubscriptionStatus() {
  console.log('Starting direct SQL update for subscription status...');
  
  try {
    // Use direct SQL to bypass Prisma's type checking
    const connection = prisma.$connect();
    
    // Find all users with old subscription status values
    await prisma.$transaction(async (tx) => {
      // First check what users we have
      const users = await tx.user.findMany({
        select: {
          id: true,
          email: true,
          subscriptionStatus: true
        },
        orderBy: {
          email: 'asc'
        }
      });
      
      console.log('Found users:', users.length);
      
      // Now update each user with non-FREE/PREMIUM status to PREMIUM
      for (const user of users) {
        if (user.subscriptionStatus !== 'FREE' && user.subscriptionStatus !== 'PREMIUM') {
          console.log(`Updating user ${user.email} from ${user.subscriptionStatus} to PREMIUM`);
          
          await tx.$executeRawUnsafe(`
            UPDATE User 
            SET subscriptionStatus = 'PREMIUM'
            WHERE id = '${user.id}'
          `);
        }
      }
      
      // Check the results
      const updatedUsers = await tx.user.findMany({
        select: {
          id: true, 
          email: true,
          subscriptionStatus: true
        },
        orderBy: {
          email: 'asc'
        }
      });
      
      console.log('User status after update:');
      for (const user of updatedUsers) {
        console.log(`${user.email}: ${user.subscriptionStatus}`);
      }
    });
    
    console.log('Database update completed.');
    
  } catch (error) {
    console.error('Error during direct SQL update:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateSubscriptionStatus(); 