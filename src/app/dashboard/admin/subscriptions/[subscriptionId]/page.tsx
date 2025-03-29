'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { format } from 'date-fns';
import { FiArrowLeft, FiExternalLink, FiAlertCircle, FiCreditCard, FiCalendar, FiDollarSign, FiUser, FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { SubscriptionDetails } from '@/types/subscription';

interface CancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, cancelImmediately: boolean) => void;
  isLoading: boolean;
}

// Cancel Subscription Modal Component
const CancelModal: React.FC<CancelModalProps> = ({ isOpen, onClose, onConfirm, isLoading }) => {
  const [reason, setReason] = useState('');
  const [cancelImmediately, setCancelImmediately] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (reason.trim().length < 5) {
      setError('Please provide a detailed reason (minimum 5 characters)');
      return;
    }
    
    onConfirm(reason, cancelImmediately);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <FiAlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Cancel Subscription
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to cancel this subscription? This action requires administrative approval and will be logged.
                  </p>
                  
                  <form onSubmit={handleSubmit} className="mt-4">
                    <div className="mb-4">
                      <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                        Reason for cancellation <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="reason"
                        name="reason"
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Please provide a detailed reason for this cancellation..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        required
                      />
                      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex items-center">
                        <input
                          id="cancelImmediately"
                          name="cancelImmediately"
                          type="checkbox"
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          checked={cancelImmediately}
                          onChange={(e) => setCancelImmediately(e.target.checked)}
                        />
                        <label htmlFor="cancelImmediately" className="ml-2 block text-sm text-gray-900">
                          Cancel immediately (instead of at period end)
                        </label>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        {cancelImmediately
                          ? "The subscription will be cancelled immediately. The user will lose access to premium features."
                          : "The subscription will continue until the end of the current billing period, then automatically cancel."}
                      </p>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              {isLoading ? 'Processing...' : 'Confirm Cancellation'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function SubscriptionDetailsPage({ params }: { params: { subscriptionId: string } }) {
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  
  // Fetch subscription details when the component mounts
  useEffect(() => {
    const fetchSubscriptionDetails = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.get<SubscriptionDetails>(`/api/admin/subscriptions/${params.subscriptionId}`);
        
        // Convert date strings to Date objects
        const subscriptionData = {
          ...response.data,
          createdAt: new Date(response.data.createdAt),
          updatedAt: new Date(response.data.updatedAt),
          currentPeriodStart: response.data.currentPeriodStart 
            ? new Date(response.data.currentPeriodStart) 
            : undefined,
          currentPeriodEnd: response.data.currentPeriodEnd 
            ? new Date(response.data.currentPeriodEnd) 
            : null,
          canceledAt: response.data.canceledAt 
            ? new Date(response.data.canceledAt) 
            : null,
          cancelAt: response.data.cancelAt 
            ? new Date(response.data.cancelAt) 
            : null,
          startDate: response.data.startDate 
            ? new Date(response.data.startDate) 
            : undefined,
          trialStart: response.data.trialStart 
            ? new Date(response.data.trialStart) 
            : null,
          trialEnd: response.data.trialEnd 
            ? new Date(response.data.trialEnd) 
            : null,
        };
        
        if (response.data.latestInvoice) {
          subscriptionData.latestInvoice = {
            ...response.data.latestInvoice,
            created: new Date(response.data.latestInvoice.created),
          };
        }
        
        setSubscription(subscriptionData);
      } catch (err: any) {
        console.error('Error fetching subscription details:', err);
        setError(err.response?.data?.error || 'Failed to fetch subscription details');
        toast.error('Failed to load subscription details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSubscriptionDetails();
  }, [params.subscriptionId]);
  
  // Handle cancelling a subscription
  const handleCancelSubscription = async (reason: string, cancelImmediately: boolean) => {
    setCancelLoading(true);
    
    try {
      const response = await axios.post('/api/admin/subscriptions/cancel', {
        subscriptionId: subscription?.stripeSubscriptionId || subscription?.id,
        reason,
        cancelImmediately,
      });
      
      // Update the local state with the response data
      setSubscription(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          status: response.data.subscription.status,
          cancelAtPeriodEnd: response.data.subscription.cancelAtPeriodEnd,
          currentPeriodEnd: new Date(response.data.subscription.currentPeriodEnd),
        };
      });
      
      toast.success(response.data.message);
      setShowCancelModal(false);
    } catch (err: any) {
      console.error('Error cancelling subscription:', err);
      toast.error(err.response?.data?.error || 'Failed to cancel subscription');
    } finally {
      setCancelLoading(false);
    }
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8 w-full">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8 w-full">
        <div className="bg-red-50 p-4 rounded-md mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading subscription details</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <FiArrowLeft className="mr-2 h-4 w-4" /> Back to Subscriptions
          </button>
        </div>
      </div>
    );
  }
  
  // Render no subscription found
  if (!subscription) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8 w-full">
        <div className="bg-yellow-50 p-4 rounded-md mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Subscription not found</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>The requested subscription could not be found.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <FiArrowLeft className="mr-2 h-4 w-4" /> Back to Subscriptions
          </button>
        </div>
      </div>
    );
  }
  
  // Get status color based on subscription status
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'trialing':
        return 'bg-blue-100 text-blue-800';
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      case 'incomplete':
      case 'incomplete_expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center mb-2">
              <button
                onClick={() => router.back()}
                className="mr-4 text-gray-400 hover:text-gray-500"
              >
                <FiArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-2xl font-semibold text-gray-900">Subscription Details</h1>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              View and manage subscription information
            </p>
          </div>
          
          <div className="mt-3 sm:mt-0 flex flex-wrap gap-2">
            {subscription.stripeUrl && (
              <a
                href={subscription.stripeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <FiExternalLink className="mr-2 h-4 w-4" /> View in Stripe
              </a>
            )}
            
            {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
              >
                <FiX className="mr-2 h-4 w-4" /> Cancel Subscription
              </button>
            )}
          </div>
        </div>
        
        {/* Subscription status display */}
        <div className="mt-4 sm:flex sm:items-center">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(subscription.status)}`}>
            {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
          </div>
          
          {subscription.cancelAtPeriodEnd && (
            <div className="mt-2 sm:mt-0 sm:ml-3 text-sm font-medium text-gray-500">
              Will cancel at period end ({format(subscription.currentPeriodEnd!, 'MMM d, yyyy')})
            </div>
          )}
        </div>
      </div>
      
      {/* Subscription Stripe error display */}
      {subscription.stripeError && (
        <div className="bg-yellow-50 p-4 rounded-md mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Stripe data unavailable</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Some Stripe data could not be loaded: {subscription.stripeError}</p>
                <p className="mt-1">Showing limited information from the local database.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Main content - grid with two columns for desktop, stacked for mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Subscription details */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Subscription Information</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Details about the subscription plan and status.</p>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            <dl className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-6">
              <div>
                <dt className="text-sm font-medium text-gray-500">Plan</dt>
                <dd className="mt-1 text-sm text-gray-900">{subscription.plan || 'Unknown'}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Subscription ID</dt>
                <dd className="mt-1 text-sm text-gray-900 truncate" title={subscription.stripeSubscriptionId || ''}>
                  {subscription.stripeSubscriptionId 
                    ? subscription.stripeSubscriptionId.slice(0, 15) + '...' 
                    : 'N/A'}
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {format(subscription.createdAt, 'MMM d, yyyy')}
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Current Period</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {subscription.currentPeriodStart && subscription.currentPeriodEnd
                    ? `${format(subscription.currentPeriodStart, 'MMM d')} - ${format(subscription.currentPeriodEnd, 'MMM d, yyyy')}`
                    : subscription.currentPeriodEnd
                      ? `Ends: ${format(subscription.currentPeriodEnd, 'MMM d, yyyy')}`
                      : 'N/A'}
                </dd>
              </div>
              
              {subscription.product && (
                <>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Amount</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: subscription.product.currency.toUpperCase(),
                      }).format(subscription.product.amount)}
                      {subscription.product.interval && (
                        <span className="text-gray-500">
                          /{subscription.product.interval}
                        </span>
                      )}
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Product Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{subscription.product.name || 'Unknown'}</dd>
                  </div>
                </>
              )}
              
              {subscription.canceledAt && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Canceled At</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {format(subscription.canceledAt, 'MMM d, yyyy')}
                  </dd>
                </div>
              )}
              
              {subscription.trialStart && subscription.trialEnd && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Trial Period</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {format(subscription.trialStart, 'MMM d')} - {format(subscription.trialEnd, 'MMM d, yyyy')}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
        
        {/* User and payment details */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Customer Information</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Customer and payment details.</p>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            <dl className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-6">
              <div>
                <dt className="text-sm font-medium text-gray-500">Customer</dt>
                <dd className="mt-1 text-sm text-gray-900">{subscription.user.name || 'Unknown'}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{subscription.user.email}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">User Role</dt>
                <dd className="mt-1 text-sm text-gray-900">{subscription.user.role}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Customer ID</dt>
                <dd className="mt-1 text-sm text-gray-900 truncate" title={subscription.stripeCustomerId || ''}>
                  {subscription.stripeCustomerId 
                    ? subscription.stripeCustomerId.slice(0, 15) + '...' 
                    : 'N/A'}
                </dd>
              </div>
              
              {subscription.paymentMethod && (
                <>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Payment Method</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <div className="flex items-center">
                        <span className="capitalize">{subscription.paymentMethod.brand}</span>
                        <span className="mx-1">•••• {subscription.paymentMethod.last4}</span>
                      </div>
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Expires</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {subscription.paymentMethod.expMonth}/{subscription.paymentMethod.expYear}
                    </dd>
                  </div>
                </>
              )}
              
              {subscription.latestInvoice && (
                <>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Latest Invoice</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {subscription.latestInvoice.number || subscription.latestInvoice.id.slice(0, 8)}
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Amount</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: subscription.latestInvoice.currency.toUpperCase(),
                      }).format(subscription.latestInvoice.amountPaid)}
                    </dd>
                  </div>
                  
                  {subscription.latestInvoice.hostedInvoiceUrl && (
                    <div className="col-span-full">
                      <a
                        href={subscription.latestInvoice.hostedInvoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <FiExternalLink className="mr-2 h-4 w-4" /> View Invoice
                      </a>
                    </div>
                  )}
                </>
              )}
            </dl>
          </div>
        </div>
      </div>
      
      {/* Cancel Subscription Modal */}
      <CancelModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelSubscription}
        isLoading={cancelLoading}
      />
    </div>
  );
} 