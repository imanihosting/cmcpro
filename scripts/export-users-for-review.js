const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient({
  // Enable logging of SQL queries
  log: ['query'],
});

async function exportUsers() {
  console.log('Exporting users for review...');
  
  try {
    // First try to get raw connection to run SQL
    try {
      const result = await prisma.$queryRawUnsafe(
        `SELECT id, email, name, role, subscriptionStatus FROM User ORDER BY email`
      );
      
      console.log(`Found ${result.length} users`);
      
      // Write results to a file
      fs.writeFileSync(
        'users-export.json', 
        JSON.stringify(result, null, 2)
      );
      
      console.log('User data exported to users-export.json');
      
      // Count by subscription status
      const counts = {};
      result.forEach(user => {
        const status = user.subscriptionStatus;
        counts[status] = (counts[status] || 0) + 1;
      });
      
      console.log('Subscription status counts:');
      console.table(counts);
      
    } catch (sqlError) {
      console.error('SQL query error:', sqlError);
    }
    
  } catch (error) {
    console.error('Error exporting users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportUsers(); 