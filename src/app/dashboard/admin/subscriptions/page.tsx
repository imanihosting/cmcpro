'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { format } from 'date-fns';
import { FiFilter, FiRefreshCw, FiSearch, FiX, FiChevronLeft, FiChevronRight, FiInfo } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { SubscriptionListItem, SubscriptionListResponse, Pagination } from '@/types/subscription';
import { User_role } from '@prisma/client';

export default function SubscriptionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State management
  const [subscriptions, setSubscriptions] = useState<SubscriptionListItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    userId: searchParams?.get('userId') || '',
    email: searchParams?.get('email') || '',
    name: searchParams?.get('name') || '',
    status: searchParams?.get('status') || '',
    role: searchParams?.get('role') || '',
    sortBy: searchParams?.get('sortBy') || 'createdAt',
    sortOrder: searchParams?.get('sortOrder') || 'desc',
  });
  
  // Function to fetch subscriptions with filters and pagination
  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const page = searchParams?.get('page') || '1';
    const limit = searchParams?.get('limit') || '10';
    
    try {
      // Build query parameters for API call
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);
      
      // Add filters if they exist
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.email) params.append('email', filters.email);
      if (filters.name) params.append('name', filters.name);
      if (filters.status) params.append('status', filters.status);
      if (filters.role) params.append('role', filters.role);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      
      const response = await axios.get<SubscriptionListResponse>(`/api/admin/subscriptions?${params.toString()}`);
      
      // Convert date strings to Date objects
      const formattedSubscriptions = response.data.subscriptions.map(sub => ({
        ...sub,
        createdAt: new Date(sub.createdAt),
        currentPeriodEnd: sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null,
      }));
      
      setSubscriptions(formattedSubscriptions);
      setPagination(response.data.pagination);
    } catch (err: any) {
      console.error('Error fetching subscriptions:', err);
      setError(err.response?.data?.error || 'Failed to fetch subscriptions');
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  }, [searchParams, filters]);
  
  // Effect to fetch subscriptions when params change
  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);
  
  // Handle filter form submit
  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build URL with new filters
    const params = new URLSearchParams();
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.email) params.append('email', filters.email);
    if (filters.name) params.append('name', filters.name);
    if (filters.status) params.append('status', filters.status);
    if (filters.role) params.append('role', filters.role);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    
    // Reset to page 1 when applying new filters
    params.append('page', '1');
    params.append('limit', pagination.limit.toString());
    
    // Navigate to the URL with filters
    router.push(`/dashboard/admin/subscriptions?${params.toString()}`);
    setFilterOpen(false);
  };
  
  // Handle filter reset
  const resetFilters = () => {
    setFilters({
      userId: '',
      email: '',
      name: '',
      status: '',
      role: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    
    // Navigate to base URL without filters
    router.push('/dashboard/admin/subscriptions');
    setFilterOpen(false);
  };
  
  // Handle pagination navigation
  const navigateToPage = (page: number) => {
    if (page < 1 || page > pagination.pages) return;
    
    const currentParams = new URLSearchParams(searchParams?.toString() || '');
    currentParams.set('page', page.toString());
    router.push(`/dashboard/admin/subscriptions?${currentParams.toString()}`);
  };
  
  // Get status badge color based on subscription status
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
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Subscriptions</h1>
        <p className="mt-1 text-sm text-gray-600">
          Monitor and manage all user subscriptions on the platform
        </p>
      </div>
      
      {/* Filters and actions */}
      <div className="flex flex-col sm:flex-row justify-between mb-4 gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FiFilter className="mr-2 h-4 w-4" /> Filters
          </button>
          
          <button
            onClick={fetchSubscriptions}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={loading}
          >
            <FiRefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          {pagination.total > 0 && (
            <span>
              Showing {(pagination.page - 1) * pagination.limit + 1}-
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </span>
          )}
        </div>
      </div>
      
      {/* Filters panel */}
      {filterOpen && (
        <div className="mb-6 p-4 border rounded-md bg-gray-50">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium">Filter Subscriptions</h3>
            <button onClick={() => setFilterOpen(false)} className="text-gray-400 hover:text-gray-500">
              <FiX className="h-5 w-5" />
            </button>
          </div>
          
          <form onSubmit={handleFilterSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  User Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={filters.name}
                  onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Search by name"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="text"
                  id="email"
                  value={filters.email}
                  onChange={(e) => setFilters({ ...filters, email: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Search by email"
                />
              </div>
              
              <div>
                <label htmlFor="userId" className="block text-sm font-medium text-gray-700">
                  User ID
                </label>
                <input
                  type="text"
                  id="userId"
                  value={filters.userId}
                  onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Search by user ID"
                />
              </div>
              
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="trialing">Trialing</option>
                  <option value="past_due">Past Due</option>
                  <option value="canceled">Canceled</option>
                  <option value="incomplete">Incomplete</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  User Role
                </label>
                <select
                  id="role"
                  value={filters.role}
                  onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">All Roles</option>
                  <option value="parent">Parent</option>
                  <option value="childminder">Childminder</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700">
                  Sort By
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <select
                    id="sortBy"
                    value={filters.sortBy}
                    onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                    className="flex-1 min-w-0 block w-full rounded-none rounded-l-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="createdAt">Created Date</option>
                    <option value="name">Name</option>
                    <option value="email">Email</option>
                    <option value="status">Status</option>
                    <option value="plan">Plan</option>
                  </select>
                  <select
                    id="sortOrder"
                    value={filters.sortOrder}
                    onChange={(e) => setFilters({ ...filters, sortOrder: e.target.value })}
                    className="inline-flex items-center px-3 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 sm:text-sm"
                  >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={resetFilters}
                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Reset Filters
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Apply Filters
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="mb-4 p-4 border rounded-md bg-red-50 text-red-800">
          <p>{error}</p>
        </div>
      )}
      
      {/* Subscriptions table for desktop */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Plan
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Renews
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  Loading subscriptions...
                </td>
              </tr>
            ) : subscriptions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  No subscriptions found
                </td>
              </tr>
            ) : (
              subscriptions.map((subscription) => (
                <tr key={subscription.userId}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{subscription.userName}</div>
                        <div className="text-sm text-gray-500">{subscription.userEmail}</div>
                        <div className="text-xs text-gray-400">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {subscription.userRole}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{subscription.plan}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(subscription.status)}`}>
                      {subscription.status}
                    </span>
                    {subscription.cancelAtPeriodEnd && (
                      <div className="text-xs text-gray-500 mt-1">Cancels at period end</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(subscription.createdAt, 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {subscription.currentPeriodEnd 
                      ? format(subscription.currentPeriodEnd, 'MMM d, yyyy')
                      : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/dashboard/admin/subscriptions/${subscription.subscriptionId || subscription.userId}`}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Mobile view - cards instead of table */}
      <div className="sm:hidden space-y-4">
        {loading ? (
          <div className="text-center py-4 text-gray-500">
            Loading subscriptions...
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No subscriptions found
          </div>
        ) : (
          subscriptions.map((subscription) => (
            <div key={subscription.userId} className="bg-white shadow rounded-lg overflow-hidden border">
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{subscription.userName}</h3>
                    <p className="text-sm text-gray-500">{subscription.userEmail}</p>
                  </div>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(subscription.status)}`}>
                    {subscription.status}
                  </span>
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Plan</p>
                    <p className="font-medium">{subscription.plan}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Role</p>
                    <p className="font-medium">{subscription.userRole}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Created</p>
                    <p className="font-medium">{format(subscription.createdAt, 'MMM d, yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Renews</p>
                    <p className="font-medium">
                      {subscription.currentPeriodEnd 
                        ? format(subscription.currentPeriodEnd, 'MMM d, yyyy')
                        : 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t flex justify-end">
                  <Link
                    href={`/dashboard/admin/subscriptions/${subscription.subscriptionId || subscription.userId}`}
                    className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => navigateToPage(pagination.page - 1)}
              disabled={pagination.page === 1}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                pagination.page === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => navigateToPage(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                pagination.page === pagination.pages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => navigateToPage(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                    pagination.page === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <FiChevronLeft className="h-5 w-5" />
                </button>
                
                {/* Pagination numbers */}
                {Array.from({ length: Math.min(5, pagination.pages) }).map((_, i) => {
                  let pageNumber;
                  
                  // Logic to show correct page numbers
                  if (pagination.pages <= 5) {
                    // If 5 or fewer total pages, show all
                    pageNumber = i + 1;
                  } else if (pagination.page <= 3) {
                    // If on pages 1-3, show pages 1-5
                    pageNumber = i + 1;
                  } else if (pagination.page >= pagination.pages - 2) {
                    // If on last 3 pages, show last 5 pages
                    pageNumber = pagination.pages - 4 + i;
                  } else {
                    // Otherwise, show current page and 2 on each side
                    pageNumber = pagination.page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => navigateToPage(pageNumber)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pagination.page === pageNumber
                          ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => navigateToPage(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                    pagination.page === pagination.pages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <FiChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 