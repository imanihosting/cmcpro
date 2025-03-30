# Childminder Connect: Database Schema Documentation

This document provides a comprehensive overview of the database schema used in the Childminder Connect application. The database is designed to support all core functionalities including user management, booking systems, messaging, and administrative functions.

## Table of Contents
- [User Management](#user-management)
- [Booking System](#booking-system)
- [Messaging System](#messaging-system)
- [Documents & Verification](#documents--verification)
- [Security & Authentication](#security--authentication)
- [Support & Moderation](#support--moderation)
- [System & Configuration](#system--configuration)
- [Enumerations](#enumerations)

---

## User Management

### User
Central entity representing all users in the system.

**Key Fields**:
- `id`: Unique identifier
- `email`: User's email address (unique)
- `name`: User's full name
- `role`: User role (ADMIN, PARENT, CHILDMINDER)
- `image`: Profile image URL
- `emailVerified`: Whether email has been verified
- `subscriptionStatus`: Current subscription status
- `twoFactorEnabled`: Whether 2FA is enabled

**Role-specific Fields**:
- **Childminder specific**:
  - `bio`: Professional biography
  - `phoneNumber`: Contact number
  - `location`: Geographic location
  - `rate`: Hourly rate
  - `qualifications`: Professional qualifications
  - `yearsOfExperience`: Experience level
  - `firstAidCert`: First aid certification status
  - `gardaVetted`: Garda vetting status
  - `tuslaRegistered`: Tusla registration status
  - `ageGroupsServed`: Age groups the childminder works with
  - `languagesSpoken`: Languages the childminder speaks
  - `maxChildrenCapacity`: Maximum number of children
  - `careTypes`: Types of care provided

**Relationships**:
- One-to-many with `Booking` (as parent and childminder)
- One-to-many with `Child` (as parent)
- One-to-many with `Message` (as sender and receiver)
- One-to-many with `Document`
- One-to-many with `Availability`
- One-to-many with `RecurringAvailability`

### Child
Represents a child registered by a parent.

**Key Fields**:
- `id`: Unique identifier
- `name`: Child's name
- `age`: Child's age
- `parentId`: Reference to parent User
- `allergies`: Any allergies (optional)
- `specialNeeds`: Any special needs (optional)

**Relationships**:
- Many-to-one with `User` (parent)
- Many-to-many with `Booking` through `BookingChildren`

### Subscription
Tracks user subscription information.

**Key Fields**:
- `id`: Unique identifier
- `userId`: Reference to User
- `status`: Current status (ACTIVE, CANCELED, etc.)
- `plan`: Subscription plan type
- `priceId`: Stripe price ID
- `quantity`: Number of seats/licenses
- `stripeSubscriptionId`: Stripe subscription ID
- `stripeCustomerId`: Stripe customer ID
- `stripeCouponApplied`: Coupon code applied
- `stripeCurrentPeriodStart`: Current period start date
- `stripeCurrentPeriodEnd`: Current period end date
- `cancelAtPeriodEnd`: Whether to cancel at period end
- `canceledAt`: When subscription was canceled

**Relationships**:
- Many-to-one with `User`

---

## Booking System

### Booking
Represents a childcare booking between a parent and childminder.

**Key Fields**:
- `id`: Unique identifier
- `parentId`: Reference to parent User
- `childminderId`: Reference to childminder User
- `startTime`: Start date/time
- `endTime`: End date/time
- `status`: Booking status (PENDING, CONFIRMED, CANCELLED, etc.)
- `bookingType`: Type of booking (STANDARD, RECURRING, EMERGENCY)
- `isEmergency`: Whether this is an emergency booking
- `isRecurring`: Whether this is a recurring booking
- `isWaitlisted`: Whether this booking is waitlisted
- `recurrencePattern`: Pattern for recurring bookings
- `cancellationNote`: Note explaining cancellation
- `priority`: Priority level
- `reminderSent`: Whether a reminder was sent

**Relationships**:
- Many-to-one with `User` (parent)
- Many-to-one with `User` (childminder)
- Many-to-many with `Child` through `BookingChildren`

### BookingChildren
Junction table connecting bookings with children.

**Key Fields**:
- `id`: Unique identifier
- `bookingId`: Reference to Booking
- `childId`: Reference to Child

**Relationships**:
- Many-to-one with `Booking`
- Many-to-one with `Child`

### Availability
Represents a specific time slot when a childminder is available.

**Key Fields**:
- `id`: Unique identifier
- `userId`: Reference to childminder User
- `date`: The specific date
- `timeSlot`: Time slot string (e.g., "09:00-12:00")

**Relationships**:
- Many-to-one with `User` (childminder)

### RecurringAvailability
Represents regularly recurring available time slots for childminders.

**Key Fields**:
- `id`: Unique identifier
- `userId`: Reference to childminder User
- `dayOfWeek`: Day of week (0-6, where 0 is Sunday)
- `startTime`: Start time
- `endTime`: End time

**Relationships**:
- Many-to-one with `User` (childminder)

---

## Messaging System

### Message
Represents a message between users.

**Key Fields**:
- `id`: Unique identifier
- `senderId`: Reference to sender User
- `receiverId`: Reference to receiver User
- `content`: Message content
- `read`: Whether the message has been read
- `createdAt`: When the message was sent

**Relationships**:
- Many-to-one with `User` (sender)
- Many-to-one with `User` (receiver)

### Notification
System-generated notifications for users.

**Key Fields**:
- `id`: Unique identifier
- `userId`: Reference to User (recipient)
- `type`: Notification type
- `title`: Notification title
- `message`: Notification message
- `status`: Read status
- `metadata`: Additional JSON data

**Relationships**:
- Many-to-one with `User`

### PushSubscription
Stores information for web push notifications.

**Key Fields**:
- `id`: Unique identifier
- `userId`: Reference to User
- `subscription`: Subscription details (JSON)

**Relationships**:
- One-to-one with `User`

---

## Documents & Verification

### Document
Stores documents uploaded by users (e.g., certifications, qualifications).

**Key Fields**:
- `id`: Unique identifier
- `userId`: Reference to User who uploaded
- `name`: Document name
- `type`: Document type
- `url`: File URL
- `category`: Document category
- `description`: Document description
- `fileSize`: Size in bytes
- `status`: Verification status (PENDING, APPROVED, REJECTED)
- `reviewerId`: Reference to admin User who reviewed
- `reviewDate`: When the document was reviewed

**Relationships**:
- Many-to-one with `User` (owner)
- Many-to-one with `User` (reviewer)

### Favorite
Tracks parents' favorite childminders.

**Key Fields**:
- `id`: Unique identifier
- `userId`: Reference to parent User
- `childminderId`: Reference to childminder User

**Relationships**:
- Many-to-one with `User` (parent)
- Many-to-one with `User` (childminder)

### Review
Stores reviews from parents about childminders.

**Key Fields**:
- `id`: Unique identifier
- `reviewerId`: Reference to parent User
- `revieweeId`: Reference to childminder User
- `rating`: Numerical rating
- `comment`: Review text

**Relationships**:
- Many-to-one with `User` (reviewer/parent)
- Many-to-one with `User` (reviewee/childminder)

---

## Security & Authentication

### Account
Stores OAuth account connections for users.

**Key Fields**:
- `id`: Unique identifier
- `userId`: Reference to User
- `type`: Account type
- `provider`: OAuth provider
- `providerAccountId`: ID from the provider
- `access_token`: OAuth access token
- `refresh_token`: OAuth refresh token
- `expires_at`: Token expiration time

**Relationships**:
- Many-to-one with `User`

### Session
Stores active sessions for users.

**Key Fields**:
- `id`: Unique identifier
- `sessionToken`: Unique session token
- `userId`: Reference to User
- `expires`: When session expires

**Relationships**:
- Many-to-one with `User`

### SecurityEvent
Logs security-related events.

**Key Fields**:
- `id`: Unique identifier
- `userId`: Reference to User
- `type`: Event type
- `ipAddress`: Source IP address
- `userAgent`: Browser user agent
- `success`: Whether the action was successful
- `details`: Additional details about the event

**Relationships**:
- Many-to-one with `User`

### VerificationToken
Stores tokens for email verification.

**Key Fields**:
- `identifier`: User email or identifier
- `token`: Verification token
- `expires`: Token expiration time

### PasswordResetToken
Stores tokens for password reset.

**Key Fields**:
- `id`: Unique identifier
- `email`: User email
- `token`: Reset token
- `expires`: Token expiration time
- `used`: Whether token has been used

---

## Support & Moderation

### SupportTicket
Represents a support request from a user.

**Key Fields**:
- `id`: Unique identifier
- `userId`: Reference to User who created ticket
- `title`: Ticket title
- `description`: Detailed description
- `status`: Current status
- `priority`: Priority level
- `assigneeId`: Reference to admin User assigned
- `category`: Ticket category
- `resolutionDetails`: How the ticket was resolved

**Relationships**:
- Many-to-one with `User` (creator)
- Many-to-one with `User` (assignee)

### ModerationItem
Represents content flagged for moderation.

**Key Fields**:
- `id`: Unique identifier
- `userId`: Reference to User who created content
- `type`: Content type
- `content`: The flagged content
- `status`: Moderation status

**Relationships**:
- Many-to-one with `User`

### Report
User-submitted reports against other users or content.

**Key Fields**:
- `id`: Unique identifier
- `type`: Report type
- `status`: Report status
- `reporterId`: Reference to User who reported
- `targetId`: Reference to User being reported
- `description`: Report details

**Relationships**:
- Many-to-one with `User` (reporter)
- Many-to-one with `User` (target)

### UserNote
Administrative notes about users.

**Key Fields**:
- `id`: Unique identifier
- `userId`: Reference to User
- `authorId`: Reference to admin User who wrote note
- `content`: Note content
- `isPrivate`: Whether note is private to admins

**Relationships**:
- Many-to-one with `User` (subject)
- Many-to-one with `User` (author)

---

## System & Configuration

### SystemLog
Logs system events and errors.

**Key Fields**:
- `id`: Unique identifier
- `type`: Log type
- `level`: Severity level
- `message`: Log message
- `details`: Additional details
- `context`: Execution context
- `timestamp`: When the event occurred

### SecuritySetting
Stores system-wide security settings.

**Key Fields**:
- `id`: Unique identifier
- `key`: Setting key
- `value`: Setting value
- `description`: Setting description
- `type`: Data type

### WebhookEvent
Logs incoming webhook events from external services.

**Key Fields**:
- `id`: Unique identifier
- `provider`: Service provider (e.g., "stripe")
- `eventType`: Type of event
- `payload`: Full event payload
- `status`: Processing status
- `processedAt`: When the event was processed
- `error`: Error message if processing failed

### UserActivityLog
Tracks user activity for auditing purposes.

**Key Fields**:
- `id`: Unique identifier
- `userId`: Reference to User
- `action`: Action performed
- `details`: Additional details
- `ipAddress`: Source IP address
- `userAgent`: Browser user agent

**Relationships**:
- Many-to-one with `User`

### CalendarSync
Tracks calendar integration with external providers.

**Key Fields**:
- `id`: Unique identifier
- `userId`: Reference to User
- `provider`: Calendar provider
- `accessToken`: Provider access token
- `refreshToken`: Provider refresh token
- `expiresAt`: Token expiration time

---

## Enumerations

### User_role
- `ADMIN`: System administrator
- `PARENT`: Parent/guardian seeking childcare
- `CHILDMINDER`: Childcare provider

### Booking_status
- `PENDING`: Awaiting confirmation
- `CONFIRMED`: Booking confirmed
- `CANCELLED`: Booking cancelled
- `COMPLETED`: Booking completed
- `REJECTED`: Booking rejected
- `RESCHEDULED`: Booking rescheduled

### Booking_bookingType
- `STANDARD`: Regular booking
- `RECURRING`: Recurring booking
- `EMERGENCY`: Emergency/last-minute booking

### Booking_recurrencePattern
- `DAILY`: Repeats daily
- `WEEKLY`: Repeats weekly
- `BIWEEKLY`: Repeats every two weeks
- `MONTHLY`: Repeats monthly

### Document_status
- `PENDING`: Awaiting review
- `APPROVED`: Document approved
- `REJECTED`: Document rejected
- `EXPIRED`: Document expired

### SupportTicket_status
- `OPEN`: New ticket
- `IN_PROGRESS`: Being worked on
- `WAITING_ON_USER`: Waiting for user response
- `RESOLVED`: Issue resolved
- `CLOSED`: Ticket closed

### SupportTicket_priority
- `LOW`: Low priority
- `MEDIUM`: Medium priority
- `HIGH`: High priority
- `URGENT`: Urgent priority

### Report_status
- `OPEN`: New report
- `UNDER_REVIEW`: Being reviewed
- `RESOLVED`: Issue resolved
- `DISMISSED`: Report dismissed

### Report_type
- `USER`: Report against a user
- `CONTENT`: Report against specific content
- `TECHNICAL`: Technical issue report
- `BILLING`: Billing-related report
- `OTHER`: Other type of report

### SystemLog_level
- `INFO`: Informational message
- `WARNING`: Warning message
- `ERROR`: Error message
- `CRITICAL`: Critical error message
- `DEBUG`: Debug information

### User_subscriptionStatus
- `FREE`: Free tier
- `TRIAL`: Trial period
- `BASIC`: Basic paid plan
- `PREMIUM`: Premium paid plan
- `EXPIRED`: Expired subscription
- `CANCELED`: Canceled subscription 