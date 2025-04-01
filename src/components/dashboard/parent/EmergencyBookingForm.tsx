'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Clock, AlertTriangle, CheckCircle, X } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format, addHours } from 'date-fns';
import { inputBaseClass, textareaClass, checkboxClass } from '@/components/ui/InputStyles';

interface Child {
  id: string;
  name: string;
  age: number;
}

export default function EmergencyBookingForm({ children }: { children: Child[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedChildrenIds, setSelectedChildrenIds] = useState<string[]>([]);
  const [startDateTime, setStartDateTime] = useState<Date>(new Date());
  const [endDateTime, setEndDateTime] = useState<Date>(addHours(new Date(), 3));
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ message: string; details: string } | null>(null);

  const handleChildToggle = (childId: string) => {
    setSelectedChildrenIds(prev => 
      prev.includes(childId) 
        ? prev.filter(id => id !== childId) 
        : [...prev, childId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (selectedChildrenIds.length === 0) {
      setError("Please select at least one child for the booking");
      return;
    }
    
    // Check if start time is in the past
    const now = new Date();
    if (startDateTime < now) {
      setError("Start time cannot be in the past");
      return;
    }
    
    // Check if end time is after start time
    if (endDateTime <= startDateTime) {
      setError("End time must be after start time");
      return;
    }
    
    // Check if the booking is within 24 hours
    const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    if (startDateTime > twentyFourHoursLater) {
      setError("Emergency bookings must be within the next 24 hours");
      return;
    }

    setLoading(true);

    try {
      const requestBody = {
        childrenIds: selectedChildrenIds,
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        notes,
      };
      
      console.log('Emergency booking request:', requestBody);
      
      const response = await fetch('/api/dashboard/parent/bookings/emergency', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || data.message || 'Failed to create emergency booking';
        console.error('Emergency booking error:', data);
        throw new Error(errorMessage);
      }

      // Show success message with childminder count
      const childminderCount = data.notifiedChildminders?.length || 0;
      const childminderText = childminderCount === 1 ? 'childminder' : 'childminders';
      
      setSuccess({
        message: 'Emergency Booking Sent Successfully!',
        details: `We've notified ${childminderCount} ${childminderText} about your emergency booking request. You'll receive a confirmation soon.`
      });
      
      // Reset form
      setSelectedChildrenIds([]);
      setNotes('');
      
      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/dashboard/parent/bookings');
        router.refresh();
      }, 3000);

    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // If success message is shown, display only that
  if (success) {
    return (
      <div className="w-full bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 bg-green-100 p-3 rounded-full">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{success.message}</h3>
            <p className="text-gray-600 mb-6">{success.details}</p>
            <p className="text-sm text-gray-500">Redirecting you to your bookings page...</p>
            <button
              onClick={() => router.push('/dashboard/parent/bookings')}
              className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              View My Bookings
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <h3 className="text-xl font-semibold text-gray-900">Emergency Childcare Request</h3>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          Find available childminders who can help right away. We'll notify them immediately.
        </p>
      </div>
      <div className="px-6 py-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start justify-between">
              <span>{error}</span>
              <button 
                type="button" 
                onClick={() => setError(null)}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                <X size={18} />
              </button>
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="children" className="block text-sm font-medium text-gray-700">
              Children Needing Care
            </label>
            <div className="space-y-2">
              {children.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No children found. Please add children to your profile first.
                </p>
              ) : (
                children.map((child) => (
                  <div key={child.id} className="flex items-center space-x-2">
                    <input 
                      type="checkbox"
                      id={`child-${child.id}`}
                      checked={selectedChildrenIds.includes(child.id)}
                      onChange={() => handleChildToggle(child.id)}
                      className={checkboxClass}
                    />
                    <label htmlFor={`child-${child.id}`} className="text-sm text-gray-700 font-normal">
                      {child.name} ({child.age} {child.age === 1 ? 'year' : 'years'} old)
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Start Time
              </label>
              <div className="relative">
                <DatePicker
                  selected={startDateTime}
                  onChange={(date: Date | null) => date && setStartDateTime(date)}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="MMMM d, yyyy h:mm aa"
                  minDate={new Date()}
                  className={inputBaseClass}
                  wrapperClassName="w-full"
                />
                <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                End Time
              </label>
              <div className="relative">
                <DatePicker
                  selected={endDateTime}
                  onChange={(date: Date | null) => date && setEndDateTime(date)}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="MMMM d, yyyy h:mm aa"
                  minDate={startDateTime}
                  className={inputBaseClass}
                  wrapperClassName="w-full"
                />
                <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Additional Notes
            </label>
            <textarea
              id="notes"
              placeholder="Special instructions or details about your emergency childcare needs"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className={textareaClass}
            />
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                  Finding Childminders...
                </>
              ) : (
                'Request Emergency Childcare'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 