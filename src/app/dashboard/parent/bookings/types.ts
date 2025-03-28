import { Booking_status, Booking_bookingType, Booking_recurrencePattern } from '@prisma/client';

// Booking child type
export interface BookingChild {
  id: string;
  name: string;
  age: number;
  allergies?: string | null;
  specialNeeds?: string | null;
}

// Childminder type
export interface BookingChildminder {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  phone?: string | null;
  bio?: string | null;
  rate?: any;
  location?: string | null;
  firstAidCert?: boolean | null;
  gardaVetted?: boolean | null;
  tuslaRegistered?: boolean | null;
  yearsOfExperience?: number | null;
}

// Duration type
export interface BookingDuration {
  hours: number;
  minutes: number;
}

// Booking type
export interface Booking {
  id: string;
  startTime: Date;
  endTime: Date;
  status: Booking_status;
  bookingType: Booking_bookingType;
  isEmergency: boolean;
  isRecurring: boolean;
  recurrencePattern?: Booking_recurrencePattern | null;
  createdAt: Date;
  updatedAt: Date;
  cancellationNote?: string | null;
  duration?: BookingDuration;
  children: BookingChild[];
  childminder: BookingChildminder;
}

// Filter options for bookings
export interface BookingFilters {
  status?: Booking_status;
  timeframe?: 'upcoming' | 'past' | 'all';
  startDate?: Date;
  endDate?: Date;
  childminderId?: string;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// Pagination information
export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// API response for bookings list
export interface BookingsResponse {
  bookings: Booking[];
  pagination: PaginationInfo;
}

// API response for a single booking
export interface BookingResponse {
  booking: Booking;
}

// Cancel booking request
export interface CancelBookingRequest {
  action: 'cancel';
  cancellationNote?: string;
} 