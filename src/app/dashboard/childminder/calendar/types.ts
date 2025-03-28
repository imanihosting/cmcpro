import { Booking_status, Booking_bookingType, Booking_recurrencePattern } from '@prisma/client';

// Event category types
export type EventCategory = 'confirmed' | 'pending' | 'personal' | 'cancelled';

// Calendar Event interface
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date | string;
  end: Date | string;
  allDay?: boolean;
  category: EventCategory;
  bookingId?: string;
  description?: string;
  parentName?: string;
  children?: string[];
  extendedProps?: {
    bookingId?: string;
    status?: Booking_status;
    bookingType?: Booking_bookingType;
    isRecurring?: boolean;
    recurrencePattern?: Booking_recurrencePattern;
    children?: string[];
    parentName?: string;
    parentId?: string;
  };
}

// API response for events
export interface CalendarEventsResponse {
  events: CalendarEvent[];
}

// Calendar filter options
export interface CalendarFilters {
  start: Date | string;
  end: Date | string;
  categories?: EventCategory[];
}

// Event detail props for modal
export interface EventDetailProps {
  event: CalendarEvent;
  onClose: () => void;
} 