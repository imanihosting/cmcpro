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
          padding: 15px 20px;
          border-radius: 5px 5px 0 0;
        }
        .logo {
          display: flex;
          align-items: center;
        }
        .logo-icon {
          width: 28px;
          height: 28px;
          margin-right: 10px;
        }
        .logo-text {
          color: white;
          font-weight: bold;
          font-size: 20px;
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
            <img class="logo-icon" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48IS0tIUZvbnQgQXdlc29tZSBGcmVlIDYuNS4xIGJ5IEBmb250YXdlc29tZSAtIGh0dHBzOi8vZm9udGF3ZXNvbWUuY29tIExpY2Vuc2UgLSBodHRwczovL2ZvbnRhd2Vzb21lLmNvbS9saWNlbnNlL2ZyZWUgQ29weXJpZ2h0IDIwMjQgRm9udGljb25zLCBJbmMuLS0+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0zMjAgMzUwLjZjLTYuNCA1LjEtMTUuMiA2LjY1LTIzLjIgNC4xMUMyODQgMzUwLjEgMjY3LjcgMzQ0LjkgMjU2IDMzNC43djE3LjMzYzAgNC40NDgtMy41ODQgOC4wMy04IDguMDNoLTY0Yy00LjQxNiAwLTgtMy41ODItOC04VjE2MGMwLTQuNDE4IDMuNTg0LTggOC04aDY0YzQuNDE2IDAgOCAzLjU4MiA4IDh2MTIxLjVjLjI4MTMtLjYyNTIgLjUzMTMtMS4yNSAuODQzOC0xLjg3NUM2My45OSAxOTAuNCAxOTYuOCAzOC4wNCAxODcuNSAzNy41OWM1OS4zLTExLjMgMTIwLjggMi45OTQgMTc1LjQgNTAuNDdsMTIuNzUgMTEuMWM0LjM0OSAzLjc2OSA0LjgyNSAxMC40MiAxLjA1NSAxNC43NmMtMy43NSA0LjM5OS0xMC4zOSA0Ljg3NC0xNC43NiAxLjA1NkwzNDkuMyAxMDQuMWMtMTEuNTgtOS41MzEtMjMuNjMtMTcuMjEtMzYtMjMuMTVjLTQzLjkyIDE0LjkyLTgzLjg2IDQyLjk0LTExNy4xIDgyLjM5Yy0yOC29tLTM0LjA1IDM1LjEyQTM0MS4zNSAzNDEuMzUgMCA1ms3Ni40MzhjNzguOTdzMjg1LjEtODUuMDQgMzAzLjItMTI1LjFjLTYuMDA2LTQ5LjgtMzAuNTktOTUuMzEtNzEuMjgtMTI3LjkDLTEuOTQtMS41ODQtMi43MjUtNC4zNzUtMS4yMzItNi4yMDNjMTIuMTYtMTQuODggMzUuNTktMTEuNzQgNDMuODEgNC42NTZDNDc0LjgxIDE2My4xIDQ5MCAyMTEuMiA0OTAgMjYwLjAxYzAgODguMzgtNzEuNjkgMTYzLjM5LTE2NC4yIDE2My4zOWMtMzAuMjYgMC01OC4zMS04LjU2Mi04My43NC0yMi44M0MyMjUuMSA0MDcuMyAyMDggNDExLjggMTk0LjkgNDAzLjJjLTEzLTguMzQ0LTE1LjM3LTI4LjMxLTcuODQ0LTQzLjFDMjAzLjggMzM1LjUgMjM2LjYgMzMzLjEgMjU2IDM0MS43djY0LjZjLTQxLjg3LTExLjI1LTc2LjMxLTQxLjA0LTkzLjQ2LTgxLjJDMTE3LjggMjgwLjggOTIuMzcgMjQxLjcgODAuNjggMTk2LjVjLTEuMjUtNC44MTIgMS43MTktOS43MTkgNi41MzEtMTEgNC44MTktMS4yMTkgOS43NSAxLjc4MSAxMSA2LjU5NEM5Ni43NCAyMDMuNCAxMDMuOSAyMTQuNiAxMTIuMiAyMjQuNmMuODEyNSAzLjA5NCAxLjYwMyA2LjIwMyAyLjUzMSA5LjI2NmMuMTk5MiAuNjc1OCAuNTExNyAxLjI2NiAuNzQ5OCAxLjkzOGMxLjAyIDMuMDk0IDIuOSA1LjgxMiA0LjEwOSA4LjgyOGEyMjguMDQgMjI4LjA0IDAgMCAwIDUuODEzIDE0LjAzYzEuMTggMi41NjMgMi41NzQgNC45ODggMy44NzMgNy40NjlhMS4wMSAxLjAxIDAgMCAxIC4xNDg0IC4yNDIyYy4xNzk3IC4zMzk4IC4yNjE3IC42OTkyIC40NjA5IDEuMDM5YTI0MC40MiAyNDAuNDIgMCAwIDAgNzkuNzMgOTMuMDZjMS4yOTMgLjgyMDMgMi44MTYgMS4xNjggNC4zMjQgMS40MThjLjI0MjIgLjAzOTEgLjQ4ODMgLjEwOTQgLjcwMzEgLjE0ODRjMS4yMiAuMTc5NyAyLjQzICjE5NyAzLjYzMyAuMzM5OGExMzYuMzYgMTM2LjM2IDAgMCAwinQwNy4yIDF2LTM3LjI3Yy01LjYwOSAzLjcwMy0xMS4yNSA3LjM0NC0xNi4xOCAxMS40MUMzMjguOSAzMzkgMzI1LjcgMzQ2LjEgMzIwIDM1MC42eiIvPjwvc3ZnPg==" alt="Baby Icon" />
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