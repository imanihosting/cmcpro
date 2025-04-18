# Childminder Connect Documentation

This directory contains comprehensive documentation for the Childminder Connect platform.

## Contents

- [API Documentation](./API_Documentation.md) - Complete reference for all API endpoints
- [Database Schema](./Database_Schema.md) - Documentation of the database structure and relationships
- [White Paper](./Childminder_Connect_Whitepaper.md) - Overview of the platform's purpose, features, and benefits
- [Stripe Webhook Setup](./STRIPE_WEBHOOK_SETUP.md) - Guide for setting up and managing Stripe webhooks
- [Microsoft Graph Setup](./MICROSOFT_GRAPH_SETUP.md) - Instructions for setting up Microsoft Graph integration
- [Subscription Update Guide](./SUBSCRIPTION-UPDATE-GUIDE.md) - Guide for updating subscription status enum
- [Suspense Boundary README](./SUSPENSE-BOUNDARY-README.md) - Information about Suspense boundaries
- [Recommendation Engine](./RECOMMENDATION_ENGINE.md) - Documentation about the recommendation system
- [Webhook Event Schema](./WEBHOOK_EVENT_SCHEMA.md) - Documentation of the WebhookEvent database table
- [Implementing New Webhook Events](./IMPLEMENTING_NEW_WEBHOOK_EVENTS.md) - Guide for adding and testing new webhook events

## Purpose

This documentation is intended to provide:

1. **Technical Reference** - For developers working on the platform
2. **System Architecture** - Overview of how the different components interact
3. **Business Context** - Explanation of the platform's value and market positioning

## API Documentation

The [API Documentation](./API_Documentation.md) provides a comprehensive reference of all available endpoints in the Childminder Connect system. It covers:

- Authentication endpoints
- User management
- Booking system
- Messaging system
- Document handling
- Administrative functions
- Subscription management
- System configuration
- Calendar management and Google Calendar integration

Each endpoint is documented with its purpose, available methods, request parameters, and response format.

## Database Schema

The [Database Schema](./Database_Schema.md) details the data model that powers Childminder Connect. It includes:

- Entity descriptions
- Field definitions
- Relationships between tables
- Enumerations and valid values
- Database design patterns and principles

This documentation is essential for understanding the data structure and making informed decisions about database access and modifications.

## White Paper

The [White Paper](./Childminder_Connect_Whitepaper.md) provides a high-level overview of the Childminder Connect platform, including:

- Market challenges in the childcare industry
- The platform's solution approach
- Core features and benefits
- Technical architecture
- Impact assessment
- Future roadmap

This document is valuable for understanding the business context and overall goals of the platform.

## Stripe Integration

The [Stripe Webhook Setup](./STRIPE_WEBHOOK_SETUP.md) guide explains how to:

- Configure Stripe webhooks in the Stripe Dashboard
- Set up the required environment variables
- Handle webhook events in the application
- Test webhooks locally using Stripe CLI
- Troubleshoot common webhook issues

This document is essential for managing subscription billing in the platform.

## Webhook Events

The [Webhook Event Schema](./WEBHOOK_EVENT_SCHEMA.md) documentation provides details about:

- The structure of the WebhookEvent database table
- How webhook events are tracked and processed
- Best practices for monitoring and maintaining webhook data
- SQL queries for troubleshooting webhook-related issues

The [Implementing New Webhook Events](./IMPLEMENTING_NEW_WEBHOOK_EVENTS.md) guide explains how to:

- Add support for new webhook events
- Implement event handlers
- Test webhook functionality
- Follow best practices for webhook implementation

These resources are critical components for ensuring reliable subscription processing.

## How to Use This Documentation

- **For Developers**: Start with the API Documentation and Database Schema to understand the system's capabilities and structure.
- **For Product Managers**: The White Paper provides context for feature planning and roadmap discussions.
- **For Business Stakeholders**: The White Paper explains the value proposition and market positioning.

## Maintenance

This documentation should be updated whenever significant changes are made to:

- API endpoints or behavior
- Database schema or relationships
- Platform features or roadmap

## Contact

For questions about this documentation or to report issues, please contact the development team. 