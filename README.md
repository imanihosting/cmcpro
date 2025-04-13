# Childminder Connect

![Childminder Connect Logo](public/logo.png)

## Overview

Childminder Connect is a comprehensive digital platform designed to bridge the gap between parents seeking quality childcare and professional childminders in Ireland. The platform addresses critical challenges in the childcare sector by creating a secure, efficient, and transparent marketplace that benefits all stakeholders.

The platform enables:

- **Parents** to find, book, and communicate with verified childminders
- **Childminders** to manage their profiles, bookings, and client communications
- **Administrators** to oversee platform operations and user management

## Features

### For Parents
- 🔍 **Smart Search & Matching** - Find childminders based on location, availability, qualifications, and more
- 📅 **Easy Booking System** - Schedule regular or one-off childcare sessions
- 💬 **Secure Messaging** - Communicate directly with childminders
- ⭐ **Reviews & Ratings** - Make informed decisions based on other parents' experiences
- 🔐 **Verified Profiles** - Access childminders with verified credentials and certifications

### For Childminders
- 👤 **Professional Profile** - Showcase qualifications, experience, and services
- 📊 **Booking Management** - Control availability and manage bookings
- 💲 **Payment Processing** - Secure, streamlined payment system
- 📱 **Mobile Notifications** - Stay updated on new booking requests and messages
- 📈 **Business Growth** - Expand client base and professional network

### Platform Features
- 🔒 **Security & Privacy** - GDPR-compliant data handling with robust security measures
- 📱 **Responsive Design** - Optimized for all devices (desktop, tablet, mobile)
- 🌐 **Real-time Updates** - Instant notifications and system updates
- 🛡️ **Two-Factor Authentication** - Enhanced account security
- 🔄 **Integration** - Calendar syncing with major providers

## Tech Stack

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: Node.js, Next.js API routes
- **Database**: MySQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Payment Processing**: Stripe
- **File Storage**: UploadThing
- **Email Service**: Microsoft Graph API
- **Deployment**: Vercel

## Getting Started

### Prerequisites
- Node.js (v18.x or higher)
- npm or yarn
- MySQL database
- Stripe account (for payment processing)
- Microsoft Azure account (for Microsoft Graph API)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/childminder-connect.git
cd childminder-connect
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with the following variables:
```
# Database
DATABASE_URL="mysql://username:password@localhost:3306/childminder_connect"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Stripe
STRIPE_SECRET_KEY="your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"

# UploadThing (File Upload)
UPLOADTHING_SECRET="your-uploadthing-secret"
UPLOADTHING_APP_ID="your-uploadthing-app-id"

# Microsoft Graph API (Email)
MICROSOFT_GRAPH_TENANT_ID="your-tenant-id"
MICROSOFT_GRAPH_CLIENT_ID="your-client-id"
MICROSOFT_GRAPH_CLIENT_SECRET="your-client-secret"
MICROSOFT_GRAPH_USER_ID="your-user-id"
MICROSOFT_GRAPH_FROM_EMAIL="noreply@yourdomain.com"
MICROSOFT_GRAPH_SUPPORT_EMAIL="support@yourdomain.com"
```

4. Initialize the database:
```bash
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
# or
yarn dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Setup

The platform uses Prisma ORM with MySQL. To initialize the database:

```bash
# Apply migrations
npx prisma migrate dev

# Seed the database with initial data
npx prisma db seed
```

## Deployment

### Production Deployment

The application is optimized for deployment on Vercel:

1. Set up a Vercel account and connect your repository
2. Configure the environment variables in the Vercel dashboard
3. Deploy the application

### Webhook Configuration

For Stripe webhooks in production:

1. Follow the instructions in `Docs/STRIPE_WEBHOOK_SETUP.md`
2. Ensure the Stripe webhook endpoint is properly configured

## Project Structure

```
childminder-connect/
├── components/          # Reusable React components
├── Docs/                # Documentation files
├── lib/                 # Utility functions and custom hooks
├── pages/               # Application pages and API routes
├── prisma/              # Database schema and migrations
├── public/              # Static assets
├── styles/              # Global styles
├── utils/               # Helper functions
└── tests/               # Test files
```

## Key Documentation

Detailed documentation can be found in the `Docs` directory:

- [API Documentation](Docs/API_Documentation.md)
- [Database Schema](Docs/Database_Schema.md)
- [Stripe Webhook Setup](Docs/STRIPE_WEBHOOK_SETUP.md)
- [Subscription Management](Docs/SUBSCRIPTION-UPDATE-GUIDE.md)
- [Microsoft Graph Integration](Docs/MICROSOFT_GRAPH_SETUP.md)
- [Recommendation Engine](Docs/RECOMMENDATION_ENGINE.md)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the [MIT License](LICENSE).

## Contact

- Website: [childminderconnect.com](https://childminderconnect.com)
- Email: support@childminderconnect.com

---

© 2024 Childminder Connect. All rights reserved.
