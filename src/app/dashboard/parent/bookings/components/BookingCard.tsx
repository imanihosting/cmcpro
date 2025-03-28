import React from 'react';
import { format } from 'date-fns';
import { FaUserCircle, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaChild } from 'react-icons/fa';
import { Booking } from '../types';
import StatusBadge from './StatusBadge';

interface BookingCardProps {
  booking: Booking;
  onClick: () => void;
}

export default function BookingCard({ booking, onClick }: BookingCardProps) {
  const formatTime = (date: Date) => {
    return format(new Date(date), 'h:mm a');
  };
  
  const formatDate = (date: Date) => {
    return format(new Date(date), 'MMMM d, yyyy');
  };
  
  // Calculate if the booking is upcoming
  const isUpcoming = new Date(booking.startTime) > new Date();
  
  // Format the time range
  const timeRange = `${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}`;
  
  // Create a string with children's names
  const childrenNames = booking.children.map(child => child.name).join(', ');
  
  return (
    <div 
      className="rounded-lg bg-white p-4 shadow-sm transition-all hover:shadow-md cursor-pointer"
      onClick={onClick}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
        <div className="mb-2 sm:mb-0 flex-grow">
          <div className="flex items-center gap-2 mb-1">
            {booking.childminder.image ? (
              <img 
                src={booking.childminder.image} 
                alt={booking.childminder.name || 'Childminder'} 
                className="h-8 w-8 rounded-full object-cover" 
              />
            ) : (
              <FaUserCircle className="h-8 w-8 text-violet-600" />
            )}
            <h3 className="text-lg font-medium text-gray-900">
              {booking.childminder.name || 'Unknown Childminder'}
            </h3>
          </div>
          
          <div className="flex items-center mt-2">
            <StatusBadge status={booking.status} />
            {booking.isEmergency && (
              <span className="ml-2 inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                Emergency
              </span>
            )}
            {booking.isRecurring && (
              <span className="ml-2 inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                Recurring
              </span>
            )}
          </div>
          
          <div className="mt-3 space-y-1">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FaCalendarAlt className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span>{formatDate(booking.startTime)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FaClock className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span>{timeRange}</span>
            </div>
            {booking.childminder.location && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FaMapMarkerAlt className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="truncate">{booking.childminder.location}</span>
              </div>
            )}
            {childrenNames && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FaChild className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="truncate">{childrenNames}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Desktop view action indicator */}
        <div className="hidden sm:flex sm:items-center sm:self-center">
          <div className="rounded-full bg-gray-100 p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
} 