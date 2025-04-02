"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { 
  FaCheckCircle, 
  FaTimesCircle, 
  FaExclamationTriangle, 
  FaCreditCard, 
  FaArrowRight, 
  FaSpinner 
} from 'react-icons/fa';

// Types for subscription and plans
interface Subscription {
  id?: string;
  status: string;
  plan: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  priceId: string | null;
  interval?: string;
  amount?: number;
  currency?: string;
  subscriptionStatus: string;
}

interface PriceInfo {
  id: string;
  currency: string;
  interval: string;
  intervalCount: number;
  unitAmount: number;
  formattedPrice: string;
}

interface PlanInfo {
  id: string;
  name: string;
  description: string | null;
  features: string[];
  isPopular: boolean;
  prices: PriceInfo[];
  defaultPrice: PriceInfo;
}

// Load Stripe outside of component rendering
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string);

export default function SubscriptionPage() {
  const { data: session, status: sessionStatus, update } = useSession();
  const router = useRouter();
  
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [activeTab, setActiveTab] = useState<'current' | 'plans'>('current');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInterval, setSelectedInterval] = useState<'month' | 'year'>('month');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelType, setCancelType] = useState<'immediate' | 'end'>('end');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Fetch subscription data and plans
  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      Promise.all([
        fetch('/api/subscription/current').then(res => res.json()),
        fetch('/api/subscription/plans').then(res => res.json())
      ]).then(([subData, plansData]) => {
        if (subData.error) {
          setError(subData.error);
        } else {
          setSubscription(subData);
        }

        if (Array.isArray(plansData)) {
          setPlans(plansData);
        }

        setIsLoading(false);
      }).catch(err => {
        setError('Failed to load subscription data. Please try again.');
        setIsLoading(false);
        console.error('Error fetching subscription data:', err);
      });
    } else if (sessionStatus === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [sessionStatus, router]);

  // Handle subscription upgrade/downgrade
  const handleSubscriptionChange = async (priceId: string) => {
    if (!session) return;
    
    setIsUpdating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/subscription/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update subscription');
      }
      
      // Refresh subscription data
      const newSubData = await fetch('/api/subscription/current').then(res => res.json());
      setSubscription(newSubData);
      setActionSuccess('Your subscription has been updated successfully!');
      
      // Reset success message after a few seconds
      setTimeout(() => {
        setActionSuccess(null);
      }, 5000);
    } catch (error: any) {
      setError(error.message || 'An error occurred while updating your subscription');
      console.error('Subscription update error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle new subscription
  const handleNewSubscription = async (priceId: string) => {
    if (!session) return;
    
    setIsUpdating(true);
    setError(null);
    
    try {
      // Create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: selectedInterval === 'month' ? 'monthly' : 'annual',
          userId: session.user.id,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }
      
      const { sessionId } = await response.json();
      
      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId });
        if (error) {
          throw error;
        }
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred while processing your subscription');
      console.error('Subscription error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle subscription cancellation
  const handleCancelSubscription = async () => {
    if (!session || !subscription?.id) return;
    
    setIsCancelling(true);
    setError(null);
    
    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cancelImmediately: cancelType === 'immediate',
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }
      
      // Refresh subscription data
      const newSubData = await fetch('/api/subscription/current').then(res => res.json());
      setSubscription(newSubData);
      setShowCancelConfirm(false);
      
      // Set success message
      const successMessage = cancelType === 'immediate' 
        ? 'Your subscription has been cancelled immediately. You will be redirected to the subscription page.' 
        : 'Your subscription will be cancelled at the end of the billing period.';
      setActionSuccess(successMessage);
      
      // If cancelled immediately, refresh session and redirect to subscription page after a few seconds
      if (cancelType === 'immediate') {
        // Force a session reload to update the subscription status
        await update(); // Use next-auth update method
        
        setTimeout(() => {
          // Use hard redirect to force a complete page refresh
          window.location.href = '/subscription?required=true';
        }, 3000);
      } else {
        // Reset success message after a few seconds
        setTimeout(() => {
          setActionSuccess(null);
        }, 5000);
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred while cancelling your subscription');
      console.error('Subscription cancel error:', error);
    } finally {
      setIsCancelling(false);
    }
  };

  if (sessionStatus === 'loading' || isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6">
        <FaSpinner className="h-8 w-8 animate-spin text-violet-600" />
        <p className="mt-4 text-sm text-gray-600">Loading subscription information...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white p-4 sm:p-6 md:p-8 lg:p-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Subscription Management</h1>
        
        {/* Error display */}
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="flex">
              <FaExclamationTriangle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-2 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Success message */}
        {actionSuccess && (
          <div className="mb-6 rounded-md bg-green-50 p-4">
            <div className="flex">
              <FaCheckCircle className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Success</h3>
                <p className="mt-2 text-sm text-green-700">{actionSuccess}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Navigation tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('current')}
              className={`
                ${activeTab === 'current'
                  ? 'border-violet-500 text-violet-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}
                whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium
              `}
            >
              Current Subscription
            </button>
            <button
              onClick={() => setActiveTab('plans')}
              className={`
                ${activeTab === 'plans'
                  ? 'border-violet-500 text-violet-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}
                whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium
              `}
            >
              Available Plans
            </button>
          </nav>
        </div>
        
        {/* Current subscription tab */}
        {activeTab === 'current' && (
          <div className="space-y-6">
            <div className="overflow-hidden rounded-lg bg-gray-50 shadow">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Subscription Details
                </h3>
                
                {subscription ? (
                  <div className="mt-5 border-t border-gray-200 pt-5">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Status</dt>
                        <dd className="mt-1 flex items-center text-sm text-gray-900">
                          {subscription.status === 'active' ? (
                            <>
                              <FaCheckCircle className="mr-1.5 h-4 w-4 text-green-500" />
                              Active
                            </>
                          ) : subscription.status === 'trialing' ? (
                            <>
                              <FaCheckCircle className="mr-1.5 h-4 w-4 text-blue-500" />
                              Trial
                            </>
                          ) : subscription.status === 'past_due' ? (
                            <>
                              <FaExclamationTriangle className="mr-1.5 h-4 w-4 text-yellow-500" />
                              Past Due
                            </>
                          ) : (
                            <>
                              <FaTimesCircle className="mr-1.5 h-4 w-4 text-red-500" />
                              {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                            </>
                          )}
                          
                          {subscription.cancelAtPeriodEnd && (
                            <span className="ml-2 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                              Cancels at period end
                            </span>
                          )}
                        </dd>
                      </div>
                      
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Plan</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {subscription.plan || 'Free Plan'}
                        </dd>
                      </div>
                      
                      {subscription.currentPeriodEnd && (
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">
                            {subscription.cancelAtPeriodEnd ? 'Access Until' : 'Next Billing Date'}
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                          </dd>
                        </div>
                      )}
                      
                      {subscription.amount && subscription.currency && (
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Price</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: subscription.currency,
                            }).format(subscription.amount)}
                            {subscription.interval && ` / ${subscription.interval}`}
                          </dd>
                        </div>
                      )}
                    </dl>
                    
                    <div className="mt-6 flex flex-col space-y-3 sm:flex-row sm:space-x-3 sm:space-y-0">
                      {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
                        <>
                          <button
                            onClick={() => setActiveTab('plans')}
                            className="inline-flex items-center justify-center rounded-md border border-transparent bg-violet-100 px-4 py-2 text-sm font-medium text-violet-700 shadow-sm hover:bg-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                          >
                            Change Plan
                          </button>
                          
                          <button
                            onClick={() => setShowCancelConfirm(true)}
                            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                          >
                            Cancel Subscription
                          </button>
                        </>
                      )}
                      
                      {subscription.status === 'inactive' || subscription.status === 'canceled' || (
                        subscription.status === 'active' && subscription.cancelAtPeriodEnd
                      ) ? (
                        <button
                          onClick={() => setActiveTab('plans')}
                          className="inline-flex items-center justify-center rounded-md border border-transparent bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                        >
                          Subscribe Again
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 text-center">
                    <p className="text-sm text-gray-500">You don't have an active subscription.</p>
                    <button
                      onClick={() => setActiveTab('plans')}
                      className="mt-3 inline-flex items-center rounded-md border border-transparent bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                    >
                      View Available Plans
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Available plans tab */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            {/* Billing interval toggle */}
            <div className="flex justify-center">
              <div className="relative mt-2 rounded-md shadow-sm">
                <div className="inline-flex rounded-md shadow-sm">
                  <button
                    type="button"
                    className={`relative inline-flex items-center rounded-l-md px-3 py-2 text-sm font-medium ${
                      selectedInterval === 'month'
                        ? 'bg-violet-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    } border border-gray-300 focus:z-10 focus:outline-none focus:ring-2 focus:ring-violet-500`}
                    onClick={() => setSelectedInterval('month')}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    className={`relative -ml-px inline-flex items-center rounded-r-md px-3 py-2 text-sm font-medium ${
                      selectedInterval === 'year'
                        ? 'bg-violet-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    } border border-gray-300 focus:z-10 focus:outline-none focus:ring-2 focus:ring-violet-500`}
                    onClick={() => setSelectedInterval('year')}
                  >
                    Yearly
                  </button>
                </div>
              </div>
            </div>
            
            {/* Plans grid */}
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map(plan => {
                // Find the price matching the selected interval
                const matchingPrice = plan.prices.find(
                  price => price.interval === (selectedInterval === 'year' ? 'year' : 'month')
                );
                const priceToShow = matchingPrice || plan.defaultPrice;
                
                // Check if this is the current plan
                const isCurrentPlan = subscription?.priceId === priceToShow.id;
                
                return (
                  <div 
                    key={plan.id}
                    className={`overflow-hidden rounded-lg border ${
                      plan.isPopular ? 'border-violet-400 ring-2 ring-violet-500' : 'border-gray-200'
                    } bg-white shadow-sm`}
                  >
                    {plan.isPopular && (
                      <div className="bg-violet-500 py-1 text-center text-xs font-medium uppercase tracking-wider text-white">
                        Most Popular
                      </div>
                    )}
                    
                    <div className="p-6">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">{plan.name}</h3>
                      
                      <p className="mt-4 flex items-baseline">
                        <span className="text-3xl font-bold tracking-tight text-gray-900">
                          {priceToShow.formattedPrice}
                        </span>
                        <span className="ml-1 text-sm font-medium text-gray-500">
                          /{priceToShow.interval}
                        </span>
                      </p>
                      
                      {plan.description && (
                        <p className="mt-2 text-sm text-gray-500">{plan.description}</p>
                      )}
                      
                      <ul className="mt-4 space-y-2">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <FaCheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                            <span className="ml-2 text-sm text-gray-500">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <div className="mt-6">
                        {isCurrentPlan ? (
                          <button
                            disabled
                            className="w-full rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-500"
                          >
                            Current Plan
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (subscription?.id) {
                                handleSubscriptionChange(priceToShow.id);
                              } else {
                                handleNewSubscription(priceToShow.id);
                              }
                            }}
                            disabled={isUpdating}
                            className="w-full rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                          >
                            {isUpdating ? (
                              <>
                                <FaSpinner className="mr-2 inline h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : subscription?.id ? (
                              'Switch to this plan'
                            ) : (
                              'Subscribe'
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Cancellation confirmation modal */}
        {showCancelConfirm && (
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              
              <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>
              
              <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <FaExclamationTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">Cancel Subscription</h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Are you sure you want to cancel your subscription? This action cannot be undone.
                        </p>
                        
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center">
                            <input
                              type="radio"
                              id="cancel-end"
                              name="cancel-type"
                              checked={cancelType === 'end'}
                              onChange={() => setCancelType('end')}
                              className="h-4 w-4 border-gray-300 text-violet-600 focus:ring-violet-500"
                            />
                            <label htmlFor="cancel-end" className="ml-2 block text-sm text-gray-700">
                              Cancel at the end of the billing period (maintain access until {
                                subscription?.currentPeriodEnd 
                                  ? new Date(subscription.currentPeriodEnd).toLocaleDateString() 
                                  : 'the end of your current period'
                              })
                            </label>
                          </div>
                          
                          <div className="flex items-center">
                            <input
                              type="radio"
                              id="cancel-immediate"
                              name="cancel-type"
                              checked={cancelType === 'immediate'}
                              onChange={() => setCancelType('immediate')}
                              className="h-4 w-4 border-gray-300 text-violet-600 focus:ring-violet-500"
                            />
                            <label htmlFor="cancel-immediate" className="ml-2 block text-sm text-gray-700">
                              Cancel immediately (lose access now)
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    onClick={handleCancelSubscription}
                    disabled={isCancelling}
                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {isCancelling ? (
                      <>
                        <FaSpinner className="mr-2 inline h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Confirm Cancellation'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCancelConfirm(false)}
                    disabled={isCancelling}
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 sm:ml-3 sm:mt-0 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 