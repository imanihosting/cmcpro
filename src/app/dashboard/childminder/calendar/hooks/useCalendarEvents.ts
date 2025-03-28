import { useState, useEffect, useCallback } from 'react';
import { CalendarEvent, CalendarEventsResponse, CalendarFilters } from '../types';
import { format } from 'date-fns';

export const useCalendarEvents = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async (filters: CalendarFilters) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Format dates for the API query
      const startStr = typeof filters.start === 'string' 
        ? filters.start 
        : format(filters.start, 'yyyy-MM-dd');
        
      const endStr = typeof filters.end === 'string'
        ? filters.end
        : format(filters.end, 'yyyy-MM-dd');
      
      // Build the query string
      const queryParams = new URLSearchParams({
        start: startStr,
        end: endStr
      });
      
      // Make the API request
      const response = await fetch(`/api/dashboard/childminder/calendar?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status}`);
      }
      
      const data: CalendarEventsResponse = await response.json();
      setEvents(data.events);
      
    } catch (err) {
      console.error('Error fetching calendar events:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch calendar events');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  return {
    events,
    isLoading,
    error,
    fetchEvents
  };
}; 