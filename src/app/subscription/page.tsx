"use client";

import { Suspense,  useState, useEffect  } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter,  } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { FaCheckCircle, FaRegCreditCard, FaArrowRight, FaStar, FaExclamationTriangle } from 'react-icons/fa';
import { RiShieldCheckFill } from 'react-icons/ri';
import { BsCalendarMonth, BsCalendar3 } from 'react-icons/bs';
import { useSafeSearchParams } from '@/hooks/useSafeSearchParams';
import { getSubscriptionDetails, getTrialDaysRemaining } from '@/lib/subscription';

// Load Stripe outside of component rendering to avoid recreating Stripe object on every render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string);

function SubscriptionPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { searchParams, SearchParamsListener } = useSafeSearchParams();
  const required = searchParams?.get('required');
  const canceled = searchParams?.get('canceled');
  const success = searchParams?.get('success');
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isFixingSubscription, setIsFixingSubscription] = useState(false);
  const [fixResult, setFixResult] = useState<{ success: boolean; message: string } | null>(null);
  const [trialInfo, setTrialInfo] = useState<{ 
    active: boolean;
    daysRemaining: number;
    expired: boolean;
  }>({ active: false, daysRemaining: 0, expired: false });

  useEffect(() => {
    // Redirect unauthenticated users to login
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
    
    // Handle redirect from registration
    // Check if there's a redirectToSubscription flag in localStorage
    if (status === 'authenticated' && typeof window !== 'undefined') {
      const redirectFlag = localStorage.getItem('redirectToSubscription');
      if (redirectFlag === 'true') {
        // Clear the flag so it doesn't trigger again
        localStorage.removeItem('redirectToSubscription');
        console.log("Detected redirect from registration, staying on subscription page");
      }
    }
    
    // If the user has just been redirected after successful payment
    // Show a success message and redirect to dashboard after a delay
    if (success === 'true') {
      setShowSuccessMessage(true);
      console.log("Payment successful, waiting before redirecting to dashboard");
      
      // Try to fix subscription status if needed
      const fixSubscription = async () => {
        try {
          console.log("Attempting to fix subscription after successful payment");
          const response = await fetch('/api/fix-subscriptions');
          const data = await response.json();
          console.log("Subscription fix response:", data);
          
          if (data.success) {
            console.log("Subscription fixed successfully, redirecting to dashboard");
            // If fix was successful, redirect to dashboard immediately
            router.push('/dashboard?subscription=success');
          } else {
            console.error("Failed to fix subscription:", data.error);
            // Try again after a delay
            setTimeout(() => {
              console.log("Retrying subscription fix...");
              fetch('/api/fix-subscriptions')
                .then(res => res.json())
                .then(retryData => {
                  console.log("Retry response:", retryData);
                  // Redirect regardless of result after second attempt
                  router.push('/dashboard?subscription=success');
                })
                .catch(err => {
                  console.error("Error in retry:", err);
                  router.push('/dashboard?subscription=success');
                });
            }, 3000);
          }
        } catch (error) {
          console.error("Error fixing subscription:", error);
          // Wait a bit longer to allow webhook to process before redirecting
          setTimeout(() => {
            console.log("Redirecting to dashboard after error");
            router.push('/dashboard?subscription=success');
          }, 5000);
        }
      };
      
      // Call the fix endpoint
      fixSubscription();
    }

    // Check if user has an active subscription but wrong status
    const checkSubscription = async () => {
      if (session && required) {
        try {
          const response = await fetch('/api/check-subscription');
          const data = await response.json();
          if (data.hasActiveSubscription) {
            setHasActiveSubscription(true);
          }
        } catch (error) {
          console.error('Error checking subscription:', error);
        }
      }
    };
    
    checkSubscription();

    // Check trial information
    if (session?.user) {
      const { status, daysRemaining } = getSubscriptionDetails(session.user);
      setTrialInfo({
        active: status === 'trial',
        daysRemaining,
        expired: status === 'expired'
      });
    }
  }, [status, router, success, session, required]);

  const handleSubscription = async () => {
    if (!session) return;
    
    setIsLoading(true);
    
    try {
      // Create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: selectedPlan,
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
          console.error('Stripe checkout error:', error);
        }
      }
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFixSubscription = async () => {
    if (!session) return;
    
    setIsFixingSubscription(true);
    
    try {
      const response = await fetch('/api/fix-subscriptions');
      const data = await response.json();
      
      if (data.success) {
        setFixResult({
          success: true,
          message: 'Subscription fixed successfully! Redirecting to dashboard...'
        });
        
        // Redirect to dashboard after a delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setFixResult({
          success: false,
          message: data.error || 'Failed to fix subscription. Please contact support.'
        });
      }
    } catch (error) {
      setFixResult({
        success: false,
        message: 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setIsFixingSubscription(false);
    }
  };

  if (status === 'loading') {
    return (
      <div>
        <SearchParamsListener />
        <div className="flex h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-violet-600 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {showSuccessMessage && (
          <div className="mb-8 rounded-lg bg-green-50 p-4 shadow-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FaCheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-green-800">
                  Payment Successful!
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>
                    Thank you for your subscription! Your payment has been processed successfully.
                    You will be redirected to your dashboard shortly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {trialInfo.active && (
          <div className="mb-8 rounded-lg bg-blue-50 p-4 shadow-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FaStar className="h-5 w-5 text-blue-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-blue-800">
                  You're on a Free Trial
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    You have <span className="font-medium">{trialInfo.daysRemaining} days</span> remaining in your free trial.
                    Subscribe now to ensure uninterrupted access to all features when your trial ends.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {trialInfo.expired && (
          <div className="mb-8 rounded-lg bg-red-50 p-4 shadow-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FaExclamationTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-red-800">
                  Your Trial Has Expired
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    Your free trial period has ended. Subscribe now to regain access to all features.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {required && !trialInfo.active && !trialInfo.expired && (
          <div className="mb-8 rounded-lg bg-yellow-50 p-4 shadow-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FaExclamationTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-yellow-800">
                  Subscription Required
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    You need an active subscription to access the dashboard and use all features of ChildminderConnect. 
                    Please choose a subscription plan below to continue.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {canceled && (
          <div className="mb-8 rounded-lg bg-orange-50 p-4 shadow-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FaExclamationTriangle className="h-5 w-5 text-orange-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-orange-800">
                  Payment Canceled
                </h3>
                <div className="mt-2 text-sm text-orange-700">
                  <p>
                    Your subscription payment was canceled. You can try again when you're ready.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {required && hasActiveSubscription && (
          <div className="mb-8 rounded-lg bg-blue-50 p-4 shadow-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FaExclamationTriangle className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3 w-full">
                <h3 className="text-lg font-medium text-blue-800">
                  Subscription Issue Detected
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    It looks like you already have an active subscription, but your account status needs to be updated.
                    Click the button below to fix this issue.
                  </p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={handleFixSubscription}
                    disabled={isFixingSubscription}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70"
                  >
                    {isFixingSubscription ? (
                      <>
                        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-solid border-white border-t-transparent"></div>
                        Fixing...
                      </>
                    ) : (
                      'Fix My Subscription'
                    )}
                  </button>
                  {fixResult && (
                    <div className={`mt-2 text-sm ${fixResult.success ? 'text-green-600' : 'text-red-600'}`}>
                      {fixResult.message}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl md:text-5xl">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600">
              Unlock Premium Features
            </span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Choose the plan that works best for you and start connecting with confidence.
          </p>
        </div>

        {/* Plan Selection */}
        <div className="flex flex-col lg:flex-row gap-8 justify-center">
          {/* Monthly Plan */}
          <div 
            className={`relative overflow-hidden rounded-2xl shadow-xl transition-all duration-300 ${
              selectedPlan === 'monthly' 
                ? 'border-2 border-violet-500 transform scale-105' 
                : 'border border-gray-200'
            }`}
            onClick={() => setSelectedPlan('monthly')}
          >
            {selectedPlan === 'monthly' && (
              <div className="absolute top-0 right-0 bg-violet-600 text-white px-4 py-1 rounded-bl-lg font-medium text-sm">
                Selected
              </div>
            )}
            <div className="p-8 bg-white h-full flex flex-col">
              <div className="flex items-center mb-4">
                <BsCalendarMonth className="text-violet-600 text-2xl mr-2" />
                <h3 className="text-xl font-bold text-gray-900">Monthly Plan</h3>
              </div>
              <div className="mb-6">
                <p className="text-4xl font-extrabold text-gray-900">€9.99<span className="text-xl text-gray-500 font-normal">/month</span></p>
                <p className="text-gray-500 mt-2">Billed monthly</p>
              </div>
              <ul className="space-y-3 mb-8 flex-grow">
                <li className="flex items-start">
                  <FaCheckCircle className="text-violet-600 mt-1 mr-2 flex-shrink-0" />
                  <span className="text-gray-600">Full access to all platform features</span>
                </li>
                <li className="flex items-start">
                  <FaCheckCircle className="text-violet-600 mt-1 mr-2 flex-shrink-0" />
                  <span className="text-gray-600">Priority customer support</span>
                </li>
                <li className="flex items-start">
                  <FaCheckCircle className="text-violet-600 mt-1 mr-2 flex-shrink-0" />
                  <span className="text-gray-600">Cancel anytime</span>
                </li>
              </ul>
              <button
                type="button"
                className={`w-full flex items-center justify-center px-5 py-3 rounded-lg font-medium text-white ${
                  selectedPlan === 'monthly'
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => setSelectedPlan('monthly')}
              >
                {selectedPlan === 'monthly' ? 'Selected' : 'Select Plan'}
              </button>
            </div>
          </div>

          {/* Annual Plan */}
          <div 
            className={`relative overflow-hidden rounded-2xl shadow-xl transition-all duration-300 ${
              selectedPlan === 'annual' 
                ? 'border-2 border-violet-500 transform scale-105' 
                : 'border border-gray-200'
            }`}
            onClick={() => setSelectedPlan('annual')}
          >
            {selectedPlan === 'annual' && (
              <div className="absolute top-0 right-0 bg-violet-600 text-white px-4 py-1 rounded-bl-lg font-medium text-sm">
                Selected
              </div>
            )}
            <div className="absolute top-0 left-0 bg-green-600 text-white px-4 py-1 rounded-br-lg font-medium text-sm">
              Save 17%
            </div>
            <div className="p-8 bg-white h-full flex flex-col">
              <div className="flex items-center mb-4">
                <BsCalendar3 className="text-violet-600 text-2xl mr-2" />
                <h3 className="text-xl font-bold text-gray-900">Annual Plan</h3>
              </div>
              <div className="mb-6">
                <p className="text-4xl font-extrabold text-gray-900">€99.99<span className="text-xl text-gray-500 font-normal">/year</span></p>
                <p className="text-gray-500 mt-2">Billed annually</p>
              </div>
              <ul className="space-y-3 mb-8 flex-grow">
                <li className="flex items-start">
                  <FaCheckCircle className="text-violet-600 mt-1 mr-2 flex-shrink-0" />
                  <span className="text-gray-600">Full access to all platform features</span>
                </li>
                <li className="flex items-start">
                  <FaCheckCircle className="text-violet-600 mt-1 mr-2 flex-shrink-0" />
                  <span className="text-gray-600">Priority customer support</span>
                </li>
                <li className="flex items-start">
                  <FaCheckCircle className="text-violet-600 mt-1 mr-2 flex-shrink-0" />
                  <span className="text-gray-600">Two months free compared to monthly</span>
                </li>
                <li className="flex items-start">
                  <FaCheckCircle className="text-violet-600 mt-1 mr-2 flex-shrink-0" />
                  <span className="text-gray-600">Cancel anytime</span>
                </li>
              </ul>
              <button
                type="button"
                className={`w-full flex items-center justify-center px-5 py-3 rounded-lg font-medium text-white ${
                  selectedPlan === 'annual'
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => setSelectedPlan('annual')}
              >
                {selectedPlan === 'annual' ? 'Selected' : 'Select Plan'}
              </button>
            </div>
          </div>
        </div>

        {/* Subscribe Button */}
        <div className="mt-12 text-center">
          <button
            onClick={handleSubscription}
            disabled={isLoading}
            className="px-8 py-4 rounded-lg font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg transform transition hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
          >
            {isLoading ? (
              <>
                <div className="h-5 w-5 mr-2 animate-spin rounded-full border-2 border-solid border-white border-t-transparent"></div>
                Processing...
              </>
            ) : (
              <>
                <FaRegCreditCard className="mr-2" />
                Subscribe Now
                <FaArrowRight className="ml-2" />
              </>
            )}
          </button>
        </div>

        {/* Trustworthy Banner */}
        <div className="mt-16 bg-violet-50 rounded-xl p-6 shadow-md">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <div className="flex items-center">
              <RiShieldCheckFill className="text-violet-600 text-xl mr-2" />
              <span className="text-gray-700">Secure payment</span>
            </div>
            <div className="flex items-center">
              <FaStar className="text-violet-600 text-xl mr-2" />
              <span className="text-gray-700">Premium support</span>
            </div>
            <div className="flex items-center">
              <FaCheckCircle className="text-violet-600 text-xl mr-2" />
              <span className="text-gray-700">Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
export default function SubscriptionPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
    </div>}>
      <SubscriptionPageContent />
    </Suspense>
  );
}