import { useState, useEffect } from 'react';
import { BookingFilters } from '../types';
import { Booking_status } from '@prisma/client';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FaFilter, FaCalendarAlt, FaSearch, FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa';

interface FilterBarProps {
  filters: BookingFilters;
  onFilterChange: (filters: BookingFilters) => void;
  onApplyFilters: () => void;
}

export default function FilterBar({ filters, onFilterChange, onApplyFilters }: FilterBarProps) {
  // Local filter state
  const [localFilters, setLocalFilters] = useState<BookingFilters>(filters);
  
  // State for mobile filter collapse
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  
  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);
  
  // Check if we're on desktop on client side
  useEffect(() => {
    setIsDesktop(window.innerWidth >= 768);
    
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Handle status change
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value === 'ALL' ? undefined : e.target.value as Booking_status;
    setLocalFilters(prev => ({ ...prev, status: value, page: 1 }));
  };
  
  // Handle timeframe change
  const handleTimeframeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as 'upcoming' | 'past' | 'all';
    setLocalFilters(prev => ({ ...prev, timeframe: value, page: 1 }));
  };
  
  // Handle start date change
  const handleStartDateChange = (date: Date | null) => {
    setLocalFilters(prev => ({ ...prev, startDate: date || undefined, page: 1 }));
  };
  
  // Handle end date change
  const handleEndDateChange = (date: Date | null) => {
    setLocalFilters(prev => ({ ...prev, endDate: date || undefined, page: 1 }));
  };
  
  // Handle parent id change
  const handleParentIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalFilters(prev => ({ ...prev, parentId: e.target.value || undefined, page: 1 }));
  };
  
  // Apply filters
  const applyFilters = () => {
    onFilterChange(localFilters);
    onApplyFilters();
  };
  
  // Clear filters
  const clearFilters = () => {
    const defaultFilters: BookingFilters = {
      status: undefined,
      timeframe: 'upcoming',
      startDate: undefined,
      endDate: undefined,
      parentId: undefined,
      page: 1,
      limit: 10,
      sortBy: 'startTime',
      sortOrder: 'asc'
    };
    setLocalFilters(defaultFilters);
    onFilterChange(defaultFilters);
    onApplyFilters();
  };
  
  // Calculate if filters are applied
  const hasFilters = !!localFilters.status || 
                    localFilters.timeframe !== 'upcoming' || 
                    !!localFilters.startDate || 
                    !!localFilters.endDate || 
                    !!localFilters.parentId;
  
  return (
    <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
      {/* Mobile toggle header */}
      <div className="flex items-center justify-between md:hidden mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <FaFilter className="mr-2 h-4 w-4 text-violet-600" />
          Filters
          {hasFilters && (
            <span className="ml-2 text-xs bg-violet-100 text-violet-800 py-0.5 px-2 rounded-full">
              Active
            </span>
          )}
        </h3>
        <div className="flex items-center">
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="mr-3 text-sm font-medium text-red-600 hover:text-red-700"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            className="text-gray-500 hover:text-gray-700"
          >
            {isFilterExpanded ? (
              <FaChevronUp className="h-5 w-5" />
            ) : (
              <FaChevronDown className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
      
      {/* Desktop header */}
      <div className="hidden md:flex md:items-center md:justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Filter Bookings</h3>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-sm font-medium text-red-600 hover:text-red-700"
          >
            Clear Filters
          </button>
        )}
      </div>
      
      {/* Filters - mobile collapsible, desktop always visible */}
      <div className={`${isFilterExpanded || isDesktop ? 'block' : 'hidden'} md:block`}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {/* Status filter */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status"
              name="status"
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              value={localFilters.status || 'ALL'}
              onChange={handleStatusChange}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="LATE_CANCELLED">Late Cancelled</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
          
          {/* Timeframe filter */}
          <div>
            <label htmlFor="timeframe" className="block text-sm font-medium text-gray-700">
              Timeframe
            </label>
            <select
              id="timeframe"
              name="timeframe"
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              value={localFilters.timeframe}
              onChange={handleTimeframeChange}
            >
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
              <option value="all">All Time</option>
            </select>
          </div>
          
          {/* Date range filters */}
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <div className="relative mt-1">
              <DatePicker
                id="startDate"
                selected={localFilters.startDate}
                onChange={handleStartDateChange}
                placeholderText="Select start date"
                className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                isClearable
              />
              <FaCalendarAlt className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
              End Date
            </label>
            <div className="relative mt-1">
              <DatePicker
                id="endDate"
                selected={localFilters.endDate}
                onChange={handleEndDateChange}
                placeholderText="Select end date"
                className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                isClearable
                minDate={localFilters.startDate}
              />
              <FaCalendarAlt className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          
          {/* Parent filter */}
          <div>
            <label htmlFor="parentId" className="block text-sm font-medium text-gray-700">
              Parent Name/Email
            </label>
            <div className="relative mt-1">
              <input
                type="text"
                id="parentId"
                placeholder="Search by parent"
                className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                value={localFilters.parentId || ''}
                onChange={handleParentIdChange}
              />
              <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={applyFilters}
            className="inline-flex items-center rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
          >
            <FaFilter className="mr-2 h-4 w-4" />
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
} 