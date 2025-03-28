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
    
    // Parse query parameters for date range
    const { searchParams } = new URL(request.url);
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');
    
    // Validate date range parameters
    if (!startParam || !endParam) {
      return NextResponse.json({ error: 'Missing required parameters: start and end dates' }, { status: 400 });
    }
    
    const startDate = parseISO(startParam);
    const endDate = parseISO(endParam);
    
    if (!isValid(startDate) || !isValid(endDate)) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }
    
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
    const events = bookings.map(booking => {
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
    
    return NextResponse.json({ events });
    
  } catch (error) {
    console.error('[CHILDMINDER_CALENDAR_GET]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 