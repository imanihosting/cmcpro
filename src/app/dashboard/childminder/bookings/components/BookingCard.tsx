import React from 'react';
import { Booking } from '../types';
import { FaCalendarAlt, FaClock, FaUserCircle, FaChild, FaMapMarkerAlt } from "react-icons/fa";
import StatusBadge from './StatusBadge';
import { format } from 'date-fns';
import Image from 'next/image';

interface BookingCardProps {
  booking: Booking;
  onClick: () => void;
}

export default function BookingCard({ booking, onClick }: BookingCardProps) {
  // Format the date and time
  const formattedDate = format(new Date(booking.startTime), 'EEE, MMM d, yyyy');
  const formattedStartTime = format(new Date(booking.startTime), 'h:mm a');
  const formattedEndTime = format(new Date(booking.endTime), 'h:mm a');
  
  return (
    <div
      className="cursor-pointer rounded-lg bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      {/* Mobile view - stacked layout */}
      <div className="flex flex-col md:hidden">
        {/* Status, date, and time section */}
        <div className="mb-3">
          <div className="mb-2 flex items-center justify-between">
            <StatusBadge status={booking.status} />
            {booking.isEmergency && (
              <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                Emergency
              </span>
            )}
          </div>
          <div className="flex items-center text-gray-700">
            <FaCalendarAlt className="mr-2 h-4 w-4 text-gray-400" />
            <span className="text-sm">{formattedDate}</span>
          </div>
          <div className="mt-1 flex items-center text-gray-700">
            <FaClock className="mr-2 h-4 w-4 text-gray-400" />
            <span className="text-sm">{formattedStartTime} - {formattedEndTime}</span>
          </div>
        </div>
        
        {/* Parent info */}
        <div className="mb-3 border-t border-gray-100 pt-3">
          <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Parent</h4>
          <div className="flex items-center">
            <div className="mr-2 h-8 w-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
              {booking.parent.image ? (
                <Image
                  src={booking.parent.image}
                  alt={booking.parent.name || 'Parent'}
                  width={32}
                  height={32}
                  className="h-full w-full object-cover"
                />
              ) : (
                <FaUserCircle className="h-full w-full text-gray-400" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{booking.parent.name || 'Unnamed Parent'}</p>
              <p className="text-xs text-gray-500 truncate">{booking.parent.email}</p>
            </div>
          </div>
        </div>
        
        {/* Children info */}
        <div className="mb-3 border-t border-gray-100 pt-3">
          <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Children</h4>
          <div>
            {booking.children.slice(0, 2).map(child => (
              <div key={child.id} className="flex items-center text-sm text-gray-700 mb-1">
                <FaChild className="mr-2 h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="truncate">{child.name} ({child.age} {child.age === 1 ? 'year' : 'years'})</span>
              </div>
            ))}
            {booking.children.length > 2 && (
              <div className="text-sm text-gray-500">+{booking.children.length - 2} more</div>
            )}
            {booking.children.length === 0 && (
              <p className="text-sm text-gray-500">No children specified</p>
            )}
          </div>
        </div>
        
        {/* Duration & tags */}
        <div className="border-t border-gray-100 pt-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Duration</h4>
              <div className="text-sm text-gray-700">
                {booking.duration ? (
                  <span>
                    {booking.duration.hours > 0 && `${booking.duration.hours}h `}
                    {booking.duration.minutes > 0 && `${booking.duration.minutes}m`}
                  </span>
                ) : (
                  <span>-</span>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              {booking.isRecurring && (
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                  Recurring
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Desktop view - row layout */}
      <div className="hidden md:flex md:flex-row">
        {/* Status & Date */}
        <div className="mb-3 md:mb-0 md:w-1/4">
          <div className="mb-2">
            <StatusBadge status={booking.status} />
          </div>
          <div className="flex items-center text-gray-700">
            <FaCalendarAlt className="mr-2 h-4 w-4 text-gray-400" />
            <span className="text-sm">{formattedDate}</span>
          </div>
          <div className="mt-1 flex items-center text-gray-700">
            <FaClock className="mr-2 h-4 w-4 text-gray-400" />
            <span className="text-sm">{formattedStartTime} - {formattedEndTime}</span>
          </div>
        </div>
        
        {/* Parent Info */}
        <div className="mb-3 md:mb-0 md:w-1/4">
          <h4 className="text-xs font-medium text-gray-500 uppercase">Parent</h4>
          <div className="mt-1 flex items-center">
            <div className="mr-2 h-8 w-8 rounded-full bg-gray-200 overflow-hidden">
              {booking.parent.image ? (
                <Image
                  src={booking.parent.image}
                  alt={booking.parent.name || 'Parent'}
                  width={32}
                  height={32}
                  className="h-full w-full object-cover"
                />
              ) : (
                <FaUserCircle className="h-full w-full text-gray-400" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{booking.parent.name || 'Unnamed Parent'}</p>
              <p className="text-xs text-gray-500">{booking.parent.email}</p>
            </div>
          </div>
        </div>
        
        {/* Children */}
        <div className="mb-3 md:mb-0 md:w-1/4">
          <h4 className="text-xs font-medium text-gray-500 uppercase">Children</h4>
          <div className="mt-1">
            {booking.children.map(child => (
              <div key={child.id} className="flex items-center text-sm text-gray-700">
                <FaChild className="mr-2 h-4 w-4 text-gray-400" />
                <span>{child.name} ({child.age} {child.age === 1 ? 'year' : 'years'})</span>
              </div>
            ))}
            {booking.children.length === 0 && (
              <p className="text-sm text-gray-500">No children specified</p>
            )}
          </div>
        </div>
        
        {/* Duration & Emergency Status */}
        <div className="md:w-1/4">
          <h4 className="text-xs font-medium text-gray-500 uppercase">Duration</h4>
          <div className="mt-1 text-sm text-gray-700">
            {booking.duration ? (
              <span>
                {booking.duration.hours > 0 && `${booking.duration.hours}h `}
                {booking.duration.minutes > 0 && `${booking.duration.minutes}m`}
              </span>
            ) : (
              <span>-</span>
            )}
          </div>
          
          {booking.isEmergency && (
            <div className="mt-2">
              <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                Emergency
              </span>
            </div>
          )}
          
          {booking.isRecurring && (
            <div className="mt-2">
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                Recurring
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 