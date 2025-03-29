import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sendBookingStatusNotification } from '@/lib/notifications';

export async function POST(request: Request) {
  try {
    // Get current user session for authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a parent
    if (session.user.role !== 'parent') {
      return NextResponse.json({ error: 'Only parents can create bookings' }, { status: 403 });
    }

    // Get parent ID
    const parentId = session.user.id;

    // Parse request body
    const {
      childminderId,
      childrenIds,
      startDateTime,
      endDateTime,
      notes,
      isRecurring,
      recurringDays,
      isEmergency
    } = await request.json();

    // Validate required fields
    if (!childminderId || !childrenIds || childrenIds.length === 0 || !startDateTime || !endDateTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate childminder exists
    const childminder = await prisma.user.findUnique({
      where: {
        id: childminderId,
        role: 'childminder',
      },
    });

    if (!childminder) {
      return NextResponse.json({ error: 'Childminder not found' }, { status: 404 });
    }

    // Validate children belong to parent
    const childrenCount = await prisma.child.count({
      where: {
        id: { in: childrenIds },
        parentId: parentId,
      },
    });

    if (childrenCount !== childrenIds.length) {
      return NextResponse.json({ error: 'Invalid children specified' }, { status: 400 });
    }

    // Parse date strings to Date objects
    const startDate = new Date(startDateTime);
    const endDate = new Date(endDateTime);

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    if (startDate >= endDate) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
    }

    if (startDate < new Date()) {
      return NextResponse.json({ error: 'Cannot create bookings in the past' }, { status: 400 });
    }

    // If recurring, validate days
    if (isRecurring && (!recurringDays || recurringDays.length === 0)) {
      return NextResponse.json({ error: 'Recurring booking must specify days' }, { status: 400 });
    }

    // Check childminder availability
    // In a real application, we would have more complex availability checking
    // For now, we'll just create the booking

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        id: `book-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
        parentId,
        childminderId,
        startTime: startDate,
        endTime: endDate,
        status: 'PENDING', // New bookings are pending by default
        bookingType: isRecurring ? 'RECURRING' : 'STANDARD',
        isEmergency: isEmergency || false,
        isRecurring: isRecurring || false,
        updatedAt: new Date(),
      },
    });
    
    // Create booking-children associations
    for (const childId of childrenIds) {
      await prisma.bookingChildren.create({
        data: {
          id: `bc-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
          bookingId: booking.id,
          childId,
        }
      });
    }

    // If recurring, set the recurrence pattern on the booking
    if (isRecurring && recurringDays && recurringDays.length > 0) {
      // Set recurrence pattern directly on the booking
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          recurrencePattern: 'WEEKLY', // Default to weekly pattern
        }
      });
    }

    // Create notification for the childminder
    await prisma.notification.create({
      data: {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
        userId: childminderId,
        type: 'NEW_BOOKING',
        title: 'New Booking Request',
        message: `You have a new booking request from ${session.user.name}`,
        status: 'UNREAD',
        metadata: JSON.stringify({ bookingId: booking.id }),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Fetch the complete booking with user information to send email notification
    const completeBooking = await prisma.booking.findUnique({
      where: { id: booking.id },
      include: {
        User_Booking_parentIdToUser: true,
        User_Booking_childminderIdToUser: true
      }
    });

    // Send email notification if booking is found
    if (completeBooking) {
      await sendBookingStatusNotification(
        completeBooking,
        'PENDING', // Previous status (new booking)
        'PENDING'  // New status
      );
    }

    // Return the created booking
    return NextResponse.json({ 
      message: 'Booking created successfully',
      booking: {
        id: booking.id,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        bookingType: booking.bookingType,
        isEmergency: booking.isEmergency,
        isRecurring: booking.isRecurring,
      }
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
} 