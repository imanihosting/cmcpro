const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateSubscriptionEnum() {
  try {
    console.log('Running subscription enum update script...');
    
    // 1. Create security setting for enabling/disabling free trial
    const existingSetting = await prisma.securitySetting.findUnique({
      where: {
        key: 'enable_free_trial'
      }
    });

    if (!existingSetting) {
      await prisma.securitySetting.create({
        data: {
          id: Date.now().toString(), // Simple ID generation
          key: 'enable_free_trial',
          value: 'false', // Default to disabled
          description: 'When enabled, new users will receive a free trial based on their role (Parent: 30 days, Childminder: 60 days)',
          type: 'boolean',
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log('Created enable_free_trial security setting');
    } else {
      console.log('enable_free_trial security setting already exists');
    }

    console.log('Subscription enum update completed successfully');
  } catch (error) {
    console.error('Error updating subscription enum:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateSubscriptionEnum()
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 