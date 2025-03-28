import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Booking_status } from '@prisma/client';

// GET: Fetch a single booking by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const bookingId = params.id;
    
    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }
    
    // Fetch the booking with related data
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        parentId: session.user.id
      },
      include: {
        User_Booking_childminderIdToUser: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            rate: true,
            location: true,
            phoneNumber: true,
            firstAidCert: true,
            gardaVetted: true,
            tuslaRegistered: true
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
    
    // Format childminder data
    const formattedChildminder = {
      id: booking.User_Booking_childminderIdToUser.id,
      name: booking.User_Booking_childminderIdToUser.name || null,
      email: booking.User_Booking_childminderIdToUser.email,
      image: booking.User_Booking_childminderIdToUser.image,
      phone: booking.User_Booking_childminderIdToUser.phoneNumber,
      location: booking.User_Booking_childminderIdToUser.location,
      rate: booking.User_Booking_childminderIdToUser.rate,
      firstAidCert: booking.User_Booking_childminderIdToUser.firstAidCert,
      gardaVetted: booking.User_Booking_childminderIdToUser.gardaVetted,
      tuslaRegistered: booking.User_Booking_childminderIdToUser.tuslaRegistered
    };
    
    // Transform the booking to match the expected format
    const transformedBooking = {
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
      childminder: formattedChildminder
    };
    
    return NextResponse.json({ booking: transformedBooking });
    
  } catch (error) {
    console.error('[BOOKING_GET]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH: Update a booking (cancel, etc.)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const bookingId = params.id;
    
    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }
    
    // Verify the booking exists and belongs to this parent
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        parentId: session.user.id
      }
    });
    
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    
    // Parse the request body
    const { action, cancellationNote } = await request.json();
    
    // Handle different actions
    if (action === 'cancel') {
      // Check if the booking can be canceled (not already cancelled, etc.)
      if (booking.status === 'CANCELLED' || booking.status === 'LATE_CANCELLED') {
        return NextResponse.json({ error: 'Booking is already cancelled' }, { status: 400 });
      }
      
      if (booking.status === 'COMPLETED') {
        return NextResponse.json({ error: 'Cannot cancel a completed booking' }, { status: 400 });
      }
      
      // Determine if this is a late cancellation
      const now = new Date();
      const bookingStart = new Date(booking.startTime);
      const hoursUntilBooking = (bookingStart.getTime() - now.getTime()) / (1000 * 60 * 60);
      const isLateCancellation = hoursUntilBooking < 24;
      
      // Update the booking status
      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: isLateCancellation ? 'LATE_CANCELLED' : 'CANCELLED',
          cancellationNote: cancellationNote || null,
          updatedAt: new Date()
        }
      });
      
      return NextResponse.json({ 
        success: true, 
        message: isLateCancellation ? 'Booking late-cancelled successfully' : 'Booking cancelled successfully',
        booking: updatedBooking
      });
    }
    
    // If the action is not supported
    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
    
  } catch (error) {
    console.error('[BOOKING_PATCH]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 