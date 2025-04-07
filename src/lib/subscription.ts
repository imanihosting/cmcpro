import { User } from "@prisma/client";

/**
 * Checks if a user has valid subscription access
 * This includes having an active subscription OR being in an active trial period
 */
export function hasValidSubscription(user: any): boolean {
  if (!user) return false;
  
  // User has premium subscription
  if (user.subscriptionStatus === "PREMIUM") return true;
  
  // User is in trial period
  if (user.subscriptionStatus === "TRIALING" && user.trialEndDate) {
    const now = new Date();
    const trialEnd = new Date(user.trialEndDate);
    return now < trialEnd;
  }
  
  // All other statuses (FREE, TRIAL_EXPIRED, PENDING_SUBSCRIPTION) do not have access
  return false;
}

/**
 * Get days remaining in trial, or 0 if expired/not on trial
 */
export function getTrialDaysRemaining(user: any): number {
  if (!user || user.subscriptionStatus !== "TRIALING" || !user.trialEndDate) {
    return 0;
  }
  
  const now = new Date();
  const trialEnd = new Date(user.trialEndDate);
  
  if (now > trialEnd) return 0;
  
  const diffTime = Math.abs(trialEnd.getTime() - now.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Formats subscription status for display
 */
function formatSubscriptionStatus(status: string): string {
  // Convert from UPPER_CASE to Proper Case
  if (!status) return '';
  
  return status.toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Gets detailed subscription status information for display
 */
export function getSubscriptionDetails(user: any): {
  status: string;
  daysRemaining: number;
  needsSubscription: boolean;
  statusText: string;
} {
  if (!user) {
    return {
      status: "unknown",
      daysRemaining: 0,
      needsSubscription: true,
      statusText: "Not logged in"
    };
  }

  // Premium subscription
  if (user.subscriptionStatus === "PREMIUM") {
    return {
      status: "premium",
      daysRemaining: 0,
      needsSubscription: false,
      statusText: "Premium Subscription"
    };
  }

  // Active trial
  if (user.subscriptionStatus === "TRIALING" && user.trialEndDate) {
    const daysRemaining = getTrialDaysRemaining(user);
    return {
      status: "trial",
      daysRemaining,
      needsSubscription: false,
      statusText: `${formatSubscriptionStatus(user.subscriptionStatus)} (${daysRemaining} days remaining)`
    };
  }

  // Expired trial
  if (user.subscriptionStatus === "TRIAL_EXPIRED") {
    return {
      status: "expired",
      daysRemaining: 0,
      needsSubscription: true,
      statusText: formatSubscriptionStatus(user.subscriptionStatus)
    };
  }

  // Pending subscription
  if (user.subscriptionStatus === "PENDING_SUBSCRIPTION") {
    return {
      status: "pending",
      daysRemaining: 0,
      needsSubscription: true,
      statusText: formatSubscriptionStatus(user.subscriptionStatus)
    };
  }

  // Free tier or other status
  return {
    status: "free",
    daysRemaining: 0,
    needsSubscription: true,
    statusText: formatSubscriptionStatus(user.subscriptionStatus) || "Free Account"
  };
} 