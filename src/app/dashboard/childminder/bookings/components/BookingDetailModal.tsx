import { useState } from 'react';
import { Booking } from '../types';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import StatusBadge from './StatusBadge';
import { format } from 'date-fns';
import { FaCalendarAlt, FaClock, FaUser, FaChild, FaMapMarkerAlt, FaEnvelope, FaPhone, FaCheck, FaTimes, FaExclamation } from 'react-icons/fa';
import Image from 'next/image';

interface BookingDetailModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => Promise<void>;
  onDecline: (note: string) => Promise<void>;
}

export default function BookingDetailModal({
  booking,
  isOpen,
  onClose,
  onAccept,
  onDecline
}: BookingDetailModalProps) {
  const [cancellationNote, setCancellationNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Format dates and times
  const formattedDate = format(new Date(booking.startTime), 'EEEE, MMMM d, yyyy');
  const formattedStartTime = format(new Date(booking.startTime), 'h:mm a');
  const formattedEndTime = format(new Date(booking.endTime), 'h:mm a');
  const formattedCreatedAt = format(new Date(booking.createdAt), 'PPp');
  
  // Format booking type for display
  const getBookingTypeDisplay = () => {
    switch (booking.bookingType) {
      case 'STANDARD':
        return 'Standard';
      case 'EMERGENCY':
        return 'Emergency';
      case 'RECURRING':
        return 'Recurring';
      case 'FLEXIBLE':
        return 'Flexible';
      default:
        return booking.bookingType;
    }
  };
  
  // Format recurrence pattern for display
  const getRecurrencePatternDisplay = () => {
    if (!booking.recurrencePattern) return null;
    
    switch (booking.recurrencePattern) {
      case 'DAILY':
        return 'Daily';
      case 'WEEKLY':
        return 'Weekly';
      case 'BIWEEKLY':
        return 'Every 2 weeks';
      case 'MONTHLY':
        return 'Monthly';
      default:
        return booking.recurrencePattern;
    }
  };
  
  // Handle accept button click
  const handleAccept = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      await onAccept();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept booking');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle decline button click
  const handleDecline = async () => {
    if (!cancellationNote.trim()) {
      setError('Please provide a reason for declining the booking');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await onDecline(cancellationNote);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decline booking');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Background overlay */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all w-full max-w-md sm:max-w-lg md:max-w-2xl mx-auto">
                {/* Close button */}
                <div className="absolute right-0 top-0 pr-4 pt-4 z-10">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <FaTimes className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div>
                    <div className="w-full">
                      {/* Header with status badge */}
                      <div className="mb-4 flex items-center justify-between">
                        <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900">
                          Booking Details
                        </Dialog.Title>
                        <StatusBadge status={booking.status} />
                      </div>
                      
                      {/* Error message if any */}
                      {error && (
                        <div className="mt-3 rounded-md bg-red-50 p-3">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <FaExclamation className="h-5 w-5 text-red-400" />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm text-red-700">{error}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Main content */}
                      <div className="mt-4">
                        {/* Booking details grid */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          {/* Parent Info */}
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-3">Parent</h4>
                            <div className="flex items-center mb-3">
                              <div className="mr-3 h-10 w-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                {booking.parent.image ? (
                                  <Image
                                    src={booking.parent.image}
                                    alt={booking.parent.name || 'Parent'}
                                    width={40}
                                    height={40}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <FaUser className="h-full w-full text-gray-400" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{booking.parent.name || 'Unnamed Parent'}</p>
                                <p className="text-xs text-gray-500 truncate">{booking.parent.email}</p>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              {booking.parent.phoneNumber && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <FaPhone className="mr-2 h-4 w-4 text-gray-400 flex-shrink-0" />
                                  <span className="truncate">{booking.parent.phoneNumber}</span>
                                </div>
                              )}
                              <div className="flex items-center text-sm text-gray-600">
                                <FaEnvelope className="mr-2 h-4 w-4 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{booking.parent.email}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Schedule */}
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-3">Schedule</h4>
                            <div className="space-y-2">
                              <div className="flex items-center text-sm text-gray-600">
                                <FaCalendarAlt className="mr-2 h-4 w-4 text-gray-400 flex-shrink-0" />
                                <span>{formattedDate}</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <FaClock className="mr-2 h-4 w-4 text-gray-400 flex-shrink-0" />
                                <span>{formattedStartTime} - {formattedEndTime}</span>
                              </div>
                              <div className="text-sm text-gray-600 ml-6">
                                <span className="font-semibold">Duration: </span>
                                <span>
                                  {booking.duration ? (
                                    <>
                                      {booking.duration.hours > 0 && `${booking.duration.hours} hour${booking.duration.hours !== 1 ? 's' : ''} `}
                                      {booking.duration.minutes > 0 && `${booking.duration.minutes} minute${booking.duration.minutes !== 1 ? 's' : ''}`}
                                    </>
                                  ) : (
                                    'N/A'
                                  )}
                                </span>
                              </div>
                              {booking.isRecurring && (
                                <div className="text-sm text-blue-600">
                                  <span className="font-semibold">Recurring: </span>
                                  <span>{getRecurrencePatternDisplay()}</span>
                                </div>
                              )}
                              {booking.isEmergency && (
                                <div className="mt-1">
                                  <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                                    Emergency Booking
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Children */}
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-3">Children</h4>
                            <ul className="space-y-2">
                              {booking.children.map(child => (
                                <li key={child.id} className="flex items-start">
                                  <FaChild className="mr-2 h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {child.name} ({child.age} {child.age === 1 ? 'year' : 'years'})
                                    </p>
                                    {(child.allergies || child.specialNeeds) && (
                                      <div className="mt-1 space-y-1">
                                        {child.allergies && (
                                          <p className="text-xs text-gray-700">
                                            <span className="font-semibold">Allergies: </span>
                                            {child.allergies}
                                          </p>
                                        )}
                                        {child.specialNeeds && (
                                          <p className="text-xs text-gray-700">
                                            <span className="font-semibold">Special needs: </span>
                                            {child.specialNeeds}
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </li>
                              ))}
                              {booking.children.length === 0 && (
                                <p className="text-sm text-gray-500">No children specified</p>
                              )}
                            </ul>
                          </div>
                          
                          {/* Booking Info */}
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-3">Booking Information</h4>
                            <div className="space-y-2">
                              <div className="text-sm text-gray-700">
                                <span className="font-semibold">Type: </span>
                                <span>{getBookingTypeDisplay()}</span>
                              </div>
                              <div className="text-sm text-gray-700">
                                <span className="font-semibold">Created: </span>
                                <span>{formattedCreatedAt}</span>
                              </div>
                              {booking.cancellationNote && (
                                <div className="mt-2">
                                  <p className="text-sm font-medium text-gray-700">Cancellation Note:</p>
                                  <p className="text-sm text-gray-600 mt-1 bg-red-50 p-2 rounded">{booking.cancellationNote}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Action controls for pending bookings */}
                        {booking.status === 'PENDING' && (
                          <div className="mt-6 border-t border-gray-200 pt-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Actions</h4>
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <button
                                  type="button"
                                  onClick={handleAccept}
                                  disabled={isSubmitting}
                                  className="inline-flex justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <FaCheck className="mr-2 h-4 w-4" />
                                  Accept Booking
                                </button>
                                <button
                                  type="button"
                                  onClick={() => document.getElementById('cancellationNote')?.focus()}
                                  disabled={isSubmitting}
                                  className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <FaTimes className="mr-2 h-4 w-4" />
                                  Decline Booking
                                </button>
                              </div>
                              
                              <div>
                                <label htmlFor="cancellationNote" className="block text-sm font-medium text-gray-700">
                                  Reason for declining (required if declining)
                                </label>
                                <textarea
                                  id="cancellationNote"
                                  rows={3}
                                  value={cancellationNote}
                                  onChange={(e) => setCancellationNote(e.target.value)}
                                  disabled={isSubmitting}
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                                  placeholder="Please provide a reason if you're declining this booking request..."
                                />
                                {cancellationNote.trim() && (
                                  <div className="mt-2 text-right">
                                    <button
                                      type="button"
                                      onClick={handleDecline}
                                      disabled={isSubmitting}
                                      className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      Confirm Decline
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 