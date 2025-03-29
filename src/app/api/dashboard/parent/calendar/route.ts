import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Booking_status } from '@prisma/client';
import { startOfDay, endOfDay, parseISO } from 'date-fns';

export async function GET(request: Request) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    
    if (!startDateParam || !endDateParam) {
      return NextResponse.json(
        { error: 'Both startDate and endDate are required' },
        { status: 400 }
      );
    }
    
    // Parse dates
    const startDate = startOfDay(parseISO(startDateParam));
    const endDate = endOfDay(parseISO(endDateParam));
    
    // Build the query
    const whereClause: any = {
      parentId: session.user.id,
      startTime: { gte: startDate },
      endTime: { lte: endDate }
    };
    
    // Fetch bookings for the calendar
    const bookings = await prisma.booking.findMany({
      where: whereClause,
      orderBy: {
        startTime: 'asc'
      },
      include: {
        User_Booking_childminderIdToUser: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            location: true
          }
        },
        BookingChildren: {
          include: {
            Child: {
              select: {
                id: true,
                name: true,
                age: true
              }
            }
          }
        }
      }
    });
    
    // Transform bookings to a format suitable for calendar rendering
    const calendarEvents = bookings.map(booking => {
      // Format children data
      const children = booking.BookingChildren.map(bookingChild => ({
        id: bookingChild.Child.id,
        name: bookingChild.Child.name,
        age: bookingChild.Child.age
      }));
      
      // Get childminder data
      const childminder = {
        id: booking.User_Booking_childminderIdToUser.id,
        name: booking.User_Booking_childminderIdToUser.name || 'Unknown',
        image: booking.User_Booking_childminderIdToUser.profileImage,
        location: booking.User_Booking_childminderIdToUser.location
      };
      
      // Define color based on booking status and type
      let color = '#6366f1'; // Default color (indigo)
      
      // Color by status
      switch (booking.status) {
        case 'PENDING':
          color = '#f59e0b'; // Amber
          break;
        case 'CONFIRMED':
          color = '#10b981'; // Emerald
          break;
        case 'CANCELLED':
        case 'LATE_CANCELLED':
          color = '#ef4444'; // Red
          break;
        case 'COMPLETED':
          color = '#6b7280'; // Gray
          break;
      }
      
      // Override color for emergency bookings
      if (booking.isEmergency) {
        color = '#dc2626'; // Bright red
      }
      
      return {
        id: booking.id,
        title: booking.User_Booking_childminderIdToUser.name ? 
          `Booking with ${booking.User_Booking_childminderIdToUser.name}` : 
          'Booking',
        start: booking.startTime.toISOString(),
        end: booking.endTime.toISOString(),
        status: booking.status,
        bookingType: booking.bookingType,
        isEmergency: booking.isEmergency,
        isRecurring: booking.isRecurring,
        recurrencePattern: booking.recurrencePattern,
        color,
        childminder,
        children,
        allDay: false
      };
    });
    
    return NextResponse.json({ events: calendarEvents });
    
  } catch (error) {
    console.error('[CALENDAR_GET]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 