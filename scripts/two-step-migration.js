const { PrismaClient } = require('@prisma/client');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const prisma = new PrismaClient();

async function twoStepMigration() {
  console.log('Starting two-step subscription status migration...');
  
  try {
    // Step 1: Check current subscription status distribution
    const statusCounts = await prisma.user.groupBy({
      by: ['subscriptionStatus'],
      _count: {
        _all: true
      }
    });
    
    console.log('Current subscription status distribution:');
    console.table(statusCounts);
    
    // Step 2: Update subscriptions manually using raw SQL
    console.log('Updating users with old subscription statuses using raw SQL...');
    
    try {
      // Update BASIC to PREMIUM
      await prisma.$executeRaw`UPDATE User SET subscriptionStatus = 'PREMIUM' WHERE subscriptionStatus = 'BASIC'`;
      console.log('Updated BASIC to PREMIUM');
      
      // Update PRO to PREMIUM
      await prisma.$executeRaw`UPDATE User SET subscriptionStatus = 'PREMIUM' WHERE subscriptionStatus = 'PRO'`;
      console.log('Updated PRO to PREMIUM');
      
      // Update active to PREMIUM
      await prisma.$executeRaw`UPDATE User SET subscriptionStatus = 'PREMIUM' WHERE subscriptionStatus = 'active'`;
      console.log('Updated active to PREMIUM');
    } catch (sqlError) {
      console.error('SQL error:', sqlError);
    }
    
    // Step 3: Final check
    const finalDistribution = await prisma.user.groupBy({
      by: ['subscriptionStatus'],
      _count: {
        _all: true
      }
    });
    
    console.log('Final subscription status distribution:');
    console.table(finalDistribution);
    
    console.log('Migration completed. You can now update the schema to remove the old values.');
    
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

twoStepMigration(); 