"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FaCalendarAlt, FaClock, FaChild, FaUser, FaSpinner, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';
import { useSafeSearchParams } from '@/hooks/useSafeSearchParams';

interface Childminder {
  id: string;
  name: string;
  image: string | null;
  rate: number | null;
}

interface Child {
  id: string;
  name: string;
  age: number;
}

function NewBookingPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { searchParams, SearchParamsListener } = useSafeSearchParams();
  const childminderId = searchParams ? searchParams.get('childminderId') : null;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [childminder, setChildminder] = useState<Childminder | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  
  // Form state
  const [bookingDate, setBookingDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDays, setRecurringDays] = useState<number[]>([]);
  const [isEmergency, setIsEmergency] = useState(false);
  
  // Days of the week for recurring bookings
  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];

  // Redirect if not authenticated or not a parent
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/auth/login?callbackUrl=${encodeURIComponent("/dashboard/parent/bookings/new")}`);
    }
    
    if (status === "authenticated" && session?.user?.role !== "parent") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  // Fetch childminder details if childminderId is provided
  useEffect(() => {
    const fetchChildminderDetails = async () => {
      if (!childminderId) return;
      
      try {
        const response = await fetch(`/api/childminders/${childminderId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch childminder details');
        }
        
        const data = await response.json();
        setChildminder(data);
      } catch (err) {
        console.error('Error fetching childminder:', err);
        setError('Could not load childminder information. Please try again.');
      }
    };

    if (childminderId) {
      fetchChildminderDetails();
    }
  }, [childminderId]);

  // Fetch parent's children
  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const response = await fetch('/api/dashboard/parent/children');
        
        if (!response.ok) {
          throw new Error('Failed to fetch children data');
        }
        
        const data = await response.json();
        setChildren(data.children || []);
      } catch (err) {
        console.error('Error fetching children:', err);
        setError('Could not load your children information. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchChildren();
    }
  }, [status]);

  // Handle recurring day selection toggle
  const toggleRecurringDay = (day: number) => {
    setRecurringDays(current => 
      current.includes(day) 
        ? current.filter(d => d !== day) 
        : [...current, day]
    );
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!childminderId) {
      setError('No childminder selected');
      return;
    }
    
    if (selectedChildren.length === 0) {
      setError('Please select at least one child');
      return;
    }
    
    if (!bookingDate || !startTime || !endTime) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (isRecurring && recurringDays.length === 0) {
      setError('Please select at least one day for recurring bookings');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const bookingData = {
        childminderId,
        childrenIds: selectedChildren,
        startDateTime: `${bookingDate}T${startTime}:00`,
        endDateTime: `${bookingDate}T${endTime}:00`,
        notes,
        isRecurring,
        recurringDays: isRecurring ? recurringDays : [],
        isEmergency
      };
      
      const response = await fetch('/api/dashboard/parent/bookings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create booking');
      }
      
      setSuccess(true);
      
      // Redirect to bookings page after successful creation
      setTimeout(() => {
        router.push('/dashboard/parent/bookings');
      }, 2000);
    } catch (err) {
      console.error('Error creating booking:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while creating the booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <SearchParamsListener />
      <header className="mb-6">
        <div className="flex items-center">
          <Link 
            href={childminderId ? `/dashboard/parent/childminder/${childminderId}` : "/dashboard/parent/find-childminders"} 
            className="mr-4 text-violet-600 hover:text-violet-800"
          >
            <FaArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">New Booking</h1>
            <p className="mt-1 text-sm text-gray-600">
              {childminder ? `Book ${childminder.name}` : "Create a new childcare booking"}
            </p>
          </div>
        </div>
      </header>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {success ? (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Success!</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Your booking has been created. Redirecting to bookings page...</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit}>
            {!childminderId && (
              <div className="mb-6">
                <p className="text-sm text-red-600">
                  No childminder selected. Please select a childminder from the{" "}
                  <Link href="/dashboard/parent/find-childminders" className="font-medium text-violet-600 hover:text-violet-800">
                    Find Childminders
                  </Link>{" "}
                  page.
                </p>
              </div>
            )}

            {/* Childminder information */}
            {childminder && (
              <div className="mb-6 rounded-md bg-violet-50 p-4">
                <h3 className="mb-2 text-sm font-medium text-violet-800">Selected Childminder</h3>
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-violet-200 flex items-center justify-center">
                    {childminder.image ? (
                      <img
                        src={childminder.image}
                        alt={childminder.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <FaUser className="h-5 w-5 text-violet-600" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{childminder.name}</p>
                    {childminder.rate && (
                      <p className="text-sm text-gray-600">€{Number(childminder.rate).toFixed(2)}/hr</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Date and time selection */}
            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
              <div>
                <label htmlFor="bookingDate" className="block text-sm font-medium text-gray-700">
                  Date*
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaCalendarAlt className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="bookingDate"
                    name="bookingDate"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="block w-full pl-10 py-2 sm:text-sm border-gray-300 rounded-md focus:ring-violet-500 focus:border-violet-500"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                  Start Time*
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaClock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="time"
                    id="startTime"
                    name="startTime"
                    required
                    className="block w-full pl-10 py-2 sm:text-sm border-gray-300 rounded-md focus:ring-violet-500 focus:border-violet-500"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                  End Time*
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaClock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="time"
                    id="endTime"
                    name="endTime"
                    required
                    className="block w-full pl-10 py-2 sm:text-sm border-gray-300 rounded-md focus:ring-violet-500 focus:border-violet-500"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Children selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Children*
              </label>
              {children.length > 0 ? (
                <div className="space-y-2">
                  {children.map((child) => (
                    <div key={child.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`child-${child.id}`}
                        name="selectedChildren"
                        value={child.id}
                        checked={selectedChildren.includes(child.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedChildren([...selectedChildren, child.id]);
                          } else {
                            setSelectedChildren(selectedChildren.filter(id => id !== child.id));
                          }
                        }}
                        className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`child-${child.id}`} className="ml-3 block text-sm text-gray-700">
                        {child.name} ({child.age} {child.age === 1 ? 'year' : 'years'} old)
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-yellow-600 flex items-center">
                  <FaChild className="mr-2" />
                  No children added yet.{" "}
                  <Link href="/dashboard/parent/children" className="ml-1 font-medium text-violet-600 hover:text-violet-800">
                    Add children
                  </Link>
                </div>
              )}
            </div>

            {/* Recurring booking option */}
            <div className="mb-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isRecurring"
                  name="isRecurring"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
                />
                <label htmlFor="isRecurring" className="ml-3 block text-sm font-medium text-gray-700">
                  This is a recurring booking
                </label>
              </div>
              
              {isRecurring && (
                <div className="mt-4 ml-7">
                  <p className="text-sm text-gray-700 mb-2">Select days for recurring bookings:</p>
                  <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleRecurringDay(day.value)}
                        className={`px-3 py-1 text-sm rounded-full ${
                          recurringDays.includes(day.value)
                            ? 'bg-violet-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Emergency booking option */}
            <div className="mb-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isEmergency"
                  name="isEmergency"
                  checked={isEmergency}
                  onChange={(e) => setIsEmergency(e.target.checked)}
                  className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
                />
                <label htmlFor="isEmergency" className="ml-3 block text-sm font-medium text-gray-700">
                  This is an emergency booking
                </label>
              </div>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Additional Notes
              </label>
              <div className="mt-1">
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  className="shadow-sm focus:ring-violet-500 focus:border-violet-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Any special requirements or information for the childminder"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Submit button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !childminderId || selectedChildren.length === 0}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                    Creating Booking...
                  </>
                ) : (
                  'Create Booking'
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function NewBookingPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-violet-600 border-t-transparent"></div>
      </div>
    }>
      <NewBookingPageContent />
    </Suspense>
  );
} 