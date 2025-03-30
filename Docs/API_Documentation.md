# Childminder Connect API Documentation

This document provides a comprehensive overview of all API endpoints available in the Childminder Connect application. The API is organized into logical sections based on functionality.

## Table of Contents
- [Authentication](#authentication)
- [User Management](#user-management)
- [Dashboard](#dashboard)
  - [Parent](#parent-dashboard)
  - [Childminder](#childminder-dashboard)
  - [Admin](#admin-dashboard)
- [Bookings](#bookings)
- [Messages](#messages)
- [Subscription & Payments](#subscription--payments)
- [Documents](#documents)
- [System](#system)
- [Support](#support)

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

### `/api/user/profile-image`
Manage the user's profile image.

**Methods**:
- `POST`: Upload a new profile image
  - Supports image upload with validation
- `DELETE`: Remove the current profile image

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
- `GET`: Get all messages in a conversation

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

---

## Bookings

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

---

## Documents

### `/api/user/documents`
Manage user documents.

**Methods**:
- `GET`: List user documents
- `POST`: Upload a new document
  - Accepts document files with validation

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
- `GET`: Download a document file
  - Returns the file with proper content-type

### `/api/admin/documents/status`
Update document verification status.

**Methods**:
- `PATCH`: Change document status
  - Update verification status (pending/approved/rejected)

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

### `/api/notifications/email`
Send system email notifications.

**Methods**:
- `POST`: Send an email
  - Supports templates for various notification types

---

## Support

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