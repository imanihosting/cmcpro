// Test script for Microsoft Graph email sending
// Run with: node src/scripts/test-email.js

require('dotenv').config();
const { ClientSecretCredential } = require('@azure/identity');
const { Client } = require('@microsoft/microsoft-graph-client');

async function testGraphEmail() {
  console.log('Testing Microsoft Graph email configuration...');
  
  // Check environment variables
  console.log('Environment variables:');
  console.log('- MICROSOFT_GRAPH_TENANT_ID:', process.env.MICROSOFT_GRAPH_TENANT_ID ? '✓ Set' : '✗ Missing');
  console.log('- MICROSOFT_GRAPH_CLIENT_ID:', process.env.MICROSOFT_GRAPH_CLIENT_ID ? '✓ Set' : '✗ Missing');
  console.log('- MICROSOFT_GRAPH_CLIENT_SECRET:', process.env.MICROSOFT_GRAPH_CLIENT_SECRET ? '✓ Set' : '✗ Missing');
  console.log('- MICROSOFT_GRAPH_USER_ID:', process.env.MICROSOFT_GRAPH_USER_ID ? `✓ ${process.env.MICROSOFT_GRAPH_USER_ID}` : '✗ Missing');
  console.log('- MICROSOFT_GRAPH_FROM_EMAIL:', process.env.MICROSOFT_GRAPH_FROM_EMAIL ? `✓ ${process.env.MICROSOFT_GRAPH_FROM_EMAIL}` : '✗ Missing');
  console.log('- MICROSOFT_GRAPH_SUPPORT_EMAIL:', process.env.MICROSOFT_GRAPH_SUPPORT_EMAIL ? `✓ ${process.env.MICROSOFT_GRAPH_SUPPORT_EMAIL}` : '✗ Missing');
  
  // Verify required variables
  const tenantId = process.env.MICROSOFT_GRAPH_TENANT_ID;
  const clientId = process.env.MICROSOFT_GRAPH_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_GRAPH_CLIENT_SECRET;
  const userId = process.env.MICROSOFT_GRAPH_USER_ID;
  const fromEmail = process.env.MICROSOFT_GRAPH_FROM_EMAIL;
  const testEmail = process.env.MICROSOFT_GRAPH_SUPPORT_EMAIL || 'test@example.com';
  
  if (!tenantId || !clientId || !clientSecret || !fromEmail || !userId) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
  }
  
  try {
    console.log('\nInitializing Microsoft Graph client...');
    // Create credential
    const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
    
    // Initialize Microsoft Graph client
    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: async () => {
          try {
            const response = await credential.getToken("https://graph.microsoft.com/.default");
            return response.token;
          } catch (error) {
            console.error('Failed to get access token:', error);
            throw error;
          }
        }
      }
    });
    
    console.log('✓ Microsoft Graph client initialized');
    console.log(`\nSending test email to ${testEmail}...`);
    
    // 1. Create a draft message
    const messageData = {
      subject: 'Test Email from Childminder Connect',
      body: {
        contentType: 'HTML',
        content: `
          <h1>Test Email</h1>
          <p>This is a test email from Childminder Connect to verify Microsoft Graph configuration.</p>
          <p>If you're receiving this email, it means the email sending functionality is working correctly!</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
          <p>Using two-step message creation and sending process.</p>
        `
      },
      toRecipients: [
        {
          emailAddress: {
            address: testEmail
          }
        }
      ]
    };
    
    console.log('Creating draft message...');
    const message = await client
      .api(`/users/${userId}/messages`)
      .post(messageData);
    
    console.log(`Draft message created with ID: ${message.id}`);
    
    // 2. Send the created message
    console.log('Sending the message...');
    await client
      .api(`/users/${userId}/messages/${message.id}/send`)
      .post({});
    
    console.log('✅ Email sent successfully!');
  } catch (error) {
    console.error('❌ Error sending email:');
    console.error(error);
    process.exit(1);
  }
}

// Execute the test
testGraphEmail()
  .then(() => {
    console.log('Test completed successfully');
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  }); 