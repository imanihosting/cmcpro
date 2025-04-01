import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Booking_status } from '@prisma/client';
import { parseISO, isValid } from 'date-fns';

export async function GET(request: Request) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Ensure the user is a childminder
    if (session.user.role !== 'childminder') {
      return NextResponse.json({ error: 'Forbidden - Childminder role required' }, { status: 403 });
    }
    
    // Parse query parameters for date range and mode
    const { searchParams } = new URL(request.url);
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');
    const mode = searchParams.get('mode') || 'bookings';
    
    // Validate date range parameters
    if (!startParam || !endParam) {
      return NextResponse.json({ error: 'Missing required parameters: start and end dates' }, { status: 400 });
    }
    
    const startDate = parseISO(startParam);
    const endDate = parseISO(endParam);
    
    if (!isValid(startDate) || !isValid(endDate)) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }
    
    let events = [];
    
    // BOOKINGS MODE: Fetch booking events
    if (mode === 'bookings') {
      // Build the query to fetch bookings in the specified date range
      const whereClause = {
        childminderId: session.user.id,
        OR: [
          // Booking starts within range
          {
            startTime: {
              gte: startDate,
              lte: endDate
            }
          },
          // Booking ends within range
          {
            endTime: {
              gte: startDate,
              lte: endDate
            }
          },
          // Booking spans the entire range
          {
            AND: [
              { startTime: { lte: startDate } },
              { endTime: { gte: endDate } }
            ]
          }
        ]
      };
      
      // Fetch bookings
      const bookings = await prisma.booking.findMany({
        where: whereClause,
        include: {
          User_Booking_parentIdToUser: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            }
          },
          BookingChildren: {
            include: {
              Child: {
                select: {
                  id: true,
                  name: true,
                  age: true,
                }
              }
            }
          }
        }
      });
      
      // Transform bookings into calendar events
      events = bookings.map(booking => {
        // Get children names for the event description
        const childrenNames = booking.BookingChildren.map(bookingChild => 
          bookingChild.Child.name
        );
        
        // Default parent name if not available
        const parentName = booking.User_Booking_parentIdToUser.name || 'Parent';
        
        // Determine event category based on booking status
        let category: 'confirmed' | 'pending' | 'cancelled';
        
        switch (booking.status) {
          case Booking_status.CONFIRMED:
            category = 'confirmed';
            break;
          case Booking_status.PENDING:
            category = 'pending';
            break;
          case Booking_status.CANCELLED:
          case Booking_status.LATE_CANCELLED:
            category = 'cancelled';
            break;
          default:
            category = 'confirmed'; // Default fallback
        }
        
        // Create calendar event object
        return {
          id: booking.id, // Using booking ID as event ID
          title: `${parentName} - ${childrenNames.join(', ')}`,
          start: booking.startTime.toISOString(),
          end: booking.endTime.toISOString(),
          allDay: false,
          category,
          bookingId: booking.id,
          parentName: parentName,
          children: childrenNames,
          extendedProps: {
            bookingId: booking.id,
            status: booking.status,
            bookingType: booking.bookingType,
            isRecurring: booking.isRecurring,
            recurrencePattern: booking.recurrencePattern,
            children: childrenNames,
            parentName: parentName,
            parentId: booking.parentId
          }
        };
      });
    }
    // AVAILABILITY MODE: Fetch availability blocks
    else if (mode === 'availability') {
      // Build the query to fetch availability blocks in the specified date range
      const availabilityWhereClause = {
        userId: session.user.id,
        date: {
          gte: startDate,
          lte: endDate
        }
      };
      
      // Fetch availabilities
      const availabilities = await prisma.availability.findMany({
        where: availabilityWhereClause
      });
      
      // Transform availabilities into calendar events
      const availabilityEvents = availabilities.map(availability => {
        // Parse the time slot
        const [startHours, startMinutes, endHours, endMinutes] = availability.timeSlot.split(':').map(Number);
        
        // Create date objects for start and end times
        const startDate = new Date(availability.date);
        startDate.setHours(startHours);
        startDate.setMinutes(startMinutes);
        startDate.setSeconds(0);
        
        const endDate = new Date(availability.date);
        endDate.setHours(endHours);
        endDate.setMinutes(endMinutes);
        endDate.setSeconds(0);
        
        return {
          id: availability.id,
          title: availability.title || (availability.type === 'AVAILABLE' ? 'Available' : 'Unavailable'),
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          allDay: false,
          category: availability.type.toLowerCase() as 'available' | 'unavailable',
          description: availability.description,
          extendedProps: {
            recurrenceRule: availability.recurrenceRule
          }
        };
      });
      
      events = availabilityEvents;
    }
    
    return NextResponse.json({ events });
    
  } catch (error) {
    console.error('[CHILDMINDER_CALENDAR_GET]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 