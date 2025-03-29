import { sendEmail } from '@/lib/msGraph';

/**
 * Test script to verify Microsoft Graph email configuration
 * 
 * Run with: 
 * NODE_ENV=production ts-node -r tsconfig-paths/register src/scripts/test-email.ts
 */
async function testEmailSending() {
  console.log('Testing Microsoft Graph email sending...');
  
  try {
    // Log environment variables (without secrets)
    console.log('Environment variables:');
    console.log('- MICROSOFT_GRAPH_TENANT_ID:', process.env.MICROSOFT_GRAPH_TENANT_ID ? '✓ Set' : '✗ Missing');
    console.log('- MICROSOFT_GRAPH_CLIENT_ID:', process.env.MICROSOFT_GRAPH_CLIENT_ID ? '✓ Set' : '✗ Missing');
    console.log('- MICROSOFT_GRAPH_CLIENT_SECRET:', process.env.MICROSOFT_GRAPH_CLIENT_SECRET ? '✓ Set' : '✗ Missing');
    console.log('- MICROSOFT_GRAPH_FROM_EMAIL:', process.env.MICROSOFT_GRAPH_FROM_EMAIL ? `✓ ${process.env.MICROSOFT_GRAPH_FROM_EMAIL}` : '✗ Missing');
    
    // Test recipient email - replace with a real test email
    const testEmail = process.env.MICROSOFT_GRAPH_SUPPORT_EMAIL || 'test@example.com';
    
    console.log(`\nSending test email to ${testEmail}...`);
    
    // Send a test email
    await sendEmail({
      toEmail: testEmail,
      subject: 'Test Email from Childminders Connect',
      body: `
        <h1>Test Email</h1>
        <p>This is a test email from Childminders Connect to verify Microsoft Graph configuration.</p>
        <p>If you're receiving this email, it means the email sending functionality is working correctly!</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `,
      isHtml: true
    });
    
    console.log('✅ Email sent successfully!');
  } catch (error) {
    console.error('❌ Error sending email:');
    console.error(error);
    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testEmailSending()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Uncaught error:', error);
      process.exit(1);
    });
} 