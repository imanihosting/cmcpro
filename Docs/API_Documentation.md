# Childminder Connect API Documentation

This document provides a comprehensive overview of all API endpoints available in the Childminder Connect application. The API is organized into logical sections based on functionality.

## Tech Stack

The Childminder Connect application is built using the following technologies:

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: MySQL
- **Authentication**: NextAuth.js
- **Payment Processing**: Stripe
- **Email Services**: Microsoft Graph API
- **Real-time Communication**: Server-Sent Events (SSE), potentially WebSockets
- **Deployment**: Vercel (Frontend and API Routes)
- **Storage**: Vercel Blob Storage (for documents and images)
- **Monitoring**: Custom built monitoring dashboard

## Table of Contents
- [Authentication](#authentication)
- [User Management](#user-management)
- [Dashboard](#dashboard)
  - [Parent](#parent-dashboard)
  - [Childminder](#childminder-dashboard)
  - [Admin](#admin-dashboard)
- [Bookings & Childminders](#bookings--childminders)
- [Messages](#messages)
- [Subscription & Payments](#subscription--payments)
- [Documents & Compliance](#documents--compliance)
- [System](#system)
- [Support](#support)
- [Live Chat](#live-chat)
- [Calendar Sync](#calendar-sync)
- [Cron Jobs](#cron-jobs)
- [Real-time Communication](#real-time-communication)

---

## Authentication

### `/api/auth/[...nextauth]`
NextAuth integration for handling authentication flows.

**Methods**:
- Implements OAuth providers and credential-based authentication
- Handles sessions and JWT tokens

### `/api/auth/register`
Register a new user account.

**Methods**:
- `POST`: Create a new user account
  - Accepts user details including email, password, name, and role
  - Validates input data and checks for existing emails
  - Creates a new user record in the database

### `/api/auth/logout`
Logout the current user.

**Methods**:
- `POST`: Clear session and logged-in state
  - Removes auth cookies and invalidates the current session

### `/api/auth/forgot-password`
Request a password reset link.

**Methods**:
- `POST`: Send a password reset email
  - Generates a secure token and sends an email with reset instructions

### `/api/auth/reset-password`
Reset a user's password.

**Methods**:
- `POST`: Reset password using a valid token
  - Validates the reset token
  - Updates the user's password in the database

### `/api/auth/chat-status`
Manage user's chat availability status.

**Methods**:
- `GET`: Retrieve current chat status
- `PATCH`: Update chat status (e.g., available, busy, offline)

---

## User Management

### `/api/users/me`
Get the current authenticated user's information.

**Methods**:
- `GET`: Retrieve current user details
  - Returns user profile data excluding sensitive information

### `/api/user/profile`
Manage the current user's profile.

**Methods**:
- `GET`: Retrieve detailed profile information
- `PATCH`: Update profile information
  - Accepts various profile fields like bio, contact info, etc.

### `/api/user/password`
Change the current user's password.

**Methods**:
- `PATCH`: Update password
  - Requires current password for verification
  - Validates and updates to the new password

### `/api/user/2fa/status`
Check Two-Factor Authentication status.

**Methods**:
- `GET`: Get current 2FA status for the user

### `/api/user/2fa/setup`
Setup Two-Factor Authentication.

**Methods**:
- `POST`: Begin 2FA setup
  - Generates and returns a TOTP secret and QR code

### `/api/user/2fa/verify`
Verify Two-Factor Authentication code.

**Methods**:
- `POST`: Verify a TOTP code
  - Validates the provided code against the user's secret

### `/api/user/2fa/disable`
Disable Two-Factor Authentication.

**Methods**:
- `POST`: Turn off 2FA for the user account
  - Requires verification before disabling

### `/api/user/activity`
Get user activity history.

**Methods**:
- `GET`: Retrieve user activity logs
  - Returns a paginated list of user actions and system events

### `/api/user/notification-preferences`
Manage notification settings.

**Methods**:
- `GET`: Get current notification preferences
- `PATCH`: Update notification preferences
  - Customize which notifications to receive and delivery methods

### `/api/user/last-minute-schedule`
Manage user's last-minute availability or booking schedule.

**Methods**:
- `GET`: Retrieve last-minute schedule/availability
- `POST`: Add/update last-minute schedule entry
- `DELETE`: Remove a last-minute schedule entry

### `/api/user/last-minute-settings`
Manage settings related to last-minute bookings.

**Methods**:
- `GET`: Retrieve last-minute booking settings
- `PATCH`: Update last-minute booking settings (e.g., notification preferences, auto-accept rules)

---

## Dashboard

### Parent Dashboard

#### `/api/dashboard/parent/stats`
Get parent dashboard statistics.

**Methods**:
- `GET`: Retrieve dashboard stats
  - Returns counts of upcoming bookings, unread messages, registered children
  - Includes subscription status information

#### `/api/dashboard/parent/bookings`
Manage parent bookings.

**Methods**:
- `GET`: List all bookings for the parent
  - Returns a paginated list of bookings with filtering options

#### `/api/dashboard/parent/bookings/create`
Create new bookings.

**Methods**:
- `POST`: Create a new booking request
  - Accepts childminder ID, date/time, children information
  - Validates availability before creating booking

#### `/api/dashboard/parent/bookings/[id]`
Manage a specific booking.

**Methods**:
- `GET`: Get booking details
- `PATCH`: Update booking information
- `DELETE`: Cancel a booking

#### `/api/dashboard/parent/children`
Manage parent's children.

**Methods**:
- `GET`: List all children registered by the parent
- `POST`: Register a new child
  - Accepts child details like name, age, special needs, etc.

#### `/api/dashboard/parent/children/[id]`
Manage a specific child's information.

**Methods**:
- `GET`: Get child details
- `PATCH`: Update child information
- `DELETE`: Remove a child from the parent's account

#### `/api/dashboard/parent/messages`
Manage parent messages.

**Methods**:
- `GET`: List all message conversations
  - Returns a list of conversations with the latest message

#### `/api/dashboard/parent/messages/conversation`
Manage a specific message conversation.

**Methods**:
- `GET`: Get all messages in a conversation
  - Returns a paginated list of messages between the parent and a childminder

#### `/api/dashboard/parent/messages/send`
Send messages to childminders.

**Methods**:
- `POST`: Send a new message
  - Accepts recipient ID and message content

#### `/api/dashboard/parent/calendar`
Manage parent calendar.

**Methods**:
- `GET`: Get calendar events for the parent
  - Returns all bookings formatted as calendar events

### Childminder Dashboard

#### `/api/dashboard/childminder/stats`
Get childminder dashboard statistics.

**Methods**:
- `GET`: Retrieve dashboard stats
  - Returns counts of pending bookings, upcoming appointments
  - Includes profile completeness and subscription info

#### `/api/dashboard/childminder/bookings`
Manage childminder bookings.

**Methods**:
- `GET`: List all bookings for the childminder
  - Returns a paginated list of pending and confirmed bookings

#### `/api/dashboard/childminder/bookings/[id]`
Manage a specific booking.

**Methods**:
- `GET`: Get booking details
- `PATCH`: Update booking status (confirm/reject)

#### `/api/dashboard/childminder/calendar`
Manage childminder calendar and availability.

**Methods**:
- `GET`: Get calendar events and availability blocks
- `POST`: Add availability block
- `DELETE`: Remove availability block

#### `/api/dashboard/childminder/messages`
Manage childminder messages.

**Methods**:
- `GET`: List all message conversations
  - Returns a list of conversations with parents

#### `/api/dashboard/childminder/messages/conversation`
Manage a specific message conversation.

**Methods**:
- `GET`: Get all messages in a conversation
  - Returns a paginated list of messages between the childminder and a parent

#### `/api/dashboard/childminder/messages/send`
Send messages to parents.

**Methods**:
- `POST`: Send a new message
  - Accepts recipient ID and message content

### Admin Dashboard

#### `/api/admin/dashboard`
Get admin dashboard overview.

**Methods**:
- `GET`: Retrieve system-wide statistics
  - Returns user counts, booking stats, revenue info, etc.

#### `/api/admin/users`
Manage all users in the system.

**Methods**:
- `GET`: List all users with pagination and filtering
- `POST`: Create a new user manually

#### `/api/admin/users/[id]`
Manage a specific user.

**Methods**:
- `GET`: Get user details
- `PATCH`: Update user information
- `DELETE`: Delete a user account

#### `/api/admin/users/[id]/reset-password`
Initiate password reset for a user.

**Methods**:
- `POST`: Send password reset email to the specified user
  - Does not require the user's current password
  - Only accessible by admins
  - Logs the action in the activity log

#### `/api/admin/users/search`
Search for users.

**Methods**:
- `GET`: Search for users by various criteria
  - Supports searching by name, email, role, etc.

#### `/api/admin/bookings`
Manage all bookings in the system.

**Methods**:
- `GET`: List all bookings with filtering and sorting

#### `/api/admin/bookings/[id]`
Manage a specific booking.

**Methods**:
- `GET`: Get booking details
- `PATCH`: Update booking information
- `DELETE`: Cancel a booking

#### `/api/admin/messages`
View and manage all messages.

**Methods**:
- `GET`: List all messages with filtering options

#### `/api/admin/messages/conversation`
View a specific conversation.

**Methods**:
- `GET`: Get all messages in a conversation (requires conversation ID)

#### `/api/admin/messages/search`
Search through messages.

**Methods**:
- `GET`: Search for specific messages
  - Supports text search across message content

#### `/api/admin/subscriptions`
Manage subscription plans and user subscriptions.

**Methods**:
- `GET`: List all user subscriptions
  - Returns details of all subscription records

#### `/api/admin/subscriptions/[subscriptionId]`
Manage a specific subscription.

**Methods**:
- `GET`: Get subscription details
- `PATCH`: Update subscription information

#### `/api/admin/subscriptions/cancel`
Cancel a user's subscription.

**Methods**:
- `POST`: Cancel a subscription
  - Initiates cancellation with Stripe
  - Updates local database records

#### `/api/admin/subscriptions/refund`
Issue a refund for a subscription.

**Methods**:
- `POST`: Process a refund
  - Initiates refund with Stripe
  - Updates payment records

#### `/api/admin/monitoring`
Get system monitoring information.

**Methods**:
- `GET`: Retrieve system health metrics
  - Returns API response times, error rates, etc.

#### `/api/admin/logs`
View system logs.

**Methods**:
- `GET`: Retrieve system logs with filtering
  - Returns paginated log entries with severity filtering

#### `/api/admin/make-admin`
Promote a user to admin role.

**Methods**:
- `POST`: Upgrade a user to admin role
  - Requires super-admin privileges

#### `/api/admin/security-settings`
Manage system security settings.

**Methods**:
- `GET`: Retrieve security configuration
- `PATCH`: Update security settings
  - Controls password policies, session timeouts, etc.

#### `/api/admin/settings`
Manage personal admin settings.

**Methods**:
- `GET`: Retrieve admin personal settings
  - Returns notification preferences, two-factor status, and other admin-specific settings
- `PUT`: Update admin personal settings
  - Update notification preferences and other admin-specific settings
  - Toggle two-factor authentication settings

#### `/api/admin/profile`
Manage admin user profile.

**Methods**:
- `GET`: Retrieve admin profile information
  - Returns admin personal information including name, email, bio, etc.
- `PUT`: Update admin profile information
  - Update profile fields like name, phone number, bio, etc.
  - Cannot change email or role

#### `/api/admin/profile-image`
Manage admin profile image.

**Methods**:
- `POST`: Upload or update admin profile image
  - Accepts image upload with validation
  - Stores image and updates user profile

#### `/api/admin/backup-recovery/history`
View backup history.

**Methods**:
- `GET`: Retrieve a list of past backup attempts and their status.

#### `/api/admin/backup-recovery/schedule`
Manage backup schedule.

**Methods**:
- `GET`: Retrieve the current backup schedule.
- `POST`: Set or update the automated backup schedule.

#### `/api/admin/backup-recovery/trigger`
Trigger a manual backup or recovery.

**Methods**:
- `POST`: Initiate an immediate backup or start a recovery process.

---

## Bookings & Childminders

### `/api/childminders`
Manage childminders.

**Methods**:
- `GET`: List all childminders (potentially with filtering/pagination).
- `POST`: Create a new childminder profile (likely admin only).

### `/api/childminders/[id]`
Get childminder details for booking.

**Methods**:
- `GET`: Retrieve childminder profile
  - Returns full profile information for a specific childminder

### `/api/childminders/recommended`
Get recommended childminders.

**Methods**:
- `GET`: List recommended childminders
  - Returns childminders based on location, ratings, and availability

### `/api/recommendations`
Get AI-powered childminder recommendations.

**Methods**:
- `GET`: Retrieve personalized childminder recommendations
  - Uses machine learning to analyze parent preferences, booking history, and childminder attributes
  - Returns recommendations with explanations for why each childminder is recommended
  - Includes a match score (0-100) indicating compatibility

### `/api/recommendations/click`
Track when a parent clicks on a recommendation.

**Methods**:
- `POST`: Record when a recommendation is clicked
  - Used for improving recommendation quality over time
  - Requires recommendation ID in the request body

### `/api/childminders/search`
Search for childminders.

**Methods**:
- `GET`: Search for childminders by criteria
  - Supports filters for location, availability, age groups, etc.

### `/api/childminders/[id]/favorite`
Add or remove a childminder from favorites.

**Methods**:
- `POST`: Add to favorites
- `DELETE`: Remove from favorites

---

## Messages

### `/api/messages/sse`
Server-Sent Events endpoint for real-time messaging.

**Methods**:
- `GET`: Establish SSE connection
  - Creates a real-time channel for message notifications

---

## Subscription & Payments

### `/api/subscription/plans`
Get available subscription plans.

**Methods**:
- `GET`: List all subscription plans
  - Returns details about available plans and pricing

### `/api/subscription/current`
Get current user's subscription.

**Methods**:
- `GET`: Retrieve subscription details
  - Returns information about the user's active subscription

### `/api/subscription/update`
Update subscription plan.

**Methods**:
- `POST`: Change subscription plan
  - Handles upgrade/downgrade with prorations

### `/api/subscription/cancel`
Cancel current subscription.

**Methods**:
- `POST`: Cancel subscription
  - Processes cancellation, sets end date

### `/api/create-checkout-session`
Create a Stripe checkout session.

**Methods**:
- `POST`: Initialize checkout
  - Creates a checkout session URL for subscription purchase

### `/api/check-subscription`
Check subscription status.

**Methods**:
- `GET`: Verify subscription status
  - Validates if the user has an active subscription

### `/api/webhooks/stripe`
Stripe webhook endpoint.

**Methods**:
- `POST`: Handle Stripe events
  - Processes webhook events like subscription created/updated/canceled
  - Updates local database based on Stripe events

### `/api/webhook`
General webhook endpoint for external integrations.

**Methods**:
- `POST`: Handle incoming webhook data from integrated services
  - Processes events from external systems
  - Updates relevant platform data based on webhook payload

### `/api/fix-subscriptions`
Utility endpoint to fix subscription status issues.

**Methods**:
- `GET`: Attempt to fix a user's subscription
  - Checks Stripe for valid subscriptions
  - Creates missing subscription records
  - Updates user subscription status
  - Only accessible to the authenticated user
  - Used as a self-service recovery tool when subscription status is out of sync

---

## Documents & Compliance

**Note:** Document and image uploads (e.g., profile pictures) are now handled directly by the frontend using UploadThing components (`<UploadButton>`, `<UploadDropzone>`). These components interact with the `/api/uploadthing` endpoint managed by the `uploadthing` library, utilizing the file routers defined in `src/app/api/uploadthing/core.ts` (`imageUploader`, `documentUploader`). The endpoints below are for managing the *metadata* associated with documents after they have been uploaded via UploadThing, or for deleting documents.

### `/api/user/documents/[documentId]`
Manage metadata for a specific document or delete it.

**Methods**:
- `PUT`: Update document metadata (e.g., name, description). This should be called after a document is successfully uploaded via UploadThing to save its details to the database.
  - **Body**: `{ name: string, description?: string }`
  - **Returns**: Updated document record.
- `DELETE`: Delete a document record and its associated file.
  - **Important**: This requires a two-step process:
    1. Delete the file from UploadThing storage using the `fileKey`. (**TODO**: Implement UploadThing deletion logic in the backend endpoint).
    2. Delete the document record from the database.
  - **Returns**: Success message or error.

### `/api/admin/documents`
Admin management of documents.

**Methods**:
- `GET`: List all user documents
  - Returns documents with filtering options

### `/api/admin/documents/[documentId]`
Manage a specific document.

**Methods**:
- `GET`: Get document details
- `PATCH`: Update document metadata
- `DELETE`: Remove a document

### `/api/admin/documents/download`
Download document files.

**Methods**:
- `GET`: Download a document file (requires document ID)
  - Returns the file with proper content-type

### `/api/admin/documents/status`
Update document verification status.

**Methods**:
- `PATCH`: Change document status (requires document ID)
  - Update verification status (pending/approved/rejected)

### `/api/admin/compliance`
Admin management of compliance requirements and status.

**Methods**:
- `GET`: List compliance requirements or user compliance status.
- `POST`: Define new compliance requirements.
- `PATCH`: Update compliance status for users or requirements.

### `/api/compliance/check-expirations`
Check for expired or soon-to-expire compliance documents.

**Methods**:
- `GET`: Retrieve a list of users with expiring compliance items.
- `POST`: Trigger notifications for expiring items (potentially via cron).

---

## System

### `/api/system/maintenance`
Manage system maintenance mode.

**Methods**:
- `GET`: Check maintenance status
  - Returns current maintenance mode state and message
- `PATCH`: Update maintenance settings
  - Enable/disable maintenance mode
  - Set maintenance message and expected end time

### `/api/test-tickets`
Get all support tickets for testing purposes.

**Methods**:
- `GET`: Retrieve all support tickets
  - Returns all tickets with associated user data
  - For testing and development use only

### `/api/notifications/email`
Send system email notifications.

**Methods**:
- `POST`: Send an email
  - Supports templates for various notification types

---

## Support

### `/api/[...tickets].ts`
Catch-all endpoint for support ticket operations. (Note: Specific functionality might vary based on implementation).

**Methods**:
- Handles various GET, POST, PATCH, DELETE requests related to support tickets based on the dynamic path segments.

### `/api/contact`
Submit contact form information.

**Methods**:
- `POST`: Submit a contact request
  - Creates a support ticket from contact form

### `/api/dashboard/parent/support`
Manage parent support tickets.

**Methods**:
- `GET`: List parent tickets
- `POST`: Create a new support ticket

### `/api/dashboard/parent/support/[id]`
Manage a specific parent support ticket.

**Methods**:
- `GET`: Get ticket details
- `PATCH`: Update ticket information

### `/api/dashboard/childminder/support`
Manage childminder support tickets.

**Methods**:
- `GET`: List childminder tickets
- `POST`: Create a new support ticket

### `/api/dashboard/childminder/support/[id]`
Manage a specific childminder support ticket.

**Methods**:
- `GET`: Get ticket details
- `PATCH`: Update ticket information

### `/api/admin/support`
Admin management of all support tickets.

**Methods**:
- `GET`: List all support tickets
  - Returns tickets with filtering options
- `POST`: Create a support ticket on behalf of a user

### `/api/admin/support/[id]`
Manage a specific support ticket.

**Methods**:
- `GET`: Get ticket details
- `PATCH`: Update ticket status or add notes
- `DELETE`: Remove a ticket

### `/api/admin/support/search`
Search through support tickets.

**Methods**:
- `GET`: Search for tickets
  - Supports text search across ticket content and metadata

### `/api/admin/support/stats`
Get support ticket statistics.

**Methods**:
- `GET`: Retrieve ticket metrics
  - Returns counts by status, response times, etc.

---

## Live Chat

### `/api/chat/sessions`
Manage chat sessions.

**Methods**:
- `GET`: List all chat sessions (admin only)
  - Returns a list of chat sessions with filtering by status
  - Includes user information and the latest message for each session
- `POST`: Create a new chat session
  - Initializes a new chat session for the current user
  - Creates a system message and sends email notification to support

### `/api/chat/sessions/[id]`
Manage a specific chat session.

**Methods**:
- `GET`: Get chat session details
  - Returns full information about a specific chat session
  - Only accessible by the session owner, assigned agent, or admin
- `PATCH`: Update chat session status
  - Update session status (active, closed, transferred)
  - Assign or transfer to a different agent
  - Regular users can only reopen their own closed chats

### `/api/chat/messages`
Manage chat messages.

**Methods**:
- `GET`: Get messages for a specific chat session
  - Returns all messages for a given session ID
  - Only accessible by session participants and admins
- `POST`: Send a new message in a chat session
  - Creates a new message in the specified session
  - Updates the session's last activity timestamp
  - Only allowed if the session is active (not closed)

### `/api/chat/notifications`
Get chat notifications for admins.

**Methods**:
- `GET`: Retrieve chat notification data
  - Returns counts of unassigned/unread chat sessions
  - Lists details of sessions requiring attention
  - Only accessible by admins

### `/api/chat/transfer`
Transfer chat sessions between agents.

**Methods**:
- `POST`: Transfer a chat session to another agent
  - Reassigns the chat to a different support agent
  - Creates a system message about the transfer
  - Only accessible by admins

### `/api/chat/agents`
Manage chat support agents.

**Methods**:
- `GET`: List available chat agents
  - Returns a list of users who can handle chat support
  - Includes availability status and active session count
  - Only accessible by admins

---

## Calendar Sync

### `/api/calendar-sync/auth`
Initiate Google Calendar authorization.

**Methods**:
- `GET`: Start the OAuth flow for Google Calendar
  - Redirects the user to Google's OAuth consent screen
  - Sets a state cookie to prevent CSRF attacks
  - Only accessible by authenticated users

### `/api/calendar-sync/callback`
Handle OAuth callback from Google.

**Methods**:
- `GET`: Process OAuth callback from Google
  - Exchanges the authorization code for access and refresh tokens
  - Stores tokens in the database for the authenticated user
  - Verifies state parameter to prevent CSRF attacks
  - Redirects back to the calendar page with success/error status

### `/api/calendar-sync/status`
Check Google Calendar connection status.

**Methods**:
- `GET`: Retrieve current connection status
  - Returns whether Google Calendar is connected
  - Includes provider information and last sync timestamp
  - Only accessible by authenticated users

### `/api/calendar-sync/sync`
Synchronize availability with Google Calendar.

**Methods**:
- `POST`: Sync availability blocks to Google Calendar
  - Finds all availability blocks without Google event IDs
  - Creates corresponding events in the user's Google Calendar
  - Updates local records with Google event IDs
  - Returns sync statistics (success/failure counts)
  - Only accessible by authenticated users

### `/api/dashboard/childminder/availability`
Manage childminder availability blocks.

**Methods**:
- `GET`: List availability blocks
  - Returns all availability blocks for the authenticated childminder
  - Supports filtering by date range
- `POST`: Create a new availability block
  - Accepts start/end times, type (available/unavailable), title, and description
  - Optionally supports recurrence rules for repeating availability

### `/api/dashboard/childminder/availability/[id]`
Manage a specific availability block.

**Methods**:
- `GET`: Get availability block details
- `PUT`: Update an existing availability block
  - Modify times, type, title, description, or recurrence
- `DELETE`: Remove an availability block
  - Also removes the corresponding Google Calendar event if synced

---

## Cron Jobs

### `/api/cron`
Endpoint triggered by scheduled tasks (cron jobs).

**Methods**:
- `GET` or `POST`: Execute scheduled tasks like checking trial expirations, sending reminders, cleaning up data, etc. (Specific actions depend on implementation and request parameters/headers).

---

## Real-time Communication

(In addition to `/api/messages/sse` for Server-Sent Events)

### `/api/socket` / `/api/socketio`
Endpoints for WebSocket-based real-time communication (if implemented).

**Methods**:
- Handles WebSocket connections for features requiring bidirectional communication beyond SSE capabilities (e.g., more complex chat features, real-time collaboration).