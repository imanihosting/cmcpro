import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { ClientSecretCredential } from '@azure/identity';

type EmailOptions = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  from?: string;
  cc?: string;
  bcc?: string;
};

/**
 * Sends an email using Microsoft Graph API
 * @param options Email options including to, subject, text, html, etc.
 * @returns Promise that resolves when email is sent
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const { to, subject, text, html, from, cc, bcc } = options;
    
    // Get environment variables
    const TENANT_ID = process.env.MICROSOFT_GRAPH_TENANT_ID;
    const CLIENT_ID = process.env.MICROSOFT_GRAPH_CLIENT_ID;
    const CLIENT_SECRET = process.env.MICROSOFT_GRAPH_CLIENT_SECRET;
    const EMAIL_FROM = process.env.EMAIL_FROM || process.env.MICROSOFT_GRAPH_USER_EMAIL;
    
    if (!TENANT_ID || !CLIENT_ID || !CLIENT_SECRET || !EMAIL_FROM) {
      throw new Error('Missing Microsoft Graph API credentials');
    }
    
    // Create credential
    const credential = new ClientSecretCredential(TENANT_ID, CLIENT_ID, CLIENT_SECRET);
    
    // Create authentication provider
    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
      scopes: ['https://graph.microsoft.com/.default']
    });
    
    // Initialize Graph client
    const graphClient = Client.initWithMiddleware({
      authProvider
    });
    
    // Create the email message
    const message = {
      message: {
        subject,
        body: {
          contentType: 'HTML',
          content: html || text
        },
        toRecipients: [
          {
            emailAddress: {
              address: to
            }
          }
        ],
        ccRecipients: [] as { emailAddress: { address: string } }[],
        bccRecipients: [] as { emailAddress: { address: string } }[]
      },
      saveToSentItems: true
    };
    
    // Add CC recipients if specified
    if (cc) {
      message.message.ccRecipients = cc.split(',').map(email => ({
        emailAddress: {
          address: email.trim()
        }
      }));
    }
    
    // Add BCC recipients if specified
    if (bcc) {
      message.message.bccRecipients = bcc.split(',').map(email => ({
        emailAddress: {
          address: email.trim()
        }
      }));
    }
    
    // Send the email using Microsoft Graph API
    await graphClient.api(`/users/${EMAIL_FROM}/sendMail`).post(message);
    
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Formats a date as a readable string (e.g., "June 1, 2023")
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  }).format(date);
} 