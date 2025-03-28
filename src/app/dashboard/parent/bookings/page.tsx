"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaCalendarAlt, FaClock, FaUserCircle, FaMapMarkerAlt, FaTrash, FaEdit, FaCalendarPlus } from "react-icons/fa";
import Link from 'next/link';
import { BookingFilters, PaginationInfo, Booking } from './types';
import BookingCard from './components/BookingCard';
import FilterBar from './components/FilterBar';
import Pagination from './components/Pagination';
import EmptyState from './components/EmptyState';
import LoadingState from './components/LoadingState';
import BookingDetailModal from './components/BookingDetailModal';

export default function BookingsPage() {
  // State for bookings data
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });
  
  // State for filters
  const [filters, setFilters] = useState<BookingFilters>({
    status: undefined,
    timeframe: 'upcoming',
    startDate: undefined,
    endDate: undefined,
    childminderId: undefined,
    page: 1,
    limit: 10,
    sortBy: 'startTime',
    sortOrder: 'asc'
  });
  
  // State for loading and errors
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for booking details modal
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  
  const router = useRouter();
  
  // Fetch bookings from API
  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Build query string from filters
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.timeframe) queryParams.append('timeframe', filters.timeframe);
      if (filters.startDate) queryParams.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) queryParams.append('endDate', filters.endDate.toISOString());
      if (filters.childminderId) queryParams.append('childminderId', filters.childminderId);
      queryParams.append('page', filters.page.toString());
      queryParams.append('limit', filters.limit.toString());
      queryParams.append('sortBy', filters.sortBy);
      queryParams.append('sortOrder', filters.sortOrder);
      
      const response = await fetch(`/api/dashboard/parent/bookings?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      
      const data = await response.json();
      
      // Update state with fetched data
      setBookings(data.bookings);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching bookings');
      console.error('Error fetching bookings:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);
  
  // Fetch booking details
  const fetchBookingDetails = async (bookingId: string) => {
    setIsLoadingDetails(true);
    
    try {
      const response = await fetch(`/api/dashboard/parent/bookings/${bookingId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch booking details');
      }
      
      const data = await response.json();
      
      setSelectedBooking(data.booking);
      setIsModalOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching booking details');
      console.error('Error fetching booking details:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  };
  
  // Cancel a booking
  const cancelBooking = async (note: string) => {
    if (!selectedBooking) return;
    
    try {
      const response = await fetch(`/api/dashboard/parent/bookings/${selectedBooking.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cancel',
          cancellationNote: note,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel booking');
      }
      
      // Close modal and refresh bookings
      setIsModalOpen(false);
      fetchBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while cancelling the booking');
      console.error('Error cancelling booking:', err);
      throw err; // Re-throw error to be caught by the calling component
    }
  };
  
  // Handle filter changes
  const handleFilterChange = (newFilters: BookingFilters) => {
    setFilters(newFilters);
  };
  
  // Handle page changes
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };
  
  // Handle booking card click
  const handleBookingClick = (booking: Booking) => {
    fetchBookingDetails(booking.id);
  };
  
  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedBooking(null);
  };
  
  // Clear all filters
  const clearFilters = () => {
    setFilters({
      status: undefined,
      timeframe: 'upcoming',
      startDate: undefined,
      endDate: undefined,
      childminderId: undefined,
      page: 1,
      limit: 10,
      sortBy: 'startTime',
      sortOrder: 'asc'
    });
  };
  
  // Fetch bookings on mount and when filters change
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);
  
  // Determine if filters are applied
  const hasFilters = !!filters.status || filters.timeframe !== 'upcoming' || !!filters.startDate || !!filters.endDate || !!filters.childminderId;
  
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Bookings</h1>
        <p className="mt-1 text-sm text-gray-600">View and manage your childcare bookings</p>
      </header>
      
      {/* Booking actions */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/parent/find-childminders"
            className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
          >
            Find Childminder
          </Link>
          <Link
            href="/dashboard/parent/calendar"
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
          >
            View Calendar
          </Link>
        </div>
      </div>
      
      {/* Filter bar */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onApplyFilters={fetchBookings}
      />
      
      {/* Error message */}
      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading bookings</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Loading state */}
      {isLoading && <LoadingState />}
      
      {/* Bookings list */}
      {!isLoading && bookings.length === 0 && (
        <EmptyState 
          filtered={hasFilters}
          onClearFilters={clearFilters}
          title={hasFilters ? "No bookings match your filters" : "No bookings found"}
          message={hasFilters 
            ? "Try changing or clearing your filters to see more results" 
            : "You don't have any bookings yet. Start by finding a childminder."
          }
        />
      )}
      
      {!isLoading && bookings.length > 0 && (
        <>
          <div className="space-y-4">
            {bookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onClick={() => handleBookingClick(booking)}
              />
            ))}
          </div>
          
          {/* Pagination */}
          <Pagination
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        </>
      )}
      
      {/* Booking detail modal */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onCancel={cancelBooking}
        />
      )}
    </div>
  );
} 