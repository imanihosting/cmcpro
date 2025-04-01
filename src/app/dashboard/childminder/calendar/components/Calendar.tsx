import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventSourceInput } from '@fullcalendar/core';
import { useCalendarEvents } from '../hooks/useCalendarEvents';
import EventDetailModal from './EventDetailModal';
import AvailabilityModal from './AvailabilityModal';
import { CalendarEvent, AvailabilityData } from '../types';
import './Calendar.css';
import { FaPlus, FaMinus } from 'react-icons/fa';
import { BsGoogle } from 'react-icons/bs';

// Define the color mapping for event categories with more vivid colors
const eventColors = {
  confirmed: {
    backgroundColor: '#4ade80', // green-400 (lighter green for better contrast with black text)
    borderColor: '#16a34a',     // green-600
    textColor: '#000000'        // black for better readability
  },
  pending: {
    backgroundColor: '#facc15', // yellow-400
    borderColor: '#ca8a04',     // yellow-600
    textColor: '#000000'        // black for better contrast
  },
  cancelled: {
    backgroundColor: '#ef4444', // red-500
    borderColor: '#dc2626',     // red-600
    textColor: '#000000'        // black for better readability
  },
  personal: {
    backgroundColor: '#94a3b8', // slate-400
    borderColor: '#64748b',     // slate-500
    textColor: '#000000'        // black for better readability
  },
  available: {
    backgroundColor: '#93c5fd', // blue-300
    borderColor: '#3b82f6',     // blue-500
    textColor: '#000000'        // black for better readability
  },
  unavailable: {
    backgroundColor: '#f87171', // red-400
    borderColor: '#ef4444',     // red-500
    textColor: '#000000'        // black for better readability
  }
};

