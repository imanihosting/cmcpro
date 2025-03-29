'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Booking, BookingFilters, BookingsResponse } from './types';
import { Booking_status } from '@prisma/client';
import FilterBar from './components/FilterBar';
import BookingCard from './components/BookingCard';
import BookingDetailModal from './components/BookingDetailModal';
import Pagination from './components/Pagination';
import EmptyState from './components/EmptyState';
import LoadingState from './components/LoadingState';
import { toast } from 'react-hot-toast';
import { FaCalendarAlt } from 'react-icons/fa';

export default function ChildminderBookings() {
  // State variables
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 10 });
  
  // Filters state
  const [filters, setFilters] = useState<BookingFilters>({
    status: undefined,
    timeframe: 'upcoming',
    startDate: undefined,
    endDate: undefined,
    parentId: undefined,
    page: 1,
    limit: 10,
    sortBy: 'startTime',
    sortOrder: 'asc'
  });
  
  const router = useRouter();
  
  // Fetch bookings
  const fetchBookings = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Build query string
      const queryParams = new URLSearchParams();
      
      if (filters.status) {
        queryParams.append('status', filters.status);
      }
      
      if (filters.timeframe) {
        queryParams.append('timeframe', filters.timeframe);
      }
      
      if (filters.startDate) {
        queryParams.append('startDate', filters.startDate.toISOString());
      }
      
      if (filters.endDate) {
        queryParams.append('endDate', filters.endDate.toISOString());
      }
      
      if (filters.parentId) {
        queryParams.append('parentId', filters.parentId);
      }
      
      queryParams.append('page', filters.page.toString());
      queryParams.append('limit', filters.limit.toString());
      queryParams.append('sortBy', filters.sortBy);
      queryParams.append('sortOrder', filters.sortOrder);
      
      // Make API request
      const response = await fetch(`/api/dashboard/childminder/bookings?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      
      const data: BookingsResponse = await response.json();
      setBookings(data.bookings);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
      setBookings([]);
      setPagination({ page: 1, pages: 1, total: 0, limit: 10 });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch bookings on mount and when filters change
  useEffect(() => {
    fetchBookings();
  }, [filters]);
  
  // Handle filter changes
  const handleFilterChange = (newFilters: BookingFilters) => {
    setFilters(newFilters);
  };
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };
  
  // Handle booking click
  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsDetailModalOpen(true);
  };
  
  // Handle modal close
  const handleCloseModal = () => {
    setIsDetailModalOpen(false);
  };
  
  // Handle accept booking
  const handleAcceptBooking = async () => {
    if (!selectedBooking) {
      return;
    }
    
    try {
      const response = await fetch(`/api/dashboard/childminder/bookings/${selectedBooking.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'accept',
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to accept booking (status: ${response.status})`);
      }
      
      // Update local state
      setBookings(prevBookings =>
        prevBookings.map(booking =>
          booking.id === selectedBooking.id
            ? { ...booking, status: Booking_status.CONFIRMED }
            : booking
        )
      );
      
      // Close modal and show success message
      setIsDetailModalOpen(false);
      toast.success('Booking accepted successfully');
      
      // Refresh bookings
      fetchBookings();
    } catch (err) {
      console.error('Error accepting booking:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to accept booking');
    }
  };
  
  // Handle decline booking
  const handleDeclineBooking = async (note: string) => {
    if (!selectedBooking) return;
    
    try {
      const response = await fetch(`/api/dashboard/childminder/bookings/${selectedBooking.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'DECLINE',
          cancellationNote: note,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to decline booking');
      }
      
      // Update local state
      setBookings(prevBookings =>
        prevBookings.map(booking =>
          booking.id === selectedBooking.id
            ? { ...booking, status: Booking_status.CANCELLED, cancellationNote: note }
            : booking
        )
      );
      
      // Close modal and show success message
      setIsDetailModalOpen(false);
      toast.success('Booking declined successfully');
      
      // Refresh bookings
      fetchBookings();
    } catch (err) {
      console.error('Error declining booking:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to decline booking');
    }
  };
  
  // Clear filters
  const handleClearFilters = () => {
    const defaultFilters: BookingFilters = {
      status: undefined,
      timeframe: 'upcoming',
      startDate: undefined,
      endDate: undefined,
      parentId: undefined,
      page: 1,
      limit: 10,
      sortBy: 'startTime',
      sortOrder: 'asc',
    };
    setFilters(defaultFilters);
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <FaCalendarAlt className="mr-2 h-6 w-6 text-violet-600" />
          Childminder Bookings
        </h1>
        <p className="mt-1 text-gray-500">Manage your bookings and schedules</p>
      </div>
      
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onApplyFilters={fetchBookings}
      />
      
      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          <p>{error}</p>
          <button
            onClick={fetchBookings}
            className="mt-2 text-sm font-medium text-red-600 hover:text-red-500"
          >
            Try again
          </button>
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState
          filtered={
            !!filters.status ||
            filters.timeframe !== 'upcoming' ||
            !!filters.startDate ||
            !!filters.endDate ||
            !!filters.parentId
          }
          onClearFilters={handleClearFilters}
          title={
            filters.status || filters.timeframe !== 'upcoming' || filters.startDate || filters.endDate || filters.parentId
              ? 'No bookings match your filters'
              : 'No bookings found'
          }
          message={
            filters.status || filters.timeframe !== 'upcoming' || filters.startDate || filters.endDate || filters.parentId
              ? 'Try changing or clearing your filters to see more bookings'
              : 'You have no upcoming bookings at this time. Check back later or change your filters to view past bookings.'
          }
        />
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {bookings.map(booking => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onClick={() => handleBookingClick(booking)}
              />
            ))}
          </div>
          
          <Pagination
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        </>
      )}
      
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          isOpen={isDetailModalOpen}
          onClose={handleCloseModal}
          onAccept={handleAcceptBooking}
          onDecline={handleDeclineBooking}
        />
      )}
    </div>
  );
}