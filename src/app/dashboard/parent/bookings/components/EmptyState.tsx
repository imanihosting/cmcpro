import React from 'react';
import { FaCalendarPlus } from 'react-icons/fa';
import Link from 'next/link';

interface EmptyStateProps {
  title?: string;
  message?: string;
  filtered?: boolean;
  onClearFilters?: () => void;
}

export default function EmptyState({ 
  title = 'No bookings found', 
  message = 'You don\'t have any bookings yet.',
  filtered = false,
  onClearFilters
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg bg-white py-12 px-6 text-center shadow-sm">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-violet-100">
        <FaCalendarPlus className="h-10 w-10 text-violet-600" />
      </div>
      <h3 className="mt-4 text-lg font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{message}</p>
      
      <div className="mt-6">
        {filtered ? (
          <button
            onClick={onClearFilters}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
          >
            Clear filters
          </button>
        ) : (
          <Link
            href="/dashboard/parent/find-childminders"
            className="inline-flex items-center rounded-md border border-transparent bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
          >
            Find a Childminder
          </Link>
        )}
      </div>
    </div>
  );
} 