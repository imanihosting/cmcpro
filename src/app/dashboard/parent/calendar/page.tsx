"use client";

import { useState, useEffect, useMemo, Fragment } from "react";
import { format, startOfMonth, endOfMonth, addMonths, parseISO, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { 
  FaCalendarAlt, 
  FaChevronLeft, 
  FaChevronRight,
  FaClock,
  FaMapMarkerAlt,
  FaChild,
  FaCircle,
  FaTimes,
  FaSpinner
} from "react-icons/fa";

// Calendar event interface
interface CalendarChild {
  id: string;
  name: string;
  age: number;
}

interface CalendarChildminder {
  id: string;
  name: string;
  image: string | null;
  location: string | null;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: string;
  bookingType: string;
  isEmergency: boolean;
  isRecurring: boolean;
  recurrencePattern: string | null;
  color: string;
  childminder: CalendarChildminder;
  children: CalendarChild[];
  allDay: boolean;
}

// Status color mapping
const STATUS_COLORS = {
  PENDING: '#f59e0b',     // Amber
  CONFIRMED: '#10b981',   // Emerald
  CANCELLED: '#ef4444',   // Red
  LATE_CANCELLED: '#ef4444', // Red
  COMPLETED: '#6b7280',   // Gray
  EMERGENCY: '#dc2626',   // Bright red
  DEFAULT: '#6366f1'      // Indigo
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Get days for current month view
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday
    const endDate = new Date(monthEnd);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay())); // End on Saturday
    
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  // Fetch calendar events
  useEffect(() => {
    async function fetchCalendarEvents() {
      try {
        setLoading(true);
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const startDateStr = format(monthStart, 'yyyy-MM-dd');
        const endDateStr = format(monthEnd, 'yyyy-MM-dd');
        
        const response = await fetch(
          `/api/dashboard/parent/calendar?startDate=${startDateStr}&endDate=${endDateStr}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch calendar events');
        }
        
        const data = await response.json();
        
        // Convert string dates to Date objects
        const formattedEvents = data.events.map((event: any) => ({
          ...event,
          start: parseISO(event.start),
          end: parseISO(event.end)
        }));
        
        setEvents(formattedEvents);
        setError(null);
      } catch (err) {
        setError('Error loading calendar events. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchCalendarEvents();
  }, [currentDate]);

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentDate(addMonths(currentDate, -1));
  };
  
  // Navigate to next month
  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };
  
  // Navigate to today
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  // Format month for display
  const formatMonthDisplay = (date: Date) => {
    return format(date, 'MMMM yyyy');
  };

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return events.filter(event => 
      isSameDay(day, event.start)
    );
  };

  // Handle event click
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  // Close event details modal
  const closeEventDetails = () => {
    setSelectedEvent(null);
  };

  // Render event details modal
  const renderEventDetails = () => {
    if (!selectedEvent) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-lg font-bold text-gray-900">Booking Details</h3>
            <button onClick={closeEventDetails} className="text-gray-500 hover:text-gray-700">
              <FaTimes className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-4 space-y-4">
            <h4 className="font-bold text-xl text-gray-900">{selectedEvent.title}</h4>
            
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="mt-1">
                <FaCircle className="h-4 w-4" style={{ color: selectedEvent.color }} />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-800">Status</div>
                <div className="text-sm font-medium text-gray-700">
                  {selectedEvent.status}
                  {selectedEvent.isEmergency && ' (Emergency)'}
                  {selectedEvent.isRecurring && ' (Recurring)'}
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <FaCalendarAlt className="h-4 w-4 mt-1 text-violet-600" />
              <div className="flex-1">
                <div className="font-semibold text-gray-800">Date & Time</div>
                <div className="text-sm font-medium text-gray-700">
                  {format(selectedEvent.start, 'EEEE, MMMM d, yyyy')}
                  <br />
                  <span className="text-violet-700 font-medium">
                    {format(selectedEvent.start, 'h:mm a')} - {format(selectedEvent.end, 'h:mm a')}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <FaMapMarkerAlt className="h-4 w-4 mt-1 text-violet-600" />
              <div className="flex-1">
                <div className="font-semibold text-gray-800">Location</div>
                <div className="text-sm font-medium text-gray-700">{selectedEvent.childminder.location || 'Not specified'}</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <FaChild className="h-4 w-4 mt-1 text-violet-600" />
              <div className="flex-1">
                <div className="font-semibold text-gray-800">Children</div>
                <div className="text-sm font-medium space-y-1 text-gray-700">
                  {selectedEvent.children.map(child => (
                    <div key={child.id} className="flex justify-between">
                      <span>{child.name}</span>
                      <span className="text-gray-500">Age: {child.age}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t flex justify-end">
            <button
              onClick={closeEventDetails}
              className="px-4 py-2 bg-violet-100 text-violet-700 font-medium rounded hover:bg-violet-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Calendar</h1>
        <p className="mt-1 text-sm text-gray-600">View and manage your childcare schedule</p>
      </header>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-3 md:space-y-0">
        <h2 className="text-xl font-semibold text-gray-900">{formatMonthDisplay(currentDate)}</h2>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={prevMonth}
            className="rounded-full p-2 text-gray-600 hover:bg-gray-100"
          >
            <FaChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={goToToday}
            className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="rounded-full p-2 text-gray-600 hover:bg-gray-100"
          >
            <FaChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mt-4 mb-6 overflow-hidden rounded-lg bg-white shadow">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <FaSpinner className="w-8 h-8 text-violet-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-96 text-red-500">
            {error}
          </div>
        ) : (
          <div className="calendar">
            {/* Calendar header (days of week) */}
            <div className="grid grid-cols-7 gap-px">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="py-2 text-center text-sm font-semibold text-gray-700 bg-gray-100">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {calendarDays.map(day => {
                const dayEvents = getEventsForDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                
                return (
                  <div 
                    key={day.toString()} 
                    className={`h-24 sm:h-32 border border-gray-200 p-1 overflow-y-auto ${
                      isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span 
                        className={`text-sm font-medium inline-flex items-center justify-center w-6 h-6 ${
                          isToday(day) 
                            ? 'bg-violet-600 text-white rounded-full font-bold' 
                            : isCurrentMonth ? 'text-gray-900' : 'text-gray-500'
                        }`}
                      >
                        {format(day, 'd')}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-xs bg-violet-100 text-violet-800 font-bold px-1.5 py-0.5 rounded-full">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-1 space-y-1.5">
                      {dayEvents.map(event => (
                        <button
                          key={event.id}
                          onClick={() => handleEventClick(event)}
                          className="w-full text-left text-xs font-medium truncate p-1.5 rounded border-l-2 hover:bg-gray-50"
                          style={{ 
                            borderLeftColor: event.color,
                            backgroundColor: `${event.color}15`, // Light version of the color
                            color: '#1F2937', // Dark gray for better readability
                          }}
                        >
                          <span className="font-semibold">{format(event.start, 'h:mm a')}</span> - {event.title}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Status color legend */}
      <div className="rounded-lg bg-white shadow p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Booking Status Legend</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6">
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            status !== 'DEFAULT' && (
              <div key={status} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full shadow-sm" style={{ backgroundColor: color }}></div>
                <span className="text-base font-semibold text-gray-900">{status.replace('_', ' ')}</span>
              </div>
            )
          ))}
        </div>
      </div>

      {/* Event details modal */}
      {renderEventDetails()}
    </div>
  );
} 