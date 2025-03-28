import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventSourceInput } from '@fullcalendar/core';
import { useCalendarEvents } from '../hooks/useCalendarEvents';
import EventDetailModal from './EventDetailModal';
import { CalendarEvent } from '../types';
import './Calendar.css';

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
  }
};

const Calendar: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [currentView, setCurrentView] = useState<string>('dayGridMonth');
  const [isMobile, setIsMobile] = useState(false);
  const [calendarHeight, setCalendarHeight] = useState('calc(100vh - 260px)');
  const { events, isLoading, error, fetchEvents } = useCalendarEvents();
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

  // Fetch initial events when the component mounts
  useEffect(() => {
    const fetchInitialEvents = () => {
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        const view = calendarApi.view;
        
        fetchEvents({
          start: view.activeStart,
          end: view.activeEnd
        });
      }
    };
    
    // Short delay to ensure the calendar is fully initialized
    const timer = setTimeout(fetchInitialEvents, 100);
    return () => clearTimeout(timer);
  }, [fetchEvents]);

  // Configure FullCalendar event sources with color coding
  const eventSources: EventSourceInput[] = [
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
  ];

  // Handle date range changes (navigation between months, weeks, etc.)
  const handleDatesSet = (arg: any) => {
    fetchEvents({
      start: arg.start,
      end: arg.end
    });
  };

  // Handle event click
  const handleEventClick = (info: any) => {
    const eventId = info.event.id;
    const eventObj = events.find(e => e.id === eventId);
    
    if (eventObj) {
      setSelectedEvent(eventObj);
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
      <div className="flex flex-wrap gap-4 mb-5 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <h3 className="w-full text-lg font-bold text-gray-800 mb-2">Legend:</h3>
        <div className="flex items-center">
          <div className="h-6 w-6 rounded-md mr-2" style={{ backgroundColor: eventColors.confirmed.backgroundColor }}></div>
          <span className="text-base font-semibold">Confirmed</span>
        </div>
        <div className="flex items-center">
          <div className="h-6 w-6 rounded-md mr-2" style={{ backgroundColor: eventColors.pending.backgroundColor }}></div>
          <span className="text-base font-semibold">Pending</span>
        </div>
        <div className="flex items-center">
          <div className="h-6 w-6 rounded-md mr-2" style={{ backgroundColor: eventColors.cancelled.backgroundColor }}></div>
          <span className="text-base font-semibold">Cancelled</span>
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
              eventMinHeight: isMobile ? 28 : 24
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
          // Custom styling for better text visibility
          eventContent={(info) => {
            return (
              <div className="p-1.5 overflow-hidden text-ellipsis whitespace-nowrap">
                {info.timeText && (
                  <div className="text-xs sm:text-sm font-extrabold mb-0.5">{info.timeText}</div>
                )}
                <div className="text-sm sm:text-base leading-snug font-bold">{info.event.title}</div>
              </div>
            )
          }}
        />
      </div>
      
      {/* Event detail modal */}
      {selectedEvent && (
        <EventDetailModal event={selectedEvent} onClose={closeModal} />
      )}
    </div>
  );
};

export default Calendar; 