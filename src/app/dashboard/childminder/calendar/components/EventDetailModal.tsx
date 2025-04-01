import React from 'react';
import { format } from 'date-fns';
import { EventDetailProps } from '../types';
import { Booking_status } from '@prisma/client';
import Link from 'next/link';
import { FaRegCalendarAlt, FaUser, FaChild, FaTimes } from 'react-icons/fa';

const statusLabels: Record<Booking_status, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  CANCELLED: 'Cancelled',
  LATE_CANCELLED: 'Late Cancelled',
  COMPLETED: 'Completed'
};

const statusColors: Record<Booking_status, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CONFIRMED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  LATE_CANCELLED: 'bg-orange-100 text-orange-800 border-orange-200',
  COMPLETED: 'bg-blue-100 text-blue-800 border-blue-200'
};

const EventDetailModal: React.FC<EventDetailProps> = ({ event, onClose }) => {
  if (!event) return null;
  
  const start = new Date(event.start);
  const end = new Date(event.end);
  const duration = ((end.getTime() - start.getTime()) / (1000 * 60)).toFixed(0); // Minutes
  
  const status = event.extendedProps?.status;
  const bookingId = event.extendedProps?.bookingId;
  const parentId = event.extendedProps?.parentId;
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 px-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-blue-600 text-white relative">
          <h3 className="text-2xl font-bold pr-8">Booking Details</h3>
          <button 
            onClick={onClose}
            className="absolute right-4 top-5 text-white hover:text-blue-100"
            aria-label="Close"
          >
            <FaTimes size={24} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Status Badge */}
          {status && (
            <div className={`inline-block px-4 py-2 rounded-full text-base font-bold mb-5 border ${statusColors[status]}`}>
              {statusLabels[status]}
            </div>
          )}
          
          {/* Title */}
          <h4 className="text-xl font-bold text-gray-900 mb-4">{event.title}</h4>
          
          {/* Time & Date */}
          <div className="mb-5">
            <div className="flex items-center gap-3 text-gray-800 mb-2">
              <FaRegCalendarAlt className="text-blue-600 text-lg" />
              <span className="text-base font-semibold">
                {format(start, 'EEEE, MMMM d, yyyy')}
              </span>
            </div>
            <div className="text-base font-semibold text-gray-800 ml-8">
              {format(start, 'h:mm a')} - {format(end, 'h:mm a')} ({duration} minutes)
            </div>
          </div>
          
          {/* Parent Information */}
          {event.parentName && (
            <div className="mb-5">
              <div className="flex items-center gap-3 text-gray-800 mb-1">
                <FaUser className="text-blue-600 text-lg" />
                <span className="text-lg font-semibold">Parent</span>
              </div>
              <div className="ml-8 text-base font-medium text-gray-800">
                {event.parentName}
              </div>
            </div>
          )}
          
          {/* Children Information */}
          {event.children && event.children.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center gap-3 text-gray-800 mb-1">
                <FaChild className="text-blue-600 text-lg" />
                <span className="text-lg font-semibold">Children</span>
              </div>
              <ul className="ml-8 list-disc pl-4 text-base font-medium text-gray-800">
                {event.children.map((child, index) => (
                  <li key={index}>{child}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Additional Information */}
          {event.extendedProps?.bookingType && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="text-lg font-semibold text-gray-800 mb-2">Additional Information</div>
              <div className="ml-0 flex justify-between text-base">
                <span className="font-medium text-gray-600">Booking Type:</span>
                <span className="font-semibold text-gray-800">
                  {event.extendedProps.bookingType === 'STANDARD' ? 'Standard' : 
                   event.extendedProps.bookingType === 'EMERGENCY' ? 'Emergency' : 
                   event.extendedProps.bookingType}
                </span>
              </div>
              {event.extendedProps.isRecurring && (
                <div className="ml-0 flex justify-between text-base mt-1">
                  <span className="font-medium text-gray-600">Recurring:</span>
                  <span className="font-semibold text-gray-800">
                    {event.extendedProps.recurrencePattern || 'Yes'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-wrap gap-3">
          {bookingId && (
            <Link 
              href={`/dashboard/childminder/bookings/${bookingId}`}
              className="inline-flex items-center px-5 py-3 rounded text-base font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 justify-center"
            >
              View Booking
            </Link>
          )}
          
          {parentId && (
            <Link 
              href={`/dashboard/childminder/messages?userId=${parentId}`}
              className="inline-flex items-center px-5 py-3 border border-gray-300 rounded text-base font-bold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 justify-center"
            >
              Message Parent
            </Link>
          )}
          
          <button
            onClick={onClose}
            className="inline-flex items-center px-5 py-3 border border-gray-300 rounded text-base font-bold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventDetailModal; 