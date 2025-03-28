import React from 'react';
import { format } from 'date-fns';
import { EventDetailProps } from '../types';
import { Booking_status } from '@prisma/client';
import Link from 'next/link';

const statusLabels: Record<Booking_status, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  CANCELLED: 'Cancelled',
  LATE_CANCELLED: 'Late Cancelled',
  COMPLETED: 'Completed'
};

const statusColors: Record<Booking_status, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  CONFIRMED: 'bg-green-100 text-green-800 border-green-300',
  CANCELLED: 'bg-red-100 text-red-800 border-red-300',
  LATE_CANCELLED: 'bg-orange-100 text-orange-800 border-orange-300',
  COMPLETED: 'bg-blue-100 text-blue-800 border-blue-300'
};

const EventDetailModal: React.FC<EventDetailProps> = ({ event, onClose }) => {
  if (!event) return null;
  
  const startDate = new Date(event.start);
  const endDate = new Date(event.end);
  
  const formattedDate = format(startDate, 'EEEE, MMMM d, yyyy');
  const startTime = format(startDate, 'h:mm a');
  const endTime = format(endDate, 'h:mm a');
  
  const status = event.extendedProps?.status;
  const bookingId = event.extendedProps?.bookingId;
  const parentId = event.extendedProps?.parentId;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header with close button */}
        <div className="sticky top-0 bg-blue-600 text-white px-5 py-4 rounded-t-lg flex justify-between items-center">
          <h3 className="text-xl font-bold">Booking Details</h3>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-200 focus:outline-none"
            aria-label="Close modal"
          >
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-5">
          <h4 className="font-bold text-2xl text-gray-800 mb-3">{event.title}</h4>
          
          {status && (
            <span className={`inline-block px-4 py-2 rounded-full text-base font-bold mt-1 mb-4 border-2 ${statusColors[status]}`}>
              {statusLabels[status]}
            </span>
          )}
          
          <div className="mt-5 space-y-5 text-gray-700">
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <p className="text-base font-bold text-gray-500 mb-1">Date</p>
              <p className="font-bold text-lg">{formattedDate}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <p className="text-base font-bold text-gray-500 mb-1">Time</p>
              <p className="font-bold text-lg">{startTime} - {endTime}</p>
            </div>
            
            {event.children && event.children.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <p className="text-base font-bold text-gray-500 mb-1">Children</p>
                <ul className="list-disc ml-5">
                  {event.children.map((child, index) => (
                    <li key={index} className="font-bold text-lg">{child}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {event.extendedProps?.isRecurring && (
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <p className="text-base font-bold text-gray-500 mb-1">Recurring</p>
                <p className="font-bold text-lg">Yes ({event.extendedProps.recurrencePattern})</p>
              </div>
            )}
          </div>
          
          <div className="mt-8 flex flex-wrap gap-3">
            {bookingId && (
              <Link 
                href={`/dashboard/childminder/bookings/${bookingId}`}
                className="inline-flex items-center px-5 py-3 border-2 border-transparent rounded-lg shadow-sm text-base font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex-1 justify-center"
              >
                View Booking
              </Link>
            )}
            
            {parentId && (
              <Link 
                href={`/dashboard/childminder/messages?userId=${parentId}`}
                className="inline-flex items-center px-5 py-3 border-2 border-gray-300 rounded-lg shadow-sm text-base font-bold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex-1 justify-center"
              >
                Message Parent
              </Link>
            )}
            
            <button
              onClick={onClose}
              className="inline-flex items-center px-5 py-3 border-2 border-gray-300 rounded-lg shadow-sm text-base font-bold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailModal; 