# Environment variables for Childminder Connect application
# Copy this file to .env and fill in your values

# Database Configuration
DATABASE_URL="mysql://username:password@hostname:port/database_name"

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_MONTHLY_PRICE_ID=price_your_monthly_plan_id
STRIPE_YEARLY_PRICE_ID=price_your_yearly_plan_id
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Azure Configuration (for Microsoft authentication and email)
AZURE_TENANT_ID=your_azure_tenant_id
AZURE_CLIENT_ID=your_azure_client_id
AZURE_CLIENT_SECRET=your_azure_client_secret
OFFICE365_USER_ID=your_office365_email@yourdomain.com
SMTP_FROM_EMAIL=noreply@yourdomain.com
CONTACT_EMAIL=support@yourdomain.com

# NextAuth Configuration
# For production, this should be your deployed domain - VERY IMPORTANT!
NEXTAUTH_URL=https://your-production-domain.com
# For local development, use: http://localhost:3000
# NEXTAUTH_URL=http://localhost:3000

# Create a strong secret for NextAuth sessions
NEXTAUTH_SECRET=generate-a-strong-random-secret-here

# App URL - used for callbacks and webhooks
# For production, this should match your deployed domain
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
# For local development, use: http://localhost:3000
# NEXT_PUBLIC_APP_URL=http://localhost:3000

# App Configuration
# Use "production" for production environments
NODE_ENV=development 

# Azure Configuration
AZURE_TENANT_ID=53568a6f-0804-40fc-87a1-57a07e78771c
AZURE_CLIENT_ID=bd6d949c-f660-4ebc-b5e7-89aa27b658ac
AZURE_CLIENT_SECRET=SuZ8Q~1SpvkLNdOSKyFkoOQr9D2QxRVqjU7NPcpz
OFFICE365_USER_ID=support@childminderconnect.com
SMTP_FROM_EMAIL=noreply@childminderconnect.com
CONTACT_EMAIL=support@childminderconnect.com




#local

# Stripe variables
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51QmYA901SWldpYb7wkeW2VddKJ6YUueaTfWIJeZCygrk11dXAo6SzRDoetSljlGMrZFQYsCG1nIE5sbPHFRmX6oY00nXZI16vt
STRIPE_SECRET_KEY=sk_test_51QmYA901SWldpYb7JFzDkkhuqCOfXnylgipQMpAf3kLKurOUquADSRGXphHDKJokAcHI1dCkBmhvg9LjlUSytXz1001h0go0Qu
STRIPE_WEBHOOK_SECRET=whsec_a3166a5f7a9b65fa58903a4a080ce4f5866c6358530a1e8d7fed90bf01dacf22
STRIPE_MONTHLY_PRICE_ID=price_1R6Icg01SWldpYb71kv4EgGV
STRIPE_ANNUAL_PRICE_ID=price_1R6IdQ01SWldpYb73X4lkvtL

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-here-replace-with-secure-value

# Google OAuth Configuration
GOOGLE_CLIENT_ID=545736311087-ugm7b9mekksb43spg1e2u6fn8f8cq5i4.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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


#Main

# Environment variables declared in this file are automatically made available to Prisma.
# See the documentation for more detail: https://pris.ly/d/prisma-schema#accessing-environment-variables-from-the-schema

# Prisma supports the native connection string format for PostgreSQL, MySQL, SQLite, SQL Server, MongoDB and CockroachDB.
# See the documentation for all the connection string options: https://pris.ly/d/connection-strings

DATABASE_URL="mysql://bgunde:Mirage%407459@87.232.53.94:3306/cmsbackend_db"

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51QmYA901SWldpYb7wkeW2VddKJ6YUueaTfWIJeZCygrk11dXAo6SzRDoetSljlGMrZFQYsCG1nIE5sbPHFRmX6oY00nXZI16vt
NEXT_PUBLIC_STRIPE_SECRET_KEY=sk_test_51QmYA901SWldpYb7JFzDkkhuqCOfXnylgipQMpAf3kLKurOUquADSRGXphHDKJokAcHI1dCkBmhvg9LjlUSytXz1001h0go0Qu
NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=price_1R6Icg01SWldpYb71kv4EgGV
NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID=price_1R6IdQ01SWldpYb73X4lkvtL
NEXT_PUBLIC_STRIPE_WEBHOOK_SECRET=whsec_a3166a5f7a9b65fa58903a4a080ce4f5866c6358530a1e8d7fed90bf01dacf22

# Microsoft Graph Configuration
MICROSOFT_GRAPH_TENANT_ID=53568a6f-0804-40fc-87a1-57a07e78771c
MICROSOFT_GRAPH_CLIENT_ID=bd6d949c-f660-4ebc-b5e7-89aa27b658ac
MICROSOFT_GRAPH_CLIENT_SECRET=SuZ8Q~1SpvkLNdOSKyFkoOQr9D2QxRVqjU7NPcpz
MICROSOFT_GRAPH_USER_ID=support@childminderconnect.com
MICROSOFT_GRAPH_FROM_EMAIL=noreply@childminderconnect.com
MICROSOFT_GRAPH_SUPPORT_EMAIL=support@childminderconnect.com

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-here-replace-with-secure-value
NEXT_PUBLIC_APP_URL=http://localhost:3000
# App Configuration
NODE_ENV=development

# Google OAuth Configuration
GOOGLE_CLIENT_ID=545736311087-ugm7b9mekksb43spg1e2u6fn8f8cq5i4.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
