# Microsoft Graph Email Setup

This guide will help you set up Microsoft Graph for sending emails from the Childminders Connect application.

## Prerequisites

- An Azure account with admin access
- Microsoft 365 subscription (for email sending capabilities)

## Setup Steps

1. **Register an Application in Azure AD**

   - Go to the [Azure Portal](https://portal.azure.com)
   - Navigate to "Azure Active Directory" > "App registrations" > "New registration"
   - Name your application (e.g., "Childminders Connect")
   - Select "Accounts in this organizational directory only" for supported account types
   - Set the redirect URI to your app's URL (e.g., http://localhost:3000/api/auth/callback/azure-ad)
   - Click "Register"

2. **Configure API Permissions**

   - In your newly created app, go to "API permissions"
   - Click "Add a permission" > "Microsoft Graph" > "Application permissions"
   - Add the following permissions:
     - `Mail.Send`
     - `Mail.ReadWrite`
     - `User.Read.All`
   - Click "Add permissions"
   - Click "Grant admin consent for [your organization]"

3. **Create a Client Secret**

   - Go to "Certificates & secrets"
   - Click "New client secret"
   - Add a description and select an expiration period
   - Click "Add"
   - **IMPORTANT**: Copy the secret value immediately, as it won't be shown again

4. **Update Environment Variables**

   Add the following variables to your `.env` file:

   ```
   # Microsoft Graph Configuration
   MICROSOFT_GRAPH_TENANT_ID=your-tenant-id
   MICROSOFT_GRAPH_CLIENT_ID=your-client-id
   MICROSOFT_GRAPH_CLIENT_SECRET=your-client-secret
   MICROSOFT_GRAPH_FROM_EMAIL=no-reply@yourdomain.com
   MICROSOFT_GRAPH_SUPPORT_EMAIL=support@yourdomain.com
   ```

   Replace the values with your actual Azure AD tenant ID, client ID, client secret, and the email addresses you want to use.

## Email Features

The application uses Microsoft Graph for the following email functionality:

1. **Welcome Emails**
   - Automatically sent to new users when they register
   - Customized based on user role (parent or childminder)
   - Contains links to get started with the platform

2. **Password Reset**
   - Users can request password reset via `/api/auth/forgot-password`
   - Secure tokens sent via email
   - Confirmation email sent after successful reset

3. **Contact Form**
   - Contact form submissions are sent to support staff
   - Auto-reply sent to the person who submitted the form
   - Support tickets created in the database

4. **Booking Notifications**
   - Notifications sent when booking status changes
   - Different messages for parents and childminders

5. **New Message Alerts**
   - Email notifications when users receive new messages

## Testing Endpoints

### Password Reset

```
POST /api/auth/forgot-password
{
  "email": "user@example.com"
}
```

### Contact Form

```
POST /api/contact
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Question about service",
  "message": "I'd like to know more about your service."
}
```

### Test Email

```
POST /api/notifications/email
{
  "recipientId": "user-id-here",
  "subject": "Test Email",
  "content": "<p>This is a test email from Childminders Connect.</p>"
}
```

## Troubleshooting

- **Permission Issues**: Make sure you've granted admin consent for the required permissions
- **Authentication Errors**: Verify your tenant ID, client ID, and client secret
- **Sending Failures**: Check that the sending email address is a valid mailbox in your Microsoft 365 tenant
- **Email Templates**: Check the HTML content if emails aren't displaying correctly

## Security Considerations

- The client secret grants access to send emails as your application. Keep it secure and never commit it to version control.
- Rotate your client secret periodically
- Consider using Azure Key Vault for production environments
- All password reset tokens expire after 1 hour for security

## Additional Resources

- [Microsoft Graph Mail API Documentation](https://learn.microsoft.com/en-us/graph/api/resources/mail-api-overview)
- [Microsoft Graph JavaScript SDK](https://github.com/microsoftgraph/msgraph-sdk-javascript)
- [Azure AD Application Authentication](https://learn.microsoft.com/en-us/azure/active-directory/develop/authentication-flows-app-scenarios) 