const Calendar: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<{start: Date, end: Date} | null>(null);
  const [availabilityType, setAvailabilityType] = useState<'AVAILABLE' | 'UNAVAILABLE'>('AVAILABLE');
  const [currentView, setCurrentView] = useState<string>('dayGridMonth');
  const [viewMode, setViewMode] = useState<'bookings' | 'availability'>('bookings');
  const [isMobile, setIsMobile] = useState(false);
  const [calendarHeight, setCalendarHeight] = useState('calc(100vh - 260px)');
  const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState(false);
  const { events, isLoading, error, fetchEvents, addAvailability, removeAvailability, syncWithGoogleCalendar, checkGoogleCalendarConnection } = useCalendarEvents();
  const calendarRef = useRef<FullCalendar | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Check if device is mobile and adjust layout accordingly
  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Adjust calendar height based on viewport
      if (containerRef.current) {
        const viewportHeight = window.innerHeight;
        const containerOffset = containerRef.current.getBoundingClientRect().top;
        const bottomPadding = mobile ? 80 : 40; // Extra padding at bottom
        const newHeight = viewportHeight - containerOffset - bottomPadding;
        
        setCalendarHeight(`${newHeight}px`);
      }
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Check Google Calendar connection status
  useEffect(() => {
    const checkGoogleConnection = async () => {
      const isConnected = await checkGoogleCalendarConnection();
      setIsGoogleCalendarConnected(isConnected);
    };
    
    checkGoogleConnection();
  }, [checkGoogleCalendarConnection]);

  // Fetch initial events when the component mounts
  useEffect(() => {
    const fetchInitialEvents = () => {
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        const view = calendarApi.view;
        
        fetchEvents({
          start: view.activeStart,
          end: view.activeEnd,
          mode: viewMode
        });
      }
    };
    
    // Short delay to ensure the calendar is fully initialized
    const timer = setTimeout(fetchInitialEvents, 100);
    return () => clearTimeout(timer);
  }, [fetchEvents, viewMode]);

  // Configure FullCalendar event sources with color coding
  const eventSources: EventSourceInput[] = [
    // Only show these categories when in bookings mode
    ...(viewMode === 'bookings' ? [
      {
        events: events.filter(event => event.category === 'confirmed'),
        ...eventColors.confirmed
      },
      {
        events: events.filter(event => event.category === 'pending'),
        ...eventColors.pending
      },
      {
        events: events.filter(event => event.category === 'cancelled'),
        ...eventColors.cancelled
      },
      {
        events: events.filter(event => event.category === 'personal'),
        ...eventColors.personal
      }
    ] : []),
    // Only show these categories when in availability mode
    ...(viewMode === 'availability' ? [
      {
        events: events.filter(event => event.category === 'available'),
        ...eventColors.available
      },
      {
        events: events.filter(event => event.category === 'unavailable'),
        ...eventColors.unavailable
      }
    ] : [])
  ];

  // Handle date range changes (navigation between months, weeks, etc.)
  const handleDatesSet = (arg: any) => {
    fetchEvents({
      start: arg.start,
      end: arg.end,
      mode: viewMode
    });
  };

  // Handle event click
  const handleEventClick = (info: any) => {
    const eventId = info.event.id;
    const eventObj = events.find(e => e.id === eventId);
    
    if (eventObj) {
      // If in availability mode and the event is an availability slot
      if (viewMode === 'availability' && 
          (eventObj.category === 'available' || eventObj.category === 'unavailable')) {
        // Handle availability event click - allow editing or deleting
        setAvailabilityType(eventObj.category === 'available' ? 'AVAILABLE' : 'UNAVAILABLE');
        setSelectedEvent(eventObj);
        setShowAvailabilityModal(true);
      } else {
        // For bookings, show the event detail modal
        setSelectedEvent(eventObj);
      }
    }
  };

  // Handle date selection (for creating availability)
  const handleDateSelect = (selectInfo: any) => {
    if (viewMode === 'availability') {
      setSelectedDate(selectInfo.start);
      setSelectedTimeRange({
        start: selectInfo.start,
        end: selectInfo.end
      });
      setShowAvailabilityModal(true);
    }
    
    // Clear selection after handling
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.unselect();
    }
  };

  // Handle view change
  const handleViewChange = (info: any) => {
    setCurrentView(info.view.type);
  };
  
  // Close the event detail modal
  const closeModal = () => {
    setSelectedEvent(null);
  };
  
  // Close the availability modal
  const closeAvailabilityModal = () => {
    setShowAvailabilityModal(false);
    setSelectedDate(null);
    setSelectedTimeRange(null);
    setSelectedEvent(null);
  };
  
  // Fix for Date | undefined type issue
  const safeRefreshEvents = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      const view = calendarApi.view;

      fetchEvents({
        start: view.activeStart,
        end: view.activeEnd,
        mode: viewMode
      });
    }
  };

  // Handle saving availability
  const handleSaveAvailability = async (data: AvailabilityData) => {
    if (selectedTimeRange) {
      await addAvailability({
        start: selectedTimeRange.start,
        end: selectedTimeRange.end,
        type: availabilityType,
        title: data.title,
        description: data.description,
        recurrenceRule: data.recurrenceRule,
        eventId: selectedEvent?.id
      });
      
      // Refresh calendar events
      safeRefreshEvents();
      
      closeAvailabilityModal();
    }
  };
  
  // Update the handleDeleteAvailability function
  const handleDeleteAvailability = async () => {
    if (selectedEvent?.id) {
      await removeAvailability(selectedEvent.id);
      
      // Refresh calendar events
      safeRefreshEvents();
      
      closeAvailabilityModal();
    }
  };
  
  // Update the toggleViewMode function
  const toggleViewMode = () => {
    const newMode = viewMode === 'bookings' ? 'availability' : 'bookings';
    setViewMode(newMode);
    
    // Refresh calendar with the new mode
    safeRefreshEvents();
  };
  
  // Update the handleGoogleSync function
  const handleGoogleSync = async () => {
    if (isGoogleCalendarConnected) {
      // Sync calendar
      await syncWithGoogleCalendar();
      
      // Refresh calendar events
      safeRefreshEvents();
    } else {
      // Redirect to Google Calendar OAuth flow
      window.location.href = '/api/calendar-sync/auth';
    }
  };

  // Determine header toolbar based on screen size
  const headerToolbar = isMobile
    ? {
        left: 'prev,next',
        center: 'title',
        right: 'dayGridMonth,timeGridDay'
      }
    : {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      };

  return (
    <div className="w-full h-full" ref={containerRef}>
      {/* View Toggle and Action Buttons */}
      <h2 className="sr-only">Calendar Controls</h2>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={toggleViewMode} 
            className={`px-4 py-2 rounded-md font-bold text-base ${
              viewMode === 'bookings' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-800'
            }`}
          >
            Bookings
          </button>
          <button 
            onClick={toggleViewMode} 
            className={`px-4 py-2 rounded-md font-bold text-base ${
              viewMode === 'availability' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-800'
            }`}
          >
            Availability
          </button>
        </div>
        
        {viewMode === 'availability' && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setAvailabilityType('AVAILABLE');
                setShowAvailabilityModal(true);
              }}
              className="flex items-center gap-1 px-3 py-2 bg-green-500 text-white rounded-md font-bold text-base"
            >
              <FaPlus size={14} />
              <span>Add Available</span>
            </button>
            <button
              onClick={() => {
                setAvailabilityType('UNAVAILABLE');
                setShowAvailabilityModal(true);
              }}
              className="flex items-center gap-1 px-3 py-2 bg-red-500 text-white rounded-md font-bold text-base"
            >
              <FaMinus size={14} />
              <span>Block Time</span>
            </button>
            <button
              onClick={handleGoogleSync}
              className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-md font-bold text-base hover:bg-gray-50"
            >
              <BsGoogle size={16} className="text-blue-500" />
              <span>{isGoogleCalendarConnected ? 'Sync Calendar' : 'Connect Google'}</span>
            </button>
          </div>
        )}
      </div>
      
      {/* Loading state */}
      {isLoading && (
        <div className="text-center my-4 py-4 bg-blue-50 rounded-lg text-blue-700 text-base sm:text-lg font-bold flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading calendar events...
        </div>
      )}
      
      {/* Error display */}
      {error && (
        <div className="text-center my-4 py-4 px-4 bg-red-50 rounded-lg text-red-700 text-base sm:text-lg font-bold">
          Error: {error}
        </div>
      )}
      
      {/* Calendar color legend */}
      <div className="flex flex-wrap gap-6 mb-5 p-5 bg-white rounded-lg shadow-sm border border-gray-200">
        <h3 className="w-full text-xl font-bold text-gray-900 mb-4">Calendar Legend:</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4 w-full">
          {viewMode === 'bookings' ? (
            <>
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-md mr-3 shadow-sm" style={{ backgroundColor: eventColors.confirmed.backgroundColor }}></div>
                <span className="text-base font-bold text-gray-900">Confirmed</span>
              </div>
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-md mr-3 shadow-sm" style={{ backgroundColor: eventColors.pending.backgroundColor }}></div>
                <span className="text-base font-bold text-gray-900">Pending</span>
              </div>
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-md mr-3 shadow-sm" style={{ backgroundColor: eventColors.cancelled.backgroundColor }}></div>
                <span className="text-base font-bold text-gray-900">Cancelled</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-md mr-3 shadow-sm" style={{ backgroundColor: eventColors.available.backgroundColor }}></div>
                <span className="text-base font-bold text-gray-900">Available</span>
              </div>
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-md mr-3 shadow-sm" style={{ backgroundColor: eventColors.unavailable.backgroundColor }}></div>
                <span className="text-base font-bold text-gray-900">Unavailable</span>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Calendar component */}
      <div className="bg-white p-2 sm:p-4 rounded-lg shadow-lg border border-gray-200 overflow-hidden" style={{ height: calendarHeight }}>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={isMobile ? "dayGridMonth" : "dayGridMonth"}
          headerToolbar={headerToolbar}
          eventSources={eventSources}
          datesSet={handleDatesSet}
          eventClick={handleEventClick}
          viewDidMount={handleViewChange}
          height="100%"
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: 'short'
          }}
          allDaySlot={false}
          nowIndicator={true}
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          slotDuration="00:30:00"
          stickyHeaderDates={true}
          dayMaxEvents={isMobile ? 2 : true}
          // For mobile view, simplify further
          views={{
            dayGridMonth: {
              // Month view settings
              dayMaxEventRows: isMobile ? 2 : 4,
              titleFormat: { month: 'long', year: 'numeric' },
              eventMinHeight: isMobile ? 32 : 28 // Increased height for better readability
            },
            timeGridWeek: {
              // Week view settings
              titleFormat: { month: 'short', day: 'numeric', year: 'numeric' }
            },
            timeGridDay: {
              // Day view settings
              titleFormat: { weekday: 'long', month: 'short', day: 'numeric' }
            }
          }}
          // Enable date selection for availability mode
          selectable={viewMode === 'availability'}
          select={handleDateSelect}
          // Custom styling for better text visibility
          eventContent={(info) => {
            return (
              <div className="p-1.5 overflow-hidden text-ellipsis whitespace-nowrap">
                {info.timeText && (
                  <div className="text-xs sm:text-sm font-extrabold mb-0.5 text-gray-900">{info.timeText}</div>
                )}
                <div className="text-sm sm:text-base font-bold leading-tight text-gray-900">{info.event.title}</div>
              </div>
            )
          }}
          // Enhance heading text
          dayHeaderContent={(arg) => {
            return (
              <div className="text-sm sm:text-base font-bold text-gray-900">
                {arg.text}
              </div>
            )
          }}
        />
      </div>
      
      {/* Event detail modal */}
      {selectedEvent && !showAvailabilityModal && (
        <EventDetailModal event={selectedEvent} onClose={closeModal} />
      )}
      
      {/* Availability modal */}
      {showAvailabilityModal && (
        <AvailabilityModal
          isOpen={showAvailabilityModal}
          onClose={closeAvailabilityModal}
          onSave={handleSaveAvailability}
          onDelete={selectedEvent ? handleDeleteAvailability : undefined}
          startDate={selectedTimeRange?.start}
          endDate={selectedTimeRange?.end}
          type={availabilityType}
          title={selectedEvent?.title}
          description={selectedEvent?.description}
          recurrenceRule={selectedEvent?.extendedProps?.recurrenceRule}
          isEditing={!!selectedEvent}
        />
      )}
    </div>
  );
};

export default Calendar; 