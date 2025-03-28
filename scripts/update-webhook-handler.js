// Update the webhook handler to use only FREE and PREMIUM values
const fs = require('fs');
const path = require('path');

const webhookPath = path.join(__dirname, '..', 'src', 'app', 'api', 'webhooks', 'stripe', 'route.ts');

// Read the file
try {
  console.log(`Reading file: ${webhookPath}`);
  const fileContent = fs.readFileSync(webhookPath, 'utf8');
  
  // Create a backup
  fs.writeFileSync(webhookPath + '.bak', fileContent);
  console.log('Backup created');
  
  // Replace the local enum with the simplified version
  let updatedContent = fileContent.replace(
    /enum SubscriptionStatus {[\s\S]*?}/,
    'enum SubscriptionStatus {\n  FREE = \'FREE\',\n  PREMIUM = \'PREMIUM\'\n}'
  );
  
  // Remove any typescript ignore comments related to subscription status
  updatedContent = updatedContent.replace(/\/\/ @ts-ignore: Using local enum to match schema changes/g, '');
  
  // Write the updated content back to the file
  fs.writeFileSync(webhookPath, updatedContent);
  console.log('Webhook handler updated successfully');
  
} catch (error) {
  console.error('Error updating webhook handler:', error);
} 