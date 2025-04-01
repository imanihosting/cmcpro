import { useState, useEffect, useCallback } from 'react';
import { CalendarEvent, CalendarEventsResponse, CalendarFilters, AvailabilityData, CalendarSyncStatus } from '../types';
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
        end: endStr,
        mode: filters.mode || 'bookings'
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

  // Add a new availability block
  const addAvailability = useCallback(async (data: AvailabilityData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Format start and end dates
      const startStr = format(data.start, "yyyy-MM-dd'T'HH:mm:ss");
      const endStr = format(data.end, "yyyy-MM-dd'T'HH:mm:ss");
      
      // Prepare request body
      const body = {
        ...data,
        start: startStr,
        end: endStr
      };
      
      // Determine if updating existing or creating new
      const method = data.eventId ? 'PUT' : 'POST';
      const url = data.eventId 
        ? `/api/dashboard/childminder/availability/${data.eventId}`
        : '/api/dashboard/childminder/availability';
      
      // Make the API request
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${data.eventId ? 'update' : 'create'} availability: ${response.status}`);
      }
      
      // No need to update events here, the parent component will refresh them
      
    } catch (err) {
      console.error('Error managing availability:', err);
      setError(err instanceof Error ? err.message : 'Failed to manage availability');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Remove an availability block
  const removeAvailability = useCallback(async (eventId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Make the API request
      const response = await fetch(`/api/dashboard/childminder/availability/${eventId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to delete availability: ${response.status}`);
      }
      
      // No need to update events here, the parent component will refresh them
      
    } catch (err) {
      console.error('Error deleting availability:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete availability');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check Google Calendar connection status
  const checkGoogleCalendarConnection = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/calendar-sync/status');
      
      if (!response.ok) {
        return false;
      }
      
      const data: CalendarSyncStatus = await response.json();
      return data.connected;
      
    } catch (err) {
      console.error('Error checking Google Calendar connection:', err);
      return false;
    }
  }, []);

  // Sync with Google Calendar
  const syncWithGoogleCalendar = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Make the API request
      const response = await fetch('/api/calendar-sync/sync', {
        method: 'POST'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to sync with Google Calendar: ${response.status}`);
      }
      
      // Success!
      return true;
      
    } catch (err) {
      console.error('Error syncing with Google Calendar:', err);
      setError(err instanceof Error ? err.message : 'Failed to sync with Google Calendar');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  return {
    events,
    isLoading,
    error,
    fetchEvents,
    addAvailability,
    removeAvailability,
    checkGoogleCalendarConnection,
    syncWithGoogleCalendar
  };
}; 