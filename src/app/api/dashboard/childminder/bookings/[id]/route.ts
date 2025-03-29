import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Booking_status } from '@prisma/client';
import { sendBookingStatusNotification } from '@/lib/notifications';
import crypto from 'crypto';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;

    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Ensure the user is a childminder
    if (session.user.role !== 'childminder') {
      return NextResponse.json({ error: 'Forbidden - Childminder role required' }, { status: 403 });
    }
    
    // Fetch the booking with childminder verification
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        childminderId: session.user.id
      },
      include: {
        User_Booking_parentIdToUser: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            phoneNumber: true
          }
        },
        BookingChildren: {
          include: {
            Child: {
              select: {
                id: true,
                name: true,
                age: true,
                allergies: true,
                specialNeeds: true
              }
            }
          }
        }
      }
    });
    
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    
    // Format children data
    const formattedChildren = booking.BookingChildren.map(bookingChild => {
      return {
        id: bookingChild.Child.id,
        name: bookingChild.Child.name,
        age: bookingChild.Child.age,
        allergies: bookingChild.Child.allergies,
        specialNeeds: bookingChild.Child.specialNeeds
      };
    });
    
    // Calculate booking duration
    const startTime = new Date(booking.startTime);
    const endTime = new Date(booking.endTime);
    const durationMs = endTime.getTime() - startTime.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    // Format parent data
    const formattedParent = {
      id: booking.User_Booking_parentIdToUser.id,
      name: booking.User_Booking_parentIdToUser.name || null,
      email: booking.User_Booking_parentIdToUser.email,
      image: booking.User_Booking_parentIdToUser.profileImage,
      phoneNumber: booking.User_Booking_parentIdToUser.phoneNumber
    };
    
    // Return formatted booking
    return NextResponse.json({
      booking: {
        id: booking.id,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        bookingType: booking.bookingType,
        isEmergency: booking.isEmergency,
        isRecurring: booking.isRecurring,
        recurrencePattern: booking.recurrencePattern,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        cancellationNote: booking.cancellationNote,
        duration: {
          hours,
          minutes
        },
        children: formattedChildren,
        parent: formattedParent
      }
    });
    
  } catch (error) {
    console.error('[CHILDMINDER_BOOKING_GET]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;
    
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Ensure the user is a childminder
    if (session.user.role !== 'childminder') {
      return NextResponse.json({ error: 'Forbidden - Childminder role required' }, { status: 403 });
    }
    
    // Parse request body
    const body = await request.json();
    const { action, cancellationNote } = body;
    
    // Validate action
    if (!action || !['accept', 'decline'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be either "accept" or "decline".' },
        { status: 400 }
      );
    }
    
    // Check if booking exists and belongs to the childminder
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        childminderId: session.user.id
      }
    });
    
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    
    // Check if the booking is in a state that can be updated
    if (booking.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Only PENDING bookings can be accepted or declined' },
        { status: 400 }
      );
    }
    
    // Store previous status for notification
    const previousStatus = booking.status;
    
    // Update booking status based on action
    const newStatus: Booking_status = action === 'accept' ? 'CONFIRMED' : 'CANCELLED';
    
    // Additional validation for decline action
    if (action === 'decline' && !cancellationNote) {
      return NextResponse.json(
        { error: 'Cancellation note is required when declining a booking' },
        { status: 400 }
      );
    }
    
    // Update the booking
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: newStatus,
        cancellationNote: action === 'decline' ? cancellationNote : null,
        updatedAt: new Date()
      }
    });
    
    // Create notification for the parent
    await prisma.notification.create({
      data: {
        id: crypto.randomUUID(),
        type: action === 'accept' ? 'BOOKING_CONFIRMED' : 'BOOKING_CANCELLED',
        title: action === 'accept' ? 'Booking Confirmed' : 'Booking Declined',
        message: action === 'accept' 
          ? `Your booking for ${new Date(booking.startTime).toLocaleDateString()} has been confirmed.`
          : `Your booking for ${new Date(booking.startTime).toLocaleDateString()} has been declined.`,
        status: 'UNREAD',
        userId: booking.parentId,
        metadata: JSON.stringify({
          bookingId: booking.id,
          childminderId: session.user.id,
          childminderName: session.user.name,
          startTime: booking.startTime,
          endTime: booking.endTime,
          cancellationNote: action === 'decline' ? cancellationNote : null
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    // Fetch the complete booking with user information to send email notification
    const completeBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        User_Booking_parentIdToUser: true,
        User_Booking_childminderIdToUser: true
      }
    });

    // Send email notification if booking is found
    if (completeBooking) {
      await sendBookingStatusNotification(
        completeBooking,
        previousStatus,
        newStatus
      );
    }
    
    return NextResponse.json({
      message: action === 'accept' ? 'Booking confirmed successfully' : 'Booking declined successfully',
      booking: updatedBooking
    });
    
  } catch (error) {
    console.error('[CHILDMINDER_BOOKING_PATCH]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 