# Childminder Connect Admin API Documentation

This document provides an overview of API endpoints specifically intended for administrative use within the Childminder Connect application.

---

## Admin Dashboard

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

## Admin Documents & Compliance

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

---

## Admin Support

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

## Admin Live Chat

### `/api/chat/sessions` (Admin Access)
Manage chat sessions.

**Methods**:
- `GET`: List all chat sessions (admin only)
  - Returns a list of chat sessions with filtering by status
  - Includes user information and the latest message for each session

### `/api/chat/sessions/[id]` (Admin Access)
Manage a specific chat session.

**Methods**:
- `GET`: Get chat session details (admin access)
- `PATCH`: Update chat session status (admin access for assignment/transfer)

### `/api/chat/messages` (Admin Access)
Manage chat messages.

**Methods**:
- `GET`: Get messages for a specific chat session (admin access)

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

## System Management (Admin Controlled)

### `/api/system/maintenance`
Manage system maintenance mode.

**Methods**:
- `GET`: Check maintenance status
- `PATCH`: Update maintenance settings (Enable/disable mode, set message)

---

## Other Admin Operations

### `/api/childminders` (Admin Action)
Manage childminders.

**Methods**:
- `POST`: Create a new childminder profile (likely admin only).