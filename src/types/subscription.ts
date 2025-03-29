import { User_role } from '@prisma/client';

// Subscription list item type
export interface SubscriptionListItem {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: User_role;
  subscriptionId: string | null;
  customerId: string | null;
  status: string;
  plan: string;
  createdAt: Date;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

// Pagination type
export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// Subscription list response type
export interface SubscriptionListResponse {
  subscriptions: SubscriptionListItem[];
  pagination: Pagination;
}

// Product details type
export interface ProductDetails {
  priceId: string;
  productId: string;
  name: string | null;
  description: string | null;
  amount: number;
  currency: string;
  interval: string | null;
  intervalCount: number | null;
}

// Payment method type
export interface PaymentMethod {
  id: string;
  type: string;
  last4: string;
  brand: string;
  expMonth: number;
  expYear: number;
}

// Invoice details type
export interface InvoiceDetails {
  id: string;
  number: string;
  status: string;
  amountPaid: number;
  amountDue: number;
  currency: string;
  created: Date;
  hostedInvoiceUrl: string;
}

// User type for subscription details
export interface UserDetails {
  id: string;
  name: string | null;
  email: string;
  role: User_role;
  subscriptionStatus: string;
}

// Detailed subscription type
export interface SubscriptionDetails {
  id: string;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  status: string;
  plan: string | null;
  createdAt: Date;
  updatedAt: Date;
  currentPeriodStart?: Date;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date | null;
  cancelAt?: Date | null;
  startDate?: Date;
  trialStart?: Date | null;
  trialEnd?: Date | null;
  user: UserDetails;
  product?: ProductDetails | null;
  paymentMethod?: PaymentMethod | null;
  latestInvoice?: InvoiceDetails | null;
  stripeUrl?: string;
  stripeError?: string;
}

// Cancel subscription request type
export interface CancelSubscriptionRequest {
  subscriptionId: string;
  reason: string;
  cancelImmediately: boolean;
}

// Refund request type
export interface RefundRequest {
  paymentIntentId: string;
  chargeId?: string;
  amount?: number;
  reason: string;
} 