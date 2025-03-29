"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  FaCalendarAlt, 
  FaSearch, 
  FaFilter, 
  FaSort, 
  FaEye,
  FaEdit,
  FaChevronLeft, 
  FaChevronRight
} from 'react-icons/fa';
import { Booking_status } from '@prisma/client';
import { format } from 'date-fns';

// Type definitions
interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  status: Booking_status;
  createdAt: string;
  updatedAt: string;
  bookingType: string;
  isEmergency: boolean;
  isRecurring: boolean;
  cancellationNote?: string;
  User_Booking_parentIdToUser: {
    id: string;
    name: string | null;
    email: string;
    phoneNumber?: string;
  };
  User_Booking_childminderIdToUser: {
    id: string;
    name: string | null;
    email: string;
    phoneNumber?: string;
    location?: string;
    rate?: number;
  };
  BookingChildren: {
    Child: {
      id: string;
      name: string;
      age: number;
      allergies?: string;
      specialNeeds?: string;
    };
  }[];
}

interface PaginationData {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Status badge color mapping
const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  LATE_CANCELLED: 'bg-orange-100 text-orange-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
};

export default function AdminBookingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // State for booking data
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false
  });
  
  // State for loading and error handling
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Booking_status | ''>('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  
  // State for sorting
  const [sortField, setSortField] = useState('startTime');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // State for booking detail modal
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // State for booking management modal
  const [showManagementModal, setShowManagementModal] = useState(false);
  const [newStatus, setNewStatus] = useState<Booking_status | ''>('');
  const [cancellationNote, setCancellationNote] = useState('');
  const [adminReason, setAdminReason] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  
  // Fetch bookings data with filters, sorting, and pagination
  const fetchBookings = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      
      if (startDateFilter) {
        params.append('startDate', startDateFilter);
      }
      
      if (endDateFilter) {
        params.append('endDate', endDateFilter);
      }
      
      params.append('sortField', sortField);
      params.append('sortOrder', sortOrder);
      
      // Fetch data from API
      const response = await fetch(`/api/admin/bookings?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching bookings: ${response.statusText}`);
      }
      
      const data = await response.json();
      setBookings(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
      console.error('Error fetching bookings:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch booking details
  const fetchBookingDetails = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching booking details: ${response.statusText}`);
      }
      
      const data = await response.json();
      setSelectedBooking(data);
      setShowDetailModal(true);
    } catch (err) {
      console.error('Error fetching booking details:', err);
      alert('Failed to load booking details. Please try again.');
    }
  };
  
  // Update booking status
  const updateBookingStatus = async () => {
    if (!selectedBooking) return;
    
    setUpdateLoading(true);
    setUpdateError(null);
    setUpdateSuccess(false);
    
    try {
      // Prepare update data
      const updateData: any = {
        adminReason
      };
      
      if (newStatus) {
        updateData.status = newStatus;
      }
      
      if (cancellationNote) {
        updateData.cancellationNote = cancellationNote;
      }
      
      // Send update request
      const response = await fetch(`/api/admin/bookings/${selectedBooking.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error updating booking: ${response.statusText}`);
      }
      
      setUpdateSuccess(true);
      
      // Refresh data after update
      fetchBookings();
      
      // Close modal after a short delay
      setTimeout(() => {
        setShowManagementModal(false);
        setUpdateSuccess(false);
        setNewStatus('');
        setCancellationNote('');
        setAdminReason('');
      }, 2000);
      
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Failed to update booking');
      console.error('Error updating booking:', err);
    } finally {
      setUpdateLoading(false);
    }
  };
  
  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Reset to page 1 when applying new filters
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchBookings();
  };
  
  // Handle clear filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
    setPagination(prev => ({ ...prev, page: 1 }));
    // Wait for state updates to take effect before fetching
    setTimeout(fetchBookings, 0);
  };
  
  // Handle pagination changes
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };
  
  // Handle sort changes
  const handleSort = (field: string) => {
    // If clicking the same field, toggle order. Otherwise, set to desc initially
    const newOrder = field === sortField && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortField(field);
    setSortOrder(newOrder);
  };
  
  // Format date/time for display
  const formatDateTime = (dateStr: string) => {
    return format(new Date(dateStr), 'MMM d, yyyy h:mm a');
  };
  
  // Effect for authentication check
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }
    
    if (status === "authenticated" && session.user.role !== "admin") {
      // Redirect to appropriate dashboard based on role
      if (session.user.role === "parent") {
        router.push("/dashboard/parent");
      } else if (session.user.role === "childminder") {
        router.push("/dashboard/childminder");
      } else {
        router.push("/dashboard");
      }
    }
  }, [status, session, router]);
  
  // Effect to fetch bookings when dependencies change
  useEffect(() => {
    if (status === "authenticated" && session?.user.role === "admin") {
      fetchBookings();
    }
  }, [pagination.page, sortField, sortOrder, status, session]);
  
  // Show loading state while checking authentication or loading data
  if (status === "loading" || (isLoading && !error && bookings.length === 0)) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  // Return the main component
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="flex items-center text-2xl font-bold text-gray-900 sm:text-3xl">
          <FaCalendarAlt className="mr-2 text-indigo-600" />
          Bookings Management
        </h1>
      </div>

      {/* Filter and search section */}
      <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Search input */}
            <div>
              <label htmlFor="search" className="mb-1 block text-sm font-medium text-gray-700">
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search parent or childminder..."
                  className="block w-full rounded-md border border-gray-300 bg-white px-4 py-2 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <FaSearch className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
            
            {/* Status filter */}
            <div>
              <label htmlFor="status" className="mb-1 block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as Booking_status | '')}
                className="block w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="LATE_CANCELLED">Late Cancelled</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
            
            {/* Date filters */}
            <div>
              <label htmlFor="startDate" className="mb-1 block text-sm font-medium text-gray-700">
                From Date
              </label>
              <input
                type="date"
                id="startDate"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                className="block w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label htmlFor="endDate" className="mb-1 block text-sm font-medium text-gray-700">
                To Date
              </label>
              <input
                type="date"
                id="endDate"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
                className="block w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={handleClearFilters}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Clear Filters
            </button>
            <button
              type="submit"
              className="flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
            >
              <FaFilter className="mr-2" />
              Apply Filters
            </button>
          </div>
        </form>
      </div>
      
      {/* Show error if present */}
      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-800">
          Error: {error}
        </div>
      )}
      
      {/* Bookings table */}
      <div className="mb-6 overflow-hidden rounded-lg bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  onClick={() => handleSort('startTime')}
                >
                  <div className="flex items-center">
                    Date/Time
                    {sortField === 'startTime' && (
                      <FaSort className="ml-1 text-gray-400" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Parent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Childminder
                </th>
                <th 
                  className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Status
                    {sortField === 'status' && (
                      <FaSort className="ml-1 text-gray-400" />
                    )}
                  </div>
                </th>
                <th 
                  className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center">
                    Created
                    {sortField === 'createdAt' && (
                      <FaSort className="ml-1 text-gray-400" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {bookings.length > 0 ? (
                bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {formatDateTime(booking.startTime)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="font-medium">
                        {booking.User_Booking_parentIdToUser.name || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {booking.User_Booking_parentIdToUser.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="font-medium">
                        {booking.User_Booking_childminderIdToUser.name || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {booking.User_Booking_childminderIdToUser.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span 
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          statusColors[booking.status] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {booking.status.replace('_', ' ')}
                      </span>
                      {booking.isEmergency && (
                        <span className="ml-2 inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                          Emergency
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {format(new Date(booking.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <button 
                        onClick={() => fetchBookingDetails(booking.id)}
                        className="mr-2 rounded bg-indigo-50 px-2 py-1 text-indigo-700 hover:bg-indigo-100"
                      >
                        <FaEye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => {
                          fetchBookingDetails(booking.id);
                          setTimeout(() => setShowManagementModal(true), 500);
                        }}
                        className="rounded bg-amber-50 px-2 py-1 text-amber-700 hover:bg-amber-100"
                      >
                        <FaEdit className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    {isLoading ? 'Loading bookings...' : 'No bookings found matching the criteria.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.totalCount)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.totalCount}</span> bookings
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPreviousPage}
                    className={`relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium ${
                      pagination.hasPreviousPage ? 'text-gray-500 hover:bg-gray-50' : 'cursor-not-allowed text-gray-300'
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <FaChevronLeft className="h-4 w-4" />
                  </button>
                  
                  {/* Page number buttons */}
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      // Show current page, first and last page, and pages +/- 1 from current
                      return (
                        page === 1 ||
                        page === pagination.totalPages ||
                        Math.abs(page - pagination.page) <= 1
                      );
                    })
                    .map((page, i, filteredPages) => {
                      // Add ellipsis where needed
                      const showEllipsisBefore = i > 0 && filteredPages[i - 1] !== page - 1;
                      const showEllipsisAfter = i < filteredPages.length - 1 && filteredPages[i + 1] !== page + 1;
                      
                      return (
                        <div key={page}>
                          {showEllipsisBefore && (
                            <span className="relative inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700">
                              ...
                            </span>
                          )}
                          
                          <button
                            onClick={() => handlePageChange(page)}
                            className={`relative inline-flex items-center border border-gray-300 ${
                              pagination.page === page
                                ? 'z-10 border-indigo-500 bg-indigo-50 text-indigo-600'
                                : 'bg-white text-gray-500 hover:bg-gray-50'
                            } px-4 py-2 text-sm font-medium`}
                          >
                            {page}
                          </button>
                          
                          {showEllipsisAfter && (
                            <span className="relative inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700">
                              ...
                            </span>
                          )}
                        </div>
                      );
                    })}
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNextPage}
                    className={`relative inline-flex items-center rounded-r-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium ${
                      pagination.hasNextPage ? 'text-gray-500 hover:bg-gray-50' : 'cursor-not-allowed text-gray-300'
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <FaChevronRight className="h-4 w-4" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Booking Details Modal */}
      {showDetailModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Booking Details</h2>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="rounded p-1 text-gray-700 hover:bg-gray-100"
              >
                &times;
              </button>
            </div>
            
            {/* Booking Information */}
            <div className="mb-6 rounded-md bg-gray-50 p-4">
              <h3 className="mb-2 text-md font-semibold text-gray-800">Booking Information</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-gray-500">Booking ID</p>
                  <p className="text-sm text-gray-800">{selectedBooking.id}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Status</p>
                  <p className="text-sm">
                    <span 
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        statusColors[selectedBooking.status] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {selectedBooking.status.replace('_', ' ')}
                    </span>
                    {selectedBooking.isEmergency && (
                      <span className="ml-2 inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                        Emergency
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Date & Time</p>
                  <p className="text-sm text-gray-800">
                    {formatDateTime(selectedBooking.startTime)} - {formatDateTime(selectedBooking.endTime)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Created At</p>
                  <p className="text-sm text-gray-800">{formatDateTime(selectedBooking.createdAt)}</p>
                </div>
                {selectedBooking.cancellationNote && (
                  <div className="sm:col-span-2">
                    <p className="text-xs font-medium text-gray-500">Cancellation Note</p>
                    <p className="text-sm text-gray-800">{selectedBooking.cancellationNote}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Parent Information */}
            <div className="mb-4 rounded-md bg-blue-50 p-4">
              <h3 className="mb-2 text-md font-semibold text-blue-800">Parent Information</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-blue-700">Name</p>
                  <p className="text-sm text-blue-900">
                    {selectedBooking.User_Booking_parentIdToUser.name || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-blue-700">Email</p>
                  <p className="text-sm text-blue-900">
                    {selectedBooking.User_Booking_parentIdToUser.email}
                  </p>
                </div>
                {selectedBooking.User_Booking_parentIdToUser.phoneNumber && (
                  <div>
                    <p className="text-xs font-medium text-blue-700">Phone</p>
                    <p className="text-sm text-blue-900">
                      {selectedBooking.User_Booking_parentIdToUser.phoneNumber}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Childminder Information */}
            <div className="mb-4 rounded-md bg-green-50 p-4">
              <h3 className="mb-2 text-md font-semibold text-green-800">Childminder Information</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-green-700">Name</p>
                  <p className="text-sm text-green-900">
                    {selectedBooking.User_Booking_childminderIdToUser.name || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-green-700">Email</p>
                  <p className="text-sm text-green-900">
                    {selectedBooking.User_Booking_childminderIdToUser.email}
                  </p>
                </div>
                {selectedBooking.User_Booking_childminderIdToUser.phoneNumber && (
                  <div>
                    <p className="text-xs font-medium text-green-700">Phone</p>
                    <p className="text-sm text-green-900">
                      {selectedBooking.User_Booking_childminderIdToUser.phoneNumber}
                    </p>
                  </div>
                )}
                {selectedBooking.User_Booking_childminderIdToUser.location && (
                  <div>
                    <p className="text-xs font-medium text-green-700">Location</p>
                    <p className="text-sm text-green-900">
                      {selectedBooking.User_Booking_childminderIdToUser.location}
                    </p>
                  </div>
                )}
                {selectedBooking.User_Booking_childminderIdToUser.rate && (
                  <div>
                    <p className="text-xs font-medium text-green-700">Rate</p>
                    <p className="text-sm text-green-900">
                      €{Number(selectedBooking.User_Booking_childminderIdToUser.rate).toFixed(2)}/hr
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Children Information */}
            <div className="mb-6 rounded-md bg-amber-50 p-4">
              <h3 className="mb-2 text-md font-semibold text-amber-800">Children</h3>
              {selectedBooking.BookingChildren.length > 0 ? (
                <div className="space-y-3">
                  {selectedBooking.BookingChildren.map((bookingChild) => (
                    <div key={bookingChild.Child.id} className="rounded-md bg-white p-3 shadow-sm">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div>
                          <p className="text-xs font-medium text-amber-700">Name</p>
                          <p className="text-sm text-amber-900">{bookingChild.Child.name}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-amber-700">Age</p>
                          <p className="text-sm text-amber-900">{bookingChild.Child.age} years</p>
                        </div>
                        {bookingChild.Child.allergies && (
                          <div className="sm:col-span-2">
                            <p className="text-xs font-medium text-amber-700">Allergies</p>
                            <p className="text-sm text-amber-900">{bookingChild.Child.allergies}</p>
                          </div>
                        )}
                        {bookingChild.Child.specialNeeds && (
                          <div className="sm:col-span-2">
                            <p className="text-xs font-medium text-amber-700">Special Needs</p>
                            <p className="text-sm text-amber-900">{bookingChild.Child.specialNeeds}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-amber-800">No children associated with this booking</p>
              )}
            </div>
            
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 sm:flex-none"
              >
                Close
              </button>
              <button
                onClick={() => setShowManagementModal(true)}
                className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 sm:flex-none"
              >
                Manage Booking
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Booking Management Modal */}
      {showManagementModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Manage Booking</h2>
              <button 
                onClick={() => setShowManagementModal(false)}
                className="rounded p-1 text-gray-700 hover:bg-gray-100"
              >
                &times;
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-800">
                <span className="font-medium">Current Status:</span> 
                <span 
                  className={`ml-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    statusColors[selectedBooking.status] || 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {selectedBooking.status.replace('_', ' ')}
                </span>
              </p>
            </div>
            
            {updateError && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">
                Error: {updateError}
              </div>
            )}
            
            {updateSuccess && (
              <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-800">
                Booking updated successfully!
              </div>
            )}
            
            <form className="space-y-4">
              {/* Status Update */}
              <div>
                <label htmlFor="status" className="mb-1 block text-sm font-medium text-gray-700">
                  Update Status
                </label>
                <select
                  id="status"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as Booking_status | '')}
                  className="block w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Select new status</option>
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="LATE_CANCELLED">Late Cancelled</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
              
              {/* Cancellation Note */}
              <div>
                <label htmlFor="cancellationNote" className="mb-1 block text-sm font-medium text-gray-700">
                  Cancellation Note (if applicable)
                </label>
                <textarea
                  id="cancellationNote"
                  value={cancellationNote}
                  onChange={(e) => setCancellationNote(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  rows={3}
                  placeholder="Reason for cancellation or other notes..."
                />
              </div>
              
              {/* Admin Reason (Required) */}
              <div>
                <label htmlFor="adminReason" className="mb-1 block text-sm font-medium text-gray-700">
                  Administrative Reason <span className="text-red-600">*</span>
                </label>
                <textarea
                  id="adminReason"
                  value={adminReason}
                  onChange={(e) => setAdminReason(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  rows={3}
                  placeholder="Administrative reason for this change (required for audit purposes)..."
                  required
                />
                <p className="mt-1 text-xs text-gray-600">
                  Please provide a detailed explanation for this administrative action. This will be recorded in the audit log.
                </p>
              </div>
              
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManagementModal(false)}
                  className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 sm:flex-none"
                  disabled={updateLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={updateBookingStatus}
                  disabled={updateLoading || !adminReason || (!newStatus && !cancellationNote)}
                  className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300 sm:flex-none"
                >
                  {updateLoading ? (
                    <span className="flex items-center justify-center">
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent"></span>
                      Updating...
                    </span>
                  ) : (
                    'Update Booking'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}