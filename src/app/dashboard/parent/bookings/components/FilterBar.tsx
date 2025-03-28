import React from 'react';
import { Booking_status } from '@prisma/client';
import { BookingFilters } from '../types';
import { FaFilter, FaSort, FaCalendarAlt } from 'react-icons/fa';

interface FilterBarProps {
  filters: BookingFilters;
  onFilterChange: (filters: BookingFilters) => void;
  onApplyFilters: () => void;
}

export default function FilterBar({ filters, onFilterChange, onApplyFilters }: FilterBarProps) {
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as Booking_status | undefined;
    onFilterChange({
      ...filters,
      status: value || undefined,
      page: 1, // Reset to first page on filter change
    });
  };
  
  const handleTimeframeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as 'upcoming' | 'past' | 'all' | undefined;
    onFilterChange({
      ...filters,
      timeframe: value || undefined,
      page: 1, // Reset to first page on filter change
    });
  };
  
  const handleSortByChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const [sortBy, sortOrder] = value.split('-');
    onFilterChange({
      ...filters,
      sortBy: sortBy || 'startTime',
      sortOrder: (sortOrder as 'asc' | 'desc') || 'asc',
      page: 1, // Reset to first page on filter change
    });
  };
  
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const startDate = e.target.value ? new Date(e.target.value) : undefined;
    onFilterChange({
      ...filters,
      startDate,
      page: 1, // Reset to first page on filter change
    });
  };
  
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const endDate = e.target.value ? new Date(e.target.value) : undefined;
    onFilterChange({
      ...filters,
      endDate,
      page: 1, // Reset to first page on filter change
    });
  };
  
  const formatDateForInput = (date?: Date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  return (
    <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-end sm:space-y-0 sm:space-x-4">
        {/* Status filter */}
        <div className="flex-1">
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <FaFilter className="h-4 w-4 text-gray-400" />
            </div>
            <select
              id="status"
              name="status"
              value={filters.status || ''}
              onChange={handleStatusChange}
              className="block w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-gray-900 placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 sm:text-sm"
            >
              <option value="">All statuses</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PENDING">Pending</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="LATE_CANCELLED">Late Cancelled</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>
        
        {/* Timeframe filter */}
        <div className="flex-1">
          <label htmlFor="timeframe" className="block text-sm font-medium text-gray-700 mb-1">
            Timeframe
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <FaCalendarAlt className="h-4 w-4 text-gray-400" />
            </div>
            <select
              id="timeframe"
              name="timeframe"
              value={filters.timeframe || ''}
              onChange={handleTimeframeChange}
              className="block w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-gray-900 placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 sm:text-sm"
            >
              <option value="">All bookings</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>
          </div>
        </div>
        
        {/* Sort by filter */}
        <div className="flex-1">
          <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">
            Sort by
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <FaSort className="h-4 w-4 text-gray-400" />
            </div>
            <select
              id="sortBy"
              name="sortBy"
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={handleSortByChange}
              className="block w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-gray-900 placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 sm:text-sm"
            >
              <option value="startTime-asc">Date (earliest first)</option>
              <option value="startTime-desc">Date (latest first)</option>
              <option value="createdAt-desc">Recently created</option>
              <option value="updatedAt-desc">Recently updated</option>
            </select>
          </div>
        </div>
        
        {/* Apply filters button for mobile */}
        <div className="sm:hidden">
          <button
            type="button"
            onClick={onApplyFilters}
            className="w-full rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
          >
            Apply Filters
          </button>
        </div>
      </div>
      
      {/* Date range filters (collapsible) */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
            From Date
          </label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={formatDateForInput(filters.startDate)}
            onChange={handleStartDateChange}
            className="block w-full rounded-md border border-gray-300 py-2 px-3 text-gray-900 placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
            To Date
          </label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={formatDateForInput(filters.endDate)}
            onChange={handleEndDateChange}
            className="block w-full rounded-md border border-gray-300 py-2 px-3 text-gray-900 placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 sm:text-sm"
          />
        </div>
      </div>
      
      {/* Apply filters button for desktop */}
      <div className="mt-4 hidden sm:block">
        <button
          type="button"
          onClick={onApplyFilters}
          className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
} 