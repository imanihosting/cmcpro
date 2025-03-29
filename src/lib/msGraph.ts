import { Client } from "@microsoft/microsoft-graph-client";
import { ClientSecretCredential } from "@azure/identity";
import type { User } from '@prisma/client';

/**
 * Get the Microsoft Graph client
 * This uses an app-only authentication flow with client credentials
 */
export function getGraphClient() {
  // Get credentials from environment variables
  const tenantId = process.env.MICROSOFT_GRAPH_TENANT_ID;
  const clientId = process.env.MICROSOFT_GRAPH_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_GRAPH_CLIENT_SECRET;
  
  // Validate all required credentials are available
  if (!tenantId) {
    console.error('Microsoft Graph tenant ID is not configured');
    throw new Error('Microsoft Graph tenant ID is not configured');
  }
  
  if (!clientId) {
    console.error('Microsoft Graph client ID is not configured');
    throw new Error('Microsoft Graph client ID is not configured');
  }
  
  if (!clientSecret) {
    console.error('Microsoft Graph client secret is not configured');
    throw new Error('Microsoft Graph client secret is not configured');
  }
  
  try {
    // Create credential with Azure Identity library
    const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
    
    // Initialize Microsoft Graph client with credential
    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: async () => {
          try {
            const response = await credential.getToken("https://graph.microsoft.com/.default");
            return response.token;
          } catch (error) {
            console.error('Failed to get access token for Microsoft Graph:', error);
            throw error;
          }
        }
      }
    });
    
    return client;
  } catch (error) {
    console.error('Failed to initialize Microsoft Graph client:', error);
    throw error;
  }
}

interface EmailOptions {
  to: string;
  subject: string;
  body: string;
  isHtml?: boolean;
}

/**
 * Send an email using Microsoft Graph
 * 
 * Note: Using Microsoft Graph for sending emails with application permissions requires
 * specific configurations in Azure AD:
 * 1. The app must have Mail.Send permissions in the Microsoft Graph API
 * 2. An admin must grant consent to these permissions
 * 3. The from address must be properly configured
 */
export async function sendEmail({ to, subject, body, isHtml = true }: EmailOptions): Promise<void> {
  try {
    // Check if we're in development mode and email is not fully configured
    if (process.env.NODE_ENV === 'development' && 
        (!process.env.MICROSOFT_GRAPH_TENANT_ID || 
         !process.env.MICROSOFT_GRAPH_CLIENT_ID || 
         !process.env.MICROSOFT_GRAPH_CLIENT_SECRET ||
         !process.env.MICROSOFT_GRAPH_USER_ID)) {
      // Log the email instead of sending it
      console.log('----------------');
      console.log('Email not sent (development mode):');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${body.substring(0, 100)}...`);
      console.log('----------------');
      return;
    }
    
    // Validate required environment variables
    const userId = process.env.MICROSOFT_GRAPH_USER_ID;
    const fromEmail = process.env.MICROSOFT_GRAPH_FROM_EMAIL;
    
    if (!fromEmail) {
      console.error('Microsoft Graph sender email is not configured');
      throw new Error('Microsoft Graph sender email is not configured');
    }

    if (!userId) {
      console.error('Microsoft Graph user ID is not configured');
      throw new Error('Microsoft Graph user ID is not configured');
    }
    
    // Get Microsoft Graph client
    const client = getGraphClient();
    
    // This approach uses the Microsoft Graph "createMessage" and "send" endpoints
    // instead of the "sendMail" endpoint, which can have permission issues
    
    // 1. Create a draft message
    const messageData = {
      subject,
      body: {
        contentType: isHtml ? 'HTML' : 'Text',
        content: body
      },
      toRecipients: [
        {
          emailAddress: {
            address: to
          }
        }
      ]
    };
    
    const message = await client
      .api(`/users/${userId}/messages`)
      .post(messageData);
    
    // 2. Send the created message
    await client
      .api(`/users/${userId}/messages/${message.id}/send`)
      .post({});
    
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error; // Rethrow the error to be handled by the caller
  }
}

/**
 * Send a notification email to a user
 */
export async function sendNotificationEmail(user: User, subject: string, content: string): Promise<void> {
  if (!user.email) {
    throw new Error('Cannot send email: User has no email address');
  }
  
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 5px;
        }
        .header {
          background-color: #7c3aed;
          color: white;
          padding: 10px 20px;
          border-radius: 5px 5px 0 0;
          display: flex;
          align-items: center;
        }
        .logo {
          display: flex;
          align-items: center;
          font-weight: bold;
          font-size: 20px;
        }
        .logo-icon {
          margin-right: 10px;
          font-size: 24px;
        }
        .logo-text {
          background: linear-gradient(to right, #9333ea, #7c3aed);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          display: inline-block;
          font-weight: bold;
        }
        .content {
          padding: 20px;
        }
        .footer {
          margin-top: 20px;
          font-size: 12px;
          color: #666;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">
            <span class="logo-icon">👶</span>
            <span class="logo-text">ChildminderConnect</span>
          </div>
        </div>
        <div class="content">
          <p>Hello ${user.name || 'there'},</p>
          ${content}
          <p>Thank you,<br>The Childminder Connect Team</p>
        </div>
        <div class="footer">
          <p>This is an automated message, please do not reply directly to this email.</p>
          <p>&copy; ${new Date().getFullYear()} Childminder Connect. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  await sendEmail({
    to: user.email,
    subject,
    body: htmlBody,
    isHtml: true
  });
}

/**
 * Send a booking confirmation email to a parent
 */
export async function sendBookingConfirmationEmail(
  user: User, 
  childminderName: string,
  bookingDate: Date,
  startTime: string,
  endTime: string
): Promise<void> {
  if (!user.email) {
    throw new Error('Cannot send booking confirmation: User has no email address');
  }
  
  const formattedDate = new Date(bookingDate).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const content = `
    <p>Your booking with ${childminderName} has been confirmed.</p>
    <p><strong>Details:</strong></p>
    <ul>
      <li><strong>Date:</strong> ${formattedDate}</li>
      <li><strong>Time:</strong> ${startTime} - ${endTime}</li>
    </ul>
    <p>You can view and manage your bookings in your <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/parent/bookings">dashboard</a>.</p>
  `;
  
  await sendNotificationEmail(user, 'Booking Confirmation', content);
} 