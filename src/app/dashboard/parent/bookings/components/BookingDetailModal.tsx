import React, { useState } from 'react';
import { format } from 'date-fns';
import { FaUserCircle, FaCalendarAlt, FaClock, FaMapMarkerAlt, 
  FaChild, FaPhone, FaEnvelope, FaTimes, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { Booking } from '../types';
import StatusBadge from './StatusBadge';

interface BookingDetailModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onCancel: (note: string) => Promise<void>;
}

export default function BookingDetailModal({ 
  booking, 
  isOpen, 
  onClose,
  onCancel
}: BookingDetailModalProps) {
  const [cancellationNote, setCancellationNote] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancellationForm, setShowCancellationForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  if (!isOpen) return null;
  
  const formatTime = (date: Date) => {
    return format(new Date(date), 'h:mm a');
  };
  
  const formatDate = (date: Date) => {
    return format(new Date(date), 'MMMM d, yyyy');
  };
  
  const formatDateTime = (date: Date) => {
    return format(new Date(date), 'MMMM d, yyyy, h:mm a');
  };
  
  // Calculate if the booking is upcoming
  const isUpcoming = new Date(booking.startTime) > new Date();
  
  // Calculate if the booking can be cancelled
  const canCancel = isUpcoming && (booking.status === 'PENDING' || booking.status === 'CONFIRMED');
  
  // Calculate if cancellation would incur a late fee
  const now = new Date();
  const bookingStart = new Date(booking.startTime);
  const hoursUntilBooking = (bookingStart.getTime() - now.getTime()) / (1000 * 60 * 60);
  const isLateCancellation = hoursUntilBooking < 24;
  
  // Format the time range
  const timeRange = `${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}`;
  
  // Handle cancellation form submission
  const handleCancellationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onCancel(cancellationNote);
      setShowCancellationForm(false);
      setCancellationNote('');
    } catch (error) {
      console.error('Error cancelling booking:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        {/* Modal panel */}
        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:align-middle">
          <div className="absolute right-0 top-0 pr-4 pt-4">
            <button
              type="button"
              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <FaTimes className="h-6 w-6" />
            </button>
          </div>
          
          {/* Modal content */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 w-full text-left sm:mt-0">
                {/* Booking header */}
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xl font-semibold leading-6 text-gray-900">
                    Booking Details
                  </h3>
                  <StatusBadge status={booking.status} />
                </div>
                
                {/* Booking details */}
                <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {/* Childminder info */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Childminder</h4>
                    <div className="flex items-center mb-3">
                      {booking.childminder.image ? (
                        <img 
                          src={booking.childminder.image} 
                          alt={booking.childminder.name || 'Childminder'} 
                          className="h-12 w-12 rounded-full object-cover mr-3" 
                        />
                      ) : (
                        <FaUserCircle className="h-12 w-12 text-violet-600 mr-3" />
                      )}
                      <div>
                        <p className="font-medium">{booking.childminder.name}</p>
                        {booking.childminder.rate && (
                          <p className="text-sm text-gray-500">€{Number(booking.childminder.rate).toFixed(2)}/hr</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {booking.childminder.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <FaPhone className="h-4 w-4 text-gray-400 mr-2" />
                          <span>{booking.childminder.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-600">
                        <FaEnvelope className="h-4 w-4 text-gray-400 mr-2" />
                        <span>{booking.childminder.email}</span>
                      </div>
                      {booking.childminder.location && (
                        <div className="flex items-center text-sm text-gray-600">
                          <FaMapMarkerAlt className="h-4 w-4 text-gray-400 mr-2" />
                          <span>{booking.childminder.location}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Childminder certifications */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {booking.childminder.firstAidCert && (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          <FaCheck className="mr-1 h-3 w-3" /> First Aid
                        </span>
                      )}
                      {booking.childminder.gardaVetted && (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          <FaCheck className="mr-1 h-3 w-3" /> Garda Vetted
                        </span>
                      )}
                      {booking.childminder.tuslaRegistered && (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          <FaCheck className="mr-1 h-3 w-3" /> Tusla Registered
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Booking schedule */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Schedule</h4>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <FaCalendarAlt className="h-4 w-4 text-gray-400 mr-2" />
                        <span>{formatDate(booking.startTime)}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <FaClock className="h-4 w-4 text-gray-400 mr-2" />
                        <span>{timeRange}</span>
                      </div>
                      {booking.duration && (
                        <div className="text-sm text-gray-600 ml-6">
                          <span className="font-medium">Duration: </span>
                          {booking.duration.hours} hour{booking.duration.hours !== 1 ? 's' : ''}
                          {booking.duration.minutes > 0 && ` ${booking.duration.minutes} minute${booking.duration.minutes !== 1 ? 's' : ''}`}
                        </div>
                      )}
                      {booking.isRecurring && booking.recurrencePattern && (
                        <div className="mt-2 text-sm text-blue-600">
                          <span className="font-medium">Recurring: </span>
                          {booking.recurrencePattern.toLowerCase()}
                        </div>
                      )}
                    </div>
                    
                    {/* Children */}
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Children</h4>
                      <ul className="space-y-2">
                        {booking.children.map(child => (
                          <li key={child.id} className="flex items-center text-sm">
                            <FaChild className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="font-medium">{child.name}</span>
                            <span className="ml-1 text-gray-500">({child.age} year{child.age !== 1 ? 's' : ''})</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                
                {/* Booking status information */}
                <div className="mt-4 rounded-lg border border-gray-200 p-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Booking Information</h4>
                      <p className="mt-1 text-sm text-gray-500">Created on {formatDateTime(booking.createdAt)}</p>
                      {booking.cancellationNote && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700">Cancellation Note:</p>
                          <p className="text-sm text-gray-600">{booking.cancellationNote}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-3 sm:mt-0 sm:ml-4">
                      {booking.isEmergency && (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                          Emergency
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Cancellation form */}
                {showCancellationForm && (
                  <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
                    <div className="flex items-start">
                      <FaExclamationTriangle className="h-5 w-5 text-red-400 mt-0.5 mr-2" />
                      <div>
                        <h3 className="text-sm font-medium text-red-800">Cancel this booking?</h3>
                        {isLateCancellation && (
                          <p className="mt-1 text-sm text-red-700">
                            This is a late cancellation (less than 24 hours before the booking).
                            Late cancellations may be subject to a fee according to the childminder's policy.
                          </p>
                        )}
                        
                        <form onSubmit={handleCancellationSubmit} className="mt-3">
                          <label htmlFor="cancellationNote" className="block text-sm font-medium text-gray-700">
                            Cancellation reason (optional)
                          </label>
                          <textarea
                            id="cancellationNote"
                            name="cancellationNote"
                            rows={3}
                            value={cancellationNote}
                            onChange={(e) => setCancellationNote(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 sm:text-sm"
                            placeholder="Please provide a reason for cancellation"
                          ></textarea>
                          
                          <div className="mt-3 flex justify-end space-x-3">
                            <button
                              type="button"
                              onClick={() => setShowCancellationForm(false)}
                              className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            >
                              {isSubmitting ? 'Processing...' : 'Confirm Cancellation'}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Modal actions */}
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            {canCancel && !showCancellationForm && (
              <button
                type="button"
                onClick={() => setShowCancellationForm(true)}
                className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
              >
                Cancel Booking
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